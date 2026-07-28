import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import * as authApi from "../../api/authApi";
import type { User, Role } from "../../types/auth.types";


const ROLE_OPTIONS = [
  { value: "chief_doctor", label: "Chief Doctor" },
  { value: "doctor", label: "Doctor" },
  { value: "assistant", label: "Assistant" },
  { value: "receptionist", label: "Receptionist" },
  { value: "accountant", label: "Accountant" },
];

export default function StaffListPage() {
  const { user: currentUser } = useAuth();
  
  // Data State
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  // Add Staff Panel Drawer State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [tempPassword, setTempPassword] = useState("Initial@123");
  const [showPassword, setShowPassword] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch staff list on component mount
  const fetchStaff = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await authApi.listStaff();
      setStaffList(res.data);
    } catch (err: any) {
      console.error("Failed to load staff list", err);
      setError("Failed to fetch staff members. You may not have permissions to view this list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSavePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !role || !tempPassword) {
      setPanelError("Please fill in all required fields.");
      return;
    }

    setPanelError("");
    setIsSaving(true);

    // Split name into first and last
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await authApi.createStaff({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: role as Role,
        password: tempPassword,
        status: "active",
      });

      // Reset Form and close drawer
      setFullName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setRole("");
      setTempPassword("Initial@123");
      setIsPanelOpen(false);
      
      // Refresh staff list
      fetchStaff();
    } catch (err: any) {
      console.error("Error creating staff", err);
      const errors = err.response?.data;
      if (errors) {
        const firstErrorKey = Object.keys(errors)[0];
        const errorMessage = errors[firstErrorKey];
        setPanelError(`${firstErrorKey}: ${Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}`);
      } else {
        setPanelError("Failed to save staff member. Please check details and try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and search computation
  const filteredStaff = staffList.filter((staff) => {
    const fullStaffName = `${staff.first_name || ""} ${staff.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullStaffName.includes(searchQuery.toLowerCase()) ||
      staff.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRole = selectedRole ? staff.role === selectedRole : true;
    
    return matchesSearch && matchesRole;
  });

  const formatRoleLabel = (roleVal: string) => {
    return roleVal
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Stats summary counts
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.status === "active").length;

  return (
    <div className="max-w-[1440px] mx-auto w-full relative">
      
      {/* Search & Actions Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-outline-variant/30">
        <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary transition-all text-body-md"
              placeholder="Search by name, username or email..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary transition-all min-w-[180px]"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
              expand_more
            </span>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-secondary font-label-md hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
            <span>Advanced Filters</span>
          </button>
          
          {currentUser?.role === "chief_doctor" && (
            <button
              onClick={() => setIsPanelOpen(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Canvas */}
      {error && (
        <div className="p-8 bg-error-container/20 text-error border border-error-container rounded-xl text-center mb-8">
          <span className="material-symbols-outlined text-4xl mb-2">gpp_maybe</span>
          <p className="font-bold text-headline-sm">{error}</p>
        </div>
      )}

      {!error && (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-secondary text-body-md">Loading staff directory...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-12 text-center text-secondary">
                <span className="material-symbols-outlined text-5xl mb-3 text-outline">group</span>
                <p className="font-headline-sm text-headline-sm font-semibold mb-1">No staff members found</p>
                <p className="text-body-md">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 font-label-sm text-on-secondary-container uppercase tracking-wider border-b border-outline-variant/30">Name</th>
                    <th className="px-6 py-4 font-label-sm text-on-secondary-container uppercase tracking-wider border-b border-outline-variant/30">Username</th>
                    <th className="px-6 py-4 font-label-sm text-on-secondary-container uppercase tracking-wider border-b border-outline-variant/30">Role</th>
                    <th className="px-6 py-4 font-label-sm text-on-secondary-container uppercase tracking-wider border-b border-outline-variant/30 text-center">Status</th>
                    <th className="px-6 py-4 font-label-sm text-on-secondary-container uppercase tracking-wider border-b border-outline-variant/30 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-surface-container-low/30 transition-colors">
                      
                      {/* Name Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                            {staff.first_name ? staff.first_name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-label-md text-on-surface font-semibold">
                              {staff.first_name || ""} {staff.last_name || ""}
                            </p>
                            <p className="text-body-sm text-secondary">{staff.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Username Column */}
                      <td className="px-6 py-4 text-body-md text-secondary">@{staff.username}</td>

                      {/* Role Column */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-primary-container/10 text-primary text-label-sm font-bold border border-primary/20">
                          {formatRoleLabel(staff.role)}
                        </span>
                      </td>

                      {/* Status Checkbox Column */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          staff.status === "active" 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-surface-dim text-secondary border-outline-variant"
                        }`}>
                          {staff.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Edit Staff">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="p-2 text-secondary hover:text-error hover:bg-error/5 rounded-lg transition-all" title="Deactivate">
                            <span className="material-symbols-outlined">person_off</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-surface-container-low/50 flex items-center justify-between border-t border-outline-variant/30">
            <p className="text-body-sm text-secondary">
              Showing {filteredStaff.length} of {staffList.length} staff members
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 text-secondary hover:bg-surface-container-high rounded-lg disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-label-md font-bold shadow-sm">1</button>
              <button className="p-2 text-secondary hover:bg-surface-container-high rounded-lg disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary uppercase tracking-wider">Total Staff</p>
            <p className="text-headline-md font-bold text-on-surface">{totalStaffCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
            <span className="material-symbols-outlined">person_check</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary uppercase tracking-wider">Active Now</p>
            <p className="text-headline-md font-bold text-on-surface">{activeStaffCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined">clinical_notes</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary uppercase tracking-wider">On Leave</p>
            <p className="text-headline-md font-bold text-on-surface">3</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-label-sm text-secondary uppercase tracking-wider">Pending Tasks</p>
            <p className="text-headline-md font-bold text-on-surface">12</p>
          </div>
        </div>
      </div>

      {/* Dim Overlay */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-on-background/40 backdrop-blur-[1px] z-50 transition-opacity duration-300"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Add Staff Slide-in Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[480px] bg-white z-[60] shadow-2xl flex flex-col border-l border-outline-variant transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Add New Staff</h2>
            <p className="text-body-sm text-on-surface-variant">Create a new personnel record</p>
          </div>
          <button 
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors" 
            onClick={() => setIsPanelOpen(false)}
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Panel Form Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <form className="space-y-6" onSubmit={handleSavePersonnel}>
            {panelError && (
              <div className="p-3 bg-error-container/30 border border-error-container text-error rounded-lg text-body-sm">
                {panelError}
              </div>
            )}

            {/* Inputs Grid */}
            <div className="space-y-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-label-md text-on-surface-variant ml-1">Full Name</label>
                <input
                  className="w-full px-4 py-3 border border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all placeholder:text-outline-variant"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Username & Role Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-label-md text-on-surface-variant ml-1">Username</label>
                  <input
                    className="w-full px-4 py-3 border border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                    placeholder="rkumar_dental"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-label-md text-on-surface-variant ml-1">Role</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none px-4 py-3 border border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all bg-white"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="">Select Role</option>
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="font-label-md text-on-surface-variant ml-1">Email Address</label>
                <input
                  className="w-full px-4 py-3 border border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                  placeholder="rajesh.k@chandrika.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="font-label-md text-on-surface-variant ml-1">Phone Number</label>
                <input
                  className="w-full px-4 py-3 border border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                  placeholder="+91 99999 88888"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Temporary Password */}
              <div className="space-y-1.5 pt-4">
                <label className="font-label-md text-on-surface-variant ml-1">Temporary Password</label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 border border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary-container/20 focus:border-primary outline-none transition-all"
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-outline-variant mt-1">Staff will be prompted to change this on first login.</p>
              </div>

            </div>

            {/* Auto-generate helper block */}
            <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant mt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-label-md text-on-surface font-semibold">Auto-generate credentials</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">info</span>
                <p>Credentials will be sent to the staff member's email automatically after saving.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant">
              <button
                type="button"
                className="px-6 py-3 border border-outline text-secondary font-label-md rounded-lg hover:bg-surface-container transition-all active:scale-[0.98]"
                onClick={() => setIsPanelOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-white font-label-md rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm disabled:opacity-75"
              >
                {isSaving ? "Saving..." : "Save Personnel"}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
