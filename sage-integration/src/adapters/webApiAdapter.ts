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
 * Default base URL format: http://<server>/Sage300WebApi/v1.0/-/<CompanyId>
 *
 * Documentation: https://developer.sage.com/sage-300/docs/web-api/
 */
export class WebApiAdapter implements SageAdapter {
  private client: AxiosInstance;

  constructor(private cfg: WebApiConfig) {
    this.client = axios.create({
      baseURL: cfg.baseUrl,
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
    await this.healthCheck();
    logger.info("SAGE 300 Web API adapter connected");
  }

  async disconnect(): Promise<void> {
    logger.info("SAGE 300 Web API adapter disconnected");
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/AR/ARCustomers?$top=1");
      return true;
    } catch {
      return false;
    }
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async listInvoices(options: ListOptions = {}): Promise<Invoice[]> {
    const params = buildODataParams(options);
    const res = await this.client.get("/AR/ARInvoiceBatches", { params });
    return (res.data.value ?? []).map(mapInvoice);
  }

  async getInvoice(id: string): Promise<Invoice> {
    const res = await this.client.get(
      `/AR/ARInvoiceBatches('${encodeURIComponent(id)}')`
    );
    return mapInvoice(res.data);
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async listPayments(options: ListOptions = {}): Promise<Payment[]> {
    const params = buildODataParams(options);
    const res = await this.client.get("/AR/ARReceiptBatches", { params });
    return (res.data.value ?? []).map(mapPayment);
  }

  async getPayment(id: string): Promise<Payment> {
    const res = await this.client.get(
      `/AR/ARReceiptBatches('${encodeURIComponent(id)}')`
    );
    return mapPayment(res.data);
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────

  async listContracts(options: ListOptions = {}): Promise<Contract[]> {
    const params = buildODataParams(options);
    const res = await this.client.get("/OE/OEContracts", { params });
    return (res.data.value ?? []).map(mapContract);
  }

  async getContract(id: string): Promise<Contract> {
    const res = await this.client.get(
      `/OE/OEContracts('${encodeURIComponent(id)}')`
    );
    return mapContract(res.data);
  }

  async verifyContract(
    id: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const contract = await this.getContract(id);
    return verifyContractData(contract);
  }
}

// ─── OData helpers ───────────────────────────────────────────────────────────

function buildODataParams(options: ListOptions): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  const filters: string[] = [];

  if (options.page && options.pageSize) {
    params["$skip"] = (options.page - 1) * (options.pageSize || 20);
  }
  if (options.pageSize) {
    params["$top"] = options.pageSize;
  }
  if (options.fromDate) {
    filters.push(`DocumentDate ge ${options.fromDate}`);
  }
  if (options.toDate) {
    filters.push(`DocumentDate le ${options.toDate}`);
  }
  if (options.customerCode) {
    filters.push(`CustomerNumber eq '${options.customerCode}'`);
  }
  if (filters.length) {
    params["$filter"] = filters.join(" and ");
  }
  return params;
}

// ─── Data mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(d: any): Invoice {
  return {
    id: d.BatchNumber ?? d.id,
    invoiceNumber: d.EntryNumber ?? d.InvoiceNumber ?? d.BatchNumber,
    customerCode: d.CustomerNumber ?? "",
    customerName: d.CustomerName ?? "",
    date: d.DocumentDate ?? d.PostingDate ?? "",
    dueDate: d.DueDate ?? "",
    subtotal: parseFloat(d.SubtotalAmount ?? d.NetAmount ?? "0"),
    tax: parseFloat(d.TaxAmount ?? "0"),
    total: parseFloat(d.DocumentTotal ?? d.TotalAmount ?? "0"),
    amountDue: parseFloat(d.AmountDue ?? d.OutstandingAmount ?? "0"),
    currency: d.CurrencyCode ?? "USD",
    status: mapInvoiceStatus(d.DocumentStatus ?? d.Status),
    lines: (d.Details ?? d.Lines ?? []).map(mapInvoiceLine),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoiceLine(l: any, idx: number): Invoice["lines"][0] {
  return {
    lineNumber: l.LineNumber ?? idx + 1,
    itemCode: l.ItemNumber ?? l.ItemCode ?? "",
    description: l.ItemDescription ?? l.Description ?? "",
    quantity: parseFloat(l.QuantityOrdered ?? l.Quantity ?? "0"),
    unitPrice: parseFloat(l.UnitPrice ?? "0"),
    discount: parseFloat(l.DiscountPercent ?? l.DiscountAmount ?? "0"),
    lineTotal: parseFloat(l.ExtendedAmount ?? l.LineTotal ?? "0"),
  };
}

function mapInvoiceStatus(raw: string | number | undefined): Invoice["status"] {
  const s = String(raw ?? "").toUpperCase();
  if (s === "1" || s === "OPEN" || s === "POSTED") return "open";
  if (s === "2" || s === "PAID" || s === "CLEARED") return "paid";
  if (s === "3" || s === "PARTIAL") return "partial";
  if (s === "4" || s === "VOID" || s === "DELETED") return "void";
  return "open";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayment(d: any): Payment {
  return {
    id: d.BatchNumber ?? d.id,
    paymentNumber: d.EntryNumber ?? d.ReceiptNumber ?? d.BatchNumber,
    customerCode: d.CustomerNumber ?? "",
    customerName: d.CustomerName ?? "",
    date: d.ReceiptDate ?? d.DocumentDate ?? "",
    amount: parseFloat(d.TotalAmount ?? d.ReceiptAmount ?? "0"),
    currency: d.CurrencyCode ?? "USD",
    method: d.PaymentCode ?? d.PaymentMethod ?? "",
    reference: d.CheckNumber ?? d.Reference ?? "",
    appliedInvoices: (d.AppliedDetails ?? d.Applied ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => ({
        invoiceNumber: a.DocumentNumber ?? a.InvoiceNumber ?? "",
        appliedAmount: parseFloat(a.AmountApplied ?? "0"),
      })
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContract(d: any): Contract {
  return {
    id: d.ContractNumber ?? d.id,
    contractNumber: d.ContractNumber ?? "",
    customerCode: d.CustomerNumber ?? "",
    customerName: d.CustomerName ?? "",
    description: d.Description ?? "",
    startDate: d.StartDate ?? "",
    endDate: d.ExpirationDate ?? d.EndDate ?? "",
    value: parseFloat(d.ContractAmount ?? d.TotalAmount ?? "0"),
    currency: d.CurrencyCode ?? "USD",
    status: mapContractStatus(d.ContractStatus ?? d.Status),
    terms: d.Terms ?? d.PaymentTerms ?? "",
  };
}

function mapContractStatus(raw: string | number | undefined): Contract["status"] {
  const s = String(raw ?? "").toUpperCase();
  if (s === "1" || s === "ACTIVE" || s === "OPEN") return "active";
  if (s === "2" || s === "EXPIRED" || s === "CLOSED") return "expired";
  if (s === "3" || s === "PENDING") return "pending";
  if (s === "4" || s === "TERMINATED" || s === "CANCELLED") return "terminated";
  return "active";
}

function verifyContractData(contract: Contract): { valid: boolean; reason?: string } {
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
