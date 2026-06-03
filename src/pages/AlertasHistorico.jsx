import { useCallback, useMemo, useState } from "react";
import { useAlerts } from "../hooks/useAlerts";
import { useSocketSnapshot } from "../hooks/useSocketSnapshot";
import { useWeather } from "../hooks/useWeather";
import { formatDateTime, formatNumber } from "../utils/formatters";
import "../styles/alertasHistorico.css";

// ─── Rangos disponibles ───────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { key: "1h",  label: "1 hora" },
  { key: "6h",  label: "6 horas" },
  { key: "12h", label: "12 horas" },
  { key: "24h", label: "24 horas" },
  { key: "2d",  label: "2 días" },
  { key: "7d",  label: "7 días" },
  { key: "30d", label: "30 días" },
];

// ─── Filtros de nivel ─────────────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { key: "all",     label: "Todos" },
  { key: "danger",  label: "Peligro" },
  { key: "warning", label: "Advertencia" },
  { key: "info",    label: "Info" },
];

// ─── Helpers de presentación ──────────────────────────────────────────────────
const LEVEL_META = {
  danger:  { label: "Peligro",      cls: "high",    dot: "#A32D2D" },
  warning: { label: "Advertencia",  cls: "med",     dot: "#BA7517" },
  info:    { label: "Info",         cls: "neutral",  dot: "#3a5560" },
};

function levelMeta(level) {
  return LEVEL_META[level] ?? LEVEL_META.info;
}

// ─── Clima: banda superior ────────────────────────────────────────────────────
function WeatherStrip({ weather, loading, error }) {
  if (loading) {
    return (
      <div className="sw-card ahl-weather-strip">
        <span className="sw-chart-hint">Obteniendo clima…</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="sw-card ahl-weather-strip">
        <span className="sw-chart-hint">Clima no disponible</span>
      </div>
    );
  }

  const riskColors = { high: "#A32D2D", med: "#BA7517", low: "#3B6D11" };
  const riskLabels = {
    high: "Alta prob. de lluvia — riesgo de saturación del suelo",
    med:  "Prob. moderada de lluvia — vigilar humedad",
    low:  "Condiciones secas — riesgo bajo por lluvia",
  };

  return (
    <div className="sw-card ahl-weather-strip">
      <div className="ahl-weather-main">
        <span className="ahl-weather-icon">{weather.weatherIcon}</span>
        <div>
          <div className="ahl-weather-label">{weather.weatherLabel}</div>
          <div className="sw-chart-hint">La Paz, Bolivia · Zona de monitoreo</div>
        </div>
      </div>

      <div className="ahl-weather-kpis">
        <div className="ahl-wkpi">
          <span className="ahl-wkpi-val">{weather.temperature}°C</span>
          <span className="sw-chart-hint">Temperatura</span>
        </div>
        <div className="ahl-wkpi">
          <span className="ahl-wkpi-val">{weather.feelsLike}°C</span>
          <span className="sw-chart-hint">Sensación</span>
        </div>
        <div className="ahl-wkpi">
          <span className="ahl-wkpi-val">{weather.humidity}%</span>
          <span className="sw-chart-hint">Humedad amb.</span>
        </div>
        <div className="ahl-wkpi">
          <span className="ahl-wkpi-val">{weather.windSpeed} km/h</span>
          <span className="sw-chart-hint">Viento</span>
        </div>
        <div className="ahl-wkpi">
          <span className="ahl-wkpi-val">{weather.rainProbability}%</span>
          <span className="sw-chart-hint">Prob. lluvia</span>
        </div>
        <div className="ahl-wkpi">
          <span className="ahl-wkpi-val">{weather.precipitation} mm</span>
          <span className="sw-chart-hint">Precipitación</span>
        </div>
      </div>

      <div
        className="ahl-weather-risk"
        style={{ borderColor: riskColors[weather.soilRisk] }}
      >
        <span
          className="ahl-weather-risk-dot"
          style={{ background: riskColors[weather.soilRisk] }}
        />
        <span
          className="sw-chart-hint"
          style={{ color: riskColors[weather.soilRisk] }}
        >
          {riskLabels[weather.soilRisk]}
        </span>
      </div>
    </div>
  );
}

