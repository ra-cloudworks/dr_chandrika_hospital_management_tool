import { useState } from "react";
import type { NewVitalsPayload, VitalsContext } from "../../../types/vitals.types";

interface Props {
    onSubmit: (data: NewVitalsPayload) => void;
    submitting: boolean;
}

export function VitalsForm({ onSubmit, submitting }: Props) {
    const [form, setForm] = useState<NewVitalsPayload>({ context: "pre_treatment" });

    const update = (field: keyof NewVitalsPayload, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value === "" ? undefined : Number(value) || value }));

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form);
            }}
            className="space-y-3 max-w-lg border rounded-lg p-4"
        >
            <select
                value={form.context}
                onChange={(e) => setForm((prev) => ({ ...prev, context: e.target.value as VitalsContext }))}
                className="border rounded px-3 py-2 w-full"
            >
                <option value="registration">Registration</option>
                <option value="pre_treatment">Pre-Treatment</option>
                <option value="intra_procedure">During Procedure</option>
                <option value="post_treatment">Post-Treatment</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="BP Systolic" onChange={(e) => update("bp_systolic", e.target.value)}
                    className="border rounded px-3 py-2" />
                <input type="number" placeholder="BP Diastolic" onChange={(e) => update("bp_diastolic", e.target.value)}
                    className="border rounded px-3 py-2" />
                <input type="number" placeholder="Pulse" onChange={(e) => update("pulse", e.target.value)}
                    className="border rounded px-3 py-2" />
                <input type="number" placeholder="Blood Sugar (mg/dL)" onChange={(e) => update("blood_sugar", e.target.value)}
                    className="border rounded px-3 py-2" />
                <input type="number" step="0.1" placeholder="Temperature (°F)" onChange={(e) => update("temperature", e.target.value)}
                    className="border rounded px-3 py-2" />
                <input type="number" placeholder="SpO2 (%)" onChange={(e) => update("spo2", e.target.value)}
                    className="border rounded px-3 py-2" />
            </div>

            <textarea placeholder="Notes" onChange={(e) => update("notes", e.target.value)}
                className="border rounded px-3 py-2 w-full" />

            <button type="submit" disabled={submitting} className="bg-teal-600 text-white px-4 py-2 rounded">
                {submitting ? "Saving..." : "Record Vitals"}
            </button>
        </form>
    );
}