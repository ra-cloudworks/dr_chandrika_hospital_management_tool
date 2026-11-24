import type { PatientListItem } from "../../../types/patient.types";
import { useNavigate } from "react-router-dom";

interface Props {
  patients: PatientListItem[];
}

export function PatientTable({ patients }: Props) {
  const navigate = useNavigate();

  return (
    /* Outer container with horizontal overflow scrolling to ensure layout responsiveness across all device sizes */
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
      <table className="w-full border-collapse text-left text-sm text-gray-700">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
          <tr>
            <th className="py-3 px-4">Patient ID</th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Phone</th>
            <th className="py-3 px-4">Gender</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Registered By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {patients.map((p) => (
            /* Navigate to patient details page when clicking anywhere on the entire table row */
            <tr
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className="hover:bg-teal-50/50 cursor-pointer transition-colors duration-150"
            >
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.patient_code}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-teal-700 font-medium hover:underline">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.no_show_count > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                      {p.no_show_count} {p.no_show_count === 1 ? "no-show" : "no-shows"}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">{p.phone}</td>
              <td className="py-3 px-4 capitalize">{p.gender || "-"}</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{p.registered_by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}