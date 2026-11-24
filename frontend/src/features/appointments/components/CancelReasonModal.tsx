import { useState } from "react";

interface Props {
    isOpen: boolean;
    actionType: "cancel" | "no-show";
    patientName: string;
    onClose: () => void;
    onConfirm: (reason: string, notes: string) => void;
    submitting?: boolean;
}

const REASON_OPTIONS = [
    "Scheduling Conflict",
    "Patient Unwell / Medical Emergency",
    "Financial Reasons",
    "Found Another Clinic",
    "No-Show / Unreachable",
    "Patient Requested Cancellation",
    "Other",
];

export function CancelReasonModal({
    isOpen, actionType, patientName, onClose, onConfirm, submitting = false,
}: Props) {
    const [reason, setReason] = useState(REASON_OPTIONS[0]);
    const [customReason, setCustomReason] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalReason = reason === "Other" ? customReason.trim() : reason;
        if (!finalReason) {
            setError("Please select or enter a cancellation reason.");
            return;
        }
        setError(null);
        onConfirm(finalReason, notes.trim());
    };

    const titleText = actionType === "no-show" ? "Mark Appointment as No-Show" : "Cancel Appointment";
    const buttonText = actionType === "no-show" ? "Confirm No-Show" : "Confirm Cancellation";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex justify-between items-start border-b pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{titleText}</h3>
                        <p className="text-xs text-slate-500">Patient: <span className="font-semibold text-slate-700">{patientName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
                        type="button"
                    >
                        &times;
                    </button>
                </div>

                {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Reason for {actionType === "no-show" ? "No-Show" : "Cancellation"} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-slate-800"
                        >
                            {REASON_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {reason === "Other" && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Specify Reason <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Enter specific reason..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Additional Audit Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Add any specific clinical notes or feedback..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            Keep Appointment
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? "Processing..." : buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
