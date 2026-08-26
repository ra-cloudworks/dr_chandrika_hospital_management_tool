import { apiClient } from "./client";
import type { ToothRecord, NewToothRecordPayload } from "../types/dentalChart.types";

export const listToothRecords = (patientId: number) =>
    apiClient.get<ToothRecord[]>(`/dental-chart/${patientId}/`);

export const createToothRecord = (patientId: number, data: NewToothRecordPayload) =>
    apiClient.post<ToothRecord>(`/dental-chart/${patientId}/`, data);

export const updateToothRecord = (recordId: number, data: Partial<NewToothRecordPayload>) =>
    apiClient.patch<ToothRecord>(`/dental-chart/record/${recordId}/`, data);