import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import LoginPage from "./features/auth/LoginPage";
import StaffListPage from "./features/auth/StaffListPage";
import ProfilePage from "./features/auth/ProfilePage";
import LoginHistoryPage from "./features/auth/LoginHistoryPage";
import { PatientListPage } from "./features/patients/PatientListPage";
import { NewPatientPage } from "./features/patients/NewPatientPage";
import { PatientDetailPage } from "./features/patients/PatientDetailPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Layout Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Redirect root to staff list */}
              <Route path="/" element={<Navigate to="/staff" replace />} />
              <Route path="/staff" element={<StaffListPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/history" element={<LoginHistoryPage />} />

              {/* Patient module */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["chief_doctor", "doctor", "assistant", "receptionist", "accountant"]}
                  />
                }
              >
                <Route path="/patients" element={<PatientListPage />} />
                <Route path="/patients/new" element={<NewPatientPage />} />
                <Route path="/patients/:id" element={<PatientDetailPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
