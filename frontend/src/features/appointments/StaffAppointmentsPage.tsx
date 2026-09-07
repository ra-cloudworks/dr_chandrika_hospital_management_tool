import { useEffect, useState } from "react";
import {
    listAppointments, appointmentAction, listPendingRequests, confirmRequest, declineRequest,
} from "../../api/appointmentApi";
import type { Appointment } from "../../types/appointment.types";
import { AppointmentCard } from "./components/AppointmentCard";
import { PendingRequestsPanel } from "./components/PendingRequestsPanel";

export function StaffAppointmentsPage() {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [pending, setPending] = useState<Appointment[]>([]);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Loads daily confirmed schedule and pending website requests
    const load = () => {
        listAppointments({ date })
            .then((res) => setAppointments(res.data))
            .catch(() => setFeedback({ type: "error", text: "Could not load appointments schedule." }));
        listPendingRequests()
            .then((res) => setPending(res.data))
            .catch(() => setFeedback({ type: "error", text: "Could not load pending website requests." }));
    };

    useEffect(load, [date]);

    // Shows temporary feedback toast for staff actions
    const showNotice = (text: string, type: "success" | "error" = "success") => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleAction = async (id: number, action: string) => {
        try {
            await appointmentAction(id, action);
            showNotice(`Appointment status updated to ${action}.`);
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
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>

                    {appointments.length === 0 ? (
                        <div className="p-8 bg-white border rounded-xl text-center text-sm text-gray-500">
                            No confirmed appointments scheduled for {date}.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {appointments.map((a) => (
                                <AppointmentCard key={a.id} appt={a} onAction={handleAction} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Website Pending Requests Column */}
                <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl border shadow-xs">
                        <h2 className="font-bold text-gray-800 text-base">Website Requests</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Pending online bookings awaiting doctor assignment & confirmation.</p>
                    </div>
                    <PendingRequestsPanel requests={pending} onConfirm={handleConfirm} onDecline={handleDecline} />
                </div>
            </div>
        </div>
    );
}