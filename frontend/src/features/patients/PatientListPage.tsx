import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPatients } from "../../api/patientApi";
import type { PatientListItem } from "../../types/patient.types";
import { PatientTable } from "./components/PatientTable";
import { PatientSearchBar } from "./components/PatientSearchBar";

export function PatientListPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Link to="/patients/new" className="bg-teal-600 text-white px-4 py-2 rounded">
          + New Patient
        </Link>
      </div>
      <PatientSearchBar value={search} onChange={setSearch} />
      {loading ? <p className="mt-4">Loading...</p> : <PatientTable patients={patients} />}
    </div>
  );
}