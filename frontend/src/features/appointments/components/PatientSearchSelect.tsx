import { useState } from "react";
import { listPatients } from "../../../api/patientApi";
import type { PatientListItem } from "../../../types/patient.types";

interface Props {
    onSelect: (patient: PatientListItem) => void;
}

export function PatientSearchSelect({ onSelect }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PatientListItem[]>([]);

    const handleSearch = async (value: string) => {
        setQuery(value);
        if (value.length < 2) {
            setResults([]);
            return;
        }
        const res = await listPatients(value);
        setResults(res.data);
    };

    const handlePick = (p: PatientListItem) => {
        setQuery(`${p.first_name} ${p.last_name} (${p.patient_code})`);
        setResults([]);
        onSelect(p);
    };

    return (
        <div className="relative">
            <input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search patient by name or phone..."
                className="border rounded px-3 py-2 w-full"
            />
            {results.length > 0 && (
                <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handlePick(p)}
                            className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                            {p.first_name} {p.last_name} — {p.patient_code} — {p.phone}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}