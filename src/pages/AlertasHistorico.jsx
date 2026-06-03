import { useCallback, useMemo, useState } from "react";
import { useRiskHistory } from "../hooks/useRiskHistory";
import { useSocketSnapshot } from "../hooks/useSocketSnapshot";
import { useWeather } from "../hooks/useWeather";
import { formatDateTime, formatHour, formatNumber } from "../utils/formatters";
import "../styles/alertasHistorico.css";

// ─── Rangos ───────────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { key: "1h",  label: "1 hora"   },
  { key: "6h",  label: "6 horas"  },
  { key: "12h", label: "12 horas" },
  { key: "24h", label: "24 horas" },
  { key: "2d",  label: "2 días"   },
  { key: "7d",  label: "7 días"   },
  { key: "30d", label: "30 días"  },
];

const LEVEL_FILTER_OPTIONS = [
  { key: "all",     label: "Todos"        },
  { key: "danger",  label: "Peligro"      },
  { key: "warning", label: "Advertencia"  },
  { key: "normal",  label: "Normal"       },
];

// ─── Metadatos visuales por nivel ─────────────────────────────────────────────
const LEVEL_META = {
  danger:  { label: "Peligro",     cls: "high",    dot: "#A32D2D", bar: "#A32D2D" },
  warning: { label: "Advertencia", cls: "med",     dot: "#BA7517", bar: "#BA7517" },
  normal:  { label: "Normal",      cls: "low",     dot: "#3B6D11", bar: "#3B6D11" },
};

function levelMeta(level) {
  return LEVEL_META[level] ?? LEVEL_META.normal;
}

