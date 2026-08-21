import { useState } from "react";
import type { PerioToothMeasurement, NewPerioExamPayload } from "../../../types/perioChart.types";
import { PerioToothEntry } from "./PerioToothEntry";

interface Props {
    onSubmitExam: (data: NewPerioExamPayload) => void;
    submitting: boolean;
}

export function PerioExamBuilder({ onSubmitExam, submitting }: Props) {
    const [teeth, setTeeth] = useState<PerioToothMeasurement[]>([]);
    const [summary, setSummary] = useState("");

    const handleSubmit = () => {
        if (teeth.length === 0) return;
        onSubmitExam({ diagnosis_summary: summary, tooth_measurements: teeth });
        setTeeth([]);
        setSummary("");
    };

    return (
        <div>
            <h3 className="font-medium mb-2">New Periodontal Exam</h3>
            <PerioToothEntry onAdd={(tooth) => setTeeth((prev) => [...prev, tooth])} />

            {teeth.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">{teeth.length} tooth/teeth added to this exam:</p>
                    <div className="flex gap-2 flex-wrap">
                        {teeth.map((t) => (
                            <span key={t.tooth_number} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {t.tooth_number}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <textarea placeholder="Diagnosis summary" value={summary} onChange={(e) => setSummary(e.target.value)}
                className="border rounded px-3 py-2 w-full mb-3" rows={2} />

            <button
                disabled={submitting || teeth.length === 0}
                onClick={handleSubmit}
                className="bg-teal-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {submitting ? "Saving Exam..." : "Save Full Exam"}
            </button>
        </div>
    );
}