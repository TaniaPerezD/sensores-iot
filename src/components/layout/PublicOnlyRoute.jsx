import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at top left, rgba(164, 92, 49, 0.08), transparent 24%), linear-gradient(180deg, #faf7f4 0%, #f5f1ed 100%)",
          color: "#2d211d",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Verificando sesión...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}