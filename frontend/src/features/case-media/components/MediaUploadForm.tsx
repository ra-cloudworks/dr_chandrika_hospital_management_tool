import { useState } from "react";
import type { MediaType } from "../../../types/caseMedia.types";

interface Props {
    onUpload: (formData: FormData) => void;
    uploading: boolean;
}

export function MediaUploadForm({ onUpload, uploading }: Props) {
    const [mediaType, setMediaType] = useState<MediaType>("photo");
    const [category, setCategory] = useState("");
    const [caption, setCaption] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = () => {
        if (!file) return;
        const formData = new FormData();
        formData.append("media_type", mediaType);
        formData.append("category", category);
        formData.append("caption", caption);
        formData.append("file", file);
        onUpload(formData);
        setFile(null);
        setCaption("");
    };

    return (
        <div className="border rounded-lg p-4 mb-4 space-y-2">
            <div className="flex gap-2">
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)}
                    className="border rounded px-3 py-2">
                    <option value="photo">Clinical Photo</option>
                    <option value="xray">X-Ray / Scan</option>
                    <option value="document">Document</option>
                </select>
                <input placeholder="Category (e.g. opg, before, consent_form)" value={category}
                    onChange={(e) => setCategory(e.target.value)} className="border rounded px-3 py-2 flex-1" />
            </div>
            <input placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)}
                className="border rounded px-3 py-2 w-full" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full" />
            <button onClick={handleSubmit} disabled={uploading || !file}
                className="bg-teal-600 text-white px-4 py-2 rounded disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload"}
            </button>
        </div>
    );
}