import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, FileText, LogOut } from "lucide-react";
import "../../styles/citizen.css";

export default function CitizenLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="cz-layout">
      <aside className="cz-sidebar">
        <div className="cz-sidebar__brand">
          <div className="cz-sidebar__brand-mark">SW</div>
          <div>
            <strong>SlideWatch</strong>
            <span>Portal ciudadano</span>
          </div>
        </div>

        <div className="cz-sidebar__user">
          <div className="cz-sidebar__avatar">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user?.full_name}</strong>
            <span>Ciudadano</span>
          </div>
        </div>

        <nav className="cz-sidebar__nav">
          <NavLink
            to="/ciudadano/inicio"
            className={({ isActive }) =>
              `cz-nav-item ${isActive ? "cz-nav-item--active" : ""}`
            }
          >
            <LayoutDashboard size={18} />
            Inicio
          </NavLink>

          <NavLink
            to="/ciudadano/mis-reportes"
            className={({ isActive }) =>
              `cz-nav-item ${isActive ? "cz-nav-item--active" : ""}`
            }
          >
            <FileText size={18} />
            Mis reportes
          </NavLink>
        </nav>

        <button className="cz-sidebar__logout" onClick={handleLogout}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </aside>

      <main className="cz-main">
        <Outlet />
      </main>
    </div>
  );
}