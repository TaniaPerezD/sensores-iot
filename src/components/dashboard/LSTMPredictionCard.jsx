import { useState, useEffect, useCallback } from "react";
import { fetchLstmPredict } from "../../api/lstmApi";

const LEVEL_STYLE = {
  danger:  { bg: "#fcebeb", text: "#791F1F", dot: "#A32D2D", label: "Peligro" },
  warning: { bg: "#faeeda", text: "#633806", dot: "#BA7517", label: "Advertencia" },
  normal:  { bg: "#eaf3de", text: "#27500A", dot: "#3B6D11", label: "Normal" },
};

function ProbBar({ value }) {
  const pct   = Math.min(100, Math.max(0, Math.round((value ?? 0) * 100)));
  const color = pct >= 70 ? "#A32D2D" : pct >= 30 ? "#BA7517" : "#3B6D11";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: "rgba(0,0,0,0.08)", overflow: "hidden",
      }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

export default function LSTMPredictionCard({ deviceCode = "esp32-node-001" }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLstmPredict(deviceCode);
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Error al obtener predicción");
    } finally {
      setLoading(false);
    }
  }, [deviceCode]);

  useEffect(() => { refresh(); }, [refresh]);

  const nivel = result?.nivel_predicho ?? "normal";
  const st    = LEVEL_STYLE[nivel] || LEVEL_STYLE.normal;

  const headerPill = loading ? (
    <span className="sw-kpi-status sw-kpi-status--low" style={{ fontSize: 11 }}>
      Calculando…
    </span>
  ) : result?.disponible ? (
    <span
      className="sw-kpi-status"
      style={{ fontSize: 11, background: st.bg, color: st.text }}
    >
      {st.label}
    </span>
  ) : (
    <span className="sw-kpi-status sw-kpi-status--low" style={{ fontSize: 11 }}>
      Sin datos
    </span>
  );

  return (
    <div className="sw-card">
      <div className="sw-card-head">
        <span className="sw-card-title">Predicción LSTM</span>
        {headerPill}
      </div>

      <div className="sw-card-body">
        {loading && (
          <div className="sw-alert sw-alert--ok">
            <div>
              <div className="sw-alert-title">Ejecutando modelo…</div>
              <div className="sw-alert-desc">Procesando las últimas lecturas</div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="sw-alert sw-alert--high">
            <div>
              <div className="sw-alert-title">Error al predecir</div>
              <div className="sw-alert-desc">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && result && !result.disponible && (
          <div className="sw-alert sw-alert--ok">
            <div>
              <div className="sw-alert-title">Datos insuficientes</div>
              <div className="sw-alert-desc">{result.mensaje}</div>
            </div>
          </div>
        )}

        {!loading && !error && result?.disponible && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div className="sw-status-label" style={{ marginBottom: 4 }}>
                Probabilidad de riesgo futuro
              </div>
              <ProbBar value={result.proba_riesgo_futuro} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="sw-status-row">
                <span className="sw-status-label">Horizonte</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {result.horizonte_segundos}s ({result.horizonte_lecturas} lecturas)
                </span>
              </div>
              <div className="sw-status-row">
                <span className="sw-status-label">Lecturas usadas</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {result.lecturas_usadas}
                </span>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={refresh}
            disabled={loading}
            className="sw-kpi-status sw-kpi-status--low"
            style={{
              cursor: loading ? "default" : "pointer",
              border: "none",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 5,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Calculando…" : "Actualizar predicción"}
          </button>
        </div>
      </div>
    </div>
  );
}
