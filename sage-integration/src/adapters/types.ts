export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerCode: string;
  customerName: string;
  date: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  amountDue: number;
  currency: string;
  status: "open" | "paid" | "overdue" | "partial" | "void";
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  lineNumber: number;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerCode: string;
  customerName: string;
  date: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  appliedInvoices: AppliedInvoice[];
}

export interface AppliedInvoice {
  invoiceNumber: string;
  appliedAmount: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerCode: string;
  customerName: string;
  description: string;
  startDate: string;
  endDate: string;
  value: number;
  currency: string;
  status: "active" | "expired" | "pending" | "terminated";
  terms: string;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  customerCode?: string;
  status?: string;
}

export interface SageAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  listInvoices(options?: ListOptions): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice>;

  listPayments(options?: ListOptions): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment>;

  listContracts(options?: ListOptions): Promise<Contract[]>;
  getContract(id: string): Promise<Contract>;
  verifyContract(id: string): Promise<{ valid: boolean; reason?: string }>;
}
