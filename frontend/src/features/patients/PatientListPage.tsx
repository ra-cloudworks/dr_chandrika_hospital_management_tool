import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listPatients } from "../../api/patientApi";
import { listDuplicateFlags } from "../../api/duplicateApi";
import { useAuth } from "../../context/AuthContext";
import type { PatientListItem } from "../../types/patient.types";
import { PatientTable } from "./components/PatientTable";
import { PatientSearchBar } from "./components/PatientSearchBar";

export function PatientListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // Store count of pending duplicate flags to conditionally enable the Resolve Duplicates button
  const [pendingFlagsCount, setPendingFlagsCount] = useState<number>(0);

  // Check if current logged-in user role is permitted to create patients and resolve duplicates
  const canCreatePatient = user?.role === "chief_doctor" || user?.role === "receptionist";

  useEffect(() => {
    // Fetch pending duplicate flags if user has permission to create patients / resolve duplicates
    if (canCreatePatient) {
      listDuplicateFlags()
        .then((res) => setPendingFlagsCount(res.data.length))
        .catch(() => setPendingFlagsCount(0));
    }
  }, [canCreatePatient]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      listPatients(search)
        .then((res) => setPatients(res.data))
        .finally(() => setLoading(false));
    }, 300); // debounce search input
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Responsive header layout supporting mobile and desktop screens */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
        
        {/* Action buttons for patient creation and duplicate resolution */}
        <div className="flex flex-wrap items-center gap-3">
          {canCreatePatient && (
            <button
              onClick={() => navigate("/duplicates")}
              disabled={pendingFlagsCount === 0}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                pendingFlagsCount > 0
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
              }`}
            >
              Resolve Duplicates {pendingFlagsCount > 0 ? `(${pendingFlagsCount})` : ""}
            </button>
          )}
          <Link
            to="/patients/new"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors"
          >
            + New Patient
          </Link>
        </div>
      </div>

      <PatientSearchBar value={search} onChange={setSearch} />
      {loading ? <p className="mt-4 text-gray-500">Loading...</p> : <PatientTable patients={patients} />}
    </div>
  );
}