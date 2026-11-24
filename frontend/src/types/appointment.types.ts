export type AppointmentStatus = "pending" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show";
export type AppointmentSource = "patient_portal" | "receptionist" | "public_request" | "walk_in";

export interface Chair {
    id: number;
    name: string;
    location: string;
    is_active: boolean;
}

export interface AvailableSlot {
    start_time: string;
    end_time: string;
    is_available?: boolean;
    reason?: string;
}

// Audit record for logging previous appointment date, time, and doctor changes
export interface AppointmentRescheduleLog {
    id: number;
    appointment: number;
    old_date: string;
    old_start_time: string;
    old_end_time: string;
    old_doctor: number | null;
    old_doctor_name: string;
    new_date: string;
    new_start_time: string;
    new_end_time: string;
    new_doctor: number | null;
    new_doctor_name: string;
    reason: string;
    rescheduled_by: number | null;
    rescheduled_by_name: string;
    rescheduled_at: string;
}

export interface Appointment {
    id: number;
    patient: number | null;
    patient_name: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    doctor: number | null;
    doctor_name?: string;
    chair: number | null;
    chair_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: AppointmentStatus;
    source: AppointmentSource;
    is_home_visit: boolean;
    home_visit_address: string;
    reason_for_visit: string;
    notes: string;
    cancellation_reason?: string;
    cancellation_notes?: string;
    token_number: number | null;
    reschedule_logs?: AppointmentRescheduleLog[];
    created_at: string;
}

export interface WalkInPayload {
    patient_id?: number;
    guest_name?: string;
    guest_phone?: string;
    doctor_id?: number;
    reason_for_visit?: string;
}

export interface NewAppointmentPayload {
    patient?: number;
    doctor: number;
    chair?: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    reason_for_visit?: string;
    is_home_visit?: boolean;
    home_visit_address?: string;
}

export interface PublicRequestPayload {
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    doctor?: number | null;
    appointment_date: string;
    start_time: string;
    reason_for_visit?: string;
    is_home_visit?: boolean;
    home_visit_address?: string;
}

// Payload for rescheduling an appointment
export interface ReschedulePayload {
    new_date: string;
    new_start_time: string;
    new_end_time: string;
    new_doctor_id?: number | null;
    reason: string;
}

// Recall reminder choices and data structures
export type RecallType = "cleaning" | "checkup" | "orthodontic_review" | "post_treatment_review" | "custom";
export type RecallStatus = "scheduled" | "notified" | "booked" | "expired" | "cancelled";

export interface RecallReminder {
    id: number;
    patient: number;
    patient_name: string;
    recall_type: RecallType;
    recall_type_display?: string;
    custom_reason: string;
    recall_date: string;
    created_by: number | null;
    created_by_name: string;
    created_at: string;
    status: RecallStatus;
    status_display?: string;
    linked_appointment: number | null;
    notes: string;
}


export interface NewRecallPayload {
    recall_type: RecallType;
    custom_reason?: string;
    recall_date: string;
    notes?: string;
}