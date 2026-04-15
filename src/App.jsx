import { useState } from 'react'
import './App.css'

const buildMockSensors = () => {
  const humidity = Math.floor(Math.random() * 41) + 40
  const vibration = Number((Math.random() * 1.5).toFixed(2))
  const pitch = Math.floor(Math.random() * 31) - 15
  const roll = Math.floor(Math.random() * 31) - 15

  return [
    {
      id: 'gyroscope',
      name: 'Giroscopio',
      value: `Pitch ${pitch}° / Roll ${roll}°`,
      status: Math.abs(pitch) > 10 || Math.abs(roll) > 10 ? 'alerta' : 'normal',
      unit: 'orientación',
    },
    {
      id: 'soil-humidity',
      name: 'Humedad del suelo',
      value: `${humidity}%`,
      status: humidity < 50 ? 'alerta' : 'normal',
      unit: 'humedad',
    },
    {
      id: 'vibration',
      name: 'Vibración',
      value: `${vibration} g`,
      status: vibration > 1 ? 'alerta' : 'normal',
      unit: 'aceleración',
    },
  ]
}

function App() {
  const [sensors, setSensors] = useState(() => buildMockSensors())
  const [updatedAt, setUpdatedAt] = useState(() => new Date())

  const refreshData = () => {
    setSensors(buildMockSensors())
    setUpdatedAt(new Date())
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard IoT</p>
          <h1>Monitoreo de sensores</h1>
          <p className="subtitle">
            Base inicial para visualizar giroscopio, humedad del suelo y vibración.
          </p>
        </div>
        <button type="button" onClick={refreshData}>
          Actualizar datos
        </button>
      </header>

      <section className="sensor-grid" aria-label="Panel de sensores">
        {sensors.map((sensor) => (
          <article key={sensor.id} className="sensor-card">
            <header>
              <h2>{sensor.name}</h2>
              <span className={`badge ${sensor.status}`}>
                {sensor.status === 'normal' ? 'Normal' : 'Alerta'}
              </span>
            </header>
            <p className="value">{sensor.value}</p>
            <p className="meta">Unidad: {sensor.unit}</p>
          </article>
        ))}
      </section>

      <p className="timestamp">
        Última actualización: {updatedAt.toLocaleTimeString('es-CO')}
      </p>
    </main>
  )
}

export default App
