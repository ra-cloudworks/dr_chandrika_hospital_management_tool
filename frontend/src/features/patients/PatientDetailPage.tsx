import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatient } from "../../api/patientApi";
import type { PatientDetail } from "../../types/patient.types";
import { MedicalHistoryTab } from "./components/MedicalHistoryTab";

type Tab = "demographics" | "medical" | "allergies";

export function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [tab, setTab] = useState<Tab>("demographics");

  const load = () => {
    if (id) getPatient(Number(id)).then((res) => setPatient(res.data));
  };

  useEffect(load, [id]);

  if (!patient) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">
        {patient.first_name} {patient.last_name}
      </h1>
      <p className="text-gray-500 mb-4">{patient.patient_code}</p>

      <div className="flex gap-4 border-b mb-4">
        {(["demographics", "medical", "allergies"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 capitalize ${tab === t ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "demographics" && (
        <div className="space-y-1">
          <p><strong>Phone:</strong> {patient.phone}</p>
          <p><strong>Email:</strong> {patient.email}</p>
          <p><strong>Address:</strong> {patient.address}</p>
          <p><strong>DOB:</strong> {patient.dob}</p>
        </div>
      )}
      {tab === "medical" && (
        <MedicalHistoryTab patientId={patient.id} history={patient.medical_history} onAdded={load} />
      )}
      {tab === "allergies" && (
        <ul>
          {patient.allergies.map((a) => (
            <li key={a.id}>{a.allergen} — {a.severity}</li>
          ))}
        </ul>
      )}
    </div>
  );
}