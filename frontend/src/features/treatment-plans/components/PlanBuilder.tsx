import { useState } from "react";
import type { NewPlanPayload, NewItemPayload, ItemPhase } from "../../../types/treatmentPlan.types";

interface Props {
    onCreatePlan: (data: NewPlanPayload) => Promise<number>; // returns new plan id
    onAddItem: (planId: number, data: NewItemPayload) => void;
}

export function PlanBuilder({ onCreatePlan, onAddItem }: Props) {
    const [title, setTitle] = useState("");
    const [complaint, setComplaint] = useState("");
    const [activePlanId, setActivePlanId] = useState<number | null>(null);

    const [toothNumber, setToothNumber] = useState("");
    const [procedure, setProcedure] = useState("");
    const [phase, setPhase] = useState<ItemPhase>("restorative");
    const [basePrice, setBasePrice] = useState(0);

    const handleCreatePlan = async () => {
        if (!title.trim()) return;
        const id = await onCreatePlan({ title, chief_complaint: complaint });
        setActivePlanId(id);
    };

    const handleAddItem = () => {
        if (!activePlanId || !procedure.trim()) return;
        onAddItem(activePlanId, {
            tooth_number: toothNumber, procedure_name: procedure, phase, visit_sequence: 1, base_price: basePrice,
        });
        setToothNumber("");
        setProcedure("");
        setBasePrice(0);
    };

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">New Treatment Plan</h3>
            {!activePlanId ? (
                <>
                    <input placeholder="Plan title" value={title} onChange={(e) => setTitle(e.target.value)}
                        className="border rounded px-3 py-2 w-full" />
                    <textarea placeholder="Chief complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)}
                        className="border rounded px-3 py-2 w-full" />
                    <button onClick={handleCreatePlan} className="bg-teal-600 text-white px-4 py-2 rounded">
                        Start Plan
                    </button>
                </>
            ) : (
                <>
                    <p className="text-sm text-gray-500">Add items to the plan you just created:</p>
                    <div className="flex gap-2 flex-wrap">
                        <input placeholder="Tooth #" value={toothNumber} onChange={(e) => setToothNumber(e.target.value)}
                            className="border rounded px-3 py-2 w-24" />
                        <input placeholder="Procedure name" value={procedure} onChange={(e) => setProcedure(e.target.value)}
                            className="border rounded px-3 py-2 flex-1" />
                        <select value={phase} onChange={(e) => setPhase(e.target.value as ItemPhase)}
                            className="border rounded px-3 py-2">
                            <option value="urgent">Urgent</option>
                            <option value="preventive">Preventive</option>
                            <option value="restorative">Restorative</option>
                            <option value="cosmetic">Cosmetic</option>
                        </select>
                        <input type="number" placeholder="Base price" value={basePrice}
                            onChange={(e) => setBasePrice(Number(e.target.value))} className="border rounded px-3 py-2 w-32" />
                        <button onClick={handleAddItem} className="bg-teal-600 text-white px-3 py-2 rounded">Add Item</button>
                    </div>
                </>
            )}
        </div>
    );
}