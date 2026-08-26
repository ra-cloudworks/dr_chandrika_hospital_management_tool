// api/authApi.ts
import { apiClient } from "./client";
import type { User, LoginHistoryEntry } from "../types/auth.types";


export const login = (username: string, password: string) =>
  apiClient.post("/auth/login/", { username, password });

export const getMe = () => apiClient.get<User>("/auth/me/");

export const updateMe = (data: Partial<User>) =>
  apiClient.patch<User>("/auth/me/", data);

export const listStaff = () => apiClient.get<User[]>("/auth/staff/");

export const createStaff = (data: Partial<User> & { password: string }) =>
  apiClient.post("/auth/staff/", data);

export const listLoginHistory = () =>
  apiClient.get<LoginHistoryEntry[]>("/auth/login-history/");