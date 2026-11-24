import { useState } from "react";
import type { FormEvent } from "react";
import { createTransaction } from "../../../api/inventoryApi";
import type { StockBatch, StockTransaction, TransactionType } from "../../../types/inventory.types";

interface ConsumeStockFormProps {
  itemId: number;
  itemName: string;
  currentStock: number;
  batches: StockBatch[];
  onSuccess: (st: StockTransaction, lowStockWarning?: boolean) => void;
  onCancel: () => void;
}

export function ConsumeStockForm({
  itemId,
  itemName,
  currentStock,
  batches,
  onSuccess,
  onCancel,
}: ConsumeStockFormProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>("consumed");
  const [quantity, setQuantity] = useState<number | "">("");
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBatches = batches.filter((b) => b.quantity_remaining > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid positive quantity.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Quantity is passed as positive in UI; backend handles sign based on transaction_type
    const payloadQuantity = Number(quantity);

    try {
      const res = await createTransaction(itemId, {
        transaction_type: transactionType,
        quantity: payloadQuantity,
        batch: selectedBatchId ? Number(selectedBatchId) : null,
        reason: reason.trim(),
      });
      onSuccess(res.data, res.data.low_stock_warning);
    } catch (err: any) {
      console.error("Error creating stock transaction:", err);
      // Extract specific field errors or detail messages returned by Django REST Framework
      const data = err.response?.data;
      let errMsg = "Failed to log stock transaction.";
      if (typeof data === "string") {
        errMsg = data;
      } else if (data?.error || data?.detail) {
        errMsg = data.error || data.detail;
      } else if (data && typeof data === "object") {
        errMsg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-4">
      <div className="flex items-center justify-between border-b border-outline-variant pb-2">
        <h4 className="font-semibold text-on-surface text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">inventory</span>
          Log Usage / Adjustment for {itemName}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-on-surface-variant hover:text-on-surface text-xs underline"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-3 bg-error-container/20 text-error text-xs rounded-lg border border-error/30">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Action Type *
          </label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as TransactionType)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          >
            <option value="consumed">Consumed (Procedure / Visit)</option>
            <option value="disposed">Disposed (Expired / Damaged)</option>
            <option value="adjusted">Stock Count Adjustment</option>
            <option value="returned">Returned to Inventory</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Quantity * (Current: {currentStock})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 3"
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Batch (Optional)
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          >
            <option value="">-- Any Batch / General Stock --</option>
            {availableBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_number} ({b.quantity_remaining} remaining
                {b.expiry_date ? `, exp: ${b.expiry_date}` : ""})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">
          Reason / Reference *
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Used during procedure for PT00003"
          className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-secondary hover:bg-surface-container-high rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-1.5 bg-primary text-on-primary font-medium text-xs rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          {submitting ? "Logging..." : "Submit Transaction"}
        </button>
      </div>
    </form>
  );
}
