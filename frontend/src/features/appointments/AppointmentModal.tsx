import { useState } from "react";
import { createAppointment } from "../../api/appointmentApi";
import { SlotPicker } from "./components/SlotPicker";
import { DoctorSelect } from "./components/DoctorSelect";
import { PatientSearchSelect } from "./components/PatientSearchSelect";
import type { AvailableSlot } from "../../types/appointment.types";
import type { PatientListItem } from "../../types/patient.types";

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export function AppointmentModal({ onClose, onCreated }: Props) {
    const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
    const [doctorId, setDoctorId] = useState<number | null>(null);
    const [reason, setReason] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!selectedPatient || !doctorId || !selectedDate || !selectedSlot) {
            setError("Please select a patient, doctor, and pick a time slot.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            await createAppointment({
                patient: selectedPatient.id,
                doctor: doctorId,
                appointment_date: selectedDate,
                start_time: selectedSlot.start_time,
                end_time: selectedSlot.end_time,
                reason_for_visit: reason,
            });
            onCreated();
            onClose();
        } catch (err) {
            setError("Could not book — that slot may already be taken.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px] max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">New Appointment</h2>
                    <button onClick={onClose} className="text-gray-400">✕</button>
                </div>

                <label className="block text-sm font-medium mb-1">Patient</label>
                <div className="mb-3">
                    <PatientSearchSelect onSelect={setSelectedPatient} />
                </div>

                <label className="block text-sm font-medium mb-1">Doctor</label>
                <div className="mb-3">
                    <DoctorSelect value={doctorId} onChange={setDoctorId} />
                </div>

                <label className="block text-sm font-medium mb-1">Reason for visit</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)}
                    className="border rounded px-3 py-2 w-full mb-4" />

                {doctorId && (
                    <>
                        <label className="block text-sm font-medium mb-1">Pick a slot</label>
                        <SlotPicker
                            doctorId={doctorId}
                            onSlotSelected={(date, slot) => { setSelectedDate(date); setSelectedSlot(slot); }}
                        />
                    </>
                )}

                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

                <button onClick={handleSubmit} disabled={submitting}
                    className="bg-teal-600 text-white px-4 py-2 rounded w-full mt-4">
                    {submitting ? "Booking..." : "Book Appointment"}
                </button>
            </div>
        </div>
    );
}