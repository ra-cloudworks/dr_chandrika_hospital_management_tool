import { useEffect, useState } from "react";
import {
    listAppointments, appointmentAction, listPendingRequests, confirmRequest, declineRequest, listRecalls,
} from "../../api/appointmentApi";
import type { Appointment, RecallReminder } from "../../types/appointment.types";
import { AppointmentCard } from "./components/AppointmentCard";
import { PendingRequestsPanel } from "./components/PendingRequestsPanel";
import { WalkInModal } from "./components/WalkInModal";

export function StaffAppointmentsPage() {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [pending, setPending] = useState<Appointment[]>([]);
    const [upcomingRecalls, setUpcomingRecalls] = useState<RecallReminder[]>([]);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Modal state for Walk-In Quick Flow
    const [showWalkInModal, setShowWalkInModal] = useState(false);

    // Loads daily confirmed schedule, pending website requests, and upcoming recalls
    const load = () => {
        listAppointments({ date })
            .then((res) => setAppointments(res.data))
            .catch(() => setFeedback({ type: "error", text: "Could not load appointments schedule." }));
        listPendingRequests()
            .then((res) => setPending(res.data))
            .catch(() => setFeedback({ type: "error", text: "Could not load pending website requests." }));
        listRecalls(undefined, { due_soon: "true" })
            .then((res) => setUpcomingRecalls(res.data))
            .catch(() => console.error("Could not load upcoming recalls."));
    };

    useEffect(load, [date]);

    // Shows temporary feedback toast for staff actions
    const showNotice = (text: string, type: "success" | "error" = "success") => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleAction = async (
        id: number, action: string, payload?: { cancellation_reason?: string; cancellation_notes?: string }
    ) => {
        if (action === "rescheduled") {
            showNotice("Appointment rescheduled successfully!");
            load();
            return;
        }
        try {
            await appointmentAction(id, action, payload);
            showNotice(`Appointment status updated to ${action.replace("-", " ")}.`);
            load();
        } catch (err: any) {
            showNotice(err.response?.data?.detail || "Could not update appointment status.", "error");
        }
    };

    // Confirms a pending website request, auto-creating/linking patient and setting assigned doctor
    const handleConfirm = async (id: number, doctorId: number, start?: string, end?: string) => {
        try {
            await confirmRequest(id, doctorId, undefined, start, end);
            showNotice("Appointment confirmed! Patient account auto-linked/registered.");
            load();
        } catch (err: any) {
            showNotice(err.response?.data?.detail || "Could not confirm appointment request.", "error");
        }
    };

    // Declines or offers alternative slots via email
    const handleDecline = async (id: number, action: "decline" | "reschedule_offer", reason?: string, altSlots?: string[]) => {
        try {
            await declineRequest(id, { action, reason, alternative_slots: altSlots });
            showNotice(action === "reschedule_offer" ? "Reschedule options sent to patient!" : "Request declined and patient notified.");
            load();
        } catch (err: any) {
            showNotice(err.response?.data?.detail || "Failed to process decline/reschedule request.", "error");
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
            {feedback && (
                <div
                    className={`p-3 rounded-lg text-xs font-medium border transition-all ${
                        feedback.type === "success" ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                    {feedback.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Schedule Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2 bg-white p-4 rounded-xl border shadow-xs">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Confirmed Appointments</h1>
                            <p className="text-xs text-gray-500">View and manage checked-in patients for the selected date.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowWalkInModal(true)}
                                className="px-3.5 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1 shadow-2xs"
                            >
                                <span>⚡</span>
                                <span>Walk-In</span>
                            </button>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                            />
                        </div>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="p-8 bg-white border rounded-xl text-center text-sm text-gray-500">
                            No confirmed appointments scheduled for {date}.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {appointments.map((a) => (
                                <AppointmentCard key={a.id} appt={a} onAction={handleAction} onRescheduled={load} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Side Panels Column (Website Requests + Upcoming Recalls) */}
                <div className="space-y-4">
                    {/* Website Pending Requests */}
                    <div className="space-y-2">
                        <div className="bg-white p-4 rounded-xl border shadow-xs">
                            <h2 className="font-bold text-gray-800 text-base">Website Requests</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Pending online bookings awaiting doctor assignment & confirmation.</p>
                        </div>
                        <PendingRequestsPanel requests={pending} onConfirm={handleConfirm} onDecline={handleDecline} />
                    </div>

                    {/* Upcoming Recalls (Next 30 Days) */}
                    <div className="bg-white p-4 rounded-xl border shadow-xs space-y-3">
                        <h2 className="font-bold text-gray-800 text-base flex items-center justify-between">
                            <span>Upcoming Recalls</span>
                            <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                                {upcomingRecalls.length} due
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500">Patients due for routine cleaning / follow-ups in the next 30 days.</p>

                        {upcomingRecalls.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No recalls due in the next 30 days.</p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {upcomingRecalls.map((recall) => (
                                    <div key={recall.id} className="p-2.5 border rounded-lg bg-gray-50 text-xs flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{recall.patient_name}</p>
                                            <p className="text-teal-700 capitalize font-medium">{recall.recall_type_display || recall.recall_type.replace("_", " ")}</p>
                                            <p className="text-gray-400 text-[11px]">Due: {recall.recall_date}</p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                            {recall.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Walk-In Quick Queue Modal */}
            <WalkInModal
                isOpen={showWalkInModal}
                onClose={() => setShowWalkInModal(false)}
                onSuccess={() => load()}
            />
        </div>
    );
}