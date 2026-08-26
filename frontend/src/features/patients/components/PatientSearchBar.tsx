interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function PatientSearchBar({ value, onChange }: Props) {
  return (
    <input
      type="text"
      placeholder="Search by name, phone, or patient ID..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2 w-80"
    />
  );
}