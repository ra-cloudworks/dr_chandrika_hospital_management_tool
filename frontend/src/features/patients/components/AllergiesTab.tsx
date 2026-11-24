import { useState } from "react";
import type { Allergy } from "../../../types/patient.types";
import { addAllergy } from "../../../api/patientApi";
import { useAuth } from "../../../context/AuthContext";

interface Props {
  patientId: number;
  allergies: Allergy[];
  onAdded: () => void;
}

const CAN_EDIT = ["chief_doctor", "doctor", "assistant"];

export function AllergiesTab({ patientId, allergies, onAdded }: Props) {
  const { user } = useAuth();
  const [allergen, setAllergen] = useState("");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [loading, setLoading] = useState(false);

  const canEdit = user && CAN_EDIT.includes(user.role);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergen.trim()) return;
    setLoading(true);
    try {
      await addAllergy(patientId, { allergen: allergen.trim(), reaction: reaction.trim(), severity });
      setAllergen("");
      setReaction("");
      setSeverity("mild");
      onAdded();
    } finally {
      setLoading(false);
    }
  };

  /* Helper function to style severity badges */
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "severe":
        return "bg-red-100 text-red-800 border-red-200";
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Interactive form for clinical staff to record new patient allergies */}
      {canEdit && (
        <form onSubmit={handleAdd} className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Record New Allergy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="Allergen (e.g. Penicillin, Latex)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              required
            />
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Reaction (e.g. Skin Rash, Swelling)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as "mild" | "moderate" | "severe")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            {loading ? "Adding..." : "+ Add Allergy"}
          </button>
        </form>
      )}

      {/* List of recorded patient allergies with empty state fallback */}
      {allergies.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 text-sm">
          No known allergies recorded for this patient.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allergies.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{a.allergen}</h4>
                {a.reaction && <p className="text-xs text-gray-600 mt-1">Reaction: {a.reaction}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getSeverityBadgeClass(a.severity)}`}>
                {a.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
