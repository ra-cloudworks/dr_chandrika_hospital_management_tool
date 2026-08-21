export type PerioSite = "mesiobuccal" | "buccal" | "distobuccal" | "mesiolingual" | "lingual" | "distolingual";

export interface PerioSiteReading {
    site: PerioSite;
    pocket_depth_mm: number;
    recession_mm: number;
    bleeding_on_probing: boolean;
    suppuration: boolean;
}

export interface PerioToothMeasurement {
    tooth_number: string;
    mobility_grade: number;
    furcation_grade: number;
    plaque_present: boolean;
    calculus_present: boolean;
    site_readings: PerioSiteReading[];
}

export interface PerioExam {
    id: number;
    patient: number;
    exam_date: string;
    diagnosis_summary: string;
    performed_by_name: string;
    created_at: string;
    tooth_measurements: PerioToothMeasurement[];
}

export interface NewPerioExamPayload {
    diagnosis_summary: string;
    tooth_measurements: PerioToothMeasurement[];
}