import { useState } from "react";
import type { PaymentMethod, PaymentType } from "../../../types/billing.types";
import { recordPayment, recordAdvance, refund } from "../../../api/billingApi";

interface RecordPaymentModalProps {
  invoiceId?: number;
  patientId: number;
  patientName?: string;
  maxAmount?: number;
  mode?: "payment" | "advance" | "refund";
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  invoiceId,
  patientId,
  patientName,
  maxAmount,
  mode = "payment",
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number | string>(maxAmount && maxAmount > 0 ? maxAmount : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    if (mode === "refund" && !notes.trim()) {
      setError("A refund justification reason is mandatory.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === "refund") {
        await refund({
          patient: patientId,
          invoice: invoiceId,
          amount: numAmount,
          payment_method: paymentMethod,
          reason: notes.trim(),
          reference_number: referenceNumber,
        });
      } else if (invoiceId) {
        await recordPayment(invoiceId, {
          amount: numAmount,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          notes,
          payment_type: "payment" as PaymentType,
        });
      } else {
        await recordAdvance({
          patient: patientId,
          amount: numAmount,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          notes,
          payment_type: "advance" as PaymentType,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to process financial transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "refund"
      ? "Process Patient Refund"
      : mode === "advance"
      ? "Collect Advance Prepayment"
      : "Record Patient Payment";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-2xl ${
                mode === "refund" ? "text-error" : "text-emerald-600"
              }`}
            >
              {mode === "refund" ? "currency_exchange" : "payments"}
            </span>
            <div>
              <h3 className="font-bold text-base text-on-surface">{title}</h3>
              {patientName && (
                <p className="text-xs text-secondary">{patientName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-error-container/20 border border-error text-error text-xs rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
            {maxAmount !== undefined && maxAmount > 0 && mode === "payment" && (
              <span className="text-[11px] text-secondary mt-1 block">
                Total balance due: ₹{Number(maxAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="bank_transfer">Direct Bank Transfer / NEFT</option>
              <option value="cheque">Cheque</option>
              <option value="insurance">Dental Insurance / TPA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UPI txn ID, Cheque #, Card auth ref..."
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              {mode === "refund" ? "Refund Reason *" : "Notes / Remarks"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                mode === "refund"
                  ? "Required explanation for issuing this refund..."
                  : "Optional notes..."
              }
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              required={mode === "refund"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all ${
                mode === "refund"
                  ? "bg-error hover:bg-error/90"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {saving ? "Processing..." : mode === "refund" ? "Process Refund" : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

