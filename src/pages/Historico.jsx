import { useEffect, useMemo, useState } from "react";
import SensorChart from "../components/SensorChart";

const QUICK_RANGES = [
  { key: "15m", label: "15 min", ms: 15 * 60 * 1000 },
  { key: "1h", label: "1 hora", ms: 60 * 60 * 1000 },
  { key: "6h", label: "6 horas", ms: 6 * 60 * 60 * 1000 },
  { key: "24h", label: "24 horas", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "7 días", ms: 7 * 24 * 60 * 60 * 1000 },
];

const SENSOR_OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "soil", label: "Humedad" },
  { key: "vib", label: "Vibración" },
  { key: "accel", label: "Inclinación" },
  { key: "gyro", label: "Rotación" },
];

function formatDateTimeLocal(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatDisplayDate(date) {
  return new Date(date).toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function max(arr) {
  if (!arr.length) return 0;
  return Math.max(...arr);
}

function min(arr) {
  if (!arr.length) return 0;
  return Math.min(...arr);
}

function getStatusCount(records) {
  let critical = 0;
  let warning = 0;

  records.forEach((r) => {
    if (r.soil <= 25 || r.vib >= 8 || r.accel >= 2.2) {
      critical++;
    } else if (
      (r.soil > 25 && r.soil <= 40) ||
      (r.vib >= 3 && r.vib < 8) ||
      (r.accel >= 1.3 && r.accel < 2.2)
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
        Ajusta el rango de fechas o verifica que existan datos guardados en el historial.
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
  const [allRecords, setAllRecords] = useState([]);
  const [selectedQuickRange, setSelectedQuickRange] = useState("1h");
  const [sensorFilter, setSensorFilter] = useState("all");

  const [startDate, setStartDate] = useState(() => {
    const now = Date.now();
    return formatDateTimeLocal(now - 60 * 60 * 1000);
  });

  const [endDate, setEndDate] = useState(() => formatDateTimeLocal(Date.now()));

  useEffect(() => {
    const raw = localStorage.getItem("slidewatch_history");
    if (!raw) {
      setAllRecords([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .filter((r) => r?.time)
          .map((r) => ({
            time: r.time,
            soil: Number(r.soil ?? 0),
            vib: Number(r.vib ?? 0),
            accel: Number(r.accel ?? 0),
            gyro: Number(r.gyro ?? 0),
            raw: Number(r.raw ?? 0),
            dur: Number(r.dur ?? 0),
          }))
          .sort((a, b) => new Date(a.time) - new Date(b.time));

        setAllRecords(normalized);
      } else {
        setAllRecords([]);
      }
    } catch (error) {
      console.error("Error leyendo slidewatch_history:", error);
      setAllRecords([]);
    }
  }, []);

  const applyQuickRange = (range) => {
    const found = QUICK_RANGES.find((r) => r.key === range);
    if (!found) return;

    const end = Date.now();
    const start = end - found.ms;

    setSelectedQuickRange(range);
    setStartDate(formatDateTimeLocal(start));
    setEndDate(formatDateTimeLocal(end));
  };

  const filteredRecords = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return allRecords.filter((r) => {
      const t = new Date(r.time).getTime();
      return t >= start && t <= end;
    });
  }, [allRecords, startDate, endDate]);

  const times = useMemo(() => {
    return filteredRecords.map((r) =>
      new Date(r.time).toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, [filteredRecords]);

  const soilData = filteredRecords.map((r) => r.soil);
  const vibData = filteredRecords.map((r) => r.vib);
  const accelData = filteredRecords.map((r) => r.accel);
  const gyroData = filteredRecords.map((r) => r.gyro);
  const rawData = filteredRecords.map((r) => r.raw);
  const durData = filteredRecords.map((r) => r.dur);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const soilAvg = average(soilData).toFixed(1);
    const vibAvg = average(vibData).toFixed(1);
    const accelAvg = average(accelData).toFixed(2);
    const gyroAvg = average(gyroData).toFixed(2);

    const soilMax = max(soilData).toFixed(1);
    const vibMax = max(vibData).toFixed(0);
    const accelMax = max(accelData).toFixed(2);
    const gyroMax = max(gyroData).toFixed(2);

    const soilMin = min(soilData).toFixed(1);
    const vibMin = min(vibData).toFixed(0);
    const accelMin = min(accelData).toFixed(2);
    const gyroMin = min(gyroData).toFixed(2);

    const counts = getStatusCount(filteredRecords);

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
  }, [filteredRecords, soilData, vibData, accelData, gyroData]);

  const visibleCharts = useMemo(() => {
    if (sensorFilter === "soil") return ["soil", "raw"];
    if (sensorFilter === "vib") return ["vib", "dur"];
    if (sensorFilter === "accel") return ["accel"];
    if (sensorFilter === "gyro") return ["gyro"];
    return ["soil", "vib", "accel", "gyro"];
  }, [sensorFilter]);

  return (
    <div className="sw-section">
      <div className="sw-topbar sw-topbar--glass" style={{ position: "static", borderRadius: 18 }}>
        <div>
          <div className="sw-page-title">Histórico de mediciones</div>
          <div className="sw-page-sub">
            Consulta datos almacenados por rango de tiempo
          </div>
        </div>
      </div>

      <div className="sw-card">
        <div className="sw-card-head">
          <span className="sw-card-title">Filtros de consulta</span>
        </div>

        <div className="sw-card-body" style={{ gap: 16 }}>
          <div className="sw-history-quick-row">
            {QUICK_RANGES.map((range) => (
              <button
                key={range.key}
                type="button"
                className={`sw-history-chip ${selectedQuickRange === range.key ? "active" : ""}`}
                onClick={() => applyQuickRange(range.key)}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="sw-history-filters-grid">
            <div className="sw-history-field">
              <label className="sw-history-label">Fecha y hora inicio</label>
              <input
                type="datetime-local"
                className="sw-history-input"
                value={startDate}
                onChange={(e) => {
                  setSelectedQuickRange("");
                  setStartDate(e.target.value);
                }}
              />
            </div>

            <div className="sw-history-field">
              <label className="sw-history-label">Fecha y hora fin</label>
              <input
                type="datetime-local"
                className="sw-history-input"
                value={endDate}
                onChange={(e) => {
                  setSelectedQuickRange("");
                  setEndDate(e.target.value);
                }}
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
          </div>

          <div className="sw-chart-hint">
            Mostrando registros desde <strong>{formatDisplayDate(startDate)}</strong> hasta{" "}
            <strong>{formatDisplayDate(endDate)}</strong>.
          </div>
        </div>
      </div>

      {!filteredRecords.length ? (
        <EmptyState />
      ) : (
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
              value={`${Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 60000))} min`}
              hint="Duración del filtro actual"
            />
          </div>

          <div className="sw-kpi-grid">
            <KpiMini
              label="Humedad promedio"
              value={`${stats.soilAvg}%`}
              hint={`mín ${stats.soilMin}% · máx ${stats.soilMax}%`}
            />
            <KpiMini
              label="Vibración promedio"
              value={stats.vibAvg}
              hint={`mín ${stats.vibMin} · máx ${stats.vibMax}`}
            />
            <KpiMini
              label="Inclinación promedio"
              value={stats.accelAvg}
              hint={`mín ${stats.accelMin} · máx ${stats.accelMax}`}
            />
            <KpiMini
              label="Rotación promedio"
              value={stats.gyroAvg}
              hint={`mín ${stats.gyroMin} · máx ${stats.gyroMax}`}
            />
          </div>

          <div className="sw-chart-grid">
            {visibleCharts.includes("soil") && (
              <SensorChart
                title="Humedad del suelo (%)"
                data={soilData}
                times={times}
                color="#7a6555"
                threshold={25}
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
                title="Magnitud de inclinación (m/s²)"
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
                threshold={null}
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
                threshold={null}
                unit="ms"
              />
            )}
          </div>

          <div className="sw-card">
            <div className="sw-card-head">
              <span className="sw-card-title">Tabla de registros</span>
              <span className="sw-chart-hint">
                {filteredRecords.length} fila{filteredRecords.length !== 1 ? "s" : ""}
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
                  {filteredRecords
                    .slice()
                    .reverse()
                    .map((row, index) => (
                      <tr key={`${row.time}-${index}`}>
                        <td>{formatDisplayDate(row.time)}</td>
                        <td>{row.soil.toFixed(1)}%</td>
                        <td>{row.vib}</td>
                        <td>{row.accel.toFixed(3)}</td>
                        <td>{row.gyro.toFixed(3)}</td>
                        <td>{row.raw}</td>
                        <td>{row.dur} ms</td>
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