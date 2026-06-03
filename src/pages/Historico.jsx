import { useCallback, useMemo, useState } from "react";
import SensorChart from "../components/dashboard/SensorChart";
import { useHistoryData } from "../hooks/useHistoryData";
import { useSocketSnapshot } from "../hooks/useSocketSnapshot";
import { formatDateTime, formatHour, formatNumber } from "../utils/formatters";

const QUICK_RANGES = [
  { key: "10s", label: "10 seg" },
  { key: "30s", label: "30 seg" },
  { key: "1m", label: "1 min" },
  { key: "5m", label: "5 min" },
  { key: "15m", label: "15 min" },
  { key: "1h", label: "1 hora" },
  { key: "6h", label: "6 horas" },
  { key: "24h", label: "24 horas" },
  { key: "7d", label: "7 días" },
];

const SENSOR_OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "soil", label: "Humedad" },
  { key: "vib", label: "Vibración" },
  { key: "accel", label: "Inclinación" },
  { key: "gyro", label: "Rotación" },
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

function getStatusCount(records) {
  let critical = 0;
  let warning = 0;

  records.forEach((r) => {
    if (r.soil >= 80 || r.vib >= 8 || r.accel >= 2.2 || r.gyro >= 1.5) {
      critical++;
    } else if (
      (r.soil >= 60 && r.soil < 80) ||
      (r.vib >= 3 && r.vib < 8) ||
      (r.accel >= 1.3 && r.accel < 2.2) ||
      (r.gyro >= 0.8 && r.gyro < 1.5)
    ) {
      warning++;
    }
  });

  return { critical, warning };
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

function KpiMini({ label, value, hint }) {
  return (
    <div className="sw-kpi">
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
    deviceCode,
    range,
    setRange,
    history,
    from,
    setFrom,
    to,
    setTo,
    loading,
    refreshing,
    error,
    reloadByRange,
    reloadByDates,
  } = useHistoryData("esp32-node-001", "24h");

  const [sensorFilter, setSensorFilter] = useState("all");

  const handleSocketUpdate = useCallback(() => {
    if (from && to) {
      reloadByDates();
    } else {
      reloadByRange();
    }
  }, [from, to, reloadByDates, reloadByRange]);

  useSocketSnapshot(handleSocketUpdate);

  const records = Array.isArray(history?.records) ? history.records : [];
  const times = Array.isArray(history?.times)
    ? history.times.map((t) => formatHour(t))
    : [];

  const soilData = history?.soil || [];
  const vibData = history?.vib || [];
  const accelData = history?.accel || [];
  const gyroData = history?.gyro || [];
  const rawData = history?.raw || [];
  const durData = history?.dur || [];

  const stats = useMemo(() => {
    const total = records.length;
    const soilAvg = average(soilData);
    const vibAvg = average(vibData);
    const accelAvg = average(accelData);
    const gyroAvg = average(gyroData);

    const soilMax = max(soilData);
    const vibMax = max(vibData);
    const accelMax = max(accelData);
    const gyroMax = max(gyroData);

    const soilMin = min(soilData);
    const vibMin = min(vibData);
    const accelMin = min(accelData);
    const gyroMin = min(gyroData);

    const counts = getStatusCount(records);

    return {
      total,
      soilAvg,
      vibAvg,
      accelAvg,
      gyroAvg,
      soilMax,
      vibMax,
      accelMax,
      gyroMax,
      soilMin,
      vibMin,
      accelMin,
      gyroMin,
      critical: counts.critical,
      warning: counts.warning,
    };
  }, [records, soilData, vibData, accelData, gyroData]);

  const visibleCharts = useMemo(() => {
    if (sensorFilter === "soil") return ["soil", "raw"];
    if (sensorFilter === "vib") return ["vib", "dur"];
    if (sensorFilter === "accel") return ["accel"];
    if (sensorFilter === "gyro") return ["gyro"];
    return ["soil", "vib", "accel", "gyro"];
  }, [sensorFilter]);

  const applyQuickRange = (nextRange) => {
    setRange(nextRange);
  };

  const handleCustomDateSearch = async () => {
    await reloadByDates();
  };

  return (
    <div className="sw-section">
      <div
        className="sw-topbar sw-topbar--glass"
        style={{ position: "static", borderRadius: 18 }}
      >
        <div>
          <div className="sw-page-title">Histórico de mediciones</div>
          <div className="sw-page-sub">
            Consulta datos almacenados por rango de tiempo · {deviceCode}
          </div>
        </div>

        {refreshing && (
          <div className="sw-chart-hint" style={{ fontWeight: 600 }}>
            Actualizando...
          </div>
        )}
      </div>

      <div className="sw-card">
        <div className="sw-card-head">
          <span className="sw-card-title">Filtros de consulta</span>
        </div>

        <div className="sw-card-body" style={{ gap: 16 }}>
          <div className="sw-history-quick-row">
            {QUICK_RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sw-history-chip ${
                  range === item.key ? "active" : ""
                }`}
                onClick={() => applyQuickRange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="sw-history-filters-grid">
            <div className="sw-history-field">
              <label className="sw-history-label">Fecha y hora inicio</label>
              <input
                type="datetime-local"
                className="sw-history-input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="sw-history-field">
              <label className="sw-history-label">Fecha y hora fin</label>
              <input
                type="datetime-local"
                className="sw-history-input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="sw-history-field">
              <label className="sw-history-label">Sensor</label>
              <select
                className="sw-history-input"
                value={sensorFilter}
                onChange={(e) => setSensorFilter(e.target.value)}
              >
                {SENSOR_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sw-history-field">
              <label className="sw-history-label">Consulta personalizada</label>
              <button
                type="button"
                className="sw-history-chip active"
                onClick={handleCustomDateSearch}
                style={{ width: "100%" }}
              >
                Buscar por fechas
              </button>
            </div>
          </div>

          <div className="sw-chart-hint">
            {from && to ? (
              <>
                Mostrando registros desde <strong>{formatDateTime(from)}</strong>{" "}
                hasta <strong>{formatDateTime(to)}</strong>.
              </>
            ) : (
              <>
                Mostrando registros del rango rápido <strong>{range}</strong>.
              </>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Cargando histórico...</div>
        </div>
      )}

      {!loading && error && (
        <div className="sw-card" style={{ padding: 24 }}>
          <div className="sw-card-title">Error</div>
          <div className="sw-chart-hint">{error}</div>
        </div>
      )}

      {!loading && !error && !records.length ? <EmptyState /> : null}

      {!loading && !error && records.length > 0 && (
        <>
          <div className="sw-kpi-grid">
            <KpiMini
              label="Muestras"
              value={stats.total}
              hint="Registros encontrados"
            />
            <KpiMini
              label="Alertas críticas"
              value={stats.critical}
              hint="Dentro del rango consultado"
            />
            <KpiMini
              label="Advertencias"
              value={stats.warning}
              hint="Cambios moderados detectados"
            />
            <KpiMini
              label="Período"
              value={range}
              hint="Filtro temporal actual"
            />
          </div>

          <div className="sw-kpi-grid">
            <KpiMini
              label="Humedad promedio"
              value={`${formatNumber(stats.soilAvg, 1)}%`}
              hint={`mín ${formatNumber(stats.soilMin, 1)}% · máx ${formatNumber(
                stats.soilMax,
                1
              )}%`}
            />
            <KpiMini
              label="Vibración promedio"
              value={formatNumber(stats.vibAvg, 1)}
              hint={`mín ${formatNumber(stats.vibMin, 0)} · máx ${formatNumber(
                stats.vibMax,
                0
              )}`}
            />
            <KpiMini
              label="Inclinación promedio"
              value={formatNumber(stats.accelAvg, 2)}
              hint={`mín ${formatNumber(stats.accelMin, 2)} · máx ${formatNumber(
                stats.accelMax,
                2
              )}`}
            />
            <KpiMini
              label="Rotación promedio"
              value={formatNumber(stats.gyroAvg, 2)}
              hint={`mín ${formatNumber(stats.gyroMin, 2)} · máx ${formatNumber(
                stats.gyroMax,
                2
              )}`}
            />
          </div>

          <div className="sw-chart-grid">
            {visibleCharts.includes("soil") && (
              <SensorChart
                title="Humedad del suelo (%)"
                data={soilData}
                times={times}
                color="#7a6555"
                threshold={80}
                unit="%"
              />
            )}

            {visibleCharts.includes("vib") && (
              <SensorChart
                title="Eventos de vibración"
                data={vibData}
                times={times}
                color="#5a7a3a"
                threshold={8}
                unit=""
              />
            )}

            {visibleCharts.includes("accel") && (
              <SensorChart
                title="Magnitud de inclinación"
                data={accelData}
                times={times}
                color="#8b5e3c"
                threshold={2.2}
                unit=""
              />
            )}

            {visibleCharts.includes("gyro") && (
              <SensorChart
                title="Rotación angular (°/s)"
                data={gyroData}
                times={times}
                color="#3a5560"
                threshold={1.5}
                unit=""
              />
            )}

            {visibleCharts.includes("raw") && (
              <SensorChart
                title="Lectura raw ADC"
                data={rawData}
                times={times}
                color="#a05828"
                threshold={null}
                unit=""
              />
            )}

            {visibleCharts.includes("dur") && (
              <SensorChart
                title="Duración de vibración (ms)"
                data={durData}
                times={times}
                color="#8c6a3d"
                threshold={300}
                unit="ms"
              />
            )}
          </div>

          <div className="sw-card">
            <div className="sw-card-head">
              <span className="sw-card-title">Tabla de registros</span>
              <span className="sw-chart-hint">
                {records.length} fila{records.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="sw-history-table-wrap">
              <table className="sw-history-table">
                <thead>
                  <tr>
                    <th>Fecha / hora</th>
                    <th>Humedad</th>
                    <th>Vibración</th>
                    <th>Inclinación</th>
                    <th>Rotación</th>
                    <th>Raw ADC</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {records
                    .slice()
                    .reverse()
                    .map((row, index) => (
                      <tr key={`${row.time}-${index}`}>
                        <td>{formatDateTime(row.time)}</td>
                        <td>{formatNumber(row.soil, 1)}%</td>
                        <td>{formatNumber(row.vib, 0)}</td>
                        <td>{formatNumber(row.accel, 3)}</td>
                        <td>{formatNumber(row.gyro, 3)}</td>
                        <td>{formatNumber(row.raw, 0)}</td>
                        <td>{formatNumber(row.dur, 0)} ms</td>
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