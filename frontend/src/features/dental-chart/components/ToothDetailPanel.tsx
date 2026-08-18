import { useState } from "react";
import type { ToothRecord, NewToothRecordPayload, ToothCondition, ToothStatus } from "../../../types/dentalChart.types";
import { ToothHistoryList } from "./ToothHistoryList";

interface Props {
    toothNumber: string;
    existingRecord: ToothRecord | undefined;
    onSave: (data: NewToothRecordPayload) => void;
    onClose: () => void;
    submitting: boolean;
}

const CONDITIONS: ToothCondition[] = [
    "healthy", "decay", "filling", "crown", "bridge", "implant", "rct",
    "missing", "impacted", "unerupted", "supernumerary", "fracture", "mobility", "sensitivity",
];
const STATUSES: ToothStatus[] = ["existing", "planned", "completed", "rejected"];

export function ToothDetailPanel({ toothNumber, existingRecord, onSave, onClose, submitting }: Props) {
    const [condition, setCondition] = useState<ToothCondition>(existingRecord?.condition ?? "healthy");
    const [status, setStatus] = useState<ToothStatus>(existingRecord?.status ?? "existing");
    const [notes, setNotes] = useState(existingRecord?.notes ?? "");

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg p-6 overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Tooth {toothNumber}</h2>
                <button onClick={onClose} className="text-gray-400">✕</button>
            </div>

            <label className="block text-sm font-medium mb-1">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as ToothCondition)}
                className="border rounded px-3 py-2 w-full mb-3 capitalize">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ToothStatus)}
                className="border rounded px-3 py-2 w-full mb-3 capitalize">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="border rounded px-3 py-2 w-full mb-4" rows={3} />

            <button
                disabled={submitting}
                onClick={() => onSave({
                    tooth_number: toothNumber, dentition_type: "adult",
                    surface: "whole", condition, status, notes,
                })}
                className="bg-teal-600 text-white px-4 py-2 rounded w-full mb-4"
            >
                {submitting ? "Saving..." : "Save"}
            </button>

            {existingRecord && (
                <>
                    <h3 className="text-sm font-medium mb-2">Change History</h3>
                    <ToothHistoryList entries={existingRecord.history} />
                </>
            )}
        </div>
    );
}