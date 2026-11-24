import { useState } from "react";
import type { FormEvent } from "react";
import { addStockBatch } from "../../../api/inventoryApi";
import type { StockBatch } from "../../../types/inventory.types";

interface ReceiveStockFormProps {
  itemId: number;
  itemName: string;
  onSuccess: (batch: StockBatch) => void;
  onCancel: () => void;
}

export function ReceiveStockForm({ itemId, itemName, onSuccess, onCancel }: ReceiveStockFormProps) {
  const [batchNumber, setBatchNumber] = useState("");
  const [quantityReceived, setQuantityReceived] = useState<number | "">("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierInvoice, setSupplierInvoice] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim()) {
      setError("Batch number is required.");
      return;
    }
    if (!quantityReceived || Number(quantityReceived) <= 0) {
      setError("Quantity received must be a positive number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await addStockBatch(itemId, {
        batch_number: batchNumber.trim(),
        quantity_received: Number(quantityReceived),
        expiry_date: expiryDate || null,
        supplier_name: supplierName.trim(),
        supplier_invoice: supplierInvoice.trim(),
        purchase_cost: purchaseCost ? Number(purchaseCost) : 0,
        notes: notes.trim(),
      });
      onSuccess(res.data);
    } catch (err: any) {
      console.error("Error receiving stock batch:", err);
      // Extract specific field errors or detail messages returned by Django REST Framework
      const data = err.response?.data;
      let errMsg = "Failed to receive stock batch.";
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
          <span className="material-symbols-outlined text-primary text-[20px]">add_box</span>
          Receive New Stock for {itemName}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Batch / Lot Number *
          </label>
          <input
            type="text"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="e.g. BATCH-2026-901"
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Quantity Received *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={quantityReceived}
            onChange={(e) => setQuantityReceived(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 20"
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Supplier Name
          </label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. Dental Depot India"
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Supplier Invoice #
          </label>
          <input
            type="text"
            value={supplierInvoice}
            onChange={(e) => setSupplierInvoice(e.target.value)}
            placeholder="e.g. INV-4401"
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Total Purchase Cost (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={purchaseCost}
            onChange={(e) => setPurchaseCost(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 17000"
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">
          Notes / Remarks
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Storage instructions or inspection notes..."
          className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
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
          {submitting ? "Saving..." : "Record Stock Entry"}
        </button>
      </div>
    </form>
  );
}
