// types/auth.types.ts
export type Role = "chief_doctor" | "doctor" | "assistant" | "receptionist" | "accountant" | "patient";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone: string | null;
  status: "active" | "inactive";
  mfa_enabled: boolean;
  biometric_enabled: boolean;
}

export interface LoginHistoryEntry {
  id: number;
  ip_address: string;
  device_info: string;
  login_at: string;
  status: string;
}
