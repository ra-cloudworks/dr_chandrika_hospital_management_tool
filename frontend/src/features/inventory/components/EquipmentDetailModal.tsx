import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { getEquipment, createMaintenanceLog } from "../../../api/inventoryApi";
import type { Equipment, MaintenanceLog, MaintenanceType } from "../../../types/inventory.types";

interface EquipmentDetailModalProps {
  equipmentId: number;
  onClose: () => void;
  onEquipmentUpdated: () => void;
}

export function EquipmentDetailModal({ equipmentId, onClose, onEquipmentUpdated }: EquipmentDetailModalProps) {
  const [equipment, setEquipment] = useState<(Equipment & { maintenance_logs: MaintenanceLog[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form state
  const [mType, setMType] = useState<MaintenanceType>("calibration");
  const [description, setDescription] = useState("");
  const [externalTech, setExternalTech] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDueDate, setNextDueDate] = useState("");
  const [cost, setCost] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails();
  }, [equipmentId]);

  const fetchDetails = () => {
    setLoading(true);
    getEquipment(equipmentId)
      .then((res) => setEquipment(res.data))
      .catch((err) => console.error("Error fetching equipment details:", err))
      .finally(() => setLoading(false));
  };

  const handleCreateLog = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!serviceDate) {
      setError("Service date is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createMaintenanceLog(equipmentId, {
        maintenance_type: mType,
        description: description.trim(),
        external_technician: externalTech.trim(),
        service_date: serviceDate,
        next_due_date: nextDueDate || null,
        cost: cost ? Number(cost) : 0,
        notes: notes.trim(),
      });
      setShowLogForm(false);
      setDescription("");
      setExternalTech("");
      setNextDueDate("");
      setCost("");
      setNotes("");
      fetchDetails();
      onEquipmentUpdated();
    } catch (err: any) {
      console.error("Error logging maintenance:", err);
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to log maintenance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !equipment) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-2xl p-8 flex items-center gap-3 text-on-surface">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          <span>Loading equipment specifications...</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Active / Operational</span>;
      case "under_maintenance":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">Under Maintenance</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">Decommissioned</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">precision_manufacturing</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  {equipment.equipment_code}
                </span>
                {getStatusBadge(equipment.status)}
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{equipment.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
          <div>
            <span className="text-secondary block font-medium">Model Number</span>
            <span className="text-sm font-semibold text-on-surface">{equipment.model_number || "N/A"}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Serial Number</span>
            <span className="text-sm font-mono text-on-surface">{equipment.serial_number || "N/A"}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Manufacturer</span>
            <span className="text-sm font-semibold text-on-surface">{equipment.manufacturer || "N/A"}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Location</span>
            <span className="text-sm font-semibold text-on-surface">{equipment.location || "N/A"}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Purchase Date</span>
            <span className="text-sm text-on-surface">{equipment.purchase_date || "N/A"}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Warranty Expiry</span>
            <span className="text-sm text-on-surface">{equipment.warranty_expiry || "N/A"}</span>
          </div>
        </div>

        {/* Log Maintenance Bar */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history_edu</span>
            Maintenance & Service History
          </h3>
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="px-3 py-1.5 bg-primary text-on-primary hover:opacity-90 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">build</span>
            {showLogForm ? "Cancel" : "Log Maintenance"}
          </button>
        </div>

        {/* Inline Maintenance Form */}
        {showLogForm && (
          <form onSubmit={handleCreateLog} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-4">
            <h4 className="font-semibold text-xs text-on-surface border-b border-outline-variant pb-2">
              Record New Service / Calibration / Repair
            </h4>

            {error && (
              <div className="p-3 bg-error-container/20 text-error text-xs rounded-lg border border-error/30">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Service Type *</label>
                <select
                  value={mType}
                  onChange={(e) => setMType(e.target.value as MaintenanceType)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface"
                >
                  <option value="calibration">Calibration</option>
                  <option value="repair">Repair</option>
                  <option value="cleaning">Cleaning / Sterilization</option>
                  <option value="inspection">Safety Inspection</option>
                  <option value="replacement">Part Replacement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Service Date *</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">External Tech / Service Firm</label>
                <input
                  type="text"
                  value={externalTech}
                  onChange={(e) => setExternalTech(e.target.value)}
                  placeholder="e.g. BioMed Tech — Mr. Rajan"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Service Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 3500"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Service Description *</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Annual spore test and temperature calibration..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-3 py-1.5 text-xs text-secondary hover:bg-surface-container-high rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-primary text-on-primary font-medium text-xs rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Maintenance Log"}
              </button>
            </div>
          </form>
        )}

        {/* Maintenance Logs Timeline */}
        <div className="flex-1 overflow-y-auto pr-1">
          {equipment.maintenance_logs.length === 0 ? (
            <div className="p-8 text-center text-secondary border border-dashed border-outline-variant rounded-xl">
              <p className="text-xs">No maintenance logs recorded for this equipment yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {equipment.maintenance_logs.map((log) => (
                <div key={log.id} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize px-2 py-0.5 rounded bg-primary-container/20 text-primary">
                        {log.maintenance_type}
                      </span>
                      <span className="text-secondary font-mono">{log.service_date}</span>
                      {log.next_due_date && (
                        <span className="text-secondary">
                          • Next due: <strong className="text-on-surface">{log.next_due_date}</strong>
                        </span>
                      )}
                    </div>
                    {log.cost > 0 && <span className="font-bold text-on-surface">₹{log.cost}</span>}
                  </div>
                  <p className="text-on-surface">{log.description}</p>
                  <div className="flex items-center gap-4 text-secondary text-[11px] pt-1 border-t border-outline-variant/40">
                    <span>Handled by: {log.performed_by_staff_name || "Staff"}</span>
                    {log.external_technician && <span>Tech: {log.external_technician}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
