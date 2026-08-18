import { apiClient } from "./client";
import type { VitalsEntry, NewVitalsPayload } from "../types/vitals.types";

export const listPatientVitals = (patientId: number) =>
    apiClient.get<VitalsEntry[]>(`/vitals/${patientId}/`);

export const recordVitals = (patientId: number, data: NewVitalsPayload) =>
    apiClient.post<VitalsEntry>(`/vitals/${patientId}/`, data);

export const listMyVitals = () =>
    apiClient.get<VitalsEntry[]>("/vitals/me/");