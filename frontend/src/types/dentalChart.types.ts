export type DentitionType = "adult" | "primary";
export type ToothSurface = "mesial" | "distal" | "occlusal" | "buccal" | "lingual" | "incisal" | "whole";
export type ToothCondition =
    | "decay" | "filling" | "crown" | "bridge" | "implant" | "rct" | "missing"
    | "impacted" | "unerupted" | "supernumerary" | "fracture" | "mobility" | "sensitivity" | "healthy";
export type ToothStatus = "existing" | "planned" | "completed" | "rejected";

export interface ToothHistoryEntry {
    id: number;
    changed_field: string;
    old_value: string;
    new_value: string;
    changed_by_name: string;
    changed_at: string;
}

export interface EndodonticDetail {
    id: number;
    working_length_mm: number | null;
    canal_count: number | null;
    obturation_date: string | null;
    technique_notes: string;
}

export interface ImplantDetail {
    id: number;
    brand: string;
    diameter_mm: number | null;
    length_mm: number | null;
    batch_number: string;
    serial_number: string;
    placement_date: string | null;
    bone_graft_material: string;
    expiry_date: string | null;
    warranty_months: number | null;
}

export interface OrthodonticDetail {
    id: number;
    appliance_type: string;
    bracket_type: string;
    wire_size: string;
    position_notes: string;
    adjustment_date: string | null;
}

export interface ToothRecord {
    id: number;
    patient: number;
    dentition_type: DentitionType;
    tooth_number: string;
    surface: ToothSurface;
    condition: ToothCondition;
    status: ToothStatus;
    notes: string;
    recorded_by_name: string;
    recorded_at: string;
    updated_at: string;
    endodontic_detail: EndodonticDetail | null;
    implant_detail: ImplantDetail | null;
    orthodontic_detail: OrthodonticDetail | null;
    history: ToothHistoryEntry[];
}

export interface NewToothRecordPayload {
    tooth_number: string;
    dentition_type: DentitionType;
    surface: ToothSurface;
    condition: ToothCondition;
    status: ToothStatus;
    notes?: string;
}