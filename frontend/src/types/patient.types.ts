export interface Guardian {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  id_proof_type: string;
  id_proof_number: string;
}

export interface MedicalHistoryEntry {
  id: number;
  condition_name: string;
  diagnosed_date: string | null;
  notes: string;
  is_active: boolean;
  recorded_by_name: string;
  created_at: string;
}

export interface Allergy {
  id: number;
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
}

export interface PatientListItem {
  id: number;
  patient_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  dob: string | null;
  gender: string;
  status: "active" | "inactive" | "merged";
  registered_by_name: string;
  created_at: string;
}

export interface PatientDetail extends PatientListItem {
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  preferred_language: string;
  photo: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  referral_source: string;
  abha_id: string | null;
  guardians: Guardian[];
  medical_history: MedicalHistoryEntry[];
  allergies: Allergy[];
}

export interface NewPatientPayload {
  first_name: string;
  last_name: string;
  dob?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}