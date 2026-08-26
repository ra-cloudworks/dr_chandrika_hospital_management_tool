import { apiClient } from "./client";
import type { Case, NewCasePayload, NewVisitNotePayload } from "../types/caseFile.types";

export const listCases = (patientId: number, statusFilter?: string) =>
  apiClient.get<Case[]>(`/case-files/${patientId}/`, { params: { status: statusFilter } });

export const createCase = (patientId: number, data: NewCasePayload) =>
  apiClient.post<Case>(`/case-files/${patientId}/`, data);

export const getCase = (caseId: number) =>
  apiClient.get<Case>(`/case-files/case/${caseId}/`);

export const closeCase = (caseId: number, closureSummary: string) =>
  apiClient.post<Case>(`/case-files/case/${caseId}/close/`, { closure_summary: closureSummary });

export const addVisitNote = (caseId: number, data: NewVisitNotePayload) =>
  apiClient.post(`/case-files/case/${caseId}/visits/`, data);