import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import SensorChart from "../components/SensorChart";
import AlertBadge from "../components/AlertBadge";
import { mockReadings } from "../data/mockData";
import "../styles/dashboard.css";

const TABS = {
  GENERAL: "general",
  SOIL: "soil",
  VIBRATION: "vibration",
  MPU: "mpu",
};

function getLastValue(arr, key) {
  if (!arr || !arr.length) return 0;
  return Number(arr[arr.length - 1][key] || 0);
}

function getAverage(arr, key) {
  if (!arr || !arr.length) return 0;
  const total = arr.reduce((acc, item) => acc + Number(item[key] || 0), 0);
  return total / arr.length;
}

function getSoilStatus(percent) {
  if (percent <= 25) return { label: "Seco", type: "danger" };
  if (percent <= 60) return { label: "Normal", type: "warning" };
  return { label: "Húmedo", type: "success" };
}

function getVibrationStatus(count) {
  if (count >= 8) return { label: "Alta", type: "danger" };
  if (count >= 3) return { label: "Media", type: "warning" };
  return { label: "Baja", type: "success" };
}

function getMovementStatus(magnitude) {
  if (magnitude >= 2.2) return { label: "Anormal", type: "danger" };
  if (magnitude >= 1.3) return { label: "Moderado", type: "warning" };
  return { label: "Estable", type: "success" };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);

  const soilPercent = getLastValue(mockReadings, "soilPercent");
  const soilRaw = getLastValue(mockReadings, "soilRaw");
  const vibrationCount = getLastValue(mockReadings, "vibrationCount");
  const vibrationDetected = getLastValue(mockReadings, "vibrationDetected");
  const vibrationDuration = getLastValue(mockReadings, "vibrationDurationMs");
  const accelMagnitude = getLastValue(mockReadings, "accelMagnitude");
  const gyroMagnitude = getLastValue(mockReadings, "gyroMagnitude");

  const soilStatus = getSoilStatus(soilPercent);
  const vibrationStatus = getVibrationStatus(vibrationCount);
  const movementStatus = getMovementStatus(accelMagnitude);

  const alerts = useMemo(() => {
    const items = [];

    if (soilPercent <= 25) {
      items.push({
        title: "Suelo seco",
        description: `La humedad actual es ${soilPercent}%`,
        type: "danger",
      });
    }

    if (vibrationCount >= 8) {
      items.push({
        title: "Vibración alta",
        description: `Se detectaron ${vibrationCount} eventos`,
        type: "danger",
      });
    }

    if (accelMagnitude >= 2.2) {
      items.push({
        title: "Movimiento anormal",
        description: `Magnitud de aceleración: ${accelMagnitude.toFixed(2)}`,
        type: "danger",
      });
    }

    if (!items.length) {
      items.push({
        title: "Sistema estable",
        description: "No hay alertas críticas en este momento",
        type: "success",
      });
    }

    return items;
  }, [soilPercent, vibrationCount, accelMagnitude]);

  const renderGeneral = () => (
    <div className="dashboard-section">
      <div className="page-header">
        <div>
          <h1>Resumen general</h1>
          <p>Vista global del estado de todos los sensores</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Humedad del suelo" value={`${soilPercent}%`} subtitle={`Valor raw: ${soilRaw}`} type={soilStatus.type} />
        <StatCard title="Vibración" value={`${vibrationCount} eventos`} subtitle={vibrationDetected ? "Actividad detectada" : "Sin actividad"} type={vibrationStatus.type} />
        <StatCard title="Aceleración" value={accelMagnitude.toFixed(2)} subtitle="Magnitud total" type={movementStatus.type} />
        <StatCard title="Rotación" value={gyroMagnitude.toFixed(2)} subtitle="Magnitud giroscopio" type="info" />
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Alertas</h2>
          </div>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <AlertBadge
                key={index}
                title={alert.title}
                description={alert.description}
                type={alert.type}
              />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Estado actual</h2>
          </div>
          <div className="status-list">
            <div className="status-row">
              <span>Suelo</span>
              <span className={`status-pill ${soilStatus.type}`}>{soilStatus.label}</span>
            </div>
            <div className="status-row">
              <span>Vibración</span>
              <span className={`status-pill ${vibrationStatus.type}`}>{vibrationStatus.label}</span>
            </div>
            <div className="status-row">
              <span>Movimiento</span>
              <span className={`status-pill ${movementStatus.type}`}>{movementStatus.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <SensorChart title="Humedad del suelo (%)" data={mockReadings} dataKey="soilPercent" xKey="time" unit="%" />
        <SensorChart title="Eventos de vibración" data={mockReadings} dataKey="vibrationCount" xKey="time" unit="" />
        <SensorChart title="Magnitud de aceleración" data={mockReadings} dataKey="accelMagnitude" xKey="time" unit="" />
        <SensorChart title="Magnitud de giro" data={mockReadings} dataKey="gyroMagnitude" xKey="time" unit="" />
      </div>
    </div>
  );

  const renderSoil = () => (
    <div className="dashboard-section">
      <div className="page-header">
        <div>
          <h1>Sensor de humedad del suelo</h1>
          <p>Lecturas raw, porcentaje y promedio</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Humedad actual" value={`${soilPercent}%`} subtitle="Porcentaje calibrado" type={soilStatus.type} />
        <StatCard title="Valor raw" value={soilRaw} subtitle="Lectura ADC" type="info" />
        <StatCard title="Promedio" value={`${getAverage(mockReadings, "soilPercent").toFixed(1)}%`} subtitle="Promedio" type="info" />
      </div>

      <div className="charts-grid single-column">
        <SensorChart title="Porcentaje de humedad" data={mockReadings} dataKey="soilPercent" xKey="time" unit="%" />
        <SensorChart title="Lectura raw" data={mockReadings} dataKey="soilRaw" xKey="time" unit="" />
      </div>
    </div>
  );

  const renderVibration = () => (
    <div className="dashboard-section">
      <div className="page-header">
        <div>
          <h1>Sensor de vibración</h1>
          <p>Eventos, duración y detección digital</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Eventos detectados" value={vibrationCount} subtitle="Último intervalo" type={vibrationStatus.type} />
        <StatCard title="Duración" value={`${vibrationDuration} ms`} subtitle="Tiempo vibrando" type="info" />
        <StatCard title="Detección digital" value={vibrationDetected ? "Sí" : "No"} subtitle="Estado actual" type={vibrationDetected ? "warning" : "success"} />
      </div>

      <div className="charts-grid single-column">
        <SensorChart title="Eventos por intervalo" data={mockReadings} dataKey="vibrationCount" xKey="time" unit="" />
        <SensorChart title="Duración de vibración" data={mockReadings} dataKey="vibrationDurationMs" xKey="time" unit="ms" />
      </div>
    </div>
  );

  const renderMPU = () => (
    <div className="dashboard-section">
      <div className="page-header">
        <div>
          <h1>Giroscopio / Acelerómetro</h1>
          <p>Movimiento y rotación</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Aceleración total" value={accelMagnitude.toFixed(2)} subtitle="Magnitud" type={movementStatus.type} />
        <StatCard title="Giro total" value={gyroMagnitude.toFixed(2)} subtitle="Magnitud" type="info" />
        <StatCard title="Accel X" value={getLastValue(mockReadings, "accelX").toFixed(2)} subtitle="Última lectura" type="info" />
        <StatCard title="Gyro Z" value={getLastValue(mockReadings, "gyroZ").toFixed(2)} subtitle="Última lectura" type="info" />
      </div>

      <div className="charts-grid">
        <SensorChart title="Aceleración X" data={mockReadings} dataKey="accelX" xKey="time" unit="" />
        <SensorChart title="Aceleración Y" data={mockReadings} dataKey="accelY" xKey="time" unit="" />
        <SensorChart title="Aceleración Z" data={mockReadings} dataKey="accelZ" xKey="time" unit="" />
        <SensorChart title="Giro X" data={mockReadings} dataKey="gyroX" xKey="time" unit="" />
        <SensorChart title="Giro Y" data={mockReadings} dataKey="gyroY" xKey="time" unit="" />
        <SensorChart title="Giro Z" data={mockReadings} dataKey="gyroZ" xKey="time" unit="" />
        <SensorChart title="Magnitud de aceleración" data={mockReadings} dataKey="accelMagnitude" xKey="time" unit="" />
        <SensorChart title="Magnitud de giro" data={mockReadings} dataKey="gyroMagnitude" xKey="time" unit="" />
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      <main className="dashboard-content">
        {activeTab === TABS.GENERAL && renderGeneral()}
        {activeTab === TABS.SOIL && renderSoil()}
        {activeTab === TABS.VIBRATION && renderVibration()}
        {activeTab === TABS.MPU && renderMPU()}
      </main>
    </div>
  );
}