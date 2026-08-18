import type { VitalsEntry } from "../../../types/vitals.types";

interface Props {
    entries: VitalsEntry[];
}

export function VitalsHistoryList({ entries }: Props) {
    if (entries.length === 0) return <p className="text-gray-500">No vitals recorded yet.</p>;

    return (
        <div className="space-y-2">
            {entries.map((v) => (
                <div key={v.id} className={`border rounded p-3 ${v.is_flagged ? "border-red-300 bg-red-50" : ""}`}>
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span className="capitalize">{v.context.replace("_", " ")}</span>
                        <span>{new Date(v.recorded_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm">
                        BP: {v.bp_systolic ?? "—"}/{v.bp_diastolic ?? "—"} · Pulse: {v.pulse ?? "—"} ·
                        Sugar: {v.blood_sugar ?? "—"} mg/dL · SpO2: {v.spo2 ?? "—"}%
                    </div>
                    {v.is_flagged && (
                        <p className="text-red-600 text-sm mt-1">⚠ {v.flagged_reason}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Recorded by {v.recorded_by_name}</p>
                </div>
            ))}
        </div>
    );
}