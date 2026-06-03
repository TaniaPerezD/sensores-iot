export default function AlertPanel({ alerts, criticalCount, loading = false }) {
  const iconOk = (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path
        d="M2.5 5.5l2 2 3-4"
        stroke="#27500A"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const iconWarn = (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path
        d="M5 2v3M5 7v.5"
        stroke="#633806"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );

  const iconDanger = (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path
        d="M5 2v3M5 7v.5"
        stroke="#791F1F"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );

  const iconMap = { high: iconDanger, med: iconWarn, ok: iconOk };

  return (
    <div className="sw-card">
      <div className="sw-card-head">
        <span className="sw-card-title">Alertas activas</span>
        <span
          className={`sw-kpi-status sw-kpi-status--${
            criticalCount > 0 ? "high" : "low"
          }`}
        >
          {loading
            ? "Cargando..."
            : criticalCount > 0
            ? `${criticalCount} críticas`
            : "Sin alertas"}
        </span>
      </div>

      <div className="sw-card-body">
        {loading ? (
          <div className="sw-alert sw-alert--ok">
            <div className="sw-alert-icon sw-alert-icon--ok">{iconOk}</div>
            <div>
              <div className="sw-alert-title">Consultando alertas...</div>
              <div className="sw-alert-desc">Conectando con el servidor</div>
            </div>
          </div>
        ) : (
          alerts.map((a, i) => (
            <div key={a.id ?? i} className={`sw-alert sw-alert--${a.type}`}>
              <div className={`sw-alert-icon sw-alert-icon--${a.type}`}>
                {iconMap[a.type] ?? iconOk}
              </div>
              <div>
                <div className="sw-alert-title">{a.title}</div>
                <div className="sw-alert-desc">{a.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}