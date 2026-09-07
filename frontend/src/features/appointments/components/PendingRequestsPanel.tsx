import { useState, useEffect } from "react";
import type { Appointment, AvailableSlot } from "../../../types/appointment.types";
import { DoctorSelect } from "./DoctorSelect";
import { getAvailableSlots } from "../../../api/appointmentApi";

interface Props {
    requests: Appointment[];
    onConfirm: (id: number, doctorId: number, start?: string, end?: string) => Promise<void>;
    onDecline: (id: number, action: "decline" | "reschedule_offer", reason?: string, altSlots?: string[]) => Promise<void>;
}

export function PendingRequestsPanel({ requests, onConfirm, onDecline }: Props) {
    // Stores doctor selection, custom end time, and decline/reschedule state for each request
    const [doctorIds, setDoctorIds] = useState<Record<number, number | null>>({});
    const [startTimes, setStartTimes] = useState<Record<number, string>>({});
    const [endTimes, setEndTimes] = useState<Record<number, string>>({});
    const [activeAction, setActiveAction] = useState<Record<number, "none" | "reschedule">>({});
    const [declineReason, setDeclineReason] = useState<Record<number, string>>({});
    const [altSlotsInput, setAltSlotsInput] = useState<Record<number, string>>({});
    const [loadingId, setLoadingId] = useState<number | null>(null);

    // Dynamic slot availability cache per request ID
    const [slotsData, setSlotsData] = useState<
        Record<number, { loading: boolean; slots: AvailableSlot[]; fetched: boolean }>
    >({});

    // Fetches doctor's available slots dynamically whenever doctor selection or date changes
    const fetchSlotsForRequest = async (reqId: number, docId: number, dateStr: string) => {
        setSlotsData((prev) => ({
            ...prev,
            [reqId]: { loading: true, slots: [], fetched: false },
        }));
        try {
            const res = await getAvailableSlots(docId, dateStr);
            setSlotsData((prev) => ({
                ...prev,
                [reqId]: { loading: false, slots: res.data.slots, fetched: true },
            }));
        } catch {
            setSlotsData((prev) => ({
                ...prev,
                [reqId]: { loading: false, slots: [], fetched: true },
            }));
        }
    };

    // Auto-fetch slots on initial render for requests with pre-assigned doctors
    useEffect(() => {
        requests.forEach((r) => {
            const docId = doctorIds[r.id] || r.doctor;
            if (docId && !slotsData[r.id]?.fetched && !slotsData[r.id]?.loading) {
                fetchSlotsForRequest(r.id, docId, r.appointment_date);
            }
        });
    }, [requests, doctorIds]);

    const handleDoctorChange = (reqId: number, docId: number | null, dateStr: string) => {
        setDoctorIds((prev) => ({ ...prev, [reqId]: docId }));
        // Clear selected slot times when doctor changes
        setStartTimes((prev) => ({ ...prev, [reqId]: "" }));
        setEndTimes((prev) => ({ ...prev, [reqId]: "" }));
        if (docId) {
            fetchSlotsForRequest(reqId, docId, dateStr);
        } else {
            setSlotsData((prev) => ({
                ...prev,
                [reqId]: { loading: false, slots: [], fetched: false },
            }));
        }
    };

    if (requests.length === 0) {
        return (
            <div className="p-4 bg-gray-50 border rounded-lg text-center text-xs text-gray-500">
                No pending website requests at this time.
            </div>
        );
    }

    const handleConfirmClick = async (r: Appointment) => {
        const docId = doctorIds[r.id] || r.doctor;
        if (!docId) {
            alert("Please select a doctor to assign to this appointment.");
            return;
        }
        const sTime = startTimes[r.id] || r.start_time;
        setLoadingId(r.id);
        try {
            await onConfirm(r.id, docId, sTime, endTimes[r.id]);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeclineClick = async (r: Appointment) => {
        setLoadingId(r.id);
        try {
            await onDecline(r.id, "decline", declineReason[r.id] || "Slot unavailable.");
        } finally {
            setLoadingId(null);
        }
    };

    const handleRescheduleSubmit = async (r: Appointment) => {
        setLoadingId(r.id);
        try {
            const rawSlots = altSlotsInput[r.id] || "";
            const altSlots = rawSlots.split(",").map((s) => s.trim()).filter(Boolean);
            await onDecline(r.id, "reschedule_offer", declineReason[r.id] || "Requested slot filled.", altSlots);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {requests.map((r) => {
                const selectedDoc = doctorIds[r.id] || r.doctor || null;
                const isRescheduleOpen = activeAction[r.id] === "reschedule";
                const isBusy = loadingId === r.id;
                const docSlotsState = slotsData[r.id] || { loading: false, slots: [], fetched: false };

                // Determine requested slot weekday name for error banner
                const requestDateObj = new Date(r.appointment_date);
                const dayName = isNaN(requestDateObj.getTime())
                    ? "this day"
                    : requestDateObj.toLocaleDateString("en-US", { weekday: "long" });

                const chosenStartTime = startTimes[r.id] || r.start_time;

                return (
                    <div key={r.id} className="border rounded-xl p-4 bg-amber-50/70 border-amber-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{r.guest_name}</p>
                                <p className="text-xs text-gray-600 font-mono">{r.guest_phone}</p>
                            </div>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                                Website Request
                            </span>
                        </div>

                        <div className="text-xs text-gray-700 bg-white/80 p-2.5 rounded-lg border border-amber-100 space-y-1">
                            <p><span className="font-medium text-gray-500">Requested Slot:</span> <strong className="text-teal-700">{r.appointment_date} at {r.start_time}</strong></p>
                            {r.doctor_name && <p><span className="font-medium text-gray-500">Preferred Doctor:</span> Dr. {r.doctor_name}</p>}
                            {r.reason_for_visit && <p><span className="font-medium text-gray-500">Reason:</span> {r.reason_for_visit}</p>}
                        </div>

                        {/* Doctor Selection & Live Schedule Availability Panel */}
                        <div className="space-y-2 pt-1 border-t border-amber-200/60">
                            <label className="block text-[11px] font-medium text-gray-600">Assign Doctor *</label>
                            <DoctorSelect
                                value={selectedDoc}
                                onChange={(docId) => handleDoctorChange(r.id, docId, r.appointment_date)}
                            />

                            {/* Dynamic Schedule & Availability Display */}
                            {selectedDoc && docSlotsState.loading && (
                                <p className="text-[11px] text-gray-500 animate-pulse">Checking doctor schedule for {r.appointment_date}...</p>
                            )}

                            {selectedDoc && docSlotsState.fetched && docSlotsState.slots.length === 0 && (
                                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
                                    <p className="font-semibold flex items-center gap-1">
                                        <span>⚠️ Doctor Unavailable</span>
                                    </p>
                                    <p className="text-[11px]">
                                        Selected doctor has no working schedule or available slots on <strong>{dayName} ({r.appointment_date})</strong>.
                                    </p>
                                    <p className="text-[10px] text-red-600 font-medium">
                                        Tip: Choose another doctor or click "Suggest Slots / Decline" to offer an alternative day to the patient.
                                    </p>
                                </div>
                            )}

                            {selectedDoc && docSlotsState.fetched && docSlotsState.slots.length > 0 && (() => {
                                const requestedSlotObj = docSlotsState.slots.find(
                                    (s) => s.start_time === r.start_time || s.start_time.startsWith(r.start_time)
                                );
                                const isRequestedOccupied = requestedSlotObj && requestedSlotObj.is_available === false;

                                return (
                                    <div className="space-y-2 bg-white p-2.5 rounded-lg border border-teal-100">
                                        <label className="block text-[11px] font-medium text-teal-800">
                                            Select Available Time Slot for {r.appointment_date}:
                                        </label>

                                        {isRequestedOccupied && (
                                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 font-medium space-y-0.5">
                                                <p className="font-semibold text-amber-900">⚠️ Requested Slot Occupied</p>
                                                <p className="text-[11px]">
                                                    The requested slot (<strong>{r.start_time}</strong>) is already booked for Dr. {r.doctor_name || "this doctor"}.
                                                    Please select an available open slot below or click <strong>"Suggest Slots / Decline"</strong> to send a reschedule notice.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-1.5 flex-wrap max-h-32 overflow-y-auto pr-1">
                                            {docSlotsState.slots.map((slot) => {
                                                const isOccupied = slot.is_available === false;
                                                const isSelected = chosenStartTime === slot.start_time;
                                                const isRequested = r.start_time === slot.start_time || slot.start_time.startsWith(r.start_time);

                                                return (
                                                    <button
                                                        key={slot.start_time}
                                                        type="button"
                                                        disabled={isOccupied}
                                                        onClick={() => {
                                                            if (!isOccupied) {
                                                                setStartTimes((p) => ({ ...p, [r.id]: slot.start_time }));
                                                                setEndTimes((p) => ({ ...p, [r.id]: slot.end_time }));
                                                            }
                                                        }}
                                                        className={`px-2 py-1 text-[11px] rounded font-mono border transition-all ${
                                                            isOccupied
                                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through opacity-70"
                                                                : isSelected
                                                                ? "bg-teal-600 text-white border-teal-700 font-bold shadow-xs"
                                                                : isRequested
                                                                ? "bg-teal-50 text-teal-700 border-teal-400 font-medium"
                                                                : "bg-gray-50 hover:bg-teal-50 text-gray-700 border-gray-200"
                                                        }`}
                                                        title={isOccupied ? `Slot ${slot.start_time} is already booked` : `Select ${slot.start_time}`}
                                                    >
                                                        {slot.start_time}–{slot.end_time} {isOccupied ? "(Booked)" : (isRequested && "⭐")}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {!isRescheduleOpen ? (
                                <div className="flex gap-2 pt-2 flex-wrap sm:flex-nowrap">
                                    <button
                                        onClick={() => handleConfirmClick(r)}
                                        disabled={
                                            isBusy ||
                                            (selectedDoc !== null && docSlotsState.fetched && docSlotsState.slots.length === 0) ||
                                            docSlotsState.slots.some((s) => s.start_time === chosenStartTime && s.is_available === false)
                                        }
                                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isBusy ? "Processing..." : "Confirm Booking"}
                                    </button>
                                    <button
                                        onClick={() => setActiveAction((p) => ({ ...p, [r.id]: "reschedule" }))}
                                        disabled={isBusy}
                                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
                                    >
                                        Suggest Slots / Decline
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 bg-white p-3 rounded-lg border border-amber-200 mt-2 text-xs">
                                    <p className="font-semibold text-gray-800">Decline or Offer Alternative Slots</p>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-0.5">Reason to Patient</label>
                                        <input
                                            placeholder="e.g. Slot already taken"
                                            value={declineReason[r.id] || ""}
                                            onChange={(e) => setDeclineReason((p) => ({ ...p, [r.id]: e.target.value }))}
                                            className="border rounded px-2 py-1 w-full text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-0.5">Alternative Available Slots (comma separated)</label>
                                        <input
                                            placeholder="e.g. 11:00 AM, 02:30 PM, 04:00 PM"
                                            value={altSlotsInput[r.id] || ""}
                                            onChange={(e) => setAltSlotsInput((p) => ({ ...p, [r.id]: e.target.value }))}
                                            className="border rounded px-2 py-1 w-full text-xs"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => handleRescheduleSubmit(r)}
                                            disabled={isBusy}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs"
                                        >
                                            Send Reschedule Email
                                        </button>
                                        <button
                                            onClick={() => handleDeclineClick(r)}
                                            disabled={isBusy}
                                            className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs"
                                        >
                                            Decline Request
                                        </button>
                                        <button
                                            onClick={() => setActiveAction((p) => ({ ...p, [r.id]: "none" }))}
                                            className="text-gray-400 hover:text-gray-600 px-2 py-1 text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}