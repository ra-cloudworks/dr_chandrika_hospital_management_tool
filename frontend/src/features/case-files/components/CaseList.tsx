import { useState } from "react";
import type { Case, NewVisitNotePayload } from "../../../types/caseFile.types";
import { VisitNoteForm } from "./VisitNoteForm";

interface Props {
    cases: Case[];
    onAddVisitNote: (caseId: number, data: NewVisitNotePayload) => void;
    onCloseCase: (caseId: number, summary: string) => void;
}

export function CaseList({ cases, onAddVisitNote, onCloseCase }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [closingId, setClosingId] = useState<number | null>(null);
    const [summary, setSummary] = useState("");

    if (cases.length === 0) return <p className="text-gray-500 text-sm">No cases opened yet.</p>;

    return (
        <div className="space-y-3">
            {cases.map((c) => (
                <div key={c.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                        <div>
                            <p className="font-medium">{c.case_number} — {c.title}</p>
                            <p className="text-sm text-gray-500 capitalize">{c.category} · opened {new Date(c.opened_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${c.status === "open" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                            {c.status}
                        </span>
                    </div>

                    {expandedId === c.id && (
                        <div className="mt-3 pt-3 border-t">
                            <h4 className="text-sm font-medium mb-2">Visit Timeline</h4>
                            {c.visit_notes.length === 0 ? (
                                <p className="text-sm text-gray-400 mb-2">No visits recorded yet.</p>
                            ) : (
                                <ul className="space-y-2 mb-3">
                                    {c.visit_notes.map((v) => (
                                        <li key={v.id} className="text-sm border-l-2 border-teal-200 pl-2">
                                            <p className="text-gray-400 text-xs">{new Date(v.visit_date).toLocaleString()} — Dr. {v.doctor_name}</p>
                                            <p><strong>Complaint:</strong> {v.chief_complaint}</p>
                                            <p><strong>Diagnosis:</strong> {v.diagnosis}</p>
                                            <p><strong>Procedure:</strong> {v.procedure_performed}</p>
                                            {v.materials_used.length > 0 && (
                                                <p className="text-gray-500">
                                                    Materials: {v.materials_used.map((m) => `${m.material_name} (batch ${m.batch_number})`).join(", ")}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {c.status === "open" && (
                                <>
                                    <VisitNoteForm caseId={c.id} onSubmit={(data) => onAddVisitNote(c.id, data)} />
                                    {closingId === c.id ? (
                                        <div className="flex gap-2">
                                            <input placeholder="Closure summary" value={summary} onChange={(e) => setSummary(e.target.value)}
                                                className="border rounded px-3 py-2 flex-1 text-sm" />
                                            <button
                                                onClick={() => { onCloseCase(c.id, summary); setClosingId(null); setSummary(""); }}
                                                className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm"
                                            >
                                                Confirm Close
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setClosingId(c.id)} className="border px-3 py-1.5 rounded text-sm">
                                            Close Case
                                        </button>
                                    )}
                                </>
                            )}

                            {c.status === "closed" && (
                                <p className="text-sm text-gray-500 italic">Closed: {c.closure_summary}</p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}