// ─── KPI mini igual al de Historico ──────────────────────────────────────────
function KpiMini({ label, value, hint, accentColor }) {
  return (
    <div className="sw-kpi" style={accentColor ? { borderTop: `3px solid ${accentColor}` } : {}}>
      <div className="sw-kpi-label">{label}</div>
      <div className="sw-kpi-val-row">
        <div className="sw-kpi-val">{value}</div>
      </div>
      <div className="sw-chart-hint">{hint}</div>
    </div>
  );
}

// ─── Fila de la tabla ─────────────────────────────────────────────────────────
function AlertRow({ alert, expanded, onToggle }) {
  const meta = levelMeta(alert.level);

  return (
    <>
      <tr
        className={`ahl-row ahl-row--${meta.cls}${expanded ? " ahl-row--open" : ""}`}
        onClick={onToggle}
        style={{ cursor: "pointer" }}
      >
        <td>
          <span className="ahl-level-dot" style={{ background: meta.dot }} />
          <span className={`ahl-level-badge ahl-level-badge--${meta.cls}`}>
            {meta.label}
          </span>
        </td>
        <td className="ahl-col-title">{alert.title}</td>
        <td className="ahl-col-code">
          <code>{alert.code ?? "—"}</code>
        </td>
        <td className="ahl-col-val">
          {alert.current_value != null
            ? formatNumber(Number(alert.current_value), 3)
            : "—"}
        </td>
        <td className="ahl-col-thresh">
          {alert.threshold_value != null
            ? formatNumber(Number(alert.threshold_value), 3)
            : "—"}
        </td>
        <td className="ahl-col-status">
          {alert.is_resolved ? (
            <span className="ahl-resolved">Resuelta</span>
          ) : (
            <span className="ahl-open">Abierta</span>
          )}
        </td>
        <td className="ahl-col-time">
          {formatDateTime(alert.created_at)}
        </td>
        <td className="ahl-col-chevron">
          <span className={`ahl-chevron${expanded ? " ahl-chevron--open" : ""}`}>
            ›
          </span>
        </td>
      </tr>

      {expanded && (
        <tr className="ahl-detail-row">
          <td colSpan={8}>
            <div className="ahl-detail-body">
              <div className="ahl-detail-grid">
                <div>
                  <div className="sw-chart-hint">Mensaje</div>
                  <div className="ahl-detail-val">
                    {alert.message ?? "Sin descripción adicional"}
                  </div>
                </div>
                <div>
                  <div className="sw-chart-hint">Sensor ID</div>
                  <div className="ahl-detail-val">
                    {alert.device_sensor_id ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="sw-chart-hint">Muestra ID</div>
                  <div className="ahl-detail-val">
                    {alert.sample_id ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="sw-chart-hint">Dispositivo</div>
                  <div className="ahl-detail-val">
                    {alert.device_code ?? "—"}
                  </div>
                </div>
                {alert.is_resolved && alert.resolved_at && (
                  <div>
                    <div className="sw-chart-hint">Resuelta el</div>
                    <div className="ahl-detail-val">
                      {formatDateTime(alert.resolved_at)}
                    </div>
                  </div>
                )}
                {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                  <div>
                    <div className="sw-chart-hint">Metadata</div>
                    <div className="ahl-detail-val ahl-detail-val--mono">
                      {JSON.stringify(alert.metadata, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AlertasHistorico() {
  const [levelFilter, setLevelFilter]   = useState("all");
  const [expandedId,  setExpandedId]    = useState(null);
  const [showResolved, setShowResolved] = useState(true);

  const {
    alerts: rawAlerts,
    rawAlerts: apiAlerts,
    loading,
    refreshing,
    error,
    range,
    setRange,
    reload,
  } = useAlerts("esp32-node-001", "24h");

  const { weather, loading: weatherLoading, error: weatherError } =
    useWeather(-16.5, -68.15);

  // Recarga cuando llega un snapshot nuevo
  const handleSocketUpdate = useCallback(() => {
    reload();
  }, [reload]);
  useSocketSnapshot(handleSocketUpdate);

  // ─── Filtrado ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return apiAlerts.filter((a) => {
      if (levelFilter !== "all" && a.level !== levelFilter) return false;
      if (!showResolved && a.is_resolved) return false;
      return true;
    });
  }, [apiAlerts, levelFilter, showResolved]);

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = apiAlerts.length;
    const danger  = apiAlerts.filter((a) => a.level === "danger").length;
    const warning = apiAlerts.filter((a) => a.level === "warning").length;
    const open    = apiAlerts.filter((a) => !a.is_resolved).length;
    const resolved= apiAlerts.filter((a) =>  a.is_resolved).length;

    // Métrica más frecuente en alertas
    const codeCounts = {};
    apiAlerts.forEach((a) => {
      if (a.code) codeCounts[a.code] = (codeCounts[a.code] ?? 0) + 1;
    });
    const topCode = Object.entries(codeCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, danger, warning, open, resolved, topCode };
  }, [apiAlerts]);

  const toggleRow = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="sw-section">
      {/* Topbar */}
      <div
        className="sw-topbar sw-topbar--glass"
        style={{ position: "static", borderRadius: 18 }}
      >
        <div>
          <div className="sw-page-title">Historial de alertas</div>
          <div className="sw-page-sub">
            Registro completo · esp32-node-001
            {refreshing && (
              <span style={{ marginLeft: 12, fontWeight: 600 }}>
                Actualizando...
              </span>
            )}
          </div>
        </div>
        <div className="sw-topbar-right">
          <select
            className="sw-range-select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clima */}
      <WeatherStrip
        weather={weather}
        loading={weatherLoading}
        error={weatherError}
      />

      {/* KPIs */}
      <div className="sw-kpi-grid">
        <KpiMini
          label="Total alertas"
          value={stats.total}
          hint={`En el rango: ${range}`}
        />
        <KpiMini
          label="Peligro"
          value={stats.danger}
          hint="Nivel crítico"
          accentColor="#A32D2D"
        />
        <KpiMini
          label="Advertencias"
          value={stats.warning}
          hint="Nivel moderado"
          accentColor="#BA7517"
        />
        <KpiMini
          label="Abiertas"
          value={stats.open}
          hint="Sin resolver"
          accentColor={stats.open > 0 ? "#A32D2D" : undefined}
        />
        <KpiMini
          label="Resueltas"
          value={stats.resolved}
          hint="Cerradas"
          accentColor="#3B6D11"
        />
        <KpiMini
          label="Sensor más activo"
          value={stats.topCode ? stats.topCode[0] : "—"}
          hint={stats.topCode ? `${stats.topCode[1]} alertas` : "Sin datos"}
        />
      </div>

      {/* Filtros */}
      <div className="sw-card">
        <div className="sw-card-head">
          <span className="sw-card-title">Filtros</span>
        </div>
        <div className="sw-card-body" style={{ gap: 12 }}>
          <div className="sw-history-quick-row">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`sw-history-chip${levelFilter === opt.key ? " active" : ""}`}
                onClick={() => setLevelFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              className={`sw-history-chip${showResolved ? " active" : ""}`}
              onClick={() => setShowResolved((v) => !v)}
              style={{ marginLeft: "auto" }}
            >
              {showResolved ? "Ocultar resueltas" : "Mostrar resueltas"}
            </button>
          </div>
          <div className="sw-chart-hint">
            Mostrando <strong>{filtered.length}</strong> de{" "}
            <strong>{apiAlerts.length}</strong> alertas en el período.
          </div>
        </div>
      </div>

      {/* Estados de carga / error */}
      {loading && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Cargando alertas…</div>
        </div>
      )}

      {!loading && error && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Error al cargar</div>
          <div className="sw-chart-hint">{error}</div>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Sin alertas en este período</div>
          <div className="sw-chart-hint">
            Prueba ampliar el rango de tiempo o cambiar los filtros.
          </div>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && filtered.length > 0 && (
        <div className="sw-card">
          <div className="sw-card-head">
            <span className="sw-card-title">Detalle de alertas</span>
            <span className="sw-chart-hint">
              {filtered.length} fila{filtered.length !== 1 ? "s" : ""} · haz
              clic en una fila para ver más
            </span>
          </div>

          <div className="sw-history-table-wrap">
            <table className="sw-history-table ahl-table">
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Título</th>
                  <th>Métrica</th>
                  <th>Valor</th>
                  <th>Umbral</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    expanded={expandedId === alert.id}
                    onToggle={() => toggleRow(alert.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}