import type { DuplicateFlag } from "../../../types/duplicate.types";

interface Props {
    flag: DuplicateFlag;
    onReview: (flag: DuplicateFlag) => void;
    onDismiss: (id: number) => void;
}

export function DuplicateFlagCard({ flag, onReview, onDismiss }: Props) {
    return (
        <div className="border rounded-lg p-4 flex justify-between items-center">
            <div>
                <p className="font-medium">
                    {flag.patient_a.first_name} {flag.patient_a.last_name} ({flag.patient_a.patient_code})
                    {" "}↔{" "}
                    {flag.patient_b.first_name} {flag.patient_b.last_name} ({flag.patient_b.patient_code})
                </p>
                <p className="text-sm text-gray-500">
                    Match score: {flag.match_score}% — matched on: {Object.keys(flag.matched_fields).join(", ")}
                </p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onReview(flag)} className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm">
                    Compare & Merge
                </button>
                <button onClick={() => onDismiss(flag.id)} className="border px-3 py-1.5 rounded text-sm">
                    Not a duplicate
                </button>
            </div>
        </div>
  );
}