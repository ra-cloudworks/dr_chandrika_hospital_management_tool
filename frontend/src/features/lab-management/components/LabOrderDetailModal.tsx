// LabOrderDetailModal component rendering full order details, status timeline, transition buttons, and doctor acceptance controls
import { useEffect, useState } from "react";
import { getLabOrder, updateLabOrderStatus, updateLabOrder } from "../../../api/labManagementApi";
import type { LabOrderDetail, LabOrderStatus } from "../../../types/labManagement.types";
import { VALID_TRANSITIONS } from "../../../types/labManagement.types";
import { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModalProps {
  orderId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_ACTION_LABELS: Record<LabOrderStatus, string> = {
  draft: "Back to Draft",
  sent_to_lab: "Send to Lab",
  in_fabrication: "Mark In Fabrication",
  trial_ready: "Mark Trial Ready",
  trial_done: "Complete Trial",
  remake_requested: "Request Remake",
  delivered: "Mark Delivered",
  accepted: "Accept Prosthesis",
  rejected: "Reject Prosthesis",
};

export function LabOrderDetailModal({
  orderId,
  onClose,
  onUpdated,
}: LabOrderDetailModalProps) {
  const [order, setOrder] = useState<LabOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Status transition state
  const [selectedNextStatus, setSelectedNextStatus] = useState<LabOrderStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  // Logistics state editing
  const [editingLogistics, setEditingLogistics] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [courierTracking, setCourierTracking] = useState("");
  const [savingLogistics, setSavingLogistics] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadDetail = () => {
    setLoading(true);
    setError(null);
    getLabOrder(orderId)
      .then((res) => {
        setOrder(res.data);
        setCourierName(res.data.courier_name || "");
        setCourierTracking(res.data.courier_tracking || "");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load lab order details.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
  }, [orderId]);

  const handleStatusTransition = async (nextStatus: LabOrderStatus) => {
    if (!order) return;
    setChangingStatus(true);
    setError(null);

    try {
      await updateLabOrderStatus(order.id, nextStatus, statusNotes);
      setSelectedNextStatus(null);
      setStatusNotes("");
      loadDetail();
      onUpdated();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to update order status."
      );
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSaveLogistics = async () => {
    if (!order) return;
    setSavingLogistics(true);
    setError(null);

    try {
      await updateLabOrder(order.id, {
        courier_name: courierName,
        courier_tracking: courierTracking,
      });
      setEditingLogistics(false);
      loadDetail();
      onUpdated();
    } catch (err: any) {
      console.error(err);
      setError("Failed to save courier/logistics info.");
    } finally {
      setSavingLogistics(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-8 max-w-md w-full text-center">
          <span className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></span>
          <p className="text-sm font-semibold text-on-surface">Loading Order #{orderId}...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const validNextStatuses = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 transition-all">
        {/* Modal Header */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined">science</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface font-mono">{order.order_number}</h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-secondary">
                Patient: <span className="font-semibold text-on-surface">{order.patient_name}</span> ({order.patient_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant">
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Work Type
              </span>
              <span className="text-sm font-semibold text-on-surface capitalize">
                {order.work_type.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Tooth #
              </span>
              <span className="text-sm font-semibold text-on-surface font-mono">
                {order.tooth_numbers || "—"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Shade / Material
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {order.shade ? `${order.shade} / ` : ""}
                {order.material || "Standard"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Assigned Lab
              </span>
              <span className="text-sm font-semibold text-primary">
                {order.lab_name || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Additional Clinical Details & Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Clinical Parameters
              </h4>
              <ul className="text-xs space-y-1 text-on-surface">
                <li>
                  <span className="text-secondary">Impression Type:</span>{" "}
                  <span className="font-semibold capitalize">
                    {order.impression_type.replace("_", " ")}
                  </span>
                </li>
                {order.brand && (
                  <li>
                    <span className="text-secondary">Brand:</span>{" "}
                    <span className="font-semibold">{order.brand}</span>
                  </li>
                )}
                {order.ordering_doctor_name && (
                  <li>
                    <span className="text-secondary">Ordering Doctor:</span>{" "}
                    <span className="font-semibold">{order.ordering_doctor_name}</span>
                  </li>
                )}
                {order.special_instructions && (
                  <li className="pt-1">
                    <span className="text-secondary block">Special Instructions:</span>
                    <p className="bg-surface p-2 rounded border border-outline-variant italic mt-0.5 text-xs text-on-surface">
                      "{order.special_instructions}"
                    </p>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Financials & Remakes
              </h4>
              <div className="bg-surface p-3 rounded-xl border border-outline-variant space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-secondary">Lab Cost:</span>
                  <span className="font-bold font-mono">₹{order.lab_cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Patient Charge:</span>
                  <span className="font-bold font-mono text-emerald-700">₹{order.patient_charge}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-outline-variant">
                  <span className="text-secondary">Remake Count:</span>
                  <span className={`font-bold ${order.remake_count > 0 ? "text-rose-600" : ""}`}>
                    {order.remake_count}
                  </span>
                </div>
                {order.remake_reason && (
                  <div className="pt-1">
                    <span className="text-rose-700 font-semibold block">Last Remake Reason:</span>
                    <p className="text-[11px] text-rose-800 bg-rose-50 p-1.5 rounded mt-0.5">
                      {order.remake_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Courier & Delivery Logistics Section */}
          <div className="border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Logistics & Tracking
              </h4>
              {!editingLogistics ? (
                <button
                  onClick={() => setEditingLogistics(true)}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit Courier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingLogistics(false)}
                    className="text-xs text-secondary hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLogistics}
                    disabled={savingLogistics}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {!editingLogistics ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-container-low/30 p-3 rounded-lg border border-outline-variant">
                <div>
                  <span className="text-secondary block">Courier Partner:</span>
                  <span className="font-semibold">{order.courier_name || "—"}</span>
                </div>
                <div>
                  <span className="text-secondary block">Tracking #:</span>
                  <span className="font-semibold font-mono">{order.courier_tracking || "—"}</span>
                </div>
                <div>
                  <span className="text-secondary block">Promised Date:</span>
                  <span className="font-semibold font-mono">{order.promised_delivery_date || "—"}</span>
                </div>
                <div>
                  <span className="text-secondary block">Actual Delivery:</span>
                  <span className="font-semibold font-mono text-emerald-700">
                    {order.actual_delivery_date || "—"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Courier Name
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. BlueDart, DTDC"
                    className="w-full px-2.5 py-1.5 text-xs bg-surface border border-outline-variant rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-secondary mb-0.5">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={courierTracking}
                    onChange={(e) => setCourierTracking(e.target.value)}
                    placeholder="e.g. BD12345678"
                    className="w-full px-2.5 py-1.5 text-xs bg-surface border border-outline-variant rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Progression Action Section */}
          <div className="border-t border-outline-variant pt-4">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Update Order Status
            </h4>

            {validNextStatuses.length === 0 ? (
              <p className="text-xs text-secondary italic">
                This order is in a final state ({order.status}) and cannot progress further.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {validNextStatuses.map((nextSt) => (
                    <button
                      key={nextSt}
                      onClick={() => {
                        setSelectedNextStatus(nextSt);
                        setStatusNotes("");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        selectedNextStatus === nextSt
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      {STATUS_ACTION_LABELS[nextSt] || nextSt}
                    </button>
                  ))}
                </div>

                {selectedNextStatus && (
                  <div className="p-3 bg-surface-container-low rounded-xl border border-primary/30 space-y-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-primary">
                      {selectedNextStatus === "remake_requested"
                        ? "Reason for Remake (Mandatory) *"
                        : `Notes for transitioning to ${selectedNextStatus}`}
                    </label>
                    <textarea
                      rows={2}
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder={
                        selectedNextStatus === "remake_requested"
                          ? "Specify why remake is requested (e.g., shade mismatch, tight contact, margin defect)..."
                          : "Optional status change notes..."
                      }
                      className="w-full p-2 text-xs bg-surface border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                    ></textarea>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedNextStatus(null)}
                        disabled={changingStatus}
                        className="px-3 py-1 text-xs text-secondary hover:bg-surface border border-outline-variant rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStatusTransition(selectedNextStatus)}
                        disabled={changingStatus}
                        className="px-4 py-1 text-xs font-bold bg-primary text-on-primary rounded shadow-sm hover:bg-primary/90 flex items-center gap-1"
                      >
                        {changingStatus ? "Updating..." : "Confirm Status Update"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Timeline History */}
          <div className="border-t border-outline-variant pt-4">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
              Status Change History Log
            </h4>

            {order.status_logs.length === 0 ? (
              <p className="text-xs text-secondary italic">No status changes recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                {order.status_logs.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface"></div>
                    <div className="bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">
                          {log.old_status ? `${log.old_status} → ${log.new_status}` : `Started as ${log.new_status}`}
                        </span>
                        <span className="text-[11px] font-mono text-secondary">
                          {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
                        Changed by: <span className="font-medium text-on-surface">{log.changed_by_name}</span>
                      </div>
                      {log.notes && (
                        <p className="text-[11px] text-on-surface mt-1 bg-surface p-1.5 rounded border border-outline-variant">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface text-on-surface border border-outline-variant text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
