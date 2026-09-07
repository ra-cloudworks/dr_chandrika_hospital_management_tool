import type { Appointment, AppointmentStatus } from "../../../types/appointment.types";

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
    onAction: (id: number, action: string) => void;
}

export function AppointmentCard({ appt, onAction }: Props) {
    return (
        <div className="border rounded-lg p-3 flex justify-between items-center">
            <div>
                <p className="font-medium">
                    {appt.token_number && <span className="text-teal-600 mr-2">#{appt.token_number}</span>}
                    {appt.patient_name} — {appt.start_time}–{appt.end_time}
                </p>
                <p className="text-sm text-gray-500">
                    Dr. {appt.doctor_name} {appt.chair_name && `· ${appt.chair_name}`} {appt.is_home_visit && "· Home Visit"}
                </p>
                <p className="text-sm text-gray-400">{appt.reason_for_visit}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs capitalize ${STATUS_COLORS[appt.status]}`}>
                    {appt.status.replace("_", " ")}
                </span>
                {appt.status === "confirmed" && (
                    <button onClick={() => onAction(appt.id, "check-in")} className="text-xs border px-2 py-1 rounded">Check In</button>
                )}
                {appt.status === "checked_in" && (
                    <button onClick={() => onAction(appt.id, "complete")} className="text-xs border px-2 py-1 rounded">Complete</button>
                )}
                {["confirmed", "checked_in"].includes(appt.status) && (
                    <>
                        <button onClick={() => onAction(appt.id, "no-show")} className="text-xs text-red-500">No-Show</button>
                        <button onClick={() => onAction(appt.id, "cancel")} className="text-xs text-red-500">Cancel</button>
                    </>
                )}
            </div>
        </div>
    );
}