import type { MediaFile } from "../../../types/caseMedia.types";
import { MEDIA_HOST } from "../../../api/caseMediaApi";
import { useAuth } from "../../../context/AuthContext";

interface Props {
    files: MediaFile[];
    onDelete: (id: number, reason: string) => void;
}

export function MediaGallery({ files, onDelete }: Props) {
    const { user } = useAuth();

    if (files.length === 0) return <p className="text-gray-500 text-sm">No files uploaded yet.</p>;

    return (
        <div className="grid grid-cols-3 gap-3">
            {files.map((f) => (
                <div key={f.id} className="border rounded p-2">
                    {f.media_type !== "document" ? (
                        <img src={`${MEDIA_HOST}${f.file}`} alt={f.caption} className="w-full h-32 object-cover rounded" />
                    ) : (
                        <a href={`${MEDIA_HOST}${f.file}`} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center h-32 bg-gray-50 rounded text-sm text-teal-600 underline">
                            View Document
                        </a>
                    )}
                    <p className="text-xs mt-1 font-medium">{f.caption || f.category}</p>
                    <p className="text-xs text-gray-400">v{f.version_number} · {f.uploaded_by_name}</p>
                    {user?.role === "chief_doctor" && (
                        <button
                            onClick={() => {
                                const reason = prompt("Reason for removing this file:");
                                if (reason) onDelete(f.id, reason);
                            }}
                            className="text-xs text-red-500 mt-1"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}