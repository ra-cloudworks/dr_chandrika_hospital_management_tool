import { useState } from "react";
import type { NewVisitNotePayload } from "../../../types/caseFile.types";
import { useAuth } from "../../../context/AuthContext";

interface Props {
    caseId: number;
    onSubmit: (data: NewVisitNotePayload) => void;
}

export function VisitNoteForm({ onSubmit }: Props) {
    const { user } = useAuth();
    const [complaint, setComplaint] = useState("");
    const [findings, setFindings] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [procedure, setProcedure] = useState("");
    const [outcome, setOutcome] = useState("");

    const handleSubmit = () => {
        if (!user) return;
        onSubmit({
            chief_complaint: complaint, examination_findings: findings,
            diagnosis, procedure_performed: procedure, outcome_notes: outcome,
            doctor: user.id,
        });
        setComplaint(""); setFindings(""); setDiagnosis(""); setProcedure(""); setOutcome("");
    };

    return (
        <div className="border rounded p-3 space-y-2 mb-3">
            <input placeholder="Chief complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm" />
            <input placeholder="Examination findings" value={findings} onChange={(e) => setFindings(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm" />
            <input placeholder="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm" />
            <input placeholder="Procedure performed" value={procedure} onChange={(e) => setProcedure(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm" />
            <input placeholder="Outcome notes" value={outcome} onChange={(e) => setOutcome(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm" />
            <button onClick={handleSubmit} className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm">
                Add Visit Note
            </button>
        </div>
    );
}