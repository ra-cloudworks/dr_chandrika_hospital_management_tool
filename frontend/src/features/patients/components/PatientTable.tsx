import type { PatientListItem } from "../../../types/patient.types";
import { Link } from "react-router-dom";

interface Props {
  patients: PatientListItem[];
}

export function PatientTable({ patients }: Props) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">Patient ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Gender</th>
          <th>Status</th>
          <th>Registered By</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p) => (
          <tr key={p.id} className="border-b hover:bg-gray-50">
            <td className="py-2">{p.patient_code}</td>
            <td>
              <Link to={`/patients/${p.id}`} className="text-teal-600 hover:underline">
                {p.first_name} {p.last_name}
              </Link>
            </td>
            <td>{p.phone}</td>
            <td>{p.gender}</td>
            <td>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {p.status}
              </span>
            </td>
            <td>{p.registered_by_name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}