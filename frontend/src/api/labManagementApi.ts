// API service functions for Module 11: Laboratory Management
import { apiClient } from "./client";
import type {
  DentalLab,
  LabOrderListItem,
  LabOrderDetail,
  NewLabOrderPayload,
  LabOrderStatus,
} from "../types/labManagement.types";

// List external dental lab profiles
export const listLabs = () =>
  apiClient.get<DentalLab[]>("/lab/labs/");

// Create a new dental lab profile
export const createLab = (data: Partial<DentalLab>) =>
  apiClient.post<DentalLab>("/lab/labs/", data);

// Global list of all lab orders across all patients (for main dashboard)
export const listGlobalLabOrders = (params?: Record<string, any>) =>
  apiClient.get<LabOrderListItem[]>("/lab/all/", { params });

// List patient-scoped lab orders
export const listPatientLabOrders = (patientId: number, params?: Record<string, any>) =>
  apiClient.get<LabOrderListItem[]>(`/lab/${patientId}/`, { params });

// Create a new lab order for a specific patient
export const createLabOrder = (patientId: number, data: NewLabOrderPayload) =>
  apiClient.post<LabOrderDetail>(`/lab/${patientId}/`, data);

// Get full details of a specific lab order including status logs
export const getLabOrder = (orderId: number) =>
  apiClient.get<LabOrderDetail>(`/lab/order/${orderId}/`);

// Update editable fields of a lab order
export const updateLabOrder = (orderId: number, data: Partial<LabOrderDetail>) =>
  apiClient.patch<LabOrderDetail>(`/lab/order/${orderId}/`, data);

// Progress status of a lab order with state transition validation
export const updateLabOrderStatus = (
  orderId: number,
  newStatus: LabOrderStatus,
  notes?: string
) =>
  apiClient.post<LabOrderDetail>(`/lab/order/${orderId}/status/`, {
    new_status: newStatus,
    notes: notes || "",
  });

// List lab orders for a specific lab
export const listOrdersByLab = (labId: number, params?: Record<string, any>) =>
  apiClient.get<LabOrderListItem[]>(`/lab/by-lab/${labId}/`, { params });

// List overdue lab orders past their promised delivery date
export const listOverdueOrders = () =>
  apiClient.get<LabOrderListItem[]>("/lab/overdue/");
