export default function Sidebar({ activeTab, setActiveTab, tabs, criticalCount }) {
  const items = [
    {
      key: tabs.GENERAL,
      label: "Resumen del terreno",
      icon: (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
    {
      key: tabs.SOIL,
      label: "Humedad del suelo",
      icon: (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 2C7 2 3 5.5 3 8a4 4 0 008 0C11 5.5 7 2 7 2z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: tabs.VIBRATION,
      label: "Sismicidad / vibración",
      icon: (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 7h2l1.5-4L7 11l2-5 1.5 2.5H13"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: tabs.MPU,
      label: "Inclinación / movimiento",
      icon: (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M7 3v2M7 9v2M3 7h2M9 7h2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      ),
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

      <div className="sw-sidebar-section-label">Monitoreo</div>

      <nav className="sw-nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`sw-nav-btn${activeTab === item.key ? " active" : ""}`}
            onClick={() => setActiveTab(item.key)}
          >
            <span className="sw-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sw-sidebar-section-label">Sistema</div>

      <button className="sw-nav-btn" type="button">
        <span className="sw-nav-icon">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>Configuración</span>
      </button>

      <button className="sw-nav-btn" type="button">
        <span className="sw-nav-icon">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 4h10M2 7h7M2 10h5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>Histórico</span>
      </button>

      <div className="sw-sidebar-footer">
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