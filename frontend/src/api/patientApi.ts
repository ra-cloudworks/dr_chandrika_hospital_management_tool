import { apiClient } from "./client";
import type {
  PatientListItem, PatientDetail, NewPatientPayload,
  MedicalHistoryEntry, Allergy,
} from "../types/patient.types";

export const listPatients = (search?: string) =>
  apiClient.get<PatientListItem[]>("/patients/", { params: { search } });

export const getPatient = (id: number) =>
  apiClient.get<PatientDetail>(`/patients/${id}/`);

export const createPatient = (data: NewPatientPayload) =>
  apiClient.post<PatientDetail>("/patients/", data);

export const updatePatient = (id: number, data: Partial<NewPatientPayload>) =>
  apiClient.patch<PatientDetail>(`/patients/${id}/`, data);

export const deactivatePatient = (id: number) =>
  apiClient.delete(`/patients/${id}/`);

export const listMedicalHistory = (patientId: number) =>
  apiClient.get<MedicalHistoryEntry[]>(`/patients/${patientId}/medical-history/`);

export const addMedicalHistory = (patientId: number, data: Partial<MedicalHistoryEntry>) =>
  apiClient.post(`/patients/${patientId}/medical-history/`, data);

export const listAllergies = (patientId: number) =>
  apiClient.get<Allergy[]>(`/patients/${patientId}/allergies/`);

export const addAllergy = (patientId: number, data: Partial<Allergy>) =>
  apiClient.post(`/patients/${patientId}/allergies/`, data);