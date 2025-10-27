// Receipt parsing types

export type Money = number; // store as decimal in CAD

export type ReceiptItem = {
  name: string;
  brand?: string;
  qty: number;               // default 1
  price_total: Money;        // line total
  unit_price?: Money;
  unit?: string;             // ea, kg, g, L, ml, lb
  ocr_confidence?: number;   // 0..1 minimal
  needs_review?: boolean;    // true if low confidence or heuristics fail
  category?: string;         // produce, dairy, meat, pantry, frozen, household, snacks
  expires_on?: string;       // YYYY-MM-DD
};

export type ReceiptDiscount = {
  label: string;             // e.g., TPR coupon, RABAIS, COUPON
  amount: Money;             // negative numbers
};

export type ParsedReceipt = {
  vendor?: string;
  store_id?: string;
  date?: string;             // YYYY-MM-DD
  currency: "CAD";
  items: ReceiptItem[];
  discounts: ReceiptDiscount[];
  subtotal?: Money;
  tax_total?: Money;
  total?: Money;
  raw_text?: string;
  needs_review: boolean;
  review_reasons: string[];
};
