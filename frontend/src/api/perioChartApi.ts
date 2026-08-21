import { apiClient } from "./client";
import type { PerioExam, NewPerioExamPayload } from "../types/perioChart.types";

export const listPerioExams = (patientId: number) =>
  apiClient.get<PerioExam[]>(`/perio-chart/${patientId}/`);

export const createPerioExam = (patientId: number, data: NewPerioExamPayload) =>
  apiClient.post<PerioExam>(`/perio-chart/${patientId}/`, data);