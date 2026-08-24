import { useState } from "react";
import type { NewCasePayload, CaseCategory } from "../../../types/caseFile.types";

const CATEGORIES: CaseCategory[] = [
    "general", "orthodontic", "surgical", "cosmetic",
    "emergency", "pediatric", "periodontal", "prosthodontic",
];

export function NewCaseForm({ onSubmit }: { onSubmit: (data: NewCasePayload) => void }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<CaseCategory>("general");

    return (
        <div className="flex gap-2 mb-4">
            <input placeholder="Case title (e.g. Root canal — tooth 36)" value={title}
                onChange={(e) => setTitle(e.target.value)} className="border rounded px-3 py-2 flex-1" />
            <select value={category} onChange={(e) => setCategory(e.target.value as CaseCategory)}
                className="border rounded px-3 py-2 capitalize">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
                onClick={() => { if (title.trim()) { onSubmit({ title, category }); setTitle(""); } }}
                className="bg-teal-600 text-white px-4 py-2 rounded"
            >
                Open Case
            </button>
        </div>
    );
}