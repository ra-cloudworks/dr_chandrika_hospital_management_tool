import { useState, useEffect } from "react";
import { listEquipment } from "../../../api/inventoryApi";
import type { Equipment } from "../../../types/inventory.types";

interface EquipmentTableProps {
  onSelectEquipment: (eq: Equipment) => void;
  refreshTrigger?: number;
}

export function EquipmentTable({ onSelectEquipment, refreshTrigger }: EquipmentTableProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEquipment();
  }, [refreshTrigger]);

  const fetchEquipment = () => {
    setLoading(true);
    listEquipment()
      .then((res) => setEquipmentList(res.data))
      .catch((err) => console.error("Error fetching equipment:", err))
      .finally(() => setLoading(false));
  };

  const filtered = equipmentList.filter((eq) =>
    eq.name.toLowerCase().includes(search.toLowerCase()) ||
    eq.equipment_code.toLowerCase().includes(search.toLowerCase()) ||
    eq.location.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Active</span>;
      case "under_maintenance":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">Under Maintenance</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300">Decommissioned</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search equipment by name, code, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-secondary">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
          <p className="text-xs mt-2">Loading clinic equipment...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-secondary text-[40px]">precision_manufacturing</span>
          <p className="text-sm font-medium text-on-surface mt-2">No equipment records found</p>
          <p className="text-xs text-secondary">Register clinic assets such as autoclaves, X-ray units, or compressors.</p>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-secondary border-b border-outline-variant font-medium">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Equipment Name</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Warranty Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-on-surface cursor-pointer">
                {filtered.map((eq) => (
                  <tr
                    key={eq.id}
                    onClick={() => onSelectEquipment(eq)}
                    className="hover:bg-surface-container-low/70 transition-colors"
                  >
                    <td className="p-3.5 font-mono font-medium">{eq.equipment_code}</td>
                    <td className="p-3.5 font-semibold text-on-surface">{eq.name}</td>
                    <td className="p-3.5">{getStatusBadge(eq.status)}</td>
                    <td className="p-3.5 text-secondary">{eq.location || "Unassigned"}</td>
                    <td className="p-3.5 font-mono text-secondary">{eq.warranty_expiry || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
