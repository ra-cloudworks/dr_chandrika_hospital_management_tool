import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import * as authApi from "../../api/authApi";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Initialize form fields with user data
  useEffect(() => {
    if (user) {
      setFullName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setMfaEnabled(user.mfa_enabled || false);
      setBiometricEnabled(user.biometric_enabled || false);
    }
  }, [user]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await authApi.updateMe({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        mfa_enabled: mfaEnabled,
        biometric_enabled: biometricEnabled,
      });

      // Reload user profile in context
      await refreshUser();
      setMessage("Profile changes saved successfully!");
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setError("Failed to save changes. Please make sure the phone number is unique and correct.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (!user) return "CD";
    const first = user.first_name ? user.first_name[0] : "";
    const last = user.last_name ? user.last_name[0] : user.username[0];
    return (first + last).toUpperCase();
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      
      {/* Alert Banners */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg text-body-md text-center flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-error-container/30 border border-error-container text-error rounded-lg text-body-md text-center flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveChanges}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Avatar & Photo Actions */}
          <div className="lg:col-span-4 flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-outline-variant/30">
            <div className="relative group cursor-pointer">
              <div className="w-48 h-48 rounded-full border-4 border-surface-container shadow-md flex items-center justify-center bg-primary text-white text-5xl font-bold">
                {getInitials()}
              </div>
              <div className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full shadow-lg">
                <span className="material-symbols-outlined text-sm">edit</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {user.first_name} {user.last_name}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {formatRole(user.role)}
              </p>
            </div>
            
            <button
              type="button"
              className="mt-8 w-full py-2.5 px-4 bg-white border border-primary text-primary font-label-md text-label-md rounded-lg hover:bg-primary/5 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">upload</span>
              <span>Upload photo</span>
            </button>
            <p className="mt-4 font-body-sm text-body-sm text-on-surface-variant text-center">
              Allowed formats: JPG, PNG. Max size: 2MB
            </p>
          </div>

          {/* Right Column: Form Inputs & Security Options */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Personal Information Section */}
            <section className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Personal Information</h3>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Full Name</label>
                  <input
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Email Address</label>
                  <input
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Phone Number</label>
                  <input
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                    type="tel"
                    value={phone}
                    placeholder="+91 XXXXX XXXXX"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Role (Read Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">System Role</label>
                  <div className="px-4 py-2.5 bg-surface-container rounded-lg border border-transparent flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                    <span className="text-body-md font-medium text-on-surface-variant">
                      {formatRole(user.role)}
                    </span>
                  </div>
                </div>

                {/* Status (Read Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Account Status</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 rounded-lg border border-primary/20 w-fit">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-body-md font-semibold text-primary capitalize">{user.status}</span>
                  </div>
                </div>

              </div>
            </section>

            {/* Security Settings Section */}
            <section className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30">
              <div className="mb-8">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Security & Privacy</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Manage your account protection and authentication preferences.</p>
              </div>
              
              <div className="space-y-6">
                
                {/* MFA Toggle */}
                <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
                  <div className="flex gap-4 items-center">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined">phonelink_lock</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">Enable Multi-Factor Authentication (MFA)</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Adds an extra layer of security to your login.</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="checkbox"
                      checked={mfaEnabled}
                      onChange={(e) => setMfaEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Biometric Toggle */}
                <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
                  <div className="flex gap-4 items-center">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined">fingerprint</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">Enable Biometric Login</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Use fingerprint or face recognition for faster access.</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="checkbox"
                      checked={biometricEnabled}
                      onChange={(e) => setBiometricEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Password Action */}
                <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">Password</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Manage your system password credentials</p>
                  </div>
                  <button
                    type="button"
                    className="py-2 px-6 bg-primary text-white font-label-md text-label-md rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    <span>Change Password</span>
                  </button>
                </div>

              </div>
            </section>

          </div>

        </div>
      </form>
      
      {/* Footer Info */}
      <footer className="mt-12 text-center text-on-surface-variant">
        <p className="font-body-sm text-body-sm">Active session logs registered under HIPAA medical compliance standards.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a className="text-primary hover:underline font-label-sm text-label-sm" href="#">Privacy Policy</a>
          <span className="text-outline-variant">•</span>
          <a className="text-primary hover:underline font-label-sm text-label-sm" href="#">Security Audit Log</a>
        </div>
      </footer>

    </div>
  );
}
