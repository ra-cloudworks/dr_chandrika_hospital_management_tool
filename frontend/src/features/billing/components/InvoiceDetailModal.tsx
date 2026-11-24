import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  getInvoice,
  issueInvoice,
  voidInvoice,
  voidPayment,
  addLineItem,
} from "../../../api/billingApi";
import type { InvoiceDetail, NewLineItemPayload } from "../../../types/billing.types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { LineItemRow } from "./LineItemRow";
import { RecordPaymentModal } from "./RecordPaymentModal";

interface InvoiceDetailModalProps {
  invoiceId: number;
  onClose: () => void;
  onUpdated: () => void;
}

export function InvoiceDetailModal({
  invoiceId,
  onClose,
  onUpdated,
}: InvoiceDetailModalProps) {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals inside detail view
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add line item state
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemDesc, setItemDesc] = useState("");
  const [itemTooth, setItemTooth] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemCost, setItemCost] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemTax, setItemTax] = useState(0);
  const [itemNotes, setItemNotes] = useState("");

  const role = user?.role || "";
  const canCreate = ["chief_doctor", "doctor", "receptionist", "accountant"].includes(role);
  const canOverridePrice = ["chief_doctor", "doctor"].includes(role);
  const canRecordPayment = ["chief_doctor", "receptionist", "accountant"].includes(role);
  const canVoid = ["chief_doctor", "accountant"].includes(role);

  const loadInvoice = () => {
    setLoading(true);
    getInvoice(invoiceId)
      .then((res) => {
        setInvoice(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load invoice details.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const handleIssue = async () => {
    if (!invoice) return;
    if (invoice.line_items.length === 0) {
      alert("Cannot issue an invoice without any procedure line items.");
      return;
    }
    setActionLoading(true);
    try {
      await issueInvoice(invoice.id);
      loadInvoice();
      onUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to issue invoice.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !voidReason.trim()) return;
    setActionLoading(true);
    try {
      await voidInvoice(invoice.id, voidReason.trim());
      setShowVoidModal(false);
      setVoidReason("");
      loadInvoice();
      onUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to void invoice.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidPayment = async (paymentId: number) => {
    const reason = window.prompt("Mandatory governance reason for voiding this payment record:");
    if (!reason || !reason.trim()) return;
    try {
      await voidPayment(paymentId, reason.trim());
      loadInvoice();
      onUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to void payment.");
    }
  };

  const handleAddLineItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !itemDesc.trim()) return;
    setActionLoading(true);
    try {
      const payload: NewLineItemPayload = {
        description: itemDesc.trim(),
        tooth_number: itemTooth.trim() || undefined,
        quantity: Number(itemQty),
        unit_price: Number(itemPrice),
        internal_unit_cost: Number(itemCost),
        discount_amount: Number(itemDiscount),
        tax_amount: Number(itemTax),
        notes: itemNotes.trim() || undefined,
      };
      await addLineItem(invoice.id, payload);
      setShowAddItem(false);
      setItemDesc("");
      setItemTooth("");
      setItemQty(1);
      setItemPrice(0);
      setItemCost(0);
      setItemDiscount(0);
      setItemTax(0);
      setItemNotes("");
      loadInvoice();
      onUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to add line item.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    if (val === undefined || val === null) return "₹0.00";
    const num = Number(val);
    return isNaN(num)
      ? "₹0.00"
      : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-surface p-8 rounded-2xl border border-outline-variant text-center">
          <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></span>
          <p className="text-sm font-medium text-secondary">Loading invoice records...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const isVoid = invoice.status === "void";
  const isDraft = invoice.status === "draft";
  const hasInternalCost = invoice.internal_cost_total !== undefined;
  const balanceDueNum = Number(invoice.balance_due) || 0;
  const amountPaidNum = Number(invoice.amount_paid) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl max-w-4xl w-full shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-on-surface">
                Invoice {invoice.invoice_number}
              </h3>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-secondary">
              Patient: <strong className="text-on-surface">{invoice.patient_name}</strong>
              {invoice.issue_date && ` • Issued on ${invoice.issue_date}`}
              {invoice.due_date && ` • Due by ${invoice.due_date}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-secondary hover:text-on-surface rounded-lg border border-outline-variant hover:bg-surface text-xs font-semibold flex items-center gap-1"
              title="Print bill"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-secondary hover:text-on-surface rounded-lg border border-outline-variant hover:bg-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="m-6 p-3 bg-error-container/20 border border-error text-error text-xs rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {isVoid && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800">
            <strong>VOIDED BILL: </strong> {invoice.void_reason || "Voided by clinic administration."}
          </div>
        )}

        {/* Procedures / Line Items Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Itemized Procedures & Products
            </h4>
            {canCreate && !isVoid && (
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Procedure</span>
              </button>
            )}
          </div>

          {showAddItem && (
            <form
              onSubmit={handleAddLineItemSubmit}
              className="p-4 bg-surface-container-low border border-primary/30 rounded-xl space-y-3"
            >
              <h5 className="text-xs font-bold text-primary">New Charge Line Item</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tooth Extraction, Ceramic Inlay..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Tooth FDI # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 16, 21"
                    value={itemTooth}
                    onChange={(e) => setItemTooth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDiscount}
                    onChange={(e) => setItemDiscount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Tax Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemTax}
                    onChange={(e) => setItemTax(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                  />
                </div>
                {hasInternalCost && (
                  <div>
                    <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                      Internal Cost (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface border border-outline-variant rounded-md text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="px-3 py-1 text-xs text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1 text-xs font-bold bg-primary text-on-primary rounded shadow-xs"
                >
                  {actionLoading ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          )}

          {/* Line items table */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold text-secondary uppercase tracking-wider">
                  <th className="py-2.5 px-4">Procedure</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  {hasInternalCost && (
                    <th className="py-2.5 px-4 text-right">Internal Cost</th>
                  )}
                  <th className="py-2.5 px-4 text-right">Discount</th>
                  <th className="py-2.5 px-4 text-right">Tax</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  {canCreate && !isVoid && <th className="py-2.5 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    canEdit={canCreate && !isVoid}
                    canOverridePrice={canOverridePrice && !isVoid}
                    onUpdated={() => {
                      loadInvoice();
                      onUpdated();
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant">
            <div className="space-y-2 text-xs">
              {invoice.notes && (
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                  <span className="font-semibold text-secondary block mb-0.5">Notes:</span>
                  <p className="text-on-surface">{invoice.notes}</p>
                </div>
              )}
              {invoice.created_by_name && (
                <p className="text-secondary text-[11px]">
                  Billed by: <strong className="text-on-surface">{invoice.created_by_name}</strong>
                </p>
              )}
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-2 text-xs">
              <div className="flex justify-between text-secondary">
                <span>Subtotal (Base Charges):</span>
                <span className="font-medium text-on-surface">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Total Approved Discounts:</span>
                <span className="font-medium text-amber-700">
                  -{formatCurrency(invoice.total_discount)}
                </span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Total Taxes (GST):</span>
                <span className="font-medium text-on-surface">
                  {formatCurrency(invoice.total_tax)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-on-surface pt-2 border-t border-outline-variant">
                <span>Grand Total:</span>
                <span className="text-primary">{formatCurrency(invoice.grand_total)}</span>
              </div>
              <div className="flex justify-between text-secondary pt-1">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(invoice.amount_paid)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-outline-variant">
                <span>Balance Due:</span>
                <span className="text-red-600">{formatCurrency(invoice.balance_due)}</span>
              </div>

              {/* Internal margin summary (Chief Doctor & Accountant view only) */}
              {hasInternalCost && (
                <div className="pt-2 border-t border-dashed border-primary/30 mt-2 space-y-1">
                  <div className="flex justify-between text-[11px] text-secondary">
                    <span>Clinic Internal Cost:</span>
                    <span className="font-mono">{formatCurrency(invoice.internal_cost_total)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Gross Profit:</span>
                    <span>
                      {formatCurrency(
                        Number(invoice.grand_total) - Number(invoice.internal_cost_total || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment History Section */}
          <div className="pt-4 border-t border-outline-variant space-y-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Payment & Transaction History
            </h4>

            {invoice.payments.length === 0 ? (
              <p className="text-xs text-secondary italic">No payments recorded yet for this invoice.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-outline-variant">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold text-secondary uppercase">
                      <th className="py-2 px-3">Receipt #</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3">Reference #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Recorded By</th>
                      {canVoid && <th className="py-2 px-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {invoice.payments.map((pmt) => (
                      <tr
                        key={pmt.id}
                        className={`hover:bg-surface-container-low/40 ${
                          pmt.is_voided ? "line-through opacity-50 bg-gray-100" : ""
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-primary">{pmt.payment_number}</td>
                        <td className="py-2 px-3 uppercase text-[10px] font-bold">
                          {pmt.payment_type}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px]">{pmt.payment_method}</td>
                        <td className="py-2 px-3 text-right font-semibold text-on-surface">
                          {formatCurrency(pmt.amount)}
                        </td>
                        <td className="py-2 px-3 text-secondary">{pmt.reference_number || "—"}</td>
                        <td className="py-2 px-3 text-secondary">{pmt.payment_date || "—"}</td>
                        <td className="py-2 px-3 text-secondary">{pmt.recorded_by_name || "Staff"}</td>
                        {canVoid && (
                          <td className="py-2 px-3 text-right">
                            {!pmt.is_voided && (
                              <button
                                onClick={() => handleVoidPayment(pmt.id)}
                                className="text-[10px] text-error hover:underline font-semibold"
                              >
                                Void Payment
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Action Toolbar */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {canVoid && !isVoid && (
              <button
                onClick={() => setShowVoidModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 border border-error/30 rounded-lg transition-colors"
              >
                Void Invoice
              </button>
            )}

            {canVoid && !isVoid && amountPaidNum > 0 && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
              >
                Process Refund
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isDraft && canCreate && (
              <button
                onClick={handleIssue}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Issue Invoice</span>
              </button>
            )}

            {!isVoid && balanceDueNum > 0 && canRecordPayment && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          patientId={invoice.patient}
          patientName={invoice.patient_name}
          maxAmount={balanceDueNum}
          mode="payment"
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            loadInvoice();
            onUpdated();
          }}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          patientId={invoice.patient}
          patientName={invoice.patient_name}
          maxAmount={amountPaidNum}
          mode="refund"
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            loadInvoice();
            onUpdated();
          }}
        />
      )}

      {/* Void Invoice Confirmation Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-60">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="font-bold text-sm text-error mb-2">Void Invoice {invoice.invoice_number}</h4>
            <p className="text-xs text-secondary mb-4">
              Governance requirement: Financial documents are never deleted. Voiding will permanently lock this invoice and audit-log your reason.
            </p>

            <form onSubmit={handleVoidInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Void Justification Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Created in error, Procedure cancelled by doctor..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoidModal(false)}
                  className="px-3 py-1.5 text-xs text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-bold bg-error text-white rounded-lg shadow-xs"
                >
                  {actionLoading ? "Voiding..." : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

