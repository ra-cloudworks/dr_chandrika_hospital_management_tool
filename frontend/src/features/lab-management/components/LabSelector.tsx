// LabSelector component for reusable laboratory dropdown selection
import { useEffect, useState } from "react";
import { listLabs } from "../../../api/labManagementApi";
import type { DentalLab } from "../../../types/labManagement.types";

interface LabSelectorProps {
  value: number | null | undefined;
  onChange: (labId: number | null) => void;
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function LabSelector({
  value,
  onChange,
  allowAll = false,
  allLabel = "All Dental Labs",
  className = "",
  disabled = false,
}: LabSelectorProps) {
  const [labs, setLabs] = useState<DentalLab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLabs()
      .then((res) => setLabs(res.data.filter((l) => l.is_active)))
      .catch(() => setLabs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
      disabled={disabled || loading}
      className={`w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${className}`}
    >
      {allowAll && <option value="">{allLabel}</option>}
      {!allowAll && !value && <option value="">-- Select Dental Lab --</option>}
      {labs.map((lab) => (
        <option key={lab.id} value={lab.id}>
          {lab.name} {lab.phone ? `(${lab.phone})` : ""}
        </option>
      ))}
    </select>
  );
}
