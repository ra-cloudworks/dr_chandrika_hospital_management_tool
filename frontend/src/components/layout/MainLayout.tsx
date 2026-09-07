import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AppointmentModal } from "../../features/appointments/AppointmentModal";

// Component mapping for page titles based on route
const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/staff": "Staff Management",
  "/patients": "Patient Records",
  "/appointments": "Appointments",
  "/history": "Login History",
  "/profile": "My Profile",
};

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const currentPath = location.pathname;
  const pageTitle = ROUTE_TITLES[currentPath] || "Chandrika Dental Care";

  // Active styles helper for sidebar links
  const getLinkClass = (path: string) => {
    const base = "flex items-center gap-3 px-6 py-3 transition-colors duration-200 font-label-md text-label-md active:scale-[0.98]";
    if (currentPath === path) {
      return `${base} bg-primary-container/10 text-primary border-l-4 border-primary font-bold`;
    }
    return `${base} text-secondary hover:bg-surface-container-low`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Safe username abbreviation for default avatar
  const getInitials = () => {
    if (!user) return "U";
    const first = user.first_name ? user.first_name[0] : "";
    const last = user.last_name ? user.last_name[0] : user.username[0];
    return (first + last).toUpperCase();
  };

  // Safe formatting of user role for display
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex">
      {/* SideNavBar (Persistent) */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface border-r border-outline-variant shadow-sm flex flex-col py-6 z-50">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight">Chandrika Dental</h1>
            <p className="font-label-sm text-label-sm text-secondary">Staff Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {/* Dashboard link */}
          {/* <Link to="/" className={getLinkClass("/")}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link> */}

          {/* Staff list link */}
          <Link to="/staff" className={getLinkClass("/staff")}>
            <span className="material-symbols-outlined">group</span>
            <span>Staff</span>
          </Link>

          {/* Patients link */}
          <Link to="/patients" className={getLinkClass("/patients")}>
            <span className="material-symbols-outlined">person</span>
            <span>Patients</span>
          </Link>

          {/* Appointments link */}
          <Link to="/appointments" className={getLinkClass("/appointments")}>
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Appointments</span>
          </Link>

          {/* Login History link */}
          {/* <Link to="/history" className={getLinkClass("/history")}>
            <span className="material-symbols-outlined">history</span>
            <span>Login History</span>
          </Link> */}

          {/* Profile link */}
          <Link to="/profile" className={getLinkClass("/profile")}>
            <span className="material-symbols-outlined">account_circle</span>
            <span>Profile</span>
          </Link>
        </nav>

        <div className="px-4 mt-auto">
          {/* Quick action button */}
          <button
            onClick={() => setShowNewAppointment(true)}
            className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Appointment</span>
          </button>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-error hover:bg-error-container/10 transition-colors duration-200 font-label-md text-label-md rounded-lg text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-8 z-40">
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">{pageTitle}</h2>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>

            <div className="h-8 w-px bg-outline-variant"></div>

            {/* User Profile Card */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-label-md font-bold text-on-surface">
                  {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
                </p>
                <p className="text-label-sm text-secondary">
                  {user ? formatRole(user.role) : ""}
                </p>
              </div>

              {/* Profile Image / Initials fallback */}
              <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden flex items-center justify-center bg-primary text-white font-bold">
                {user ? getInitials() : "?"}
              </div>
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <main className="mt-16 p-8 flex-1 bg-surface-bright">
          <Outlet />
        </main>
      </div>

      {/* New Appointment modal — fixed/overlay, so it's fine to render here regardless of layout structure */}
      {showNewAppointment && (
        <AppointmentModal
          onClose={() => setShowNewAppointment(false)}
          onCreated={() => {
            setShowNewAppointment(false);
            navigate("/appointments");
          }}
        />
      )}
    </div>
  );
}