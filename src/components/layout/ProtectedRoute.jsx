import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at top, #132238 0%, #08111f 45%, #050b14 100%)", color: "#d9e7ff", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ padding: "18px 24px", borderRadius: "18px", border: "1px solid rgba(120, 170, 255, 0.18)", background: "rgba(10, 18, 32, 0.72)", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)" }}>
          Verificando acceso...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si hay roles requeridos y el usuario no tiene el rol correcto
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirigir según su rol real
    if (user?.role === "ciudadano") return <Navigate to="/ciudadano" replace />;
    if (user?.role === "admin") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}