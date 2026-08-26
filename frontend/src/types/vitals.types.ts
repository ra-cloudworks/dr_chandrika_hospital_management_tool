export type VitalsContext = "registration" | "pre_treatment" | "intra_procedure" | "post_treatment";

export interface VitalsEntry {
    id: number;
    patient: number;
    context: VitalsContext;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    pulse: number | null;
    blood_sugar: number | null;
    temperature: number | null;
    spo2: number | null;
    weight_kg: number | null;
    height_cm: number | null;
    notes: string;
    is_flagged: boolean;
    flagged_reason: string;
    recorded_by_name: string;
    recorded_at: string;
}

export interface NewVitalsPayload {
    context: VitalsContext;
    bp_systolic?: number;
    bp_diastolic?: number;
    pulse?: number;
    blood_sugar?: number;
    temperature?: number;
    spo2?: number;
    weight_kg?: number;
    height_cm?: number;
    notes?: string;
}