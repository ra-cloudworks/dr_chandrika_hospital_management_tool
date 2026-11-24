import { useState } from "react";
import type { Appointment, AppointmentStatus, AvailableSlot } from "../../../types/appointment.types";
import { DoctorSelect } from "./DoctorSelect";
import { SlotPicker } from "./SlotPicker";
import { CancelReasonModal } from "./CancelReasonModal";
import { rescheduleAppointment } from "../../../api/appointmentApi";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    confirmed: "bg-blue-100 text-blue-700",
    checked_in: "bg-amber-100 text-amber-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    no_show: "bg-red-100 text-red-700",
};

interface Props {
    appt: Appointment;
    onAction: (id: number, action: string, payload?: { cancellation_reason?: string; cancellation_notes?: string }) => void;
    onRescheduled?: () => void;
}

export function AppointmentCard({ appt, onAction, onRescheduled }: Props) {
    const [showReschedule, setShowReschedule] = useState(false);
    const [doctorId, setDoctorId] = useState<number>(appt.doctor || 0);
    const [rescheduleDate, setRescheduleDate] = useState<string>("");
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Cancel / No-Show modal state
    const [cancelModalState, setCancelModalState] = useState<{
        isOpen: boolean;
        actionType: "cancel" | "no-show";
    }>({ isOpen: false, actionType: "cancel" });

    // Submits reschedule request to backend API
    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !rescheduleDate) {
            setError("Please select a date and an available slot.");
            return;
        }
        if (!reason.trim()) {
            setError("Reason for rescheduling is required.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await rescheduleAppointment(appt.id, {
                new_date: rescheduleDate,
                new_start_time: selectedSlot.start_time,
                new_end_time: selectedSlot.end_time,
                new_doctor_id: doctorId || undefined,
                reason,
            });
            setShowReschedule(false);
            if (onRescheduled) {
                onRescheduled();
            } else {
                onAction(appt.id, "rescheduled");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to reschedule appointment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmCancelAction = (reason: string, notes: string) => {
        onAction(appt.id, cancelModalState.actionType, {
            cancellation_reason: reason,
            cancellation_notes: notes,
        });
        setCancelModalState({ isOpen: false, actionType: "cancel" });
    };

    return (
        <div className="border rounded-lg p-3 space-y-3 bg-white shadow-xs">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                    <p className="font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                        {appt.token_number && (
                            <span className="text-teal-600 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded text-xs">
                                #{appt.token_number}
                            </span>
                        )}
                        {appt.source === "walk_in" && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
                                Walk-In
                            </span>
                        )}
                        <span>{appt.patient_name} — {appt.start_time}–{appt.end_time}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        Dr. {appt.doctor_name || "Unassigned"} {appt.chair_name && `· ${appt.chair_name}`} {appt.is_home_visit && "· Home Visit"}
                    </p>
                    {appt.reason_for_visit && <p className="text-sm text-gray-400">{appt.reason_for_visit}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[appt.status]}`}>
                        {appt.status.replace("_", " ")}
                    </span>
                    {appt.status === "confirmed" && (
                        <button onClick={() => onAction(appt.id, "check-in")} className="text-xs border border-gray-300 hover:bg-gray-50 px-2 py-1 rounded">Check In</button>
                    )}
                    {appt.status === "checked_in" && (
                        <button onClick={() => onAction(appt.id, "complete")} className="text-xs border border-teal-600 text-teal-700 hover:bg-teal-50 px-2 py-1 rounded">Complete</button>
                    )}
                    {["confirmed", "checked_in"].includes(appt.status) && (
                        <>
                            <button
                                onClick={() => setShowReschedule(!showReschedule)}
                                className="text-xs border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded font-medium"
                            >
                                Reschedule
                            </button>
                            <button
                                onClick={() => setCancelModalState({ isOpen: true, actionType: "no-show" })}
                                className="text-xs text-red-500 hover:underline font-medium"
                            >
                                No-Show
                            </button>
                            <button
                                onClick={() => setCancelModalState({ isOpen: true, actionType: "cancel" })}
                                className="text-xs text-red-500 hover:underline font-medium"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Render Cancellation & No-Show Reason Audit Details if present */}
            {(appt.cancellation_reason || appt.cancellation_notes) && (
                <div className="text-xs bg-red-50/80 p-2.5 rounded-lg border border-red-200 text-red-800 space-y-0.5">
                    <p className="font-bold flex items-center gap-1">
                        <span>⚠️</span>
                        <span>{appt.status === "no_show" ? "No-Show Audit Record" : "Cancellation Audit Record"}:</span>
                    </p>
                    {appt.cancellation_reason && (
                        <p><span className="font-semibold">Reason:</span> {appt.cancellation_reason}</p>
                    )}
                    {appt.cancellation_notes && (
                        <p><span className="font-semibold">Notes:</span> {appt.cancellation_notes}</p>
                    )}
                </div>
            )}

            {/* Render audit log history if present */}
            {appt.reschedule_logs && appt.reschedule_logs.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 space-y-1">
                    <p className="font-semibold text-gray-700">Reschedule History ({appt.reschedule_logs.length}):</p>
                    {appt.reschedule_logs.map((log) => (
                        <p key={log.id}>
                            Moved from {log.old_date} ({log.old_start_time}) to {log.new_date} ({log.new_start_time}) — Reason: &quot;{log.reason}&quot; (by {log.rescheduled_by_name || "Staff"})
                        </p>
                    ))}
                </div>
            )}

            {/* Inline Reschedule Form */}
            {showReschedule && (
                <form onSubmit={handleRescheduleSubmit} className="mt-3 p-4 border rounded-lg bg-teal-50/40 space-y-3">
                    <h4 className="font-semibold text-sm text-teal-900">Reschedule Appointment</h4>

                    {error && <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded text-xs">{error}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Doctor</label>
                            <DoctorSelect value={doctorId} onChange={(id) => setDoctorId(id)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Select Date & Time Slot</label>
                            {doctorId ? (
                                <SlotPicker
                                    doctorId={doctorId}
                                    onSlotSelected={(d, slot) => {
                                        setRescheduleDate(d);
                                        setSelectedSlot(slot);
                                    }}
                                />
                            ) : (
                                <p className="text-xs text-gray-500 mt-2">Select a doctor first.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Rescheduling (Required)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Patient requested morning slot"
                            className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowReschedule(false)}
                            className="px-3 py-1.5 text-xs text-gray-600 border rounded hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !selectedSlot}
                            className="px-4 py-1.5 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : "Confirm Reschedule"}
                        </button>
                    </div>
                </form>
            )}

            {/* Cancellation Reason Modal */}
            <CancelReasonModal
                isOpen={cancelModalState.isOpen}
                actionType={cancelModalState.actionType}
                patientName={appt.patient_name}
                onClose={() => setCancelModalState({ isOpen: false, actionType: "cancel" })}
                onConfirm={handleConfirmCancelAction}
            />
        </div>
    );
}