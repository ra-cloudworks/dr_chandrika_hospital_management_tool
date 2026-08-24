export type CaseCategory =
    | "general" | "orthodontic" | "surgical" | "cosmetic"
    | "emergency" | "pediatric" | "periodontal" | "prosthodontic";
export type CaseStatus = "open" | "closed";

export interface MaterialUsed {
    id: number;
    material_name: string;
    batch_number: string;
    quantity: number;
    unit: string;
}

export interface CaseVisitNote {
    id: number;
    chief_complaint: string;
    examination_findings: string;
    diagnosis: string;
    procedure_performed: string;
    complications: string;
    outcome_notes: string;
    next_appointment_notes: string;
    ai_generated_summary: string;
    doctor: number;
    doctor_name: string;
    assistant_name: string;
    recorded_by_name: string;
    visit_date: string;
    materials_used: MaterialUsed[];
}

export interface Case {
    id: number;
    patient: number;
    patient_code: string;
    case_number: string;
    title: string;
    category: CaseCategory;
    status: CaseStatus;
    opened_by_name: string;
    opened_at: string;
    closed_at: string | null;
    closure_summary: string;
    visit_notes: CaseVisitNote[];
}

export interface NewCasePayload {
    title: string;
    category: CaseCategory;
}

export interface NewVisitNotePayload {
    chief_complaint?: string;
    examination_findings?: string;
    diagnosis?: string;
    procedure_performed?: string;
    complications?: string;
    outcome_notes?: string;
    next_appointment_notes?: string;
    doctor: number;
    assistant?: number;
    materials_used?: { material_name: string; batch_number?: string; quantity?: number; unit?: string }[];
}