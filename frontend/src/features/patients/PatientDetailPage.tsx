import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatient } from "../../api/patientApi";
import type { PatientDetail } from "../../types/patient.types";
import { MedicalHistoryTab } from "./components/MedicalHistoryTab";

// Vitals
import { listPatientVitals, recordVitals } from "../../api/vitalsApi";
import type { VitalsEntry, NewVitalsPayload } from "../../types/vitals.types";
import { VitalsForm } from "../vitals/components/VitalsForm";
import { VitalsHistoryList } from "../vitals/components/VitalsHistoryList";

// Dental Charts
import { listToothRecords, createToothRecord, updateToothRecord } from "../../api/dentalChartApi";
import type { ToothRecord, NewToothRecordPayload } from "../../types/dentalChart.types";
import { ToothGrid } from "../dental-chart/components/ToothGrid";
import { ToothDetailPanel } from "../dental-chart/components/ToothDetailPanel";

type Tab = "demographics" | "medical" | "allergies" | "vitals" | "dental-chart";

export function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [tab, setTab] = useState<Tab>("demographics");
  // Vitals
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  // Dental Charts
  const [toothRecords, setToothRecords] = useState<ToothRecord[]>([]);
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const [savingTooth, setSavingTooth] = useState(false);

  const load = () => {
    if (id) getPatient(Number(id)).then((res) => setPatient(res.data));
  };

  const loadVitals = () => {
    if (id) listPatientVitals(Number(id)).then((res) => setVitals(res.data));
  };

  const loadToothRecords = () => {
    if (id) listToothRecords(Number(id)).then((res) => setToothRecords(res.data));
  };

  useEffect(load, [id]);
  useEffect(loadVitals, [id]);
  useEffect(loadToothRecords, [id]);

  const handleVitalsSubmit = async (data: NewVitalsPayload) => {
    if (!id) return;
    await recordVitals(Number(id), data);
    loadVitals();
  };

  const handleToothSave = async (data: NewToothRecordPayload) => {
    if (!id) return;
    setSavingTooth(true);
    try {
      const existing = toothRecords.find((r) => r.tooth_number === data.tooth_number);
      if (existing) {
        await updateToothRecord(existing.id, data);
      } else {
        await createToothRecord(Number(id), data);
      }
      setActiveTooth(null);
      loadToothRecords();
    } finally {
      setSavingTooth(false);
    }
  };

  if (!patient) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">
        {patient.first_name} {patient.last_name}
      </h1>
      <p className="text-gray-500 mb-4">{patient.patient_code}</p>

      <div className="flex gap-4 border-b mb-4">
        {(["demographics", "medical", "allergies", "vitals", "dental-chart"] as Tab[]).map((t) => (
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
      {tab === "vitals" && (
        <div>
          <VitalsForm onSubmit={handleVitalsSubmit} submitting={false} />
          <div className="mt-4">
            <VitalsHistoryList entries={vitals} />
          </div>
        </div>
      )}
      {tab === "dental-chart" && (
        <div>
          <ToothGrid records={toothRecords} onToothClick={setActiveTooth} />
          {activeTooth && (
            <ToothDetailPanel
              toothNumber={activeTooth}
              existingRecord={toothRecords.find((r) => r.tooth_number === activeTooth)}
              onSave={handleToothSave}
              onClose={() => setActiveTooth(null)}
              submitting={savingTooth}
            />
          )}
        </div>
      )}
    </div>
  );
}