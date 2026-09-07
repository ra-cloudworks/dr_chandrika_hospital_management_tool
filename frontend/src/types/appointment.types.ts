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
    token_number: number | null;
    created_at: string;
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