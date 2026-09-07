import { apiClient } from "./client";
import type {
    Appointment, NewAppointmentPayload, PublicRequestPayload,
    Chair, AvailableSlot,
} from "../types/appointment.types";

export const listChairs = () => apiClient.get<Chair[]>("/appointments/chairs/");

export const getAvailableSlots = (doctorId: number, date: string) =>
    apiClient.get<{ slots: AvailableSlot[] }>("/appointments/available-slots/", { params: { doctor_id: doctorId, date } });

export const listAppointments = (params?: Record<string, string>) =>
    apiClient.get<Appointment[]>("/appointments/", { params });

export const createAppointment = (data: NewAppointmentPayload) =>
    apiClient.post<Appointment>("/appointments/", data);

export const appointmentAction = (id: number, action: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/${action}/`);

export const submitPublicRequest = (data: PublicRequestPayload) =>
    apiClient.post("/appointments/public-request/", data);

export const listPendingRequests = () =>
    apiClient.get<Appointment[]>("/appointments/pending-requests/");

export const confirmRequest = (
    id: number, doctorId: number, patientId?: number, start?: string, end?: string, chairId?: number
) =>
    apiClient.post(`/appointments/pending-requests/${id}/confirm/`, {
        doctor_id: doctorId,
        patient_id: patientId || undefined,
        start_time: start || undefined,
        end_time: end || undefined,
        chair_id: chairId || undefined,
    });

export const declineRequest = (
    id: number,
    payload: { action?: "decline" | "reschedule_offer"; reason?: string; alternative_slots?: string[] }
) =>
    apiClient.post(`/appointments/pending-requests/${id}/decline/`, payload);