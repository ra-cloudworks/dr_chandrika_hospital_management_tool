import { useState } from "react";
import type { PerioToothMeasurement, PerioSite, PerioSiteReading } from "../../../types/perioChart.types";

const SITES: PerioSite[] = ["mesiobuccal", "buccal", "distobuccal", "mesiolingual", "lingual", "distolingual"];

const emptySites = (): PerioSiteReading[] =>
    SITES.map((site) => ({ site, pocket_depth_mm: 2, recession_mm: 0, bleeding_on_probing: false, suppuration: false }));

interface Props {
    onAdd: (tooth: PerioToothMeasurement) => void;
}

export function PerioToothEntry({ onAdd }: Props) {
    const [toothNumber, setToothNumber] = useState("");
    const [mobility, setMobility] = useState(0);
    const [furcation, setFurcation] = useState(0);
    const [plaque, setPlaque] = useState(false);
    const [calculus, setCalculus] = useState(false);
    const [sites, setSites] = useState<PerioSiteReading[]>(emptySites());

    const updateSite = (index: number, field: keyof PerioSiteReading, value: string | boolean) => {
        setSites((prev) =>
            prev.map((s, i) => (i === index ? { ...s, [field]: typeof value === "boolean" ? value : Number(value) } : s))
        );
    };

    const handleAdd = () => {
        if (!toothNumber.trim()) return;
        onAdd({
            tooth_number: toothNumber, mobility_grade: mobility, furcation_grade: furcation,
            plaque_present: plaque, calculus_present: calculus, site_readings: sites,
        });
        setToothNumber("");
        setMobility(0);
        setFurcation(0);
        setPlaque(false);
        setCalculus(false);
        setSites(emptySites());
    };

    return (
        <div className="border rounded-lg p-4 mb-4">
            <div className="flex gap-3 mb-3 items-center">
                <input placeholder="Tooth (e.g. 36)" value={toothNumber}
                    onChange={(e) => setToothNumber(e.target.value)} className="border rounded px-3 py-2 w-32" />
                <label className="text-sm">Mobility
                    <select value={mobility} onChange={(e) => setMobility(Number(e.target.value))} className="border rounded px-2 py-1 ml-1">
                        {[0, 1, 2, 3].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                </label>
                <label className="text-sm">Furcation
                    <select value={furcation} onChange={(e) => setFurcation(Number(e.target.value))} className="border rounded px-2 py-1 ml-1">
                        {[0, 1, 2, 3].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                </label>
                <label className="text-sm flex items-center gap-1">
                    <input type="checkbox" checked={plaque} onChange={(e) => setPlaque(e.target.checked)} /> Plaque
                </label>
                <label className="text-sm flex items-center gap-1">
                    <input type="checkbox" checked={calculus} onChange={(e) => setCalculus(e.target.checked)} /> Calculus
                </label>
            </div>

            <table className="w-full text-xs">
                <thead>
                    <tr className="text-left border-b">
                        <th className="py-1">Site</th>
                        <th>Pocket depth (mm)</th>
                        <th>Recession (mm)</th>
                        <th>Bleeding</th>
                        <th>Suppuration</th>
                    </tr>
                </thead>
                <tbody>
                    {sites.map((s, i) => (
                        <tr key={s.site} className="border-b">
                            <td className="py-1 capitalize">{s.site}</td>
                            <td><input type="number" value={s.pocket_depth_mm} onChange={(e) => updateSite(i, "pocket_depth_mm", e.target.value)}
                                className="border rounded px-2 py-1 w-16" /></td>
                            <td><input type="number" value={s.recession_mm} onChange={(e) => updateSite(i, "recession_mm", e.target.value)}
                                className="border rounded px-2 py-1 w-16" /></td>
                            <td><input type="checkbox" checked={s.bleeding_on_probing} onChange={(e) => updateSite(i, "bleeding_on_probing", e.target.checked)} /></td>
                            <td><input type="checkbox" checked={s.suppuration} onChange={(e) => updateSite(i, "suppuration", e.target.checked)} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button onClick={handleAdd} className="mt-3 bg-teal-600 text-white px-3 py-1.5 rounded text-sm">
                Add Tooth to Exam
            </button>
        </div>
    );
}