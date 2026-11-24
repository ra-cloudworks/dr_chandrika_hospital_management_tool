import { useEffect, useState } from "react";
import type { RecallReminder, NewRecallPayload, RecallType } from "../../../types/appointment.types";
import { listRecalls, createRecall } from "../../../api/appointmentApi";

interface Props {
    patientId: number;
}

const TYPE_LABELS: Record<RecallType, string> = {
    cleaning: "Dental Cleaning",
    checkup: "Routine Checkup",
    orthodontic_review: "Orthodontic Review",
    post_treatment_review: "Post-Treatment Follow-up",
    custom: "Custom Reason",
};

const STATUS_BADGES: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    notified: "bg-amber-100 text-amber-800 border-amber-200",
    booked: "bg-green-100 text-green-800 border-green-200",
    expired: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
};

export function RecallTab({ patientId }: Props) {
    const [recalls, setRecalls] = useState<RecallReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form state for creating a new recall reminder
    const [recallType, setRecallType] = useState<RecallType>("cleaning");
    const [customReason, setCustomReason] = useState("");
    const [recallDate, setRecallDate] = useState("");
    const [notes, setNotes] = useState("");

    const load = () => {
        setLoading(true);
        listRecalls(patientId)
            .then((res) => setRecalls(res.data))
            .catch(() => setError("Failed to load recall reminders."))
            .finally(() => setLoading(false));
    };

    useEffect(load, [patientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recallDate) {
            setError("Please select a target recall date.");
            return;
        }
        if (recallType === "custom" && !customReason.trim()) {
            setError("Custom reason is required when recall type is Custom.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        const payload: NewRecallPayload = {
            recall_type: recallType,
            custom_reason: recallType === "custom" ? customReason : "",
            recall_date: recallDate,
            notes,
        };

        try {
            await createRecall(patientId, payload);
            setSuccessMsg("Recall reminder scheduled successfully!");
            setRecallDate("");
            setNotes("");
            setCustomReason("");
            load();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Could not schedule recall reminder.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Recall Creation Form */}
            <div className="bg-white p-4 sm:p-5 border rounded-xl shadow-xs space-y-4">
                <h3 className="font-bold text-gray-800 text-base">Schedule Future Recall Visit</h3>
                <p className="text-xs text-gray-500">
                    Set a target date for the patient&apos;s return visit (e.g. 6-month hygiene cleaning).
                </p>

                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}
                {successMsg && <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-lg">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Recall Purpose</label>
                        <select
                            value={recallType}
                            onChange={(e) => setRecallType(e.target.value as RecallType)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        >
                            <option value="cleaning">Dental Cleaning</option>
                            <option value="checkup">Routine Checkup</option>
                            <option value="orthodontic_review">Orthodontic Review</option>
                            <option value="post_treatment_review">Post-Treatment Review</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {recallType === "custom" && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Reason</label>
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Specify reason..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Target Return Date</label>
                        <input
                            type="date"
                            value={recallDate}
                            onChange={(e) => setRecallDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Add internal notes for reception or treating doctor..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving Recall..." : "Schedule Recall"}
                        </button>
                    </div>
                </form>
            </div>

            {/* List of Existing Recalls */}
            <div className="bg-white p-4 sm:p-5 border rounded-xl shadow-xs space-y-4">
                <h3 className="font-bold text-gray-800 text-base">Recall History</h3>

                {loading ? (
                    <p className="text-xs text-gray-500">Loading recall records...</p>
                ) : recalls.length === 0 ? (
                    <p className="text-xs text-gray-500">No recall reminders scheduled for this patient.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b text-gray-600 bg-gray-50">
                                    <th className="py-2.5 px-3">Recall Type</th>
                                    <th className="py-2.5 px-3">Target Due Date</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">Created By</th>
                                    <th className="py-2.5 px-3">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recalls.map((r) => (
                                    <tr key={r.id} className="border-b hover:bg-gray-50">
                                        <td className="py-2.5 px-3 font-medium text-gray-800">
                                            {TYPE_LABELS[r.recall_type] || r.recall_type}
                                            {r.recall_type === "custom" && r.custom_reason && ` (${r.custom_reason})`}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-teal-700">{r.recall_date}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_BADGES[r.status] || "bg-gray-100"}`}>
                                                {r.status_display || r.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-500">{r.created_by_name || "Staff"}</td>
                                        <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">{r.notes || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
