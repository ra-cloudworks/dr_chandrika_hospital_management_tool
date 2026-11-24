import { useState } from "react";
import type { FormEvent } from "react";
import { createEquipment } from "../../../api/inventoryApi";
import type { Equipment, EquipmentStatus } from "../../../types/inventory.types";

interface NewEquipmentFormProps {
  onSuccess: (eq: Equipment) => void;
  onCancel: () => void;
}

export function NewEquipmentForm({ onSuccess, onCancel }: NewEquipmentFormProps) {
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("active");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Equipment name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createEquipment({
        name: name.trim(),
        model_number: modelNumber.trim(),
        serial_number: serialNumber.trim(),
        manufacturer: manufacturer.trim(),
        location: location.trim(),
        purchase_date: purchaseDate || null,
        warranty_expiry: warrantyExpiry || null,
        status,
        notes: notes.trim(),
      });
      onSuccess(res.data);
    } catch (err: any) {
      console.error("Error creating equipment:", err);
      // Extract specific field errors or detail messages returned by Django REST Framework
      const data = err.response?.data;
      let errMsg = "Failed to create equipment record.";
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">precision_manufacturing</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Add New Equipment</h3>
              <p className="text-xs text-secondary">Register clinic asset, autoclave, X-ray machine, or dental unit</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error-container/20 text-error text-xs rounded-xl border border-error/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Autoclave — SteamPro 250"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Model Number</label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. SP-250"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SP250-2024-0891"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. MedEquip India"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Clinic Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sterilization Room / Operatory 1"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Operational Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              >
                <option value="active">Active / Operational</option>
                <option value="under_maintenance">Under Maintenance / Service</option>
                <option value="decommissioned">Decommissioned / Retired</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Notes / Specifications</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Power requirements, service contract details..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-secondary hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-on-primary font-medium text-xs rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Equipment Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
