import { useMemo, useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import SensorChart from "../components/SensorChart";
import AlertPanel from "../components/AlertPanel";
import StatusPanel from "../components/StatusPanel";
import Historico from "./Historico";

const TABS = {
  GENERAL: "general",
  SOIL: "soil",
  VIBRATION: "vibration",
  MPU: "mpu",
  HISTORICAL: "historical",
};

const N = 48;

function genSeries(base, noise, n) {
  const d = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.5) * noise;
    v = Math.max(base - noise * 3.5, Math.min(base + noise * 3.5, v));
    d.push(parseFloat(v.toFixed(3)));
  }
  return d;
}

function genTimes(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 2000);
    return d.toTimeString().slice(0, 8);
  });
}

const INITIAL_DATA = {
  soil: genSeries(47, 9, N),
  vib: genSeries(2, 2, N).map((v) => Math.max(0, Math.round(v))),
  accel: genSeries(1.02, 0.13, N),
  gyro: genSeries(0.08, 0.04, N),
  raw: genSeries(1842, 80, N).map(Math.round),
  dur: genSeries(120, 45, N).map((v) => Math.max(0, Math.round(v))),
  ax: genSeries(0.12, 0.08, N),
  ay: genSeries(0.05, 0.06, N),
  az: genSeries(0.98, 0.07, N),
  gx: genSeries(0.02, 0.03, N),
  times: genTimes(N),
};

export function getSoilStatus(v) {
  if (v <= 25) return { label: "Crítico", type: "high" };
  if (v <= 40) return { label: "Alerta", type: "med" };
  return { label: "Normal", type: "low" };
}

export function getVibStatus(v) {
  if (v >= 8) return { label: "Alta", type: "high" };
  if (v >= 3) return { label: "Moderada", type: "med" };
  return { label: "Sin actividad", type: "low" };
}

export function getAccelStatus(v) {
  if (v >= 2.2) return { label: "Movimiento", type: "high" };
  if (v >= 1.3) return { label: "Moderado", type: "med" };
  return { label: "Estable", type: "low" };
}

export function getTrend(arr) {
  if (arr.length < 6) return { cls: "flat", txt: "—" };
  const r = arr.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const o = arr.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
  const delta = r - o;
  const pct = Math.abs((delta / (o || 1)) * 100).toFixed(0);

  if (Math.abs(delta) < 0.02 * Math.abs(o || 1)) {
    return { cls: "flat", txt: "estable" };
  }

  return delta > 0
    ? { cls: "up", txt: `↑ ${pct}%` }
    : { cls: "dn", txt: `↓ ${pct}%` };
}

