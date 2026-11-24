import { apiClient } from "./client";
import type {
    Appointment, NewAppointmentPayload, PublicRequestPayload,
    Chair, AvailableSlot, ReschedulePayload, RecallReminder, NewRecallPayload, WalkInPayload
} from "../types/appointment.types";

export const listChairs = () => apiClient.get<Chair[]>("/appointments/chairs/");

export const getAvailableSlots = (doctorId: number, date: string) =>
    apiClient.get<{ slots: AvailableSlot[] }>("/appointments/available-slots/", { params: { doctor_id: doctorId, date } });

export const listAppointments = (params?: Record<string, string>) =>
    apiClient.get<Appointment[]>("/appointments/", { params });

export const createAppointment = (data: NewAppointmentPayload) =>
    apiClient.post<Appointment>("/appointments/", data);

export const createWalkIn = (data: WalkInPayload) =>
    apiClient.post<Appointment>("/appointments/walk-in/", data);

export const appointmentAction = (
    id: number, action: string, payload?: { cancellation_reason?: string; cancellation_notes?: string }
) => apiClient.post<Appointment>(`/appointments/${id}/${action}/`, payload);

// API call to reschedule an existing appointment to a new date/time/doctor
export const rescheduleAppointment = (id: number, data: ReschedulePayload) =>
    apiClient.post<Appointment>(`/appointments/${id}/reschedule/`, data);

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

// API call to list recalls (optional patient filter and due_soon filter)
export const listRecalls = (patientId?: number, params?: Record<string, any>) => {
    const url = patientId ? `/appointments/recalls/${patientId}/` : "/appointments/recalls/";
    return apiClient.get<RecallReminder[]>(url, { params });
};

// API call to create a new recall reminder for a patient
export const createRecall = (patientId: number, data: NewRecallPayload) =>
    apiClient.post<RecallReminder>(`/appointments/recalls/${patientId}/`, data);