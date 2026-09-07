import { useState } from "react";
import { getAvailableSlots } from "../../../api/appointmentApi";
import type { AvailableSlot } from "../../../types/appointment.types";

interface Props {
    doctorId: number;
    onSlotSelected: (date: string, slot: AvailableSlot) => void;
}

export function SlotPicker({ doctorId, onSlotSelected }: Props) {
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    // Tracks the active selected slot start time to highlight the button
    const [selectedStartTime, setSelectedStartTime] = useState<string>("");

    const handleDateChange = async (value: string) => {
        setDate(value);
        setSelectedStartTime("");
        if (value) {
            const res = await getAvailableSlots(doctorId, value);
            setSlots(res.data.slots);
        }
    };

    const handleSlotClick = (slot: AvailableSlot) => {
        setSelectedStartTime(slot.start_time);
        onSlotSelected(date, slot);
    };

    const openSlots = slots.filter((s) => s.is_available !== false);

    return (
        <div>
            <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
            {openSlots.length === 0 && date && <p className="text-sm text-gray-500">No open slots that day.</p>}
            <div className="flex gap-2 flex-wrap">
                {openSlots.map((s) => {
                    const isSelected = selectedStartTime === s.start_time;
                    return (
                        <button
                            key={s.start_time}
                            type="button"
                            onClick={() => handleSlotClick(s)}
                            className={`border rounded px-3 py-1.5 text-sm transition-all font-medium ${
                                isSelected
                                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-teal-50 hover:border-teal-400"
                            }`}
                        >
                            {s.start_time}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}