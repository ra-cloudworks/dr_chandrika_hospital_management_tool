import { useState } from "react";
import type { MedicalHistoryEntry } from "../../../types/patient.types";
import { addMedicalHistory } from "../../../api/patientApi";
import { useAuth } from "../../../context/AuthContext";

interface Props {
  patientId: number;
  history: MedicalHistoryEntry[];
  onAdded: () => void;
}

const CAN_EDIT = ["chief_doctor", "doctor", "assistant"];

export function MedicalHistoryTab({ patientId, history, onAdded }: Props) {
  const { user } = useAuth();
  const [condition, setCondition] = useState("");
  const canEdit = user && CAN_EDIT.includes(user.role);

  const handleAdd = async () => {
    if (!condition.trim()) return;
    await addMedicalHistory(patientId, { condition_name: condition });
    setCondition("");
    onAdded();
  };

  return (
    <div>
      {canEdit && (
        <div className="flex gap-2 mb-4">
          <input value={condition} onChange={(e) => setCondition(e.target.value)}
            placeholder="Add condition (e.g. Diabetes)" className="border rounded px-3 py-2 flex-1" />
          <button onClick={handleAdd} className="bg-teal-600 text-white px-4 py-2 rounded">Add</button>
        </div>
      )}
      <ul className="space-y-2">
        {history.map((h) => (
          <li key={h.id} className="border rounded p-3">
            <div className="font-medium">{h.condition_name}</div>
            <div className="text-sm text-gray-500">
              {h.diagnosed_date || "Date unknown"} — recorded by {h.recorded_by_name}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}