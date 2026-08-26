import type { PerioExam } from "../../../types/perioChart.types";

export function PerioExamHistory({ exams }: { exams: PerioExam[] }) {
    if (exams.length === 0) return <p className="text-gray-500 text-sm">No periodontal exams recorded yet.</p>;

    return (
        <div className="space-y-3">
            {exams.map((exam) => (
                <div key={exam.id} className="border rounded p-3">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>{exam.exam_date}</span>
                        <span>by {exam.performed_by_name}</span>
                    </div>
                    <p className="text-sm mb-2">{exam.diagnosis_summary || "No summary provided."}</p>
                    <p className="text-xs text-gray-400">{exam.tooth_measurements.length} teeth examined</p>
                </div>
            ))}
        </div>
    );
}