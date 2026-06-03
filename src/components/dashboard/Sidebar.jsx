import { LogOut, Settings, LayoutGrid, Droplets, Activity, Compass, History } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ activeTab, setActiveTab, tabs, criticalCount }) {
  const { logout } = useAuth();

  const items = [
    {
      key: tabs.GENERAL,
      label: "Resumen del terreno",
      icon: <LayoutGrid size={16} strokeWidth={2} />,
    },
    {
      key: tabs.SOIL,
      label: "Humedad del suelo",
      icon: <Droplets size={16} strokeWidth={2} />,
    },
    {
      key: tabs.VIBRATION,
      label: "Sismicidad / vibración",
      icon: <Activity size={16} strokeWidth={2} />,
    },
    {
      key: tabs.MPU,
      label: "Inclinación / movimiento",
      icon: <Compass size={16} strokeWidth={2} />,
    },
    {
      key: tabs.HISTORICAL,
      label: "Histórico",
      icon: <History size={16} strokeWidth={2} />,
    },
  ];

  return (
    <aside className="sw-sidebar">
      <div className="sw-sidebar-head">
        <div className="sw-logo">
          <div className="sw-logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 13 Q4 7 8 9 Q12 11 14 5"
                stroke="#fff"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M2 13 L14 13"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <circle cx="8" cy="9" r="1.5" fill="white" opacity="0.85" />
            </svg>
          </div>

          <div>
            <div className="sw-logo-name">SlideWatch</div>
            <div className="sw-logo-sub">Sistema de alerta temprana</div>
          </div>
        </div>
      </div>

      <div className="sw-sidebar-scroll">
        <div className="sw-sidebar-section-label">Monitoreo</div>

        <nav className="sw-nav">
          {items.map((item) => (
            <button
              key={item.key}
              className={`sw-nav-btn${activeTab === item.key ? " active" : ""}`}
              onClick={() => setActiveTab(item.key)}
              type="button"
            >
              <span className="sw-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sw-sidebar-section-label">Sistema</div>

        <button className="sw-nav-btn" type="button">
          <span className="sw-nav-icon">
            <Settings size={16} strokeWidth={2} />
          </span>
          <span>Configuración</span>
        </button>
      </div>

      <div className="sw-sidebar-footer">
        <button className="sw-logout-btn" onClick={logout} type="button">
          <LogOut size={15} strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>

        <div className={`sw-risk-badge${criticalCount > 0 ? " danger" : ""}`}>
          <span className="sw-risk-dot" />
          <div>
            <div className="sw-risk-label">
              {criticalCount > 0
                ? `${criticalCount} alerta${criticalCount > 1 ? "s" : ""} activa${criticalCount > 1 ? "s" : ""}`
                : "Sin alertas críticas"}
            </div>
            <div className="sw-risk-sub">Zona A · Sector Norte</div>
          </div>
        </div>
      </div>
    </aside>
  );
}