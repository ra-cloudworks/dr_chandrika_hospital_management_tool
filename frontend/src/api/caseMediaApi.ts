import { apiClient } from "./client";
import type { MediaFile } from "../types/caseMedia.types";

// File URLs from the backend are relative (e.g. "/media/..."), and MEDIA_URL
// isn't under /api like the rest of your endpoints — so this needs its own base.
export const MEDIA_HOST = "http://127.0.0.1:8000";

export const listMedia = (patientId: number, mediaType?: string) =>
    apiClient.get<MediaFile[]>(`/case-media/${patientId}/`, { params: { media_type: mediaType } });

export const uploadMedia = (patientId: number, formData: FormData) =>
    // Do NOT set a Content-Type header manually here — axios sets the correct
    // multipart boundary automatically when it sees a FormData object.
    // Setting it yourself breaks the upload.
    apiClient.post<MediaFile>(`/case-media/${patientId}/`, formData);

export const uploadNewVersion = (mediaId: number, formData: FormData) =>
    apiClient.post<MediaFile>(`/case-media/file/${mediaId}/new-version/`, formData);

export const softDeleteMedia = (mediaId: number, reason: string) =>
    apiClient.post<MediaFile>(`/case-media/file/${mediaId}/delete/`, { reason });