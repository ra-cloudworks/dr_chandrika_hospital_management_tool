import { useState } from "react";
import type { NewPatientPayload } from "../../../types/patient.types";

interface Props {
  onSubmit: (data: NewPatientPayload) => void;
  submitting: boolean;
}

export function PatientForm({ onSubmit, submitting }: Props) {
  const [form, setForm] = useState<NewPatientPayload>({ first_name: "", last_name: "" });

  const update = (field: keyof NewPatientPayload, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4 max-w-lg"
    >
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="First name" value={form.first_name}
          onChange={(e) => update("first_name", e.target.value)} className="border rounded px-3 py-2" />
        <input placeholder="Last name" value={form.last_name}
          onChange={(e) => update("last_name", e.target.value)} className="border rounded px-3 py-2" />
      </div>
      <input placeholder="Phone" value={form.phone || ""}
        onChange={(e) => update("phone", e.target.value)} className="border rounded px-3 py-2 w-full" />
      <input type="email" placeholder="Email" value={form.email || ""}
        onChange={(e) => update("email", e.target.value)} className="border rounded px-3 py-2 w-full" />
      <input type="date" value={form.dob || ""}
        onChange={(e) => update("dob", e.target.value)} className="border rounded px-3 py-2 w-full" />
      <select value={form.gender || ""} onChange={(e) => update("gender", e.target.value)}
        className="border rounded px-3 py-2 w-full">
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <textarea placeholder="Address" value={form.address || ""}
        onChange={(e) => update("address", e.target.value)} className="border rounded px-3 py-2 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Emergency contact name" value={form.emergency_contact_name || ""}
          onChange={(e) => update("emergency_contact_name", e.target.value)} className="border rounded px-3 py-2" />
        <input placeholder="Emergency contact phone" value={form.emergency_contact_phone || ""}
          onChange={(e) => update("emergency_contact_phone", e.target.value)} className="border rounded px-3 py-2" />
      </div>
      <button type="submit" disabled={submitting} className="bg-teal-600 text-white px-4 py-2 rounded">
        {submitting ? "Saving..." : "Register Patient"}
      </button>
    </form>
  );
}