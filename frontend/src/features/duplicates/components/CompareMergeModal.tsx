import { useState } from "react";
import type { DuplicateFlag, MergePayload } from "../../../types/duplicate.types";

interface Props {
    flag: DuplicateFlag;
    onClose: () => void;
    onMerge: (payload: MergePayload) => void;
    submitting: boolean;
}

const COMPARE_FIELDS = ["first_name", "last_name", "phone", "email", "address", "dob"] as const;

export function CompareMergeModal({ flag, onClose, onMerge, submitting }: Props) {
    const [primaryId, setPrimaryId] = useState(flag.patient_a.id);
    const [resolutions, setResolutions] = useState<Record<string, string>>({});

    const secondary = primaryId === flag.patient_a.id ? flag.patient_b : flag.patient_a;
    const primary = primaryId === flag.patient_a.id ? flag.patient_a : flag.patient_b;

    const pick = (field: string, value: string) =>
        setResolutions((prev) => ({ ...prev, [field]: value }));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-1">Compare & Merge Patients</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Choose which record survives, then pick the correct value for each conflicting field.
                </p>

                <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2">
                        <input type="radio" checked={primaryId === flag.patient_a.id}
                            onChange={() => setPrimaryId(flag.patient_a.id)} />
                        Keep {flag.patient_a.patient_code} as primary
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" checked={primaryId === flag.patient_b.id}
                            onChange={() => setPrimaryId(flag.patient_b.id)} />
                        Keep {flag.patient_b.patient_code} as primary
                    </label>
                </div>

                <table className="w-full text-sm mb-4">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-1">Field</th>
                            <th>Primary value</th>
                            <th>Other record's value — click to use instead</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMPARE_FIELDS.map((field) => {
                            const primaryVal = String((primary as any)[field] ?? "—");
                            const secondaryVal = String((secondary as any)[field] ?? "—");
                            const chosen = resolutions[field] ?? primaryVal;
                            return (
                                <tr key={field} className="border-b">
                                    <td className="py-2 capitalize">{field.replace("_", " ")}</td>
                                    <td className={chosen === primaryVal ? "font-semibold text-teal-700" : ""}>{primaryVal}</td>
                                    <td>
                                        {secondaryVal !== primaryVal ? (
                                            <button
                                                onClick={() => pick(field, secondaryVal)}
                                                className={`underline ${chosen === secondaryVal ? "font-semibold text-teal-700" : "text-gray-500"}`}
                                            >
                                                {secondaryVal}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">same</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm mb-4">
                    This will permanently mark {secondary.patient_code} as merged into {primary.patient_code}.
                    This action is logged and only reversible within 48 hours by request.
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="border px-4 py-2 rounded">Cancel</button>
                    <button
                        disabled={submitting}
                        onClick={() =>
                            onMerge({ flag_id: flag.id, primary_patient_id: primaryId, field_resolutions: resolutions })
                        }
                        className="bg-teal-600 text-white px-4 py-2 rounded"
                    >
                        {submitting ? "Merging..." : "Confirm Merge"}
                    </button>
                </div>
            </div>
        </div>
    );
}