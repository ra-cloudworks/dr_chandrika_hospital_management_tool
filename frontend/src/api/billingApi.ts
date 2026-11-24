// API service functions for Module 13: Billing & Financial Governance
import { apiClient } from "./client";
import type {
  ClinicFinancialSettings,
  InvoiceListItem,
  InvoiceDetail,
  InvoiceLineItem,
  Payment,
  DiscountApprovalRequest,
  PatientAccount,
  RevenueReport,
  NewInvoicePayload,
  NewLineItemPayload,
  RecordPaymentPayload,
  DiscountActionPayload,
  PriceOverridePayload,
  RefundPayload,
} from "../types/billing.types";

// Settings
export const getSettings = () =>
  apiClient.get<ClinicFinancialSettings>("/billing/settings/");

export const updateSettings = (data: Partial<ClinicFinancialSettings>) =>
  apiClient.patch<ClinicFinancialSettings>("/billing/settings/", data);

// Invoices
export const listInvoices = (patientId: number, filters?: Record<string, any>) =>
  apiClient.get<InvoiceListItem[]>(`/billing/${patientId}/`, { params: filters });

export const getInvoice = (id: number) =>
  apiClient.get<InvoiceDetail>(`/billing/invoice/${id}/`);

export const createInvoice = (patientId: number, data: NewInvoicePayload) =>
  apiClient.post<InvoiceDetail>(`/billing/${patientId}/`, data);

export const issueInvoice = (id: number, data?: { due_date?: string }) =>
  apiClient.post<InvoiceDetail>(`/billing/invoice/${id}/issue/`, data || {});

export const voidInvoice = (id: number, reason: string) =>
  apiClient.post<{ detail: string; invoice: InvoiceDetail }>(`/billing/invoice/${id}/void/`, { reason });

// Line Items
export const addLineItem = (invoiceId: number, data: NewLineItemPayload) =>
  apiClient.post<InvoiceLineItem>(`/billing/invoice/${invoiceId}/line-items/`, data);

export const updateLineItem = (id: number, data: Partial<NewLineItemPayload>) =>
  apiClient.patch<InvoiceLineItem>(`/billing/line-item/${id}/`, data);

export const deleteLineItem = (id: number) =>
  apiClient.delete(`/billing/line-item/${id}/`);

export const overridePrice = (lineItemId: number, data: PriceOverridePayload) =>
  apiClient.post<InvoiceLineItem>(`/billing/line-item/${lineItemId}/override-price/`, data);

// Payments & Advances & Refunds
export const recordPayment = (invoiceId: number, data: RecordPaymentPayload) =>
  apiClient.post<Payment>(`/billing/invoice/${invoiceId}/record-payment/`, data);

export const recordAdvance = (data: RecordPaymentPayload & { patient: number }) =>
  apiClient.post<Payment>("/billing/payment/advance/", data);

export const refund = (data: RefundPayload) =>
  apiClient.post<Payment>("/billing/refund/", data);

export const voidPayment = (id: number, reason: string) =>
  apiClient.post<{ detail: string; payment: Payment }>(`/billing/payment/${id}/void/`, { reason });

// Discount Approval Workflow
export const listDiscountRequests = () =>
  apiClient.get<DiscountApprovalRequest[]>("/billing/discount-requests/");

export const actionDiscountRequest = (id: number, data: DiscountActionPayload) =>
  apiClient.post<DiscountApprovalRequest>(`/billing/discount-requests/${id}/action/`, data);

// Patient Account Summary
export const getPatientAccount = (patientId: number) =>
  apiClient.get<PatientAccount>(`/billing/patient-account/${patientId}/`);

// Reports
export const getOutstandingInvoices = () =>
  apiClient.get<InvoiceListItem[]>("/billing/reports/outstanding/");

export const getRevenueReport = (from?: string, to?: string) =>
  apiClient.get<RevenueReport>("/billing/reports/revenue/", {
    params: { from: from || undefined, to: to || undefined },
  });

