import { apiClient } from "./client";
import type { DuplicateFlag, MergePayload, MergeLogEntry } from "../types/duplicate.types";

export const listDuplicateFlags = () =>
    apiClient.get<DuplicateFlag[]>("/duplicates/flags/");

export const dismissFlag = (flagId: number) =>
    apiClient.patch(`/duplicates/flags/${flagId}/dismiss/`);

export const mergePatients = (payload: MergePayload) =>
    apiClient.post("/duplicates/merge/", payload);

export const listMergeHistory = () =>
    apiClient.get<MergeLogEntry[]>("/duplicates/merge-history/");

export const scanForDuplicates = () =>
  apiClient.post<{ message: string; pending_flags: number }>("/duplicates/scan/");