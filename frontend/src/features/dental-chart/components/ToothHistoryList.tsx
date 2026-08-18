import type { ToothHistoryEntry } from "../../../types/dentalChart.types";

export function ToothHistoryList({ entries }: { entries: ToothHistoryEntry[] }) {
    if (entries.length === 0) return <p className="text-xs text-gray-400">No changes recorded yet.</p>;
    return (
        <ul className="space-y-1 text-xs text-gray-600">
            {entries.map((h) => (
                <li key={h.id} className="border-l-2 border-gray-200 pl-2">
                    <strong className="capitalize">{h.changed_field}</strong>: {h.old_value || "—"} → {h.new_value || "—"}
                    <div className="text-gray-400">{h.changed_by_name} · {new Date(h.changed_at).toLocaleString()}</div>
                </li>
            ))}
        </ul>
    );
}