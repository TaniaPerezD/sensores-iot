import { useCallback, useMemo, useState } from "react";
import SensorChart from "../components/dashboard/SensorChart";
import { useHistoryData } from "../hooks/useHistoryData";
import { useRiskHistory } from "../hooks/useRiskHistory";
import { useSocketSnapshot } from "../hooks/useSocketSnapshot";
import { formatDateTime, formatHour, formatNumber } from "../utils/formatters";

const QUICK_RANGES = [
  { key: "10s", label: "10 seg" },
  { key: "30s", label: "30 seg" },
  { key: "1m",  label: "1 min"  },
  { key: "5m",  label: "5 min"  },
  { key: "15m", label: "15 min" },
  { key: "1h",  label: "1 hora" },
  { key: "6h",  label: "6 horas"},
  { key: "24h", label: "24 horas"},
  { key: "7d",  label: "7 días" },
];

const SENSOR_OPTIONS = [
  { key: "all",   label: "Todos"       },
  { key: "soil",  label: "Humedad"     },
  { key: "vib",   label: "Vibración"   },
  { key: "accel", label: "Inclinación" },
  { key: "gyro",  label: "Rotación"    },
];

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}
function max(arr) {
  if (!arr.length) return 0;
  return Math.max(...arr.map((v) => Number(v || 0)));
}
function min(arr) {
  if (!arr.length) return 0;
  return Math.min(...arr.map((v) => Number(v || 0)));
}

function EmptyState() {
  return (
    <div className="sw-card" style={{ padding: 24 }}>
      <div className="sw-card-title" style={{ marginBottom: 8 }}>
        Sin registros para este período
      </div>
      <div className="sw-chart-hint">
        Ajusta el rango de tiempo o verifica que existan muestras guardadas.
      </div>
    </div>
  );
}

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

export default function Historico() {
  const {
    deviceCode, range, setRange,
    history, from, setFrom, to, setTo,
    loading, refreshing, error,
    reloadByRange, reloadByDates,
  } = useHistoryData("esp32-node-001", "24h");

  // Risk history para KPIs de riesgo real (device_samples)
  const {
    rows: riskRows,
    range: riskRange,
    setRange: setRiskRange,
    reloadByRange: reloadRiskByRange,
    reloadByDates: reloadRiskByDates,
  } = useRiskHistory("esp32-node-001", "24h");

  const [sensorFilter, setSensorFilter] = useState("all");

  // Sync risk range with sensor range
  const handleRangeChange = (val) => {
    setRange(val);
    setRiskRange(val);
  };

  const handleSocketUpdate = useCallback(() => {
    if (from && to) { reloadByDates(); reloadRiskByDates(); }
    else            { reloadByRange(); reloadRiskByRange(); }
  }, [from, to, reloadByRange, reloadByDates, reloadRiskByRange, reloadRiskByDates]);
  useSocketSnapshot(handleSocketUpdate);

  const records   = Array.isArray(history?.records) ? history.records : [];
  const times     = Array.isArray(history?.times) ? history.times.map(formatHour) : [];
  const soilData  = history?.soil  || [];
  const vibData   = history?.vib   || [];
  const accelData = history?.accel || [];
  const gyroData  = history?.gyro  || [];
  const rawData   = history?.raw   || [];
  const durData   = history?.dur   || [];

  // Risk KPIs from device_samples
  const riskStats = useMemo(() => {
    const danger  = riskRows.filter((r) => r.risk_level === "danger").length;
    const warning = riskRows.filter((r) => r.risk_level === "warning").length;
    const scores  = riskRows.map((r) => Number(r.risk_score) || 0);
    const avgScore = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
    return { danger, warning, avgScore };
  }, [riskRows]);

  const stats = useMemo(() => {
    const total    = records.length;
    const soilAvg  = average(soilData);
    const vibAvg   = average(vibData);
    const accelAvg = average(accelData);
    const gyroAvg  = average(gyroData);
    return {
      total,
      soilAvg, soilMin: min(soilData), soilMax: max(soilData),
      vibAvg,  vibMin:  min(vibData),  vibMax:  max(vibData),
      accelAvg,accelMin:min(accelData),accelMax:max(accelData),
      gyroAvg, gyroMin: min(gyroData), gyroMax: max(gyroData),
    };
  }, [records, soilData, vibData, accelData, gyroData]);

  const visibleCharts = useMemo(() => {
    if (sensorFilter === "soil")  return ["soil", "raw"];
    if (sensorFilter === "vib")   return ["vib", "dur"];
    if (sensorFilter === "accel") return ["accel"];
    if (sensorFilter === "gyro")  return ["gyro"];
    return ["soil", "vib", "accel", "gyro"];
  }, [sensorFilter]);

  return (
    <div className="sw-section">
      <div className="sw-topbar sw-topbar--glass" style={{ position: "static", borderRadius: 18 }}>
        <div>
          <div className="sw-page-title">Histórico de mediciones</div>
          <div className="sw-page-sub">Consulta datos almacenados · {deviceCode}</div>
        </div>
        {refreshing && <div className="sw-chart-hint" style={{ fontWeight: 600 }}>Actualizando...</div>}
      </div>

      {/* Filtros */}
      <div className="sw-card">
        <div className="sw-card-head"><span className="sw-card-title">Filtros de consulta</span></div>
        <div className="sw-card-body" style={{ gap: 16 }}>
          <div className="sw-history-quick-row">
            {QUICK_RANGES.map((item) => (
              <button
                key={item.key} type="button"
                className={`sw-history-chip${range === item.key ? " active" : ""}`}
                onClick={() => handleRangeChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="sw-history-filters-grid">
            <div className="sw-history-field">
              <label className="sw-history-label">Fecha y hora inicio</label>
              <input type="datetime-local" className="sw-history-input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="sw-history-field">
              <label className="sw-history-label">Fecha y hora fin</label>
              <input type="datetime-local" className="sw-history-input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="sw-history-field">
              <label className="sw-history-label">Sensor</label>
              <select className="sw-history-input" value={sensorFilter} onChange={(e) => setSensorFilter(e.target.value)}>
                {SENSOR_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div className="sw-history-field">
              <label className="sw-history-label">Consulta personalizada</label>
              <button type="button" className="sw-history-chip active" onClick={() => { reloadByDates(); reloadRiskByDates(); }} style={{ width: "100%" }}>
                Buscar por fechas
              </button>
            </div>
          </div>
          <div className="sw-chart-hint">
            {from && to
              ? <>Mostrando desde <strong>{formatDateTime(from)}</strong> hasta <strong>{formatDateTime(to)}</strong>.</>
              : <>Rango rápido: <strong>{range}</strong>.</>}
          </div>
        </div>
      </div>

      {loading && <div className="sw-card" style={{ padding: 24 }}><div className="sw-card-title">Cargando histórico...</div></div>}
      {!loading && error && <div className="sw-card" style={{ padding: 24 }}><div className="sw-card-title">Error</div><div className="sw-chart-hint">{error}</div></div>}
      {!loading && !error && !records.length && <EmptyState />}

      {!loading && !error && records.length > 0 && (
        <>
          {/* KPIs de riesgo — de device_samples */}
          <div className="sw-kpi-grid">
            <KpiMini label="Muestras"           value={stats.total}                       hint="Registros encontrados" />
            <KpiMini label="Muestras peligro"   value={riskStats.danger}                  hint="risk_level = danger del ESP32"   accentColor="#A32D2D" />
            <KpiMini label="Muestras advertencia" value={riskStats.warning}               hint="risk_level = warning del ESP32"  accentColor="#BA7517" />
            <KpiMini label="Score promedio"     value={formatNumber(riskStats.avgScore,2)} hint="Modelo del dispositivo" />
          </div>

          {/* KPIs de sensores */}
          <div className="sw-kpi-grid">
            <KpiMini label="Humedad promedio"    value={`${formatNumber(stats.soilAvg,1)}%`}  hint={`mín ${formatNumber(stats.soilMin,1)}% · máx ${formatNumber(stats.soilMax,1)}%`} />
            <KpiMini label="Vibración promedio"  value={formatNumber(stats.vibAvg,1)}          hint={`mín ${formatNumber(stats.vibMin,0)} · máx ${formatNumber(stats.vibMax,0)}`} />
            <KpiMini label="Inclinación promedio"value={formatNumber(stats.accelAvg,2)}        hint={`mín ${formatNumber(stats.accelMin,2)} · máx ${formatNumber(stats.accelMax,2)}`} />
            <KpiMini label="Rotación promedio"   value={formatNumber(stats.gyroAvg,2)}         hint={`mín ${formatNumber(stats.gyroMin,2)} · máx ${formatNumber(stats.gyroMax,2)}`} />
          </div>

          {/* Gráficos */}
          <div className="sw-chart-grid">
            {visibleCharts.includes("soil")  && <SensorChart title="Humedad del suelo (%)"      data={soilData}  times={times} color="#7a6555" threshold={80}  unit="%" />}
            {visibleCharts.includes("vib")   && <SensorChart title="Eventos de vibración"        data={vibData}   times={times} color="#5a7a3a" threshold={8}   unit="" />}
            {visibleCharts.includes("accel") && <SensorChart title="Magnitud de inclinación"     data={accelData} times={times} color="#8b5e3c" threshold={2.2} unit="" />}
            {visibleCharts.includes("gyro")  && <SensorChart title="Rotación angular (°/s)"      data={gyroData}  times={times} color="#3a5560" threshold={1.5} unit="" />}
            {visibleCharts.includes("raw")   && <SensorChart title="Lectura raw ADC"             data={rawData}   times={times} color="#a05828" threshold={null} unit="" />}
            {visibleCharts.includes("dur")   && <SensorChart title="Duración de vibración (ms)"  data={durData}   times={times} color="#8c6a3d" threshold={300} unit="ms" />}
          </div>

          {/* Tabla */}
          <div className="sw-card">
            <div className="sw-card-head">
              <span className="sw-card-title">Tabla de registros</span>
              <span className="sw-chart-hint">{records.length} fila{records.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="sw-history-table-wrap">
              <table className="sw-history-table">
                <thead>
                  <tr>
                    <th>Fecha / hora</th><th>Humedad</th><th>Vibración</th>
                    <th>Inclinación</th><th>Rotación</th><th>Raw ADC</th><th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice().reverse().map((row, i) => (
                    <tr key={`${row.time}-${i}`}>
                      <td>{formatDateTime(row.time)}</td>
                      <td>{formatNumber(row.soil,1)}%</td>
                      <td>{formatNumber(row.vib,0)}</td>
                      <td>{formatNumber(row.accel,3)}</td>
                      <td>{formatNumber(row.gyro,3)}</td>
                      <td>{formatNumber(row.raw,0)}</td>
                      <td>{formatNumber(row.dur,0)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}