import { useEffect, useState } from "react";
import { apiClient } from "../../../api/client";

interface Doctor {
    id: number;
    first_name: string;
    last_name: string;
}

interface Props {
    value: number | null;
    onChange: (doctorId: number) => void;
}

export function DoctorSelect({ value, onChange }: Props) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);

    useEffect(() => {
        apiClient.get<Doctor[]>("/appointments/public-doctors/").then((res) => setDoctors(res.data));
    }, []);

    return (
        <select
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
        >
            <option value="" disabled>Select a doctor</option>
            {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                    Dr. {d.first_name} {d.last_name}
                </option>
            ))}
        </select>
    );
}