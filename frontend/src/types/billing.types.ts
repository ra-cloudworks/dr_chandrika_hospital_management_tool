// Types for Module 13: Billing & Financial Governance

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "void";
export type PaymentType = "payment" | "advance" | "refund";
export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "insurance";
export type DiscountRequestStatus = "pending" | "approved" | "rejected";

export interface ClinicFinancialSettings {
  id: number;
  discount_approval_threshold_percent: number | string;
  discount_approval_threshold_amount: number | string;
  default_tax_percent: number | string;
  currency_symbol: string;
  invoice_prefix: string;
  updated_at?: string;
}

export interface InvoiceLineItem {
  id: number;
  invoice: number;
  treatment_plan_item?: number | null;
  description: string;
  tooth_number?: string;
  quantity: number | string;
  unit_price: number | string;
  internal_unit_cost?: number | string; // Omitted by backend for non-privileged roles
  discount_amount: number | string;
  discount_approved: boolean;
  tax_amount: number | string;
  line_total: number | string;
  line_internal_cost?: number | string; // Omitted by backend for non-privileged roles
  notes?: string;
}

export interface InvoiceListItem {
  id: number;
  invoice_number: string;
  patient: number;
  patient_name: string;
  status: InvoiceStatus;
  grand_total: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  issue_date?: string | null;
  due_date?: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  payment_number: string;
  invoice?: number | null;
  patient: number;
  patient_name?: string;
  payment_type: PaymentType;
  amount: number | string;
  payment_method: PaymentMethod;
  reference_number?: string;
  payment_date?: string | null;
  notes?: string;
  is_voided: boolean;
  void_reason?: string;
  recorded_by?: number | null;
  recorded_by_name?: string | null;
  created_at: string;
}

export interface DiscountApprovalRequest {
  id: number;
  invoice: number;
  line_item?: number | null;
  requested_discount_amount: number | string;
  discount_percent: number | string;
  reason: string;
  status: DiscountRequestStatus;
  requested_by?: number | null;
  requested_by_name?: string | null;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  review_notes?: string;
  requested_at: string;
  reviewed_at?: string | null;
}

export interface PriceOverrideLog {
  id: number;
  line_item: number;
  old_price: number | string;
  new_price: number | string;
  reason: string;
  changed_by?: number | null;
  changed_by_name?: string | null;
  changed_at: string;
}

export interface PatientAccount {
  patient_id: number;
  patient_name: string;
  credit_balance: number | string;
  total_invoiced?: number | string;
  total_paid?: number | string;
  total_outstanding?: number | string;
  updated_at?: string;
}

export interface InvoiceDetail {
  id: number;
  invoice_number: string;
  patient: number;
  patient_name: string;
  treatment_plan?: number | null;
  status: InvoiceStatus;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal: number | string;
  total_discount: number | string;
  total_tax: number | string;
  grand_total: number | string;
  internal_cost_total?: number | string; // Omitted by backend for non-privileged roles
  amount_paid: number | string;
  balance_due: number | string;
  notes?: string;
  void_reason?: string;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  line_items: InvoiceLineItem[];
  payments: Payment[];
  discount_requests: DiscountApprovalRequest[];
}

export interface RevenueReport {
  from_date?: string | null;
  to_date?: string | null;
  invoice_count: number;
  total_revenue: number | string;
  total_collected: number | string;
  total_outstanding: number | string;
  total_discount_given: number | string;
  total_internal_cost?: number | string;
  gross_margin?: number | string;
  gross_margin_percent?: number;
}

// Request Payloads

export interface NewInvoicePayload {
  treatment_plan?: number | null;
  due_date?: string;
  notes?: string;
}

export interface NewLineItemPayload {
  description: string;
  tooth_number?: string;
  quantity?: number;
  unit_price: number;
  internal_unit_cost?: number;
  discount_amount?: number;
  tax_amount?: number;
  notes?: string;
  reason?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  payment_type?: PaymentType;
}

export interface DiscountActionPayload {
  decision: "approve" | "reject";
  review_notes?: string;
}

export interface PriceOverridePayload {
  new_price: number;
  reason: string;
}

export interface VoidPayload {
  reason: string;
}

export interface RefundPayload {
  patient?: number;
  invoice?: number;
  amount: number;
  payment_method: PaymentMethod;
  reason: string;
  reference_number?: string;
}

