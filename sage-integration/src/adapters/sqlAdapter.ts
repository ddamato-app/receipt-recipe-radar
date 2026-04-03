import sql from "mssql";
import { SqlServerConfig } from "../config";
import { logger } from "../logger";
import {
  SageAdapter,
  Invoice,
  Payment,
  Contract,
  ListOptions,
} from "./types";

/**
 * SAGE 300 SQL Server direct adapter.
 *
 * Connects directly to the SAGE 300 SQL Server database.
 * Requires READ-ONLY access to the company database.
 *
 * Table names follow the ACCPAC naming convention:
 *   ARINVOICE  – AR Invoice header
 *   ARINVDET   – AR Invoice detail lines
 *   ARCUSTOMER – AR Customer master
 *   ARRECEIPT  – AR Receipt (payment) header
 *   ARRECPDET  – AR Receipt detail
 */
export class SqlAdapter implements SageAdapter {
  private pool: sql.ConnectionPool | null = null;

  constructor(private cfg: SqlServerConfig) {}

  async connect(): Promise<void> {
    this.pool = await new sql.ConnectionPool({
      server: this.cfg.server,
      database: this.cfg.database,
      user: this.cfg.user,
      password: this.cfg.password,
      options: this.cfg.options,
    }).connect();
    logger.info("SAGE 300 SQL Server adapter connected", {
      server: this.cfg.server,
      database: this.cfg.database,
    });
  }

