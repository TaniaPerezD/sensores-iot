import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PublicOnlyRoute from "../components/layout/PublicOnlyRoute";

import Landing from "../pages/public/Landing";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/Dashboard";

import CitizenLayout from "../pages/citizen/CitizenLayout";
import CitizenHome from "../pages/citizen/CitizenHome";
import MisReportes from "../pages/citizen/MisReportes";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><Dashboard /></ProtectedRoute>} />

          <Route path="/ciudadano" element={<ProtectedRoute allowedRoles={["ciudadano"]}><CitizenLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<CitizenHome />} />
            <Route path="mis-reportes" element={<MisReportes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}