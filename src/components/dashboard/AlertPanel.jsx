import { useRiskHistory } from "../../hooks/useRiskHistory";

// Últimas N muestras danger del historial reciente
function useDangerSamples(deviceCode = "esp32-node-001", limit = 3) {
  const { rows, loading } = useRiskHistory(deviceCode, "24h");

  // Las más recientes primero (rows viene asc del backend)
  const reversed  = [...rows].reverse();
  const dangers   = reversed.filter((r) => r.risk_level === "danger");
  const lastLevel = reversed[0]?.risk_level ?? null;  // estado más reciente

  return {
    dangerSamples: dangers.slice(0, limit),
    lastLevel,
    loading,
  };
}

const LEVEL_COLOR = {
  danger:  { bg: "#fcebeb", text: "#791F1F", dot: "#A32D2D" },
  warning: { bg: "#faeeda", text: "#633806", dot: "#BA7517" },
  normal:  { bg: "#eaf3de", text: "#27500A", dot: "#3B6D11" },
};

function RiskBar({ score }) {
  const pct   = Math.min(100, Math.max(0, Number(score) || 0));
  const color = pct >= 70 ? "#A32D2D" : pct >= 30 ? "#BA7517" : "#3B6D11";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
      <div style={{
        flex: 1, height: 4, borderRadius: 2,
        background: "rgba(0,0,0,0.08)", overflow: "hidden",
      }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 24, textAlign: "right" }}>
        {pct % 1 === 0 ? pct : pct.toFixed(1)}
      </span>
    </div>
  );
}

export default function AlertPanel({ criticalCount, loading: externalLoading = false }) {
  const { dangerSamples, lastLevel, loading } = useDangerSamples();

  const isLoading = externalLoading || loading;
  const isCurrentlyNormal = lastLevel === "normal" || lastLevel === null;
  const c = LEVEL_COLOR[lastLevel ?? "normal"];

  const iconOk = (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path d="M2.5 5.5l2 2 3-4" stroke="#27500A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const iconWarn = (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path d="M5 2v3M5 7v.5" stroke="#633806" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
  const iconDanger = (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path d="M5 2v3M5 7v.5" stroke="#791F1F" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );

  // Estado actual del dispositivo (pill superior)
  const statusPill = isCurrentlyNormal ? (
    <span className="sw-kpi-status sw-kpi-status--low" style={{ fontSize: 11 }}>
      ✓ Actualmente normal
    </span>
  ) : lastLevel === "warning" ? (
    <span className="sw-kpi-status sw-kpi-status--med" style={{ fontSize: 11 }}>
      ⚠ Actualmente en advertencia
    </span>
  ) : (
    <span className="sw-kpi-status sw-kpi-status--high" style={{ fontSize: 11 }}>
      ✕ Actualmente en peligro
    </span>
  );

  return (
    <div className="sw-card">
      <div className="sw-card-head">
        <span className="sw-card-title">Últimas alertas de riesgo</span>
        {isLoading ? (
          <span className="sw-kpi-status sw-kpi-status--low" style={{ fontSize: 11 }}>
            Cargando...
          </span>
        ) : statusPill}
      </div>

      <div className="sw-card-body">
        {isLoading && (
          <div className="sw-alert sw-alert--ok">
            <div className="sw-alert-icon sw-alert-icon--ok">{iconOk}</div>
            <div>
              <div className="sw-alert-title">Consultando historial…</div>
              <div className="sw-alert-desc">Conectando con el servidor</div>
            </div>
          </div>
        )}

        {!isLoading && dangerSamples.length === 0 && (
          <div className="sw-alert sw-alert--ok">
            <div className="sw-alert-icon sw-alert-icon--ok">{iconOk}</div>
            <div>
              <div className="sw-alert-title">Sin peligro en las últimas 24h</div>
              <div className="sw-alert-desc">El terreno se mantiene estable</div>
            </div>
          </div>
        )}

        {!isLoading && dangerSamples.map((s, i) => {
          const date = new Date(s.sampled_at).toLocaleTimeString("es-BO", {
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          });
          return (
            <div key={s.sample_id ?? i} className="sw-alert sw-alert--high">
              <div className="sw-alert-icon sw-alert-icon--high">{iconDanger}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sw-alert-title">
                  Riesgo alto detectado
                  {isCurrentlyNormal && i === 0 && (
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 600,
                      padding: "1px 6px", borderRadius: 4,
                      background: "#eaf3de", color: "#27500A",
                    }}>
                      Inactivo — ahora normal
                    </span>
                  )}
                </div>
                <div className="sw-alert-desc">Score del modelo · {date}</div>
                <RiskBar score={s.risk_score} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}