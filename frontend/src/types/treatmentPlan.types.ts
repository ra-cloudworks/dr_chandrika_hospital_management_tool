export type PlanStatus = "draft" | "proposed" | "accepted" | "rejected" | "in_progress" | "completed" | "cancelled";
export type ItemPhase = "urgent" | "preventive" | "restorative" | "cosmetic";
export type ItemStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface TreatmentPlanItem {
    id: number;
    tooth_number: string;
    surface: string;
    procedure_name: string;
    phase: ItemPhase;
    visit_sequence: number;
    expected_duration_minutes: number | null;
    base_price: number;
    material_price: number;
    lab_charge: number;
    discount_amount: number;
    tax_amount: number;
    item_total: number;
    status: ItemStatus;
    completion_percentage: number;
    notes: string;
}

export interface RevisionLog {
    id: number;
    revision_number: number;
    reason_for_change: string;
    changed_by_name: string;
    changed_at: string;
}

export interface TreatmentPlan {
    id: number;
    patient: number;
    title: string;
    chief_complaint: string;
    doctor_name: string;
    status: PlanStatus;
    total_estimated_cost: number;
    patient_approved_price: number | null;
    consent_signed: boolean;
    consent_signed_at: string | null;
    revision_number: number;
    created_by_name: string;
    created_at: string;
    items: TreatmentPlanItem[];
    revision_logs: RevisionLog[];
}

export interface NewPlanPayload {
    title: string;
    chief_complaint?: string;
}

export interface NewItemPayload {
    tooth_number?: string;
    surface?: string;
    procedure_name: string;
    phase: ItemPhase;
    visit_sequence: number;
    base_price: number;
    material_price?: number;
    lab_charge?: number;
    discount_amount?: number;
    tax_amount?: number;
}