import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types/auth.types";
import * as authApi from "../api/authApi";


// Definition of AuthContextType interface with proper comment
interface AuthContextType {
  user: User | null; // Current authenticated user info
  loading: boolean; // Loading state while fetching user profile
  login: (username: string, password: string) => Promise<void>; // Function to log in user
  logout: () => void; // Function to log out user
  refreshUser: () => Promise<void>; // Function to reload user details
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details from API
  const fetchProfile = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user profile on startup", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Check for stored token and fetch user on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      // Save tokens to localStorage
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      
      // Fetch user profile immediately upon successful login
      const profileRes = await authApi.getMe();
      setUser(profileRes.data);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  // Refresh user profile details manually
  const refreshUser = async () => {
    try {
      const profileRes = await authApi.getMe();
      setUser(profileRes.data);
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
