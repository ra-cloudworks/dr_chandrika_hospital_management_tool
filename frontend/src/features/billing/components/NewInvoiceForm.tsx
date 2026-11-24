import { useEffect, useState } from "react";
import { listTreatmentPlans } from "../../../api/treatmentPlanApi";
import { createInvoice } from "../../../api/billingApi";
import type { TreatmentPlan } from "../../../types/treatmentPlan.types";
import type { InvoiceDetail } from "../../../types/billing.types";

interface NewInvoiceFormProps {
  patientId: number;
  patientName?: string;
  onClose: () => void;
  onCreated: (invoice: InvoiceDetail) => void;
}

export function NewInvoiceForm({
  patientId,
  patientName,
  onClose,
  onCreated,
}: NewInvoiceFormProps) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | string>("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingPlans(true);
    listTreatmentPlans(patientId)
      .then((res) => {
        // Show plans that have items
        setPlans(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load patient treatment plans", err);
      })
      .finally(() => setLoadingPlans(false));
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await createInvoice(patientId, {
        treatment_plan: selectedPlanId ? Number(selectedPlanId) : null,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to create invoice."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">post_add</span>
            <div>
              <h3 className="font-bold text-base text-on-surface">Generate New Patient Invoice</h3>
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
              Source Treatment Plan (Optional)
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={loadingPlans}
            >
              <option value="">Blank Invoice (Add items manually)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (v{p.revision_number}) — ₹{Number(p.total_estimated_cost).toLocaleString("en-IN")} [{p.status}]
                </option>
              ))}
            </select>
            <span className="text-[11px] text-secondary mt-1 block">
              Selecting an accepted treatment plan will automatically copy procedures, pricing, and materials into invoice line items.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Payment Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Invoice Notes & Payment Instructions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 50% deposit payable before surgical appointment, UPI accepted..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
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
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">receipt</span>
              <span>{submitting ? "Creating Invoice..." : "Create Invoice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

