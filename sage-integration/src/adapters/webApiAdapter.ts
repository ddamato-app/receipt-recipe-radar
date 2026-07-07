import axios, { AxiosInstance } from "axios";
import { WebApiConfig } from "../config";
import { logger } from "../logger";
import {
  SageAdapter,
  Invoice,
  Payment,
  Contract,
  ListOptions,
} from "./types";

/**
 * SAGE 300 Web API adapter.
 *
 * SAGE 300 Web API must be installed on the same Windows Server.
 * Base URL format: http://<server>/Sage300WebApi/v1.0/-/<CompanyId>
 * Authentication: HTTP Basic Auth  (username + password of a WEBAPI-enabled user)
 *
 * Swagger UI (to explore endpoints): http://<server>/Sage300WebApi/
 *
 * Key endpoints used:
 *   AR/ARInvoiceBatches         – AR invoice batches (each batch holds Invoices[])
 *   AR/ARReceiptAndAdjustmentBatches – AR cash receipts (BatchRecordType="CA") & adjustments
 *   AR/ARCustomers              – Customer master
 *   OE/OEOrders                 – Order Entry orders (quotes/orders, used as contracts)
 *
 * Note: SAGE 300 organises AR transactions in *batches*. A batch contains many
 * individual invoice entries. We expand them on the way in and flatten to a
 * simple Invoice[] for the API consumers.
 */
export class WebApiAdapter implements SageAdapter {
  private client: AxiosInstance;

  constructor(private cfg: WebApiConfig) {
    this.client = axios.create({
      baseURL: cfg.baseUrl,
      // SAGE 300 Web API uses HTTP Basic Auth
      auth: { username: cfg.username, password: cfg.password },
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        logger.error("SAGE Web API error", {
          url: err.config?.url,
          status: err.response?.status,
          data: err.response?.data,
        });
        return Promise.reject(err);
      }
    );
  }

  async connect(): Promise<void> {
    const ok = await this.healthCheck();
    if (!ok) {
      throw new Error(
        "Cannot reach SAGE 300 Web API. Check baseUrl, credentials, and that the Web API module is installed."
      );
    }
    logger.info("SAGE 300 Web API adapter connected", { adapter: "webapi" });
  }

  async disconnect(): Promise<void> {
    logger.info("SAGE 300 Web API adapter disconnected");
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Lightweight probe – just fetch one customer record
      await this.client.get("/AR/ARCustomers?$top=1");
      return true;
    } catch {
      return false;
    }
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────
  //
  // SAGE 300 stores invoices inside *batches*.
  // GET AR/ARInvoiceBatches?$expand=Invoices returns an OData collection:
  //   { "value": [ { "BatchNumber": 1, "Invoices": [ {...}, {...} ] }, ... ] }
  //
  // We flatten all invoices across all returned batches into a single list.

  async listInvoices(options: ListOptions = {}): Promise<Invoice[]> {
    const params = this._buildODataParams(options);
    params["$expand"] = "Invoices";

    const res = await this.client.get("/AR/ARInvoiceBatches", { params });
    const batches: SageBatch[] = res.data.value ?? [];

    const invoices: Invoice[] = [];
    for (const batch of batches) {
      for (const entry of batch.Invoices ?? []) {
        invoices.push(mapInvoice(batch, entry));
      }
    }

    if (options.customerCode) {
      return invoices.filter((i) => i.customerCode === options.customerCode);
    }
    return invoices.slice(0, options.pageSize ?? 50);
  }

  async getInvoice(id: string): Promise<Invoice> {
    // id can be "BatchNumber-EntryNumber" or just BatchNumber
    const [batchNum, entryNum] = id.includes("-")
      ? id.split("-")
      : [id, undefined];

    const res = await this.client.get(
      `/AR/ARInvoiceBatches(${encodeURIComponent(batchNum)})?$expand=Invoices`
    );
    const batch: SageBatch = res.data;

    if (entryNum) {
      const entry = (batch.Invoices ?? []).find(
        (e) => String(e.EntryNumber) === entryNum
      );
      if (!entry) throw new Error(`Invoice ${id} not found`);
      return mapInvoice(batch, entry);
    }

    // Return first entry in batch if no entry number given
    const entries = batch.Invoices ?? [];
    if (!entries.length) throw new Error(`Invoice ${id} not found`);
    return mapInvoice(batch, entries[0]);
  }

  // ─── Payments / Receipts ───────────────────────────────────────────────────
  //
  // SAGE 300 endpoint: AR/ARReceiptAndAdjustmentBatches
  // Each batch has BatchRecordType: "CA" (cash receipt) or "AD" (adjustment).
  // Individual entries are in ReceiptsAdjustments[].

