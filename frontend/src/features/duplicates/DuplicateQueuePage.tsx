import { useEffect, useState } from "react";
import { listDuplicateFlags, dismissFlag, mergePatients, scanForDuplicates } from "../../api/duplicateApi";
import type { DuplicateFlag, MergePayload } from "../../types/duplicate.types";
import { DuplicateFlagCard } from "./components/DuplicateFlagCard";
import { CompareMergeModal } from "./components/CompareMergeModal";
import { useAuth } from "../../context/AuthContext";

export function DuplicateQueuePage() {
    const { user } = useAuth();
    const [flags, setFlags] = useState<DuplicateFlag[]>([]);
    const [activeFlag, setActiveFlag] = useState<DuplicateFlag | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [scanning, setScanning] = useState(false);

    const load = () => listDuplicateFlags().then((res) => setFlags(res.data));

    useEffect(() => {
        load();
    }, []);

    const handleScan = async () => {
        setScanning(true);
        try {
            const res = await scanForDuplicates();
            await load();
            alert(res.data.message);
        } catch (err) {
            alert("Scan failed — check permissions.");
        } finally {
            setScanning(false);
        }
    };

    const handleDismiss = async (id: number) => {
        await dismissFlag(id);
        load();
    };

    const handleMerge = async (payload: MergePayload) => {
        setSubmitting(true);
        try {
            await mergePatients(payload);
            setActiveFlag(null);
            load();
        } catch (err) {
            alert("Merge failed — check field resolutions.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">Duplicate Patient Queue</h1>
                {user?.role === "chief_doctor" && (
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="bg-teal-600 text-white px-4 py-2 rounded"
                    >
                        {scanning ? "Scanning..." : "Scan for Duplicates"}
                    </button>
                )}
            </div>

            {flags.length === 0 ? (
                <p className="text-gray-500">No pending duplicates flagged.</p>
            ) : (
                <div className="space-y-3">
                    {flags.map((flag) => (
                        <DuplicateFlagCard key={flag.id} flag={flag} onReview={setActiveFlag} onDismiss={handleDismiss} />
                    ))}
                </div>
            )}
            {activeFlag && (
                <CompareMergeModal
                    flag={activeFlag}
                    onClose={() => setActiveFlag(null)}
                    onMerge={handleMerge}
                    submitting={submitting}
                />
            )}
        </div>
    );
}