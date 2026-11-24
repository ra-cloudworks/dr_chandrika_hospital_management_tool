// NewLabOrderForm component for creating a new laboratory order
import { useState } from "react";
import { createLabOrder } from "../../../api/labManagementApi";
import type { NewLabOrderPayload, WorkType, ImpressionType } from "../../../types/labManagement.types";
import { LabSelector } from "./LabSelector";

interface NewLabOrderFormProps {
  patientId: number;
  onCreated: () => void;
  onCancel: () => void;
}

export function NewLabOrderForm({ patientId, onCreated, onCancel }: NewLabOrderFormProps) {
  const [labId, setLabId] = useState<number | null>(null);
  const [workType, setWorkType] = useState<WorkType>("crown");
  const [toothNumbers, setToothNumbers] = useState("");
  const [shade, setShade] = useState("");
  const [material, setMaterial] = useState("Zirconia");
  const [brand, setBrand] = useState("");
  const [impressionType, setImpressionType] = useState<ImpressionType>("physical");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [labCost, setLabCost] = useState<number | string>(0);
  const [patientCharge, setPatientCharge] = useState<number | string>(0);
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState<number | string>("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: NewLabOrderPayload = {
      lab: labId,
      work_type: workType,
      tooth_numbers: toothNumbers,
      shade,
      material,
      brand,
      impression_type: impressionType,
      special_instructions: specialInstructions,
      lab_cost: Number(labCost) || 0,
      patient_charge: Number(patientCharge) || 0,
      promised_delivery_date: promisedDeliveryDate || undefined,
      warranty_months: warrantyMonths ? Number(warrantyMonths) : null,
    };

    try {
      await createLabOrder(patientId, payload);
      onCreated();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err?.response?.data?.error || "Failed to create lab order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-md max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-on-surface">New Laboratory Order</h3>
          <p className="text-xs text-secondary">
            Fill in the prosthesis parameters and external lab details.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-secondary hover:text-on-surface transition-colors p-1"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Select Dental Lab
            </label>
            <LabSelector value={labId} onChange={setLabId} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Work Type *</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkType)}
              required
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="crown">Crown</option>
              <option value="bridge">Bridge</option>
              <option value="denture">Denture</option>
              <option value="partial_denture">Partial Denture</option>
              <option value="implant_crown">Implant Crown</option>
              <option value="orthodontic_appliance">Orthodontic Appliance</option>
              <option value="night_guard">Night Guard</option>
              <option value="retainer">Retainer</option>
              <option value="veneer">Veneer</option>
              <option value="inlay_onlay">Inlay/Onlay</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Tooth Number(s)
            </label>
            <input
              type="text"
              placeholder="e.g. 36 or 35,36,37"
              value={toothNumbers}
              onChange={(e) => setToothNumbers(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Shade</label>
            <input
              type="text"
              placeholder="e.g. A2, B1"
              value={shade}
              onChange={(e) => setShade(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Material</label>
            <input
              type="text"
              placeholder="e.g. Zirconia, E-max"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Brand</label>
            <input
              type="text"
              placeholder="e.g. Lava, Ceramill"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Impression Type</label>
            <select
              value={impressionType}
              onChange={(e) => setImpressionType(e.target.value as ImpressionType)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="physical">Physical Impression</option>
              <option value="digital_scan">Digital Intraoral Scan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Lab Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={labCost}
              onChange={(e) => setLabCost(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Patient Charge (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={patientCharge}
              onChange={(e) => setPatientCharge(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Promised Delivery Date
            </label>
            <input
              type="date"
              value={promisedDeliveryDate}
              onChange={(e) => setPromisedDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Warranty (Months)</label>
            <input
              type="number"
              min="0"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value)}
              placeholder="e.g. 60"
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">
            Special Instructions
          </label>
          <textarea
            rows={2}
            placeholder="Special margin, contact point instructions, articulators..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:bg-surface-container-low border border-outline-variant rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                <span>Creating Order...</span>
              </>
            ) : (
              <span>Create Order</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
