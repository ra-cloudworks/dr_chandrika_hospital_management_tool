import { useState } from "react";
import type { InvoiceLineItem } from "../../../types/billing.types";
import { overridePrice, deleteLineItem } from "../../../api/billingApi";

interface LineItemRowProps {
  item: InvoiceLineItem;
  canEdit: boolean;
  canOverridePrice: boolean;
  onUpdated: () => void;
}

export function LineItemRow({
  item,
  canEdit,
  canOverridePrice,
  onUpdated,
}: LineItemRowProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [newPrice, setNewPrice] = useState(Number(item.unit_price) || 0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (val: number | string | undefined) => {
    if (val === undefined || val === null) return "—";
    const num = Number(val);
    return isNaN(num)
      ? "₹0.00"
      : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const hasDiscount = Number(item.discount_amount) > 0;
  const showInternalCost = item.internal_unit_cost !== undefined;

  const handlePriceOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A justification reason is required for price override.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await overridePrice(item.id, {
        new_price: Number(newPrice),
        reason: reason.trim(),
      });
      setShowOverride(false);
      setReason("");
      onUpdated();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to override price.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove procedure "${item.description}" from bill?`)) return;
    setDeleting(true);
    try {
      await deleteLineItem(item.id);
      onUpdated();
    } catch (err) {
      console.error(err);
      alert("Failed to delete line item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr className="border-b border-outline-variant hover:bg-surface-container-low/40 text-xs">
      <td className="py-3 px-4">
        <div className="font-semibold text-on-surface">{item.description}</div>
        {item.tooth_number && (
          <span className="text-[11px] text-secondary">
            Tooth FDI #{item.tooth_number}
          </span>
        )}
        {item.notes && <p className="text-[11px] text-secondary italic mt-0.5">{item.notes}</p>}
      </td>

      <td className="py-3 px-4 text-center text-on-surface">
        {Number(item.quantity)}
      </td>

      <td className="py-3 px-4 text-right">
        <div className="font-medium text-on-surface">{formatCurrency(item.unit_price)}</div>
        {canOverridePrice && canEdit && (
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="text-[10px] text-primary hover:underline font-semibold block ml-auto"
          >
            Override Price
          </button>
        )}
      </td>

      {/* Internal cost column — only rendered if backend returned it (governance rule) */}
      {showInternalCost && (
        <td className="py-3 px-4 text-right text-secondary">
          <span className="font-mono">{formatCurrency(item.internal_unit_cost)}</span>
        </td>
      )}

      <td className="py-3 px-4 text-right">
        {hasDiscount ? (
          <div>
            <span className="text-amber-700 font-semibold block">
              -{formatCurrency(item.discount_amount)}
            </span>
            {item.discount_approved ? (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                Approved
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                Pending Approval
              </span>
            )}
          </div>
        ) : (
          <span className="text-secondary">—</span>
        )}
      </td>

      <td className="py-3 px-4 text-right text-secondary">
        {Number(item.tax_amount) > 0 ? formatCurrency(item.tax_amount) : "—"}
      </td>

      <td className="py-3 px-4 text-right font-bold text-on-surface">
        {formatCurrency(item.line_total)}
      </td>

      {canEdit && (
        <td className="py-3 px-4 text-right">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1 text-secondary hover:text-error transition-colors"
            title="Delete line item"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </td>
      )}

      {showOverride && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <h4 className="font-bold text-sm text-on-surface mb-2">Override Procedure Price</h4>
            <p className="text-xs text-secondary mb-4">
              Governance rule: Any manual pricing change is logged with your identity, old price, new price, and justification.
            </p>

            {error && (
              <p className="text-xs text-error mb-3 p-2 bg-error-container/20 rounded-lg">{error}</p>
            )}

            <form onSubmit={handlePriceOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  New Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Justification Reason *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Matched competitor quote, Special package discount..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverride(false)}
                  className="px-3 py-1.5 text-xs text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-lg shadow-xs"
                >
                  {saving ? "Saving..." : "Confirm Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </tr>
  );
}