  async listPayments(options: ListOptions = {}): Promise<Payment[]> {
    const params = this._buildODataParams(options);
    params["$expand"] = "ReceiptsAdjustments";
    // Only fetch cash receipt batches (not adjustments)
    params["$filter"] = params["$filter"]
      ? `(${params["$filter"]}) and BatchRecordType eq 'CA'`
      : "BatchRecordType eq 'CA'";

    const res = await this.client.get("/AR/ARReceiptAndAdjustmentBatches", {
      params,
    });
    const batches: SageReceiptBatch[] = res.data.value ?? [];

    const payments: Payment[] = [];
    for (const batch of batches) {
      for (const entry of batch.ReceiptsAdjustments ?? []) {
        payments.push(mapPayment(batch, entry));
      }
    }

    if (options.customerCode) {
      return payments.filter((p) => p.customerCode === options.customerCode);
    }
    return payments.slice(0, options.pageSize ?? 50);
  }

  async getPayment(id: string): Promise<Payment> {
    const [batchNum, entryNum] = id.includes("-")
      ? id.split("-")
      : [id, undefined];

    const res = await this.client.get(
      `/AR/ARReceiptAndAdjustmentBatches(${encodeURIComponent(batchNum)})?$expand=ReceiptsAdjustments`
    );
    const batch: SageReceiptBatch = res.data;

    if (entryNum) {
      const entry = (batch.ReceiptsAdjustments ?? []).find(
        (e) => String(e.EntryNumber) === entryNum
      );
      if (!entry) throw new Error(`Payment ${id} not found`);
      return mapPayment(batch, entry);
    }

    const entries = batch.ReceiptsAdjustments ?? [];
    if (!entries.length) throw new Error(`Payment ${id} not found`);
    return mapPayment(batch, entries[0]);
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────
  //
  // SAGE 300 does not have a dedicated "Contracts" module in the standard Web API.
  // We use OE/OEOrders with OrderType="Quote" as a contract proxy.
  // If your SAGE 300 installation has a custom Contract module (e.g. CN module),
  // update the endpoint below to match.

  async listContracts(options: ListOptions = {}): Promise<Contract[]> {
    const params = this._buildODataParams(options);
    // Treat "Quote" orders as contracts; adjust OrderType filter if needed
    params["$filter"] = params["$filter"]
      ? `(${params["$filter"]}) and OrderType eq 'Quote'`
      : "OrderType eq 'Quote'";

    const res = await this.client.get("/OE/OEOrders", { params });
    return (res.data.value ?? []).map(mapOEOrderAsContract);
  }

  async getContract(id: string): Promise<Contract> {
    const res = await this.client.get(
      `/OE/OEOrders('${encodeURIComponent(id)}')`
    );
    return mapOEOrderAsContract(res.data);
  }

  async verifyContract(
    id: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const contract = await this.getContract(id);
    return verifyContractData(contract);
  }

  // ─── OData helpers ───────────────────────────────────────────────────────────

  private _buildODataParams(
    options: ListOptions
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    const filters: string[] = [];

    if (options.pageSize) {
      params["$top"] = options.pageSize;
    }
    if (options.page && options.pageSize) {
      params["$skip"] = (options.page - 1) * options.pageSize;
    }
    if (options.fromDate) {
      filters.push(`DocumentDate ge ${options.fromDate}`);
    }
    if (options.toDate) {
      filters.push(`DocumentDate le ${options.toDate}`);
    }
    if (filters.length) {
      params["$filter"] = filters.join(" and ");
    }
    return params;
  }
}

// ─── Internal SAGE 300 response shapes ───────────────────────────────────────

interface SageBatch {
  BatchNumber: number;
  BatchDate: string;
  BatchStatus: number;
  Description: string;
  Invoices?: SageInvoiceEntry[];
}

interface SageInvoiceEntry {
  EntryNumber: number;
  CustomerNumber: string;
  DocumentType: string;
  DocumentDate: string;
  DueDate: string;
  InvoiceType?: string;
  InvoiceDetails?: SageInvoiceDetail[];
  InvoicePaymentSchedules?: SagePaymentSchedule[];
}

interface SageInvoiceDetail {
  LineNumber: number;
  DistributionCode?: string;
  ExtendedAmountWithTIP?: number;
  ItemNumber?: string;
  ItemDescription?: string;
  QuantityOrdered?: number;
  UnitPrice?: number;
  DiscountPercent?: number;
}

interface SagePaymentSchedule {
  PaymentNumber: number;
  AmountDue: number;
}

interface SageReceiptBatch {
  BatchRecordType: "CA" | "AD";
  BatchNumber: number;
  BatchDate: string;
  Description: string;
  BankCode?: string;
  DefaultBankCurrency?: string;
  ReceiptsAdjustments?: SageReceiptEntry[];
}

interface SageReceiptEntry {
  EntryNumber: number;
  CustomerNumber: string;
  ReceiptDateAdjustmentDate: string;
  EntryDescription?: string;
  EntryReference?: string;
  BankReceiptAmount?: number;
  CustomerReceiptAmount?: number;
  ReceiptTransactionType?: string;
  AppliedReceiptsAdjustments?: SageAppliedDoc[];
}

interface SageAppliedDoc {
  DocumentNumber?: string;
  CustomerReceiptAmount?: number;
}

// ─── Data mappers ─────────────────────────────────────────────────────────────

function mapInvoice(batch: SageBatch, entry: SageInvoiceEntry): Invoice {
  const schedules = entry.InvoicePaymentSchedules ?? [];
  const amountDue = schedules.reduce((s, p) => s + (p.AmountDue ?? 0), 0);

  const lines = (entry.InvoiceDetails ?? []).map(
    (d, idx): Invoice["lines"][0] => ({
      lineNumber: d.LineNumber ?? idx + 1,
      itemCode: d.ItemNumber ?? d.DistributionCode ?? "",
      description: d.ItemDescription ?? d.DistributionCode ?? "",
      quantity: d.QuantityOrdered ?? 1,
      unitPrice: d.UnitPrice ?? 0,
      discount: d.DiscountPercent ?? 0,
      lineTotal: d.ExtendedAmountWithTIP ?? 0,
    })
  );

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  return {
    // Composite ID so callers can fetch a specific entry: "batchNum-entryNum"
    id: `${batch.BatchNumber}-${entry.EntryNumber}`,
    invoiceNumber: String(entry.EntryNumber),
    customerCode: entry.CustomerNumber ?? "",
    customerName: "",
    date: entry.DocumentDate?.slice(0, 10) ?? "",
    dueDate: entry.DueDate?.slice(0, 10) ?? "",
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: 0,
    total: parseFloat((subtotal).toFixed(2)),
    amountDue: parseFloat(amountDue.toFixed(2)),
    currency: "USD",
    status: amountDue <= 0 ? "paid" : "open",
    lines,
  };
}

function mapPayment(
  batch: SageReceiptBatch,
  entry: SageReceiptEntry
): Payment {
  const applied = (entry.AppliedReceiptsAdjustments ?? []).map((a) => ({
    invoiceNumber: a.DocumentNumber ?? "",
    appliedAmount: a.CustomerReceiptAmount ?? 0,
  }));

  return {
    id: `${batch.BatchNumber}-${entry.EntryNumber}`,
    paymentNumber: String(entry.EntryNumber),
    customerCode: entry.CustomerNumber ?? "",
    customerName: "",
    date: entry.ReceiptDateAdjustmentDate?.slice(0, 10) ?? "",
    amount: entry.CustomerReceiptAmount ?? entry.BankReceiptAmount ?? 0,
    currency: batch.DefaultBankCurrency ?? "USD",
    method: entry.ReceiptTransactionType ?? "Receipt",
    reference: entry.EntryReference ?? "",
    appliedInvoices: applied,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOEOrderAsContract(d: any): Contract {
  return {
    id: d.OrderNumber ?? d.id,
    contractNumber: d.OrderNumber ?? "",
    customerCode: d.CustomerNumber ?? "",
    customerName: d.CustomerName ?? "",
    description: d.Description ?? d.Reference ?? "",
    startDate: d.OrderDate?.slice(0, 10) ?? "",
    endDate: d.ExpirationDate?.slice(0, 10) ?? d.RequiredDate?.slice(0, 10) ?? "",
    value: parseFloat(d.OrderTotal ?? d.SubtotalAmount ?? "0"),
    currency: d.CustomerCurrency ?? "USD",
    status: mapOEOrderStatus(d.OrderStatus ?? d.Completed),
    terms: d.PaymentTerms ?? d.TermsCode ?? "",
  };
}

function mapOEOrderStatus(raw: unknown): Contract["status"] {
  const s = String(raw ?? "").toUpperCase();
  if (s === "ACTIVE" || s === "1" || s === "OPEN") return "active";
  if (s === "COMPLETED" || s === "2" || s === "TRUE") return "expired";
  if (s === "PENDING" || s === "3") return "pending";
  if (s === "CANCELLED" || s === "4") return "terminated";
  return "active";
}

function verifyContractData(
  contract: Contract
): { valid: boolean; reason?: string } {
  if (contract.status === "terminated" || contract.status === "expired") {
    return { valid: false, reason: `Contract status is ${contract.status}` };
  }
  if (contract.endDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (contract.endDate < today) {
      return {
        valid: false,
        reason: `Contract expired on ${contract.endDate}`,
      };
    }
  }
  return { valid: true };
}