  async disconnect(): Promise<void> {
    await this.pool?.close();
    this.pool = null;
    logger.info("SAGE 300 SQL Server adapter disconnected");
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool!.query("SELECT 1 AS alive");
      return true;
    } catch {
      return false;
    }
  }

  private get db(): sql.ConnectionPool {
    if (!this.pool) throw new Error("SQL adapter not connected");
    return this.pool;
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async listInvoices(options: ListOptions = {}): Promise<Invoice[]> {
    const req = this.db.request();
    let query = `
      SELECT TOP ${options.pageSize || 50}
        h.BATCHNBR, h.ENTRYNUM, h.CUSTNO, h.CUSTNAME,
        h.TRANDATE, h.DUEDATE, h.SUBTOTAL, h.TAXAMOUNT,
        h.DOCTOTAL, h.AMTDUE, h.CURRENCY, h.DOCSTATUS
      FROM ARINVOICE h
      WHERE 1=1
    `;
    if (options.fromDate) {
      req.input("fromDate", sql.VarChar, options.fromDate);
      query += " AND h.TRANDATE >= @fromDate";
    }
    if (options.toDate) {
      req.input("toDate", sql.VarChar, options.toDate);
      query += " AND h.TRANDATE <= @toDate";
    }
    if (options.customerCode) {
      req.input("custno", sql.VarChar, options.customerCode);
      query += " AND h.CUSTNO = @custno";
    }
    query += " ORDER BY h.TRANDATE DESC";

    const res = await req.query(query);
    return res.recordset.map(mapSqlInvoice);
  }

  async getInvoice(id: string): Promise<Invoice> {
    const req = this.db.request();
    req.input("id", sql.VarChar, id);

    const header = await req.query(`
      SELECT h.BATCHNBR, h.ENTRYNUM, h.CUSTNO, h.CUSTNAME,
             h.TRANDATE, h.DUEDATE, h.SUBTOTAL, h.TAXAMOUNT,
             h.DOCTOTAL, h.AMTDUE, h.CURRENCY, h.DOCSTATUS
      FROM ARINVOICE h
      WHERE h.BATCHNBR = @id OR h.ENTRYNUM = @id
    `);
    if (!header.recordset.length) {
      throw new Error(`Invoice ${id} not found`);
    }

    const invoice = mapSqlInvoice(header.recordset[0]);

    const lines = await req.query(`
      SELECT d.LINENUM, d.ITEMNO, d.ITEMDESC, d.QTYORDERED,
             d.UNITPRICE, d.DISCOUNT, d.EXTAMT
      FROM ARINVDET d
      WHERE d.BATCHNBR = @id OR d.ENTRYNUM = @id
      ORDER BY d.LINENUM
    `);
    invoice.lines = lines.recordset.map(mapSqlInvoiceLine);

    return invoice;
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async listPayments(options: ListOptions = {}): Promise<Payment[]> {
    const req = this.db.request();
    let query = `
      SELECT TOP ${options.pageSize || 50}
        r.BATCHNBR, r.ENTRYNUM, r.CUSTNO, r.CUSTNAME,
        r.TRANDATE, r.RECEIPTAMT, r.CURRENCY, r.PAYCODE, r.CHEQUENO
      FROM ARRECEIPT r
      WHERE 1=1
    `;
    if (options.fromDate) {
      req.input("fromDate", sql.VarChar, options.fromDate);
      query += " AND r.TRANDATE >= @fromDate";
    }
    if (options.toDate) {
      req.input("toDate", sql.VarChar, options.toDate);
      query += " AND r.TRANDATE <= @toDate";
    }
    if (options.customerCode) {
      req.input("custno", sql.VarChar, options.customerCode);
      query += " AND r.CUSTNO = @custno";
    }
    query += " ORDER BY r.TRANDATE DESC";

    const res = await req.query(query);
    return res.recordset.map(mapSqlPayment);
  }

  async getPayment(id: string): Promise<Payment> {
    const req = this.db.request();
    req.input("id", sql.VarChar, id);

    const header = await req.query(`
      SELECT r.BATCHNBR, r.ENTRYNUM, r.CUSTNO, r.CUSTNAME,
             r.TRANDATE, r.RECEIPTAMT, r.CURRENCY, r.PAYCODE, r.CHEQUENO
      FROM ARRECEIPT r
      WHERE r.BATCHNBR = @id OR r.ENTRYNUM = @id
    `);
    if (!header.recordset.length) {
      throw new Error(`Payment ${id} not found`);
    }

    const payment = mapSqlPayment(header.recordset[0]);

    const applied = await req.query(`
      SELECT d.DOCNUMBER, d.AMTAPPLIED
      FROM ARRECPDET d
      WHERE d.BATCHNBR = @id OR d.ENTRYNUM = @id
    `);
    payment.appliedInvoices = applied.recordset.map((a) => ({
      invoiceNumber: a.DOCNUMBER,
      appliedAmount: parseFloat(a.AMTAPPLIED ?? "0"),
    }));

    return payment;
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────

  async listContracts(options: ListOptions = {}): Promise<Contract[]> {
    const req = this.db.request();
    let query = `
      SELECT TOP ${options.pageSize || 50}
        c.CONTNO, c.CUSTNO, c.CUSTNAME, c.DESCRIPT,
        c.STARTDATE, c.EXPDATE, c.CONTAMT, c.CURRENCY,
        c.CONTSTATUS, c.TERMSCODE
      FROM OECONTRACT c
      WHERE 1=1
    `;
    if (options.customerCode) {
      req.input("custno", sql.VarChar, options.customerCode);
      query += " AND c.CUSTNO = @custno";
    }
    if (options.status) {
      req.input("status", sql.VarChar, options.status);
      query += " AND c.CONTSTATUS = @status";
    }
    query += " ORDER BY c.STARTDATE DESC";

    const res = await req.query(query);
    return res.recordset.map(mapSqlContract);
  }

  async getContract(id: string): Promise<Contract> {
    const req = this.db.request();
    req.input("id", sql.VarChar, id);

    const res = await req.query(`
      SELECT c.CONTNO, c.CUSTNO, c.CUSTNAME, c.DESCRIPT,
             c.STARTDATE, c.EXPDATE, c.CONTAMT, c.CURRENCY,
             c.CONTSTATUS, c.TERMSCODE
      FROM OECONTRACT c
      WHERE c.CONTNO = @id
    `);
    if (!res.recordset.length) {
      throw new Error(`Contract ${id} not found`);
    }
    return mapSqlContract(res.recordset[0]);
  }

  async verifyContract(id: string): Promise<{ valid: boolean; reason?: string }> {
    const contract = await this.getContract(id);
    if (contract.status === "terminated" || contract.status === "expired") {
      return { valid: false, reason: `Contract status is ${contract.status}` };
    }
    if (contract.endDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (contract.endDate < today) {
        return { valid: false, reason: `Contract expired on ${contract.endDate}` };
      }
    }
    return { valid: true };
  }
}

// ─── Data mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSqlInvoice(d: any): Invoice {
  return {
    id: String(d.BATCHNBR ?? ""),
    invoiceNumber: String(d.ENTRYNUM ?? d.BATCHNBR ?? ""),
    customerCode: String(d.CUSTNO ?? ""),
    customerName: String(d.CUSTNAME ?? ""),
    date: formatDate(d.TRANDATE),
    dueDate: formatDate(d.DUEDATE),
    subtotal: parseFloat(d.SUBTOTAL ?? "0"),
    tax: parseFloat(d.TAXAMOUNT ?? "0"),
    total: parseFloat(d.DOCTOTAL ?? "0"),
    amountDue: parseFloat(d.AMTDUE ?? "0"),
    currency: String(d.CURRENCY ?? "USD"),
    status: mapInvoiceStatus(d.DOCSTATUS),
    lines: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSqlInvoiceLine(l: any): Invoice["lines"][0] {
  return {
    lineNumber: parseInt(l.LINENUM ?? "0"),
    itemCode: String(l.ITEMNO ?? ""),
    description: String(l.ITEMDESC ?? ""),
    quantity: parseFloat(l.QTYORDERED ?? "0"),
    unitPrice: parseFloat(l.UNITPRICE ?? "0"),
    discount: parseFloat(l.DISCOUNT ?? "0"),
    lineTotal: parseFloat(l.EXTAMT ?? "0"),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSqlPayment(d: any): Payment {
  return {
    id: String(d.BATCHNBR ?? ""),
    paymentNumber: String(d.ENTRYNUM ?? d.BATCHNBR ?? ""),
    customerCode: String(d.CUSTNO ?? ""),
    customerName: String(d.CUSTNAME ?? ""),
    date: formatDate(d.TRANDATE),
    amount: parseFloat(d.RECEIPTAMT ?? "0"),
    currency: String(d.CURRENCY ?? "USD"),
    method: String(d.PAYCODE ?? ""),
    reference: String(d.CHEQUENO ?? ""),
    appliedInvoices: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSqlContract(d: any): Contract {
  return {
    id: String(d.CONTNO ?? ""),
    contractNumber: String(d.CONTNO ?? ""),
    customerCode: String(d.CUSTNO ?? ""),
    customerName: String(d.CUSTNAME ?? ""),
    description: String(d.DESCRIPT ?? ""),
    startDate: formatDate(d.STARTDATE),
    endDate: formatDate(d.EXPDATE),
    value: parseFloat(d.CONTAMT ?? "0"),
    currency: String(d.CURRENCY ?? "USD"),
    status: mapContractStatus(d.CONTSTATUS),
    terms: String(d.TERMSCODE ?? ""),
  };
}

function mapInvoiceStatus(raw: string | number | undefined): Invoice["status"] {
  const s = String(raw ?? "").trim();
  if (s === "1" || s.toUpperCase() === "OPEN") return "open";
  if (s === "2" || s.toUpperCase() === "PAID") return "paid";
  if (s === "3" || s.toUpperCase() === "PARTIAL") return "partial";
  if (s === "4" || s.toUpperCase() === "VOID") return "void";
  return "open";
}

function mapContractStatus(raw: string | number | undefined): Contract["status"] {
  const s = String(raw ?? "").trim();
  if (s === "1" || s.toUpperCase() === "ACTIVE") return "active";
  if (s === "2" || s.toUpperCase() === "EXPIRED") return "expired";
  if (s === "3" || s.toUpperCase() === "PENDING") return "pending";
  if (s === "4" || s.toUpperCase() === "TERMINATED") return "terminated";
  return "active";
}

function formatDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}
