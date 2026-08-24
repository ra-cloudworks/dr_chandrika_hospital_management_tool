export type MediaType = "photo" | "xray" | "document";

export interface MediaFile {
    id: number;
    patient: number;
    case: number | null;
    tooth_number: string;
    media_type: MediaType;
    category: string;
    file: string;   // relative URL — needs the backend host prefixed to display
    caption: string;
    version_number: number;
    previous_version: number | null;
    is_current: boolean;
    uploaded_by_name: string;
    uploaded_at: string;
}