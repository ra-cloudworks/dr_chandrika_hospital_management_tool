import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPatient } from "../../api/patientApi";
import type { NewPatientPayload } from "../../types/patient.types";
import { PatientForm } from "./components/PatientForm";

export function NewPatientPage() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: NewPatientPayload) => {
    setSubmitting(true);
    try {
      const res = await createPatient(data);
      navigate(`/patients/${res.data.id}`);
    } catch (err) {
      alert("Could not register patient — check required fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Register New Patient</h1>
      <PatientForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}