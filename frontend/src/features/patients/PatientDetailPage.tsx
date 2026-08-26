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

// Periodontal Charts
import { listPerioExams, createPerioExam } from "../../api/perioChartApi";
import type { PerioExam, NewPerioExamPayload } from "../../types/perioChart.types";
import { PerioExamBuilder } from "../perio-chart/components/PerioExamBuilder";
import { PerioExamHistory } from "../perio-chart/components/PerioExamHistory";

// Treatment Plans
import { listTreatmentPlans, createTreatmentPlan, addPlanItem, proposePlan, revisePlan } from "../../api/treatmentPlanApi";
import type { TreatmentPlan, NewPlanPayload, NewItemPayload } from "../../types/treatmentPlan.types";
import { PlanBuilder } from "../treatment-plans/components/PlanBuilder";
import { PlanList } from "../treatment-plans/components/PlanList";

// Case Files
import { listCases, createCase, addVisitNote, closeCase } from "../../api/caseFileApi";
import type { Case, NewCasePayload, NewVisitNotePayload } from "../../types/caseFile.types";
import { NewCaseForm } from "../case-files/components/NewCaseForm";
import { CaseList } from "../case-files/components/CaseList";

// Case Media
import { listMedia, uploadMedia, softDeleteMedia } from "../../api/caseMediaApi";
import type { MediaFile } from "../../types/caseMedia.types";
import { MediaUploadForm } from "../case-media/components/MediaUploadForm";
import { MediaGallery } from "../case-media/components/MediaGallery";

type Tab = "demographics" | "medical" | "allergies" | "vitals" | "dental-chart" | "perio-chart" | "treatment-plan" | "cases" | "media";


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
  // Periodontal Charts
  const [perioExams, setPerioExams] = useState<PerioExam[]>([]);
  const [savingExam, setSavingExam] = useState(false);
  // Treatment Plans
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  // Case Files
  const [cases, setCases] = useState<Case[]>([]);
  // Case Media
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    if (id) getPatient(Number(id)).then((res) => setPatient(res.data));
  };

  const loadVitals = () => {
    if (id) listPatientVitals(Number(id)).then((res) => setVitals(res.data));
  };

  const loadToothRecords = () => {
    if (id) listToothRecords(Number(id)).then((res) => setToothRecords(res.data));
  };

  const loadPerioExams = () => {
    if (id) listPerioExams(Number(id)).then((res) => setPerioExams(res.data));
  };

  const loadPlans = () => {
    if (id) listTreatmentPlans(Number(id)).then((res) => setPlans(res.data));
  };

  const loadCases = () => {
    if (id) listCases(Number(id)).then((res) => setCases(res.data));
  };

  const loadMedia = () => {
    if (id) listMedia(Number(id)).then((res) => setMediaFiles(res.data));
  };

  useEffect(load, [id]);
  useEffect(loadVitals, [id]);
  useEffect(loadToothRecords, [id]);
  useEffect(loadPerioExams, [id]);
  useEffect(loadPlans, [id]);
  useEffect(loadCases, [id]);
  useEffect(loadMedia, [id]);

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

  const handleExamSubmit = async (data: NewPerioExamPayload) => {
    if (!id) return;
    setSavingExam(true);
    try {
      await createPerioExam(Number(id), data);
      loadPerioExams();
    } finally {
      setSavingExam(false);
    }
  };

  // Treatment Plan Handlers
  const handleCreatePlan = async (data: NewPlanPayload) => {
    const res = await createTreatmentPlan(Number(id), data);
    loadPlans();
    return res.data.id;
  };
  const handleAddItem = async (planId: number, data: NewItemPayload) => {
    await addPlanItem(planId, data);
    loadPlans();
  };
  const handlePropose = async (planId: number) => { await proposePlan(planId); loadPlans(); };
  const handleRevise = async (planId: number, reason: string) => { await revisePlan(planId, reason); loadPlans(); };

  // Case Files
  const handleCreateCase = async (data: NewCasePayload) => {
    if (!id) return;
    await createCase(Number(id), data);
    loadCases();
  };
  const handleAddVisitNote = async (caseId: number, data: NewVisitNotePayload) => {
    await addVisitNote(caseId, data);
    loadCases();
  };
  const handleCloseCase = async (caseId: number, summary: string) => {
    await closeCase(caseId, summary);
    loadCases();
  };

  // Case Media
  const handleUpload = async (formData: FormData) => {
    if (!id) return;
    setUploading(true);
    try {
      await uploadMedia(Number(id), formData);
      loadMedia();
    } finally {
      setUploading(false);
    }
  };
  const handleDelete = async (mediaId: number, reason: string) => {
    await softDeleteMedia(mediaId, reason);
    loadMedia();
  };

  if (!patient) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">
        {patient.first_name} {patient.last_name}
      </h1>
      <p className="text-gray-500 mb-4">{patient.patient_code}</p>

      <div className="flex gap-4 border-b mb-4">
        {(["demographics", "medical", "allergies", "vitals", "dental-chart", "perio-chart", "treatment-plan", "cases", "media"] as Tab[]).map((t) => (
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
      {tab === "perio-chart" && (
        <div>
          <PerioExamBuilder onSubmitExam={handleExamSubmit} submitting={savingExam} />
          <div className="mt-6">
            <h3 className="font-medium mb-2">Past Exams</h3>
            <PerioExamHistory exams={perioExams} />
          </div>
        </div>
      )}
      {tab === "treatment-plan" && (
        <div>
          <PlanBuilder onCreatePlan={handleCreatePlan} onAddItem={handleAddItem} />
          <div className="mt-4">
            <PlanList plans={plans} onPropose={handlePropose} onRevise={handleRevise} />
          </div>
        </div>
      )}
      {tab === "cases" && (
        <div>
          <NewCaseForm onSubmit={handleCreateCase} />
          <CaseList cases={cases} onAddVisitNote={handleAddVisitNote} onCloseCase={handleCloseCase} />
        </div>
      )}
      {tab === "media" && (
        <div>
          <MediaUploadForm onUpload={handleUpload} uploading={uploading} />
          <MediaGallery files={mediaFiles} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}