import { useState, useEffect } from "react";
import * as authApi from "../../api/authApi";
import type { LoginHistoryEntry } from "../../types/auth.types";

export default function LoginHistoryPage() {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");


  const fetchHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await authApi.listLoginHistory();
      setHistory(res.data);
    } catch (err: any) {
      console.error("Failed to load login history", err);
      setError("Failed to retrieve login history. Please check back later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format date-time helper
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
      return {
        date: d.toLocaleDateString("en-US", dateOptions),
        time: d.toLocaleTimeString("en-US", timeOptions),
      };
    } catch (e) {
      return { date: dateStr, time: "" };
    }
  };

  // Parser helper to extract browser/OS details from user agent
  const parseDeviceInfo = (agentStr: string) => {
    if (!agentStr) return { device: "Unknown Device", icon: "help" };
    const agent = agentStr.toLowerCase();
    
    let deviceIcon = "desktop_windows";
    let systemInfo = "Web Browser";

    if (agent.includes("windows")) {
      systemInfo = "Windows";
    } else if (agent.includes("macintosh") || agent.includes("mac os")) {
      systemInfo = "MacOS";
    } else if (agent.includes("linux")) {
      systemInfo = "Linux";
    } else if (agent.includes("android")) {
      systemInfo = "Android";
      deviceIcon = "smartphone";
    } else if (agent.includes("iphone") || agent.includes("ipad")) {
      systemInfo = "iOS";
      deviceIcon = "smartphone";
    }

    let browser = "Browser";
    if (agent.includes("chrome")) {
      browser = "Chrome";
    } else if (agent.includes("safari")) {
      browser = "Safari";
    } else if (agent.includes("firefox")) {
      browser = "Firefox";
    } else if (agent.includes("edg")) {
      browser = "Edge";
    }

    return {
      device: `${browser} / ${systemInfo}`,
      icon: deviceIcon,
    };
  };

  // Filter login logs based on criteria
  const filteredHistory = history.filter((entry) => {
    const parsedDevice = parseDeviceInfo(entry.device_info).device.toLowerCase();
    const matchesSearch =
      entry.ip_address.includes(searchQuery) ||
      parsedDevice.includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" ||
      entry.status.toLowerCase() === statusFilter.toLowerCase();

    // Date range filter
    const entryDate = new Date(entry.login_at).toISOString().split("T")[0];
    const matchesDateRange = entryDate >= startDate && entryDate <= endDate;

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const failedCount = history.filter((h) => h.status !== "success").length;

  return (
    <div className="max-w-[1440px] mx-auto w-full">
      
      {/* Filters & Stats Section */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        
        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Date range selection */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-label-sm text-secondary">Date Range</label>
            <div className="flex items-center bg-white border border-outline-variant rounded-lg px-3 py-2 gap-3">
              <span className="material-symbols-outlined text-secondary text-[20px]">calendar_today</span>
              <input
                className="bg-transparent border-none p-0 text-body-md focus:ring-0 outline-none w-28"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-outline">to</span>
              <input
                className="bg-transparent border-none p-0 text-body-md focus:ring-0 outline-none w-28"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-label-sm text-secondary">Status</label>
            <select
              className="bg-white border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-primary-container outline-none min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Search Logs Input */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-label-sm text-secondary">Search logs</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary-container outline-none transition-all w-64"
                placeholder="Search IP or browser..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Failed Count Stats Widget */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-4 rounded-xl border border-outline-variant flex items-center gap-4 min-w-[200px] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">gpp_maybe</span>
            </div>
            <div>
              <p className="text-label-sm font-label-sm text-secondary">Failed Attempts</p>
              <p className="text-headline-sm font-headline-sm font-bold text-on-surface">{failedCount}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Table Container */}
      {error && (
        <div className="p-8 bg-error-container/20 text-error border border-error-container rounded-xl text-center mb-8">
          <span className="material-symbols-outlined text-4xl mb-2">gpp_maybe</span>
          <p className="font-bold text-headline-sm">{error}</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-secondary text-body-md">Loading security audits...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-secondary">
            <span className="material-symbols-outlined text-5xl mb-3 text-outline">history</span>
            <p className="font-headline-sm text-headline-sm font-semibold mb-1">No audit logs found</p>
            <p className="text-body-md">Try expanding your date range filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Device / Browser</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredHistory.map((entry) => {
                const { date, time } = formatDateTime(entry.login_at);
                const { device, icon } = parseDeviceInfo(entry.device_info);
                return (
                  <tr key={entry.id} className="hover:bg-surface-container-low/20 transition-colors">
                    
                    {/* Date Time */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-body-md font-medium text-on-surface">{date}</span>
                        <span className="text-body-sm text-secondary">{time}</span>
                      </div>
                    </td>

                    {/* IP */}
                    <td className="px-6 py-5">
                      <span className="font-mono text-body-md text-secondary">{entry.ip_address || "127.0.0.1"}</span>
                    </td>

                    {/* Device & Browser Info */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">{icon}</span>
                        <div className="flex flex-col">
                          <span className="text-body-md text-on-surface">{device}</span>
                          <span className="text-body-sm text-secondary">v118.0.0 (Agent)</span>
                        </div>
                      </div>
                    </td>

                    {/* Location Placeholder */}
                    <td className="px-6 py-5">
                      <span className="text-body-md text-secondary">New Delhi, IN</span>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        entry.status === "success" 
                          ? "bg-primary-container/10 text-primary" 
                          : "bg-error-container/10 text-error"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          entry.status === "success" ? "bg-primary" : "bg-error"
                        }`} />
                        {entry.status}
                      </span>
                    </td>

                    {/* Info Icon Action */}
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-secondary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">info</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant">
          <p className="text-body-sm text-secondary">
            Showing {filteredHistory.length} of {history.length} logs
          </p>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-secondary hover:bg-surface-bright transition-colors" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-label-sm text-label-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-secondary hover:bg-surface-bright transition-colors" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Insights Bento Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bento 1: Active Sessions */}
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">verified_user</span>
            <h3 className="font-headline-sm text-headline-sm font-semibold">Active Sessions</h3>
          </div>
          <p className="text-body-md text-secondary mb-4">There are currently 2 active sessions across different devices for your account.</p>
          <button className="text-primary font-label-md text-label-md hover:underline font-bold">Manage Sessions</button>
        </div>

        {/* Bento 2: Locations graph */}
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-tertiary">location_on</span>
            <h3 className="font-headline-sm text-headline-sm font-semibold">Recent Locations</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-sm">New Delhi, India</span>
              <span className="text-label-sm text-secondary font-bold">Current (98%)</span>
            </div>
            <div className="w-full bg-outline-variant h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[98%]"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm">Other Locations</span>
              <span className="text-label-sm text-secondary font-bold">2%</span>
            </div>
          </div>
        </div>

        {/* Bento 3: Export Audit Log */}
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-on-surface-variant">security</span>
              <h3 className="font-headline-sm text-headline-sm font-semibold">Export Data</h3>
            </div>
            <p className="text-body-md text-secondary">Download a comprehensive audit trail of your login activity for clinical compliance.</p>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-label-md font-label-md hover:bg-outline-variant transition-colors">
              CSV
            </button>
            <button className="flex-1 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-label-md font-label-md hover:bg-outline-variant transition-colors">
              PDF
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