function getRiskSummary(soilStatus, vibStatus, accelStatus) {
  const levels = [soilStatus.type, vibStatus.type, accelStatus.type];

  if (levels.includes("high")) {
    return {
      label: "Riesgo alto",
      type: "high",
      description: "Se detectan condiciones que requieren atención inmediata.",
      score: 86,
    };
  }

  if (levels.includes("med")) {
    return {
      label: "Riesgo moderado",
      type: "med",
      description: "Hay variaciones relevantes; se recomienda seguimiento continuo.",
      score: 58,
    };
  }

  return {
    label: "Riesgo bajo",
    type: "low",
    description: "Las variables actuales se mantienen dentro de parámetros esperados.",
    score: 24,
  };
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);
  const [data, setData] = useState(INITIAL_DATA);
  const [clock, setClock] = useState(new Date().toTimeString().slice(0, 8));
  const [lastChange, setLastChange] = useState({
    soil: Date.now() - 180000,
    vib: Date.now() - 600000,
    accel: Date.now() - 3600000,
  });

  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const now = new Date();
      const ts = now.toTimeString().slice(0, 8);
      setClock(ts);

      setData((prev) => {
        const pS = prev.soil[prev.soil.length - 1];
        const pV = prev.vib[prev.vib.length - 1];
        const pA = prev.accel[prev.accel.length - 1];

        const nS = Math.max(0, Math.min(100, pS + (Math.random() - 0.5) * 4));
        const nV = Math.max(0, Math.round(pV + (Math.random() - 0.5) * 2));
        const nA = Math.max(0, pA + (Math.random() - 0.5) * 0.1);
        const nG = Math.max(
          0,
          prev.gyro[prev.gyro.length - 1] + (Math.random() - 0.5) * 0.04
        );

        if (getSoilStatus(pS).label !== getSoilStatus(nS).label) {
          setLastChange((lc) => ({ ...lc, soil: Date.now() }));
        }

        if (getVibStatus(pV).label !== getVibStatus(nV).label) {
          setLastChange((lc) => ({ ...lc, vib: Date.now() }));
        }

        if (getAccelStatus(pA).label !== getAccelStatus(nA).label) {
          setLastChange((lc) => ({ ...lc, accel: Date.now() }));
        }

        const shift = (arr, val) => [...arr.slice(1), val];

        return {
          soil: shift(prev.soil, parseFloat(nS.toFixed(1))),
          vib: shift(prev.vib, nV),
          accel: shift(prev.accel, parseFloat(nA.toFixed(3))),
          gyro: shift(prev.gyro, parseFloat(nG.toFixed(3))),
          raw: shift(prev.raw, Math.round(2048 - nS * 8)),
          dur: shift(
            prev.dur,
            Math.max(
              0,
              Math.round(
                prev.dur[prev.dur.length - 1] + (Math.random() - 0.5) * 30
              )
            )
          ),
          ax: shift(
            prev.ax,
            parseFloat(
              (prev.ax[prev.ax.length - 1] + (Math.random() - 0.5) * 0.05).toFixed(3)
            )
          ),
          ay: shift(
            prev.ay,
            parseFloat(
              (prev.ay[prev.ay.length - 1] + (Math.random() - 0.5) * 0.04).toFixed(3)
            )
          ),
          az: shift(
            prev.az,
            parseFloat(
              (prev.az[prev.az.length - 1] + (Math.random() - 0.5) * 0.04).toFixed(3)
            )
          ),
          gx: shift(
            prev.gx,
            parseFloat(
              (prev.gx[prev.gx.length - 1] + (Math.random() - 0.5) * 0.02).toFixed(3)
            )
          ),
          times: shift(prev.times, ts),
        };
      });
    }, 2000);

    return () => clearInterval(tickRef.current);
  }, []);

  const sv = data.soil[data.soil.length - 1];
  const vv = data.vib[data.vib.length - 1];
  const av = data.accel[data.accel.length - 1];
  const gv = data.gyro[data.gyro.length - 1];

  const soilStatus = getSoilStatus(sv);
  const vibStatus = getVibStatus(vv);
  const accelStatus = getAccelStatus(av);

  const riskSummary = getRiskSummary(soilStatus, vibStatus, accelStatus);

  const alerts = useMemo(() => {
    const items = [];

    if (sv <= 25) {
      items.push({
        title: "Humedad crítica del suelo",
        description: `${sv.toFixed(0)}% — riesgo de saturación`,
        type: "high",
      });
    }

    if (vv >= 8) {
      items.push({
        title: "Alta actividad sísmica",
        description: `${vv} eventos en el intervalo actual`,
        type: "high",
      });
    }

    if (av >= 2.2) {
      items.push({
        title: "Desplazamiento detectado",
        description: `Magnitud ${av.toFixed(2)} m/s² — anormal`,
        type: "high",
      });
    }

    if (sv > 25 && sv <= 40) {
      items.push({
        title: "Humedad elevada",
        description: `${sv.toFixed(0)}% — vigilar tendencia`,
        type: "med",
      });
    }

    if (vv >= 3 && vv < 8) {
      items.push({
        title: "Vibración moderada",
        description: `${vv} eventos registrados`,
        type: "med",
      });
    }

    if (!items.length) {
      items.push({
        title: "Terreno estable",
        description: "Sin anomalías en este momento",
        type: "ok",
      });
    }

    return items;
  }, [sv, vv, av]);

  const criticalCount = alerts.filter((a) => a.type === "high").length;
  const avgSoil = average(data.soil).toFixed(1);
  const avgVib = average(data.vib).toFixed(1);
  const avgAccel = average(data.accel).toFixed(2);

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
            <strong>Monitoreo N-01</strong>
          </div>
          <div className="sw-hero-meta-card">
            <span className="sw-hero-meta-label">Última lectura</span>
            <strong>{clock}</strong>
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
            <span className="sw-risk-ring-value">{riskSummary.score}%</span>
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
        <strong>{avgSoil}%</strong>
      </div>
      <div className="sw-mini-card">
        <span className="sw-mini-label">Promedio vibración</span>
        <strong>{avgVib} evt</strong>
      </div>
      <div className="sw-mini-card">
        <span className="sw-mini-label">Promedio inclinación</span>
        <strong>{avgAccel} m/s²</strong>
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
          value={`${sv.toFixed(0)}`}
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
          value={`${av.toFixed(2)}`}
          unit="m/s²"
          status={accelStatus}
          trend={getTrend(data.accel)}
          accentType={accelStatus.type}
        />
        <StatCard
          label="Rotación angular"
          value={`${gv.toFixed(2)}`}
          unit="°/s"
          status={{ label: "Nominal", type: "neutral" }}
          trend={getTrend(data.gyro)}
          accentType="neutral"
        />
      </div>

      <div className="sw-mid-grid">
        <AlertPanel alerts={alerts} criticalCount={criticalCount} />
        <StatusPanel
          soilStatus={soilStatus}
          vibStatus={vibStatus}
          accelStatus={accelStatus}
          lastChange={lastChange}
        />
      </div>

      <div className="sw-chart-grid">
        <SensorChart
          title="Humedad del suelo (%)"
          data={data.soil}
          times={data.times}
          color="#7a6555"
          threshold={25}
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
          title="Magnitud de inclinación (m/s²)"
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
          threshold={null}
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
          value={`${sv.toFixed(0)}`}
          unit="%"
          status={soilStatus}
          trend={getTrend(data.soil)}
          accentType={soilStatus.type}
        />
        <StatCard
          label="Valor raw ADC"
          value={`${data.raw[data.raw.length - 1]}`}
          unit=""
          status={{ label: "Lectura directa", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
        <StatCard
          label="Promedio 24h"
          value={`${avgSoil}`}
          unit="%"
          status={{ label: "Estable", type: "low" }}
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
          threshold={25}
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
          value={`${data.dur[data.dur.length - 1]}`}
          unit="ms"
          status={{ label: "Normal", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
        <StatCard
          label="Estado digital"
          value="No"
          unit=""
          status={{ label: "Sin detección", type: "low" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="low"
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
          threshold={null}
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
          value={`${av.toFixed(2)}`}
          unit="m/s²"
          status={accelStatus}
          trend={getTrend(data.accel)}
          accentType={accelStatus.type}
        />
        <StatCard
          label="Rotación total"
          value={`${gv.toFixed(2)}`}
          unit="°/s"
          status={{ label: "Nominal", type: "neutral" }}
          trend={getTrend(data.gyro)}
          accentType="neutral"
        />
        <StatCard
          label="Accel X"
          value={`${data.ax[data.ax.length - 1].toFixed(2)}`}
          unit=""
          status={{ label: "Normal", type: "neutral" }}
          trend={{ cls: "flat", txt: "—" }}
          accentType="neutral"
        />
        <StatCard
          label="Gyro Z"
          value={`${data.gx[data.gx.length - 1].toFixed(2)}`}
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
      sub: "Monitoreo en tiempo real · Estación N-01",
    },
    [TABS.SOIL]: {
      title: "Humedad del suelo",
      sub: "Sensor capacitivo · Profundidad 30 cm",
    },
    [TABS.VIBRATION]: {
      title: "Sismicidad y vibración",
      sub: "Geófono triaxial · Umbral 0.5 Hz",
    },
    [TABS.MPU]: {
      title: "Inclinación y movimiento",
      sub: "Acelerómetro + giroscopio MPU-6050",
    },
    [TABS.HISTORICAL]: {
      title: "Histórico de eventos",
      sub: "Registro completo sensores",
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
            <div className="sw-page-sub">{meta.sub}</div>
          </div>

          <div className="sw-topbar-right">
            <span className="sw-live-pill">
              <span className="sw-live-dot" />
              En línea
            </span>
            <span className="sw-clock">{clock}</span>
            <span className="sw-coord">4°35'N 74°04'W · 1840 m</span>
          </div>
        </div>

        <div className="sw-content">
          {activeTab === TABS.GENERAL && renderGeneral()}
          {activeTab === TABS.SOIL && renderSoil()}
          {activeTab === TABS.VIBRATION && renderVibration()}
          {activeTab === TABS.MPU && renderMPU()}
          {activeTab === TABS.HISTORICAL && <Historico />}
        </div>
      </div>
    </div>
  );
}