// ─── Barra de score ───────────────────────────────────────────────────────────
function RiskScoreBar({ score, level }) {
  const pct   = Math.min(100, Math.max(0, Number(score) || 0));
  const color = levelMeta(level).bar;
  return (
    <div className="ahl-risk-bar-wrap">
      <div className="ahl-risk-bar-track">
        <div className="ahl-risk-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="ahl-risk-bar-label" style={{ color }}>
        {pct % 1 === 0 ? pct : pct.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Clima ────────────────────────────────────────────────────────────────────
function WeatherStrip({ weather, loading, error }) {
  if (loading) return (
    <div className="sw-card ahl-weather-strip">
      <span className="sw-chart-hint">Obteniendo clima…</span>
    </div>
  );
  if (error || !weather) return (
    <div className="sw-card ahl-weather-strip">
      <span className="sw-chart-hint">Clima no disponible</span>
    </div>
  );

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
        {[
          { val: `${weather.temperature}°C`,       lbl: "Temperatura"   },
          { val: `${weather.feelsLike}°C`,          lbl: "Sensación"     },
          { val: `${weather.humidity}%`,            lbl: "Humedad amb."  },
          { val: `${weather.windSpeed} km/h`,       lbl: "Viento"        },
          { val: `${weather.rainProbability}%`,     lbl: "Prob. lluvia"  },
          { val: `${weather.precipitation} mm`,     lbl: "Precipitación" },
        ].map(({ val, lbl }) => (
          <div key={lbl} className="ahl-wkpi">
            <span className="ahl-wkpi-val">{val}</span>
            <span className="sw-chart-hint">{lbl}</span>
          </div>
        ))}
      </div>
      <div className="ahl-weather-risk" style={{ borderColor: riskColors[weather.soilRisk] }}>
        <span className="ahl-weather-risk-dot" style={{ background: riskColors[weather.soilRisk] }} />
        <span className="sw-chart-hint" style={{ color: riskColors[weather.soilRisk] }}>
          {riskLabels[weather.soilRisk]}
        </span>
      </div>
    </div>
  );
}

// ─── KPI ──────────────────────────────────────────────────────────────────────
function KpiMini({ label, value, hint, accentColor }) {
  return (
    <div className="sw-kpi" style={accentColor ? { borderTop: `3px solid ${accentColor}` } : {}}>
      <div className="sw-kpi-label">{label}</div>
      <div className="sw-kpi-val-row"><div className="sw-kpi-val">{value}</div></div>
      <div className="sw-chart-hint">{hint}</div>
    </div>
  );
}

// ─── Fila expandible ──────────────────────────────────────────────────────────
function SampleRow({ row, expanded, onToggle }) {
  const meta = levelMeta(row.risk_level);
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
        <td className="ahl-col-val">
          <RiskScoreBar score={row.risk_score} level={row.risk_level} />
        </td>
        <td className="ahl-col-time">{formatDateTime(row.sampled_at)}</td>
        <td className="ahl-col-chevron">
          <span className={`ahl-chevron${expanded ? " ahl-chevron--open" : ""}`}>›</span>
        </td>
      </tr>

      {expanded && (
        <tr className="ahl-detail-row">
          <td colSpan={4}>
            <div className="ahl-detail-body">
              <div className="ahl-detail-grid">
                <div>
                  <div className="sw-chart-hint">Sample ID</div>
                  <div className="ahl-detail-val"><code>{row.sample_id}</code></div>
                </div>
                <div>
                  <div className="sw-chart-hint">Nivel de riesgo</div>
                  <div className="ahl-detail-val" style={{ color: meta.dot, fontWeight: 600 }}>
                    {meta.label}
                  </div>
                </div>
                <div>
                  <div className="sw-chart-hint">Score del modelo</div>
                  <div className="ahl-detail-val">
                    {formatNumber(Number(row.risk_score), 4)}
                  </div>
                </div>
                <div>
                  <div className="sw-chart-hint">Fecha y hora</div>
                  <div className="ahl-detail-val">{formatDateTime(row.sampled_at)}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function AlertasHistorico() {
  const [levelFilter,  setLevelFilter]  = useState("all");
  const [expandedId,   setExpandedId]   = useState(null);

  const {
    deviceCode, range, setRange,
    rows, from, setFrom, to, setTo,
    loading, refreshing, error,
    reloadByRange, reloadByDates,
  } = useRiskHistory("esp32-node-001", "24h");

  const { weather, loading: weatherLoading, error: weatherError } =
    useWeather(-16.5, -68.15);

  const handleSocketUpdate = useCallback(() => {
    if (from && to) reloadByDates();
    else            reloadByRange();
  }, [from, to, reloadByRange, reloadByDates]);
  useSocketSnapshot(handleSocketUpdate);

  // ─── Filtrado ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    levelFilter === "all"
      ? rows
      : rows.filter((r) => r.risk_level === levelFilter),
    [rows, levelFilter]
  );

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = rows.length;
    const danger  = rows.filter((r) => r.risk_level === "danger").length;
    const warning = rows.filter((r) => r.risk_level === "warning").length;
    const normal  = rows.filter((r) => r.risk_level === "normal").length;
    const scores  = rows.map((r) => Number(r.risk_score) || 0);
    const avgScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    return { total, danger, warning, normal, avgScore, maxScore };
  }, [rows]);

  const toggleRow = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="sw-section">
      {/* Topbar */}
      <div className="sw-topbar sw-topbar--glass" style={{ position: "static", borderRadius: 18 }}>
        <div>
          <div className="sw-page-title">Historial de riesgo</div>
          <div className="sw-page-sub">
            Muestras del dispositivo · {deviceCode}
            {refreshing && <span style={{ marginLeft: 12, fontWeight: 600 }}>Actualizando...</span>}
          </div>
        </div>
        <div className="sw-topbar-right">
          <select className="sw-range-select" value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clima */}
      <WeatherStrip weather={weather} loading={weatherLoading} error={weatherError} />

      {/* KPIs */}
      <div className="sw-kpi-grid">
        <KpiMini label="Total muestras"  value={stats.total}                          hint={`Rango: ${range}`} />
        <KpiMini label="Peligro"         value={stats.danger}                         hint="risk_level = danger"  accentColor="#A32D2D" />
        <KpiMini label="Advertencia"     value={stats.warning}                        hint="risk_level = warning" accentColor="#BA7517" />
        <KpiMini label="Normal"          value={stats.normal}                         hint="risk_level = normal"  accentColor="#3B6D11" />
        <KpiMini label="Score promedio"  value={formatNumber(stats.avgScore, 2)}      hint="Del modelo ESP32" />
        <KpiMini label="Score máximo"    value={formatNumber(stats.maxScore, 2)}      hint="Pico en el período" accentColor={stats.maxScore >= 70 ? "#A32D2D" : stats.maxScore >= 30 ? "#BA7517" : undefined} />
      </div>

      {/* Filtros de nivel */}
      <div className="sw-card">
        <div className="sw-card-head"><span className="sw-card-title">Filtros</span></div>
        <div className="sw-card-body" style={{ gap: 12 }}>

          {/* Filtro rápido por rango de fechas */}
          <div className="sw-history-filters-grid">
            <div className="sw-history-field">
              <label className="sw-history-label">Fecha inicio</label>
              <input type="datetime-local" className="sw-history-input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="sw-history-field">
              <label className="sw-history-label">Fecha fin</label>
              <input type="datetime-local" className="sw-history-input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="sw-history-field">
              <label className="sw-history-label">Consulta personalizada</label>
              <button type="button" className="sw-history-chip active" onClick={reloadByDates} style={{ width: "100%" }}>
                Buscar por fechas
              </button>
            </div>
          </div>

          {/* Filtro por nivel */}
          <div className="sw-history-quick-row">
            {LEVEL_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`sw-history-chip${levelFilter === opt.key ? " active" : ""}`}
                onClick={() => setLevelFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="sw-chart-hint">
            Mostrando <strong>{filtered.length}</strong> de <strong>{rows.length}</strong> muestras.
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Cargando historial…</div>
        </div>
      )}
      {!loading && error && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Error</div>
          <div className="sw-chart-hint">{error}</div>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Sin muestras en este período</div>
          <div className="sw-chart-hint">Ajusta el rango o los filtros.</div>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && filtered.length > 0 && (
        <div className="sw-card">
          <div className="sw-card-head">
            <span className="sw-card-title">Detalle de muestras</span>
            <span className="sw-chart-hint">
              {filtered.length} fila{filtered.length !== 1 ? "s" : ""} · clic para expandir
            </span>
          </div>
          <div className="sw-history-table-wrap">
            <table className="sw-history-table ahl-table">
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Score del modelo</th>
                  <th>Fecha y hora</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <SampleRow
                    key={row.sample_id}
                    row={row}
                    expanded={expandedId === row.sample_id}
                    onToggle={() => toggleRow(row.sample_id)}
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