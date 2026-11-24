import { useState } from "react";
import { PatientSearchSelect } from "./PatientSearchSelect";
import { DoctorSelect } from "./DoctorSelect";
import { createWalkIn } from "../../../api/appointmentApi";
import type { PatientListItem } from "../../../types/patient.types";
import type { Appointment } from "../../../types/appointment.types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (appt: Appointment) => void;
    onOpenWaitlist?: () => void;
}

export function WalkInModal({ isOpen, onClose, onSuccess, onOpenWaitlist }: Props) {
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [doctorId, setDoctorId] = useState<number | null>(null);
    const [reasonForVisit, setReasonForVisit] = useState("");
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [noSlotsConflict, setNoSlotsConflict] = useState(false);
    const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

    if (!isOpen) return null;

    const resetForm = () => {
        setIsNewPatient(false);
        setSelectedPatient(null);
        setGuestName("");
        setGuestPhone("");
        setDoctorId(null);
        setReasonForVisit("");
        setError(null);
        setNoSlotsConflict(false);
        setCreatedAppointment(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setNoSlotsConflict(false);

        if (!isNewPatient && !selectedPatient) {
            setError("Please search and select an existing patient, or toggle 'New Patient'.");
            return;
        }

        if (isNewPatient && (!guestName.trim() || !guestPhone.trim())) {
            setError("Please provide both patient name and phone number for new registration.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await createWalkIn({
                patient_id: isNewPatient ? undefined : selectedPatient?.id,
                guest_name: isNewPatient ? guestName.trim() : undefined,
                guest_phone: isNewPatient ? guestPhone.trim() : undefined,
                doctor_id: doctorId || undefined,
                reason_for_visit: reasonForVisit.trim() || "Walk-In Consultation",
            });
            setCreatedAppointment(res.data);
            onSuccess(res.data);
        } catch (err: any) {
            if (err.response?.status === 409) {
                setNoSlotsConflict(true);
                setError(err.response?.data?.detail || "No available slots today for any doctor.");
            } else {
                setError(err.response?.data?.detail || "Failed to process walk-in appointment.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex justify-between items-start border-b pb-3">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span>⚡</span> Quick Walk-In Queue
                        </h3>
                        <p className="text-xs text-slate-500">Fast-track walk-in booking for immediate consultation today.</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
                        type="button"
                    >
                        &times;
                    </button>
                </div>

                {/* SUCCESS SCREEN WITH PROMINENT TOKEN NUMBER */}
                {createdAppointment ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 text-teal-800 rounded-full font-extrabold text-2xl shadow-inner border border-teal-200">
                            #{createdAppointment.token_number || "1"}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-800">Walk-In Confirmed!</h4>
                            <p className="text-sm font-semibold text-teal-700 mt-1">
                                {createdAppointment.patient_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Assigned: Dr. {createdAppointment.doctor_name || "Assigned Specialist"} ({createdAppointment.start_time}–{createdAppointment.end_time})
                            </p>
                        </div>
                        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-medium">
                            Token #{createdAppointment.token_number} assigned. Patient is added to today&apos;s active queue list.
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    /* WALK-IN REGISTRATION FORM */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className={`p-3 rounded-xl text-xs font-medium border ${
                                noSlotsConflict ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-red-50 border-red-200 text-red-700"
                            }`}>
                                <p className="font-bold">{noSlotsConflict ? "Schedule Full Today" : "Registration Error"}</p>
                                <p>{error}</p>
                                {noSlotsConflict && onOpenWaitlist && (
                                    <div className="mt-2 pt-2 border-t border-amber-200 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleClose();
                                                onOpenWaitlist();
                                            }}
                                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                                        >
                                            Add Patient to Waitlist
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Patient Lookup / New Patient Toggle */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Patient Identity <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsNewPatient(!isNewPatient);
                                        setSelectedPatient(null);
                                        setError(null);
                                    }}
                                    className="text-xs text-teal-600 font-semibold hover:underline"
                                >
                                    {isNewPatient ? "Search existing patient" : "+ New Patient"}
                                </button>
                            </div>

                            {!isNewPatient ? (
                                <PatientSearchSelect onSelect={(p) => {
                                    setSelectedPatient(p);
                                    setError(null);
                                }} />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="e.g. Rahul Sharma"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                            required={isNewPatient}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                            placeholder="e.g. 9876543210"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                            required={isNewPatient}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preferred Doctor Select (Optional) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Preferred Doctor <span className="text-slate-400 font-normal">(Optional — leave blank to auto-assign earliest slot)</span>
                            </label>
                            <DoctorSelect
                                value={doctorId}
                                onChange={(id) => setDoctorId(id || null)}
                            />
                        </div>

                        {/* Reason for Visit */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Reason for Visit
                            </label>
                            <input
                                type="text"
                                value={reasonForVisit}
                                onChange={(e) => setReasonForVisit(e.target.value)}
                                placeholder="e.g. Toothache, routine checkup, cleaning"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                            >
                                <span>⚡</span>
                                <span>{submitting ? "Processing..." : "Queue Walk-In"}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
