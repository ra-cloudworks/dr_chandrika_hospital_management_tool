import type { PatientDetail } from "./patient.types";

export interface DuplicateFlag {
    id: number;
    patient_a: PatientDetail;
    patient_b: PatientDetail;
    match_score: number;
    matched_fields: Record<string, boolean | number>;
    status: "pending" | "dismissed" | "merged";
    flagged_at: string;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
}

export interface MergePayload {
    flag_id: number;
    primary_patient_id: number;
    field_resolutions: Record<string, string>;
}

export interface MergeLogEntry {
    id: number;
    primary_patient_code: string;
    merged_patient_code: string;
    merged_by_name: string;
    field_resolutions: Record<string, string>;
    merged_at: string;
    reversible_until: string;
    reversed: boolean;
}