import { useCallback, useMemo, useState,useEffect } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import SensorChart from "../components/SensorChart";
import AlertPanel from "../components/AlertPanel";
import StatusPanel from "../components/StatusPanel";
import Historico from "./Historico";

import { useDashboardData } from "../hooks/useDashboardData";
import { useSocketSnapshot } from "../hooks/useSocketSnapshot";
import { formatHour, formatNumber, toNumeric } from "../utils/formatters";
import {
  getSoilStatus,
  getVibrationStatus,
  getAccelStatus,
  getGyroStatus,
  getRiskStatus,
  getTrend,
} from "../utils/statusHelpers";

const TABS = {
  GENERAL: "general",
  SOIL: "soil",
  VIBRATION: "vibration",
  MPU: "mpu",
  HISTORICAL: "historical",
};

function average(arr = []) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length;
}

function getRiskSummaryFromSnapshot(snapshot) {
  if (!snapshot) {
    return {
      label: "Sin datos",
      type: "neutral",
      description: "Aún no hay muestras disponibles.",
      score: 0,
    };
  }

  const risk = getRiskStatus(snapshot.risk_level);
  const score = toNumeric(snapshot.risk_score, 0);

  if (snapshot.risk_level === "danger") {
    return {
      label: "Riesgo alto",
      type: "high",
      description: "Se detectan condiciones que requieren atención inmediata.",
      score,
    };
  }

  if (snapshot.risk_level === "warning") {
    return {
      label: "Riesgo moderado",
      type: "med",
      description:
        "Hay variaciones relevantes; se recomienda seguimiento continuo.",
      score,
    };
  }

  return {
    label: "Riesgo bajo",
    type: risk.type,
    description:
      "Las variables actuales se mantienen dentro de parámetros esperados.",
    score,
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);

  const {
    deviceCode,
    range,
    setRange,
    snapshot,
    setSnapshot,
    series,
    loading,
    refreshing,
    error,
    reload,
  } = useDashboardData("esp32-node-001", "24h");
  useEffect(() => {
  if (activeTab === TABS.HISTORICAL) return;

  const interval = setInterval(() => {
      reload();
    }, 5000); // cada 5 segundos

    return () => clearInterval(interval);
  }, [activeTab, reload]);

  

  const handleSocketUpdate = useCallback(
    (incomingSnapshot) => {
      setSnapshot(incomingSnapshot);
    },
    [setSnapshot]
  );

  useSocketSnapshot(handleSocketUpdate);

  const data = useMemo(() => {
    return {
      soil: Array.isArray(series?.soil) ? series.soil : [],
      vib: Array.isArray(series?.vib) ? series.vib : [],
      accel: Array.isArray(series?.accel) ? series.accel : [],
      gyro: Array.isArray(series?.gyro) ? series.gyro : [],
      raw: Array.isArray(series?.raw) ? series.raw : [],
      dur: Array.isArray(series?.dur) ? series.dur : [],
      ax: Array.isArray(series?.ax) ? series.ax : [],
      ay: Array.isArray(series?.ay) ? series.ay : [],
      az: Array.isArray(series?.az) ? series.az : [],
      gx: Array.isArray(series?.gx) ? series.gx : [],
      gy: Array.isArray(series?.gy) ? series.gy : [],
      gz: Array.isArray(series?.gz) ? series.gz : [],
      times: Array.isArray(series?.times)
        ? series.times.map((t) => formatHour(t))
        : [],
    };
  }, [series]);

  const sv = toNumeric(snapshot?.soilPercent, 0);
  const vv = toNumeric(snapshot?.vibrationCount, 0);
  const av = toNumeric(snapshot?.accelMagnitude, 0);
  const gv = toNumeric(snapshot?.gyroMagnitude, 0);

  const soilStatus = getSoilStatus(sv);
  const vibStatus = getVibrationStatus(vv);
  const accelStatus = getAccelStatus(av);
  const gyroStatus = getGyroStatus(gv);

  const riskSummary = getRiskSummaryFromSnapshot(snapshot);

  const alerts = useMemo(() => {
    const items = [];

    if (soilStatus.type === "high") {
      items.push({
        title: "Humedad crítica del suelo",
        description: `${formatNumber(
          sv,
          0
        )}% — riesgo elevado de saturación`,
        type: "high",
      });
    } else if (soilStatus.type === "med") {
      items.push({
        title: "Humedad elevada",
        description: `${formatNumber(sv, 0)}% — vigilar tendencia`,
        type: "med",
      });
    }

    if (vibStatus.type === "high") {
      items.push({
        title: "Alta actividad vibratoria",
        description: `${vv} eventos en el intervalo actual`,
        type: "high",
      });
    } else if (vibStatus.type === "med") {
      items.push({
        title: "Vibración moderada",
        description: `${vv} eventos registrados`,
        type: "med",
      });
    }

    if (accelStatus.type === "high") {
      items.push({
        title: "Desplazamiento detectado",
        description: `Magnitud ${formatNumber(av, 2)} — anormal`,
        type: "high",
      });
    } else if (accelStatus.type === "med") {
      items.push({
        title: "Movimiento moderado",
        description: `Magnitud ${formatNumber(av, 2)} — observar evolución`,
        type: "med",
      });
    }

    if (gyroStatus.type === "high") {
      items.push({
        title: "Rotación crítica",
        description: `Magnitud ${formatNumber(gv, 2)} °/s`,
        type: "high",
      });
    } else if (gyroStatus.type === "med") {
      items.push({
        title: "Rotación moderada",
        description: `Magnitud ${formatNumber(gv, 2)} °/s`,
        type: "med",
      });
    }

    if (!items.length) {
      items.push({
        title: "Terreno estable",
        description: "Sin anomalías relevantes en este momento",
        type: "ok",
      });
    }

    return items;
  }, [sv, vv, av, gv, soilStatus, vibStatus, accelStatus, gyroStatus]);

  const criticalCount = alerts.filter((a) => a.type === "high").length;
  const avgSoil = average(data.soil);
  const avgVib = average(data.vib);
  const avgAccel = average(data.accel);

  const lastSampleTime = snapshot?.sampled_at
    ? formatHour(snapshot.sampled_at)
    : "--:--";

  const renderOverviewHero = () => (
    <div className={`sw-hero sw-hero--${riskSummary.type}`}>
      <div className="sw-hero-left">
        <div className="sw-hero-badge">
          <span className={`sw-hero-dot sw-hero-dot--${riskSummary.type}`} />
          Estado general del sitio
        </div>

        <h1 className="sw-hero-title">{riskSummary.label}</h1>
        <p className="sw-hero-text">{riskSummary.description}</p>

        <div className="sw-hero-meta">
          <div className="sw-hero-meta-card">
            <span className="sw-hero-meta-label">Estación</span>
            <strong>{snapshot?.device_name || "Monitoreo N-01"}</strong>
          </div>
          <div className="sw-hero-meta-card">
            <span className="sw-hero-meta-label">Última lectura</span>
            <strong>{lastSampleTime}</strong>
          </div>
          <div className="sw-hero-meta-card">
            <span className="sw-hero-meta-label">Alertas críticas</span>
            <strong>{criticalCount}</strong>
          </div>
        </div>
      </div>

      <div className="sw-hero-right">
        <div className="sw-risk-ring">
          <div className="sw-risk-ring-inner">
            <span className="sw-risk-ring-value">
              {formatNumber(riskSummary.score, 0)}%
            </span>
            <span className="sw-risk-ring-label">índice de riesgo</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuickMetrics = () => (
    <div className="sw-mini-grid">
      <div className="sw-mini-card">
        <span className="sw-mini-label">Promedio humedad</span>
        <strong>{formatNumber(avgSoil, 1)}%</strong>
      </div>
      <div className="sw-mini-card">
        <span className="sw-mini-label">Promedio vibración</span>
        <strong>{formatNumber(avgVib, 1)} evt</strong>
      </div>
      <div className="sw-mini-card">
        <span className="sw-mini-label">Promedio inclinación</span>
        <strong>{formatNumber(avgAccel, 2)}</strong>
      </div>
      <div className="sw-mini-card">
        <span className="sw-mini-label">Sensores activos</span>
        <strong>4 / 4</strong>
      </div>
    </div>
  );

  const renderGeneral = () => (
    
    <div className="sw-section">
      {renderOverviewHero()}
      {renderQuickMetrics()}

      <div className="sw-kpi-grid">
        <StatCard
          label="Humedad del suelo"
          value={`${formatNumber(sv, 0)}`}
          unit="%"
          status={soilStatus}
          trend={getTrend(data.soil)}
          accentType={soilStatus.type}
        />
        <StatCard
          label="Vibración acumulada"
          value={`${vv}`}
          unit="eventos"
          status={vibStatus}
          trend={getTrend(data.vib)}
          accentType={vibStatus.type}
        />
        <StatCard
          label="Inclinación"
          value={`${formatNumber(av, 2)}`}
          unit=""
          status={accelStatus}
          trend={getTrend(data.accel)}
          accentType={accelStatus.type}
        />
        <StatCard
          label="Rotación angular"
          value={`${formatNumber(gv, 2)}`}
          unit="°/s"
          status={gyroStatus}
          trend={getTrend(data.gyro)}
          accentType={gyroStatus.type}
        />
      </div>

      <div className="sw-mid-grid">
        <AlertPanel alerts={alerts} criticalCount={criticalCount} />
        <StatusPanel
          soilStatus={soilStatus}
          vibStatus={vibStatus}
          accelStatus={accelStatus}
          lastChange={{
            soil: Date.now(),
            vib: Date.now(),
            accel: Date.now(),
          }}
        />
      </div>

      <div className="sw-chart-grid">
        <SensorChart
          title="Humedad del suelo (%)"
          data={data.soil}
          times={data.times}
          color="#7a6555"
          threshold={80}
          unit="%"
        />
        <SensorChart
          title="Eventos de vibración"
          data={data.vib}
          times={data.times}
          color="#5a7a3a"
          threshold={8}
          unit=""
        />
        <SensorChart
          title="Magnitud de inclinación"
          data={data.accel}
          times={data.times}
          color="#8b5e3c"
          threshold={2.2}
          unit=""
        />
        <SensorChart
          title="Rotación angular (°/s)"
          data={data.gyro}
          times={data.times}
          color="#3a5560"
          threshold={1.5}
          unit=""
        />
      </div>
    </div>
  );

  const renderSoil = () => (
    <div className="sw-section">
      <div className="sw-kpi-grid">
        <StatCard
          label="Humedad actual"
          value={`${formatNumber(sv, 0)}`}
          unit="%"
          status={soilStatus}
          trend={getTrend(data.soil)}
          accentType={soilStatus.type}
        />
        <StatCard
          label="Valor raw ADC"
          value={`${formatNumber(snapshot?.soilRaw, 0)}`}
          unit=""
          status={{ label: "Lectura directa", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
        <StatCard
          label="Promedio"
          value={`${formatNumber(avgSoil, 1)}`}
          unit="%"
          status={{ label: "Referencia", type: "low" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="low"
        />
      </div>

      <div className="sw-chart-grid">
        <SensorChart
          title="Porcentaje de humedad (%)"
          data={data.soil}
          times={data.times}
          color="#7a6555"
          threshold={80}
          unit="%"
        />
        <SensorChart
          title="Lectura raw ADC"
          data={data.raw}
          times={data.times}
          color="#a05828"
          threshold={null}
          unit=""
        />
      </div>
    </div>
  );

  const renderVibration = () => (
    <div className="sw-section">
      <div className="sw-kpi-grid">
        <StatCard
          label="Eventos detectados"
          value={`${vv}`}
          unit=""
          status={vibStatus}
          trend={getTrend(data.vib)}
          accentType={vibStatus.type}
        />
        <StatCard
          label="Duración total"
          value={`${formatNumber(snapshot?.vibrationDurationMs, 0)}`}
          unit="ms"
          status={{ label: "Monitoreo", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
        <StatCard
          label="Estado digital"
          value={toNumeric(snapshot?.vibrationDetected, 0) ? "Sí" : "No"}
          unit=""
          status={
            toNumeric(snapshot?.vibrationDetected, 0)
              ? { label: "Detectada", type: "med" }
              : { label: "Sin detección", type: "low" }
          }
          trend={{ cls: "flat", txt: "—" }}
          accentType={
            toNumeric(snapshot?.vibrationDetected, 0) ? "med" : "low"
          }
        />
      </div>

      <div className="sw-chart-grid">
        <SensorChart
          title="Eventos por intervalo"
          data={data.vib}
          times={data.times}
          color="#5a7a3a"
          threshold={8}
          unit=""
        />
        <SensorChart
          title="Duración de vibración (ms)"
          data={data.dur}
          times={data.times}
          color="#a05828"
          threshold={300}
          unit="ms"
        />
      </div>
    </div>
  );

  const renderMPU = () => (
    <div className="sw-section">
      <div className="sw-kpi-grid">
        <StatCard
          label="Inclinación total"
          value={`${formatNumber(av, 2)}`}
          unit=""
          status={accelStatus}
          trend={getTrend(data.accel)}
          accentType={accelStatus.type}
        />
        <StatCard
          label="Rotación total"
          value={`${formatNumber(gv, 2)}`}
          unit="°/s"
          status={gyroStatus}
          trend={getTrend(data.gyro)}
          accentType={gyroStatus.type}
        />
        <StatCard
          label="Accel X"
          value={`${formatNumber(snapshot?.accelX, 2)}`}
          unit=""
          status={{ label: "Normal", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
        <StatCard
          label="Gyro X"
          value={`${formatNumber(snapshot?.gyroX, 2)}`}
          unit=""
          status={{ label: "Normal", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
      </div>

      <div className="sw-chart-grid">
        <SensorChart
          title="Aceleración X"
          data={data.ax}
          times={data.times}
          color="#3a5560"
          threshold={null}
          unit=""
        />
        <SensorChart
          title="Aceleración Y"
          data={data.ay}
          times={data.times}
          color="#5a7a3a"
          threshold={null}
          unit=""
        />
        <SensorChart
          title="Aceleración Z"
          data={data.az}
          times={data.times}
          color="#8b5e3c"
          threshold={null}
          unit=""
        />
        <SensorChart
          title="Giro X"
          data={data.gx}
          times={data.times}
          color="#7a6555"
          threshold={null}
          unit=""
        />
      </div>
    </div>
  );

  const PAGE_META = {
    [TABS.GENERAL]: {
      title: "Resumen del terreno",
      sub: "Monitoreo en tiempo real",
    },
    [TABS.SOIL]: {
      title: "Humedad del suelo",
      sub: "Sensor capacitivo",
    },
    [TABS.VIBRATION]: {
      title: "Sismicidad y vibración",
      sub: "Sensor de vibración",
    },
    [TABS.MPU]: {
      title: "Inclinación y movimiento",
      sub: "Acelerómetro + giroscopio MPU6050",
    },
    [TABS.HISTORICAL]: {
      title: "Histórico de eventos",
      sub: "Registro completo de sensores",
    },
  };

  const meta = PAGE_META[activeTab];

  return (
    <div className="sw-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={TABS}
        criticalCount={criticalCount}
      />

      <div className="sw-main">
        <div className="sw-topbar sw-topbar--glass">
          <div>
            <div className="sw-page-title">{meta.title}</div>
            <div className="sw-page-sub">
              {meta.sub} · {snapshot?.device_name || deviceCode}
            </div>
          </div>

          <div className="sw-topbar-right">
            <span className="sw-live-pill">
              <span className="sw-live-dot" />
              En línea
            </span>

            {refreshing && (
              <span className="sw-chart-hint" style={{ fontWeight: 600 }}>
                Actualizando...
              </span>
            )}

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="sw-range-select"
            >
              <option value="10s">10s</option>
              <option value="30s">30s</option>
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="1h">1h</option>
              <option value="6h">6h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
            </select>

            <span className="sw-clock">{lastSampleTime}</span>
            <span className="sw-coord">
              {snapshot?.location_name || "Ubicación no disponible"}
            </span>
          </div>
        </div>

        <div className="sw-content">
          {loading && (
            <div className="sw-section">
              <div className="sw-mini-card">Cargando datos del dashboard...</div>
            </div>
          )}

          {!loading && error && (
            <div className="sw-section">
              <div className="sw-mini-card">Error: {error}</div>
            </div>
          )}

          {!loading && !error && activeTab === TABS.GENERAL && renderGeneral()}
          {!loading && !error && activeTab === TABS.SOIL && renderSoil()}
          {!loading && !error && activeTab === TABS.VIBRATION && renderVibration()}
          {!loading && !error && activeTab === TABS.MPU && renderMPU()}
          {activeTab === TABS.HISTORICAL && <Historico />}
        </div>
      </div>
    </div>
  );
}