// components/layout/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types/auth.types";


export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, loading } = useAuth();

  // Show a clean loading state if the auth state is still loading (e.g. during page refresh)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bright">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to home if user role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}