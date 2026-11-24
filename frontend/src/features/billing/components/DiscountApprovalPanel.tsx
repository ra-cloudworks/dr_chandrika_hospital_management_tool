import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listDiscountRequests, actionDiscountRequest } from "../../../api/billingApi";
import type { DiscountApprovalRequest } from "../../../types/billing.types";

interface DiscountApprovalPanelProps {
  onRequestResolved?: () => void;
}

export function DiscountApprovalPanel({ onRequestResolved }: DiscountApprovalPanelProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DiscountApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [notesState, setNotesState] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const isChiefDoctor = user?.role === "chief_doctor";

  const fetchRequests = async () => {
    if (!isChiefDoctor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listDiscountRequests();
      setRequests(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load discount requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isChiefDoctor) {
      fetchRequests();
    }
  }, [isChiefDoctor]);

  const handleAction = async (id: number, decision: "approve" | "reject") => {
    setActingId(id);
    setError(null);
    try {
      await actionDiscountRequest(id, {
        decision,
        review_notes: notesState[id] || "",
      });
      fetchRequests();
      if (onRequestResolved) onRequestResolved();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          `Failed to ${decision} discount request.`
      );
    } finally {
      setActingId(null);
    }
  };

  if (!isChiefDoctor) return null;

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-2xl">approval</span>
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Chief Doctor Discount Approval Queue
            </h3>
            <p className="text-xs text-secondary">
              Discounts exceeding clinic governance thresholds require explicit sign-off before applying to patient invoices.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          {requests.length} Pending
        </span>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-error-container/20 border border-error text-error text-xs rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-secondary text-xs">
          <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mb-1"></span>
          <p>Loading approval queue...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-6 text-center text-secondary text-xs">
          <span className="material-symbols-outlined text-3xl text-secondary/60 mb-1">verified</span>
          <p className="font-semibold text-on-surface">No Pending Discount Requests</p>
          <p className="text-[11px] text-secondary mt-0.5">All clinician discounts are within allowed thresholds.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">Request #{req.id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {req.discount_percent}% Discount (₹{Number(req.requested_discount_amount).toLocaleString("en-IN")})
                  </span>
                  <span className="text-[11px] text-secondary">
                    for Invoice #{req.invoice}
                  </span>
                </div>

                <p className="text-xs text-on-surface">
                  <strong className="text-secondary font-medium">Justification: </strong>
                  <span className="italic">{req.reason}</span>
                </p>

                <p className="text-[11px] text-secondary">
                  Requested by <strong className="text-on-surface">{req.requested_by_name || "Doctor"}</strong> on{" "}
                  {new Date(req.requested_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Review notes (optional)..."
                  value={notesState[req.id] || ""}
                  onChange={(e) =>
                    setNotesState((prev) => ({ ...prev, [req.id]: e.target.value }))
                  }
                  className="px-2.5 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={actingId === req.id}
                    className="px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 border border-error/30 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "approve")}
                    disabled={actingId === req.id}
                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
                  >
                    {actingId === req.id ? "Saving..." : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

