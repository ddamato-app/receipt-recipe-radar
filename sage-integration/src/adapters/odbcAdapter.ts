import odbc from "odbc";
import { OdbcConfig } from "../config";
import { logger } from "../logger";
import {
  SageAdapter,
  Invoice,
  Payment,
  Contract,
  ListOptions,
} from "./types";

/**
 * SAGE 300 ODBC adapter.
 *
 * Requires the SAGE 300 ODBC driver to be installed on the Windows Server.
 * Set up a System DSN in Windows ODBC Data Source Administrator pointing to
 * the SAGE 300 company database, then reference it in config.json:
 *
 *   "connectionString": "DSN=SAGE300;Uid=ADMIN;Pwd=password;"
 *
 * Or use a full driver connection string:
 *   "connectionString": "Driver={ACCPAC ODBC 32-bit};DSN=SAMLTD;Uid=ADMIN;Pwd=password;"
 */
export class OdbcAdapter implements SageAdapter {
  private conn: odbc.Connection | null = null;

  constructor(private cfg: OdbcConfig) {}

  async connect(): Promise<void> {
    this.conn = await odbc.connect(this.cfg.connectionString);
    logger.info("SAGE 300 ODBC adapter connected");
  }

  async disconnect(): Promise<void> {
    await this.conn?.close();
    this.conn = null;
    logger.info("SAGE 300 ODBC adapter disconnected");
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  private get db(): odbc.Connection {
    if (!this.conn) throw new Error("ODBC adapter not connected");
    return this.conn;
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async listInvoices(options: ListOptions = {}): Promise<Invoice[]> {
    let query = `
      SELECT TOP ${options.pageSize || 50}
        h.BATCHNBR, h.ENTRYNUM, h.CUSTNO, h.CUSTNAME,
        h.TRANDATE, h.DUEDATE, h.SUBTOTAL, h.TAXAMOUNT,
        h.DOCTOTAL, h.AMTDUE, h.CURRENCY, h.DOCSTATUS
      FROM ARINVOICE h
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (options.fromDate) {
      query += " AND h.TRANDATE >= ?";
      params.push(options.fromDate);
    }
    if (options.toDate) {
      query += " AND h.TRANDATE <= ?";
      params.push(options.toDate);
    }
    if (options.customerCode) {
      query += " AND h.CUSTNO = ?";
      params.push(options.customerCode);
    }
    query += " ORDER BY h.TRANDATE DESC";

    const res = await this.db.query(query, params);
    return res.map(mapOdbcInvoice);
  }

  async getInvoice(id: string): Promise<Invoice> {
    const headers = await this.db.query(
      `SELECT h.BATCHNBR, h.ENTRYNUM, h.CUSTNO, h.CUSTNAME,
              h.TRANDATE, h.DUEDATE, h.SUBTOTAL, h.TAXAMOUNT,
              h.DOCTOTAL, h.AMTDUE, h.CURRENCY, h.DOCSTATUS
       FROM ARINVOICE h WHERE h.BATCHNBR = ? OR h.ENTRYNUM = ?`,
      [id, id]
    );
    if (!headers.length) throw new Error(`Invoice ${id} not found`);

    const invoice = mapOdbcInvoice(headers[0]);
    const lines = await this.db.query(
      `SELECT d.LINENUM, d.ITEMNO, d.ITEMDESC, d.QTYORDERED,
              d.UNITPRICE, d.DISCOUNT, d.EXTAMT
       FROM ARINVDET d WHERE d.BATCHNBR = ? OR d.ENTRYNUM = ? ORDER BY d.LINENUM`,
      [id, id]
    );
    invoice.lines = lines.map(mapOdbcInvoiceLine);
    return invoice;
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async listPayments(options: ListOptions = {}): Promise<Payment[]> {
    let query = `
      SELECT TOP ${options.pageSize || 50}
        r.BATCHNBR, r.ENTRYNUM, r.CUSTNO, r.CUSTNAME,
        r.TRANDATE, r.RECEIPTAMT, r.CURRENCY, r.PAYCODE, r.CHEQUENO
      FROM ARRECEIPT r WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (options.fromDate) {
      query += " AND r.TRANDATE >= ?";
      params.push(options.fromDate);
    }
    if (options.toDate) {
      query += " AND r.TRANDATE <= ?";
      params.push(options.toDate);
    }
    if (options.customerCode) {
      query += " AND r.CUSTNO = ?";
      params.push(options.customerCode);
    }
    query += " ORDER BY r.TRANDATE DESC";

    const res = await this.db.query(query, params);
    return res.map(mapOdbcPayment);
  }

  async getPayment(id: string): Promise<Payment> {
    const headers = await this.db.query(
      `SELECT r.BATCHNBR, r.ENTRYNUM, r.CUSTNO, r.CUSTNAME,
              r.TRANDATE, r.RECEIPTAMT, r.CURRENCY, r.PAYCODE, r.CHEQUENO
       FROM ARRECEIPT r WHERE r.BATCHNBR = ? OR r.ENTRYNUM = ?`,
      [id, id]
    );
    if (!headers.length) throw new Error(`Payment ${id} not found`);

    const payment = mapOdbcPayment(headers[0]);
    const applied = await this.db.query(
      `SELECT d.DOCNUMBER, d.AMTAPPLIED FROM ARRECPDET d
       WHERE d.BATCHNBR = ? OR d.ENTRYNUM = ?`,
      [id, id]
    );
    payment.appliedInvoices = applied.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => ({
        invoiceNumber: String(a.DOCNUMBER ?? ""),
        appliedAmount: parseFloat(a.AMTAPPLIED ?? "0"),
      })
    );
    return payment;
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────

  async listContracts(options: ListOptions = {}): Promise<Contract[]> {
    let query = `
      SELECT TOP ${options.pageSize || 50}
        c.CONTNO, c.CUSTNO, c.CUSTNAME, c.DESCRIPT,
        c.STARTDATE, c.EXPDATE, c.CONTAMT, c.CURRENCY, c.CONTSTATUS, c.TERMSCODE
      FROM OECONTRACT c WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (options.customerCode) {
      query += " AND c.CUSTNO = ?";
      params.push(options.customerCode);
    }
    query += " ORDER BY c.STARTDATE DESC";

    const res = await this.db.query(query, params);
    return res.map(mapOdbcContract);
  }

  async getContract(id: string): Promise<Contract> {
    const res = await this.db.query(
      `SELECT c.CONTNO, c.CUSTNO, c.CUSTNAME, c.DESCRIPT,
              c.STARTDATE, c.EXPDATE, c.CONTAMT, c.CURRENCY, c.CONTSTATUS, c.TERMSCODE
       FROM OECONTRACT c WHERE c.CONTNO = ?`,
      [id]
    );
    if (!res.length) throw new Error(`Contract ${id} not found`);
    return mapOdbcContract(res[0]);
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
function mapOdbcInvoice(d: any): Invoice {
  return {
    id: String(d.BATCHNBR ?? ""),
    invoiceNumber: String(d.ENTRYNUM ?? d.BATCHNBR ?? ""),
    customerCode: String(d.CUSTNO ?? ""),
    customerName: String(d.CUSTNAME ?? ""),
    date: String(d.TRANDATE ?? "").slice(0, 10),
    dueDate: String(d.DUEDATE ?? "").slice(0, 10),
    subtotal: parseFloat(d.SUBTOTAL ?? "0"),
    tax: parseFloat(d.TAXAMOUNT ?? "0"),
    total: parseFloat(d.DOCTOTAL ?? "0"),
    amountDue: parseFloat(d.AMTDUE ?? "0"),
    currency: String(d.CURRENCY ?? "USD"),
    status: mapStatus(d.DOCSTATUS),
    lines: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOdbcInvoiceLine(l: any): Invoice["lines"][0] {
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
function mapOdbcPayment(d: any): Payment {
  return {
    id: String(d.BATCHNBR ?? ""),
    paymentNumber: String(d.ENTRYNUM ?? d.BATCHNBR ?? ""),
    customerCode: String(d.CUSTNO ?? ""),
    customerName: String(d.CUSTNAME ?? ""),
    date: String(d.TRANDATE ?? "").slice(0, 10),
    amount: parseFloat(d.RECEIPTAMT ?? "0"),
    currency: String(d.CURRENCY ?? "USD"),
    method: String(d.PAYCODE ?? ""),
    reference: String(d.CHEQUENO ?? ""),
    appliedInvoices: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOdbcContract(d: any): Contract {
  return {
    id: String(d.CONTNO ?? ""),
    contractNumber: String(d.CONTNO ?? ""),
    customerCode: String(d.CUSTNO ?? ""),
    customerName: String(d.CUSTNAME ?? ""),
    description: String(d.DESCRIPT ?? ""),
    startDate: String(d.STARTDATE ?? "").slice(0, 10),
    endDate: String(d.EXPDATE ?? "").slice(0, 10),
    value: parseFloat(d.CONTAMT ?? "0"),
    currency: String(d.CURRENCY ?? "USD"),
    status: mapContractStatus(d.CONTSTATUS),
    terms: String(d.TERMSCODE ?? ""),
  };
}

function mapStatus(raw: unknown): Invoice["status"] {
  const s = String(raw ?? "").trim();
  if (s === "1" || s.toUpperCase() === "OPEN") return "open";
  if (s === "2" || s.toUpperCase() === "PAID") return "paid";
  if (s === "3" || s.toUpperCase() === "PARTIAL") return "partial";
  return "open";
}

function mapContractStatus(raw: unknown): Contract["status"] {
  const s = String(raw ?? "").trim();
  if (s === "1" || s.toUpperCase() === "ACTIVE") return "active";
  if (s === "2" || s.toUpperCase() === "EXPIRED") return "expired";
  if (s === "3" || s.toUpperCase() === "PENDING") return "pending";
  if (s === "4" || s.toUpperCase() === "TERMINATED") return "terminated";
  return "active";
}
