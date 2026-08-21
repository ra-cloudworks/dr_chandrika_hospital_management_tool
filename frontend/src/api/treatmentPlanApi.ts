import { apiClient } from "./client";
import type { TreatmentPlan, NewPlanPayload, NewItemPayload } from "../types/treatmentPlan.types";

export const listTreatmentPlans = (patientId: number) =>
    apiClient.get<TreatmentPlan[]>(`/treatment-plans/${patientId}/`);

export const createTreatmentPlan = (patientId: number, data: NewPlanPayload) =>
    apiClient.post<TreatmentPlan>(`/treatment-plans/${patientId}/`, data);

export const addPlanItem = (planId: number, data: NewItemPayload) =>
    apiClient.post(`/treatment-plans/plan/${planId}/items/`, data);

export const proposePlan = (planId: number) =>
    apiClient.post<TreatmentPlan>(`/treatment-plans/plan/${planId}/propose/`);

export const revisePlan = (planId: number, reason: string) =>
    apiClient.post<TreatmentPlan>(`/treatment-plans/plan/${planId}/revise/`, { reason_for_change: reason });