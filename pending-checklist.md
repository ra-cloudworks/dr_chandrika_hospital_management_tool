# Project Checklist & Implementation Tracker

## Module 13 — Billing & Financial Governance
- [x] Clinic Financial Settings with singleton pattern & configurable discount approval threshold percent and amount
- [x] Invoice model with auto-generated sequential numbers (`INV00001`), atomic totals calculation (`recalculate_totals`), and payment status progression
- [x] Invoice line items with role-based internal cost hiding via serializer `to_representation` (restricted to Chief Doctor and Accountant)
- [x] Strict discount approval workflow requiring Chief Doctor approval for discounts exceeding governance thresholds
- [x] Price override auditing via `PriceOverrideLog` with mandatory clinical justification
- [x] Payment tracking with auto-generated numbers (`PAY00001`), multi-method support, and patient advance credit balance tracking (`PatientAccount`)
- [x] Safe refund & voiding workflows (financial records are never hard-deleted; only voided with mandatory reasons)
- [x] System-wide immutable `AuditLog` integration across all financial mutations (invoices, line items, payments, overrides, voids, refunds, discount approvals)
- [x] Outstanding invoices dashboard and date-range aggregated revenue & gross margin analytics
- [x] React + TypeScript frontend with `BillingPage`, `InvoiceTable`, `InvoiceDetailModal`, `DiscountApprovalPanel`, `RevenueSummaryCard`, `NewInvoiceForm`, `LineItemRow`, `RecordPaymentModal`, and Patient Detail "Billing" tab

