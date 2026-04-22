function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function StatusPanel({ soilStatus, vibStatus, accelStatus, lastChange }) {
  const pillSt = {
    low:     { bg: "#eaf3de", color: "#3B6D11" },
    med:     { bg: "#faeeda", color: "#633806" },
    high:    { bg: "#fcebeb", color: "#791F1F" },
    neutral: { bg: "#e8f0f2", color: "#3a5560" },
  };
  const rows = [
    { label: "Suelo",      status: soilStatus,                          ago: lastChange.soil  },
    { label: "Vibración",  status: vibStatus,                           ago: lastChange.vib   },
    { label: "Inclinación",status: accelStatus,                         ago: lastChange.accel },
    { label: "Telemetría", status: { label: "En línea", type: "neutral" }, ago: null          },
    { label: "Batería",    status: { label: "87%",      type: "low"    }, ago: null           },
  ];
  return (
    <div className="sw-card">
      <div className="sw-card-head">
        <span className="sw-card-title">Estado de sensores</span>
      </div>
      <div className="sw-card-body">
        {rows.map((r, i) => {
          const st = pillSt[r.status.type] || pillSt.neutral;
          return (
            <div key={i} className="sw-status-row">
              <span className="sw-status-label">{r.label}</span>
              <div className="sw-status-right">
                {r.ago && (
                  <span className="sw-status-ago">{timeAgo(r.ago)}</span>
                )}
                <span className="sw-status-pill" style={{ background: st.bg, color: st.color }}>
                  {r.status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}