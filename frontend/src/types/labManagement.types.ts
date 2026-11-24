// TypeScript types and interface definitions for Module 11: Laboratory Management

export type LabOrderStatus =
  | "draft"
  | "sent_to_lab"
  | "in_fabrication"
  | "trial_ready"
  | "trial_done"
  | "remake_requested"
  | "delivered"
  | "accepted"
  | "rejected";

export type WorkType =
  | "crown"
  | "bridge"
  | "denture"
  | "partial_denture"
  | "implant_crown"
  | "orthodontic_appliance"
  | "night_guard"
  | "retainer"
  | "veneer"
  | "inlay_onlay"
  | "custom";

export type ImpressionType = "physical" | "digital_scan";

export type DoctorAcceptance = "pending" | "accepted" | "rejected";

// Shared VALID_TRANSITIONS map matching backend state transition engine
export const VALID_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  draft: ["sent_to_lab"],
  sent_to_lab: ["in_fabrication", "delivered"],
  in_fabrication: ["trial_ready", "delivered"],
  trial_ready: ["trial_done"],
  trial_done: ["in_fabrication", "delivered", "remake_requested"],
  remake_requested: ["in_fabrication", "sent_to_lab"],
  delivered: ["accepted", "rejected", "remake_requested"],
  accepted: [],
  rejected: ["remake_requested"],
};

export interface DentalLab {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface LabOrderStatusLog {
  id: number;
  lab_order: number;
  old_status: string;
  new_status: string;
  changed_by: number | null;
  changed_by_name: string;
  notes: string;
  changed_at: string;
}

export interface LabOrderListItem {
  id: number;
  order_number: string;
  patient: number;
  patient_code: string;
  patient_name: string;
  work_type: WorkType;
  material: string;
  status: LabOrderStatus;
  lab: number | null;
  lab_name: string | null;
  doctor_acceptance: DoctorAcceptance;
  promised_delivery_date: string | null;
  actual_delivery_date: string | null;
  created_at: string;
}

export interface LabOrderDetail {
  id: number;
  order_number: string;
  patient: number;
  patient_code: string;
  patient_name: string;
  tooth_record: number | null;
  treatment_plan_item: number | null;
  lab: number | null;
  lab_name: string | null;
  ordering_doctor: number | null;
  ordering_doctor_name: string | null;
  work_type: WorkType;
  tooth_numbers: string;
  shade: string;
  material: string;
  brand: string;
  impression_type: ImpressionType;
  special_instructions: string;
  status: LabOrderStatus;
  date_sent: string | null;
  trial_date: string | null;
  promised_delivery_date: string | null;
  actual_delivery_date: string | null;
  lab_cost: string | number;
  patient_charge: string | number;
  warranty_months: number | null;
  remake_count: number;
  remake_reason: string;
  doctor_acceptance: DoctorAcceptance;
  acceptance_notes: string;
  quality_photo: string | null;
  courier_name: string;
  courier_tracking: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  status_logs: LabOrderStatusLog[];
}

export interface NewLabOrderPayload {
  lab?: number | null;
  work_type: WorkType;
  tooth_numbers?: string;
  shade?: string;
  material?: string;
  brand?: string;
  impression_type?: ImpressionType;
  special_instructions?: string;
  lab_cost?: number | string;
  patient_charge?: number | string;
  promised_delivery_date?: string;
  warranty_months?: number | null;
  tooth_record?: number | null;
  treatment_plan_item?: number | null;
}
