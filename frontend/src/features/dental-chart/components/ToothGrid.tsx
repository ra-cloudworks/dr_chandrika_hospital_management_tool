import type { ToothRecord, ToothStatus } from "../../../types/dentalChart.types";

// FDI notation: upper-right, upper-left, lower-left, lower-right
const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"];
const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"];
const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"];

const STATUS_COLORS: Record<ToothStatus, string> = {
    existing: "bg-gray-300",
    planned: "bg-amber-300",
    completed: "bg-green-400",
    rejected: "bg-red-300",
};

interface Props {
    records: ToothRecord[];
    onToothClick: (toothNumber: string) => void;
}

export function ToothGrid({ records, onToothClick }: Props) {
    const recordFor = (toothNumber: string) =>
        records.find((r) => r.tooth_number === toothNumber);

    const renderRow = (numbers: string[]) => (
        <div className="flex gap-1">
            {numbers.map((num) => {
                const record = recordFor(num);
                const color = record ? STATUS_COLORS[record.status] : "bg-white border";
                return (
                    <button
                        key={num}
                        onClick={() => onToothClick(num)}
                        className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium ${color}`}
                        title={record ? `${record.condition} (${record.status})` : "No record"}
                    >
                        {num}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-1">
            <div className="flex justify-center gap-1">
                {renderRow(UPPER_RIGHT)}
                {renderRow(UPPER_LEFT)}
            </div>
            <div className="flex justify-center gap-1">
                {renderRow(LOWER_RIGHT)}
                {renderRow(LOWER_LEFT)}
            </div>
            <div className="flex gap-4 mt-3 text-xs">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded ${color}`} />
                        <span className="capitalize">{status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}