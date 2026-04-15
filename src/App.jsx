import { useEffect, useMemo, useState } from 'react'
import './App.css'

const MAX_POINTS = 24
const UPDATE_INTERVAL_MS = 3000
const CHART_WIDTH = 340
const CHART_HEIGHT = 160
const CHART_PADDING = 18

const buildMockReading = () => {
  const humidity = Math.floor(Math.random() * 41) + 40
  const vibration = Number((Math.random() * 1.5).toFixed(2))
  const pitch = Math.floor(Math.random() * 31) - 15
  const roll = Math.floor(Math.random() * 31) - 15

  return {
    humidity,
    vibration,
    pitch,
    roll,
    timestamp: new Date(),
  }
}

const buildInitialReadings = () => {
  const now = Date.now()

  return Array.from({ length: MAX_POINTS }, (_, index) => {
    const reading = buildMockReading()
    const offset = (MAX_POINTS - index - 1) * UPDATE_INTERVAL_MS

    return {
      ...reading,
      timestamp: new Date(now - offset),
    }
  })
}

const getSeriesStats = (values) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return { min, max, range }
}

const buildPolylinePoints = (values, stats) => {
  if (values.length === 0) {
    return ''
  }

  const usableWidth = CHART_WIDTH - CHART_PADDING * 2
  const usableHeight = CHART_HEIGHT - CHART_PADDING * 2
  const xAxisSegments = Math.max(values.length - 1, 1)

  return values
    .map((value, index) => {
      const x = CHART_PADDING + (usableWidth * index) / xAxisSegments
      const normalized = (value - stats.min) / stats.range
      const y = CHART_HEIGHT - CHART_PADDING - normalized * usableHeight
      return `${x},${y}`
    })
    .join(' ')
}

const getHumidityStatus = (value) => (value < 50 ? 'alerta' : 'normal')
const getVibrationStatus = (value) => (value > 1 ? 'alerta' : 'normal')
const getGyroStatus = (pitch, roll) =>
  Math.abs(pitch) > 10 || Math.abs(roll) > 10 ? 'alerta' : 'normal'

function SeriesCard({ title, unit, values, color, latestLabel, status }) {
  const stats = useMemo(() => getSeriesStats(values), [values])
  const points = useMemo(() => buildPolylinePoints(values, stats), [values, stats])

  return (
    <article className="chart-card">
      <header>
        <h2>{title}</h2>
        <span className={`badge ${status}`}>
          {status === 'normal' ? 'Normal' : 'Alerta'}
        </span>
      </header>
      <p className="value">{latestLabel}</p>
      <p className="meta">Unidad: {unit}</p>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`Gráfica de ${title}`}>
        <title>{`Gráfica de ${title}`}</title>
        <polyline className="chart-grid-line" points={`${CHART_PADDING},${CHART_PADDING} ${CHART_WIDTH - CHART_PADDING},${CHART_PADDING}`} />
        <polyline className="chart-grid-line" points={`${CHART_PADDING},${CHART_HEIGHT / 2} ${CHART_WIDTH - CHART_PADDING},${CHART_HEIGHT / 2}`} />
        <polyline className="chart-grid-line" points={`${CHART_PADDING},${CHART_HEIGHT - CHART_PADDING} ${CHART_WIDTH - CHART_PADDING},${CHART_HEIGHT - CHART_PADDING}`} />
        <polyline className="chart-line" points={points} style={{ '--line-color': color }} />
      </svg>
      <p className="chart-legend">
        min {stats.min.toFixed(2)} · max {stats.max.toFixed(2)}
      </p>
    </article>
  )
}

function App() {
  const [readings, setReadings] = useState(() => buildInitialReadings())

  const refreshData = () => {
    setReadings((previous) => [...previous, buildMockReading()].slice(-MAX_POINTS))
  }

  useEffect(() => {
    const intervalId = setInterval(refreshData, UPDATE_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])

  const latest = readings.at(-1)

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard IoT</p>
          <h1>Monitoreo de sensores</h1>
          <p className="subtitle">
            Gráficas en tiempo real para giroscopio, humedad del suelo y vibración.
          </p>
        </div>
        <button type="button" onClick={refreshData}>
          Actualizar datos
        </button>
      </header>

      <section className="chart-grid" aria-label="Panel de gráficas de sensores">
        <SeriesCard
          title="Giroscopio (Pitch)"
          unit="°"
          values={readings.map((reading) => reading.pitch)}
          color="#ef4444"
          latestLabel={`Pitch ${latest.pitch}° / Roll ${latest.roll}°`}
          status={getGyroStatus(latest.pitch, latest.roll)}
        />
        <SeriesCard
          title="Humedad del suelo"
          unit="%"
          values={readings.map((reading) => reading.humidity)}
          color="#2563eb"
          latestLabel={`${latest.humidity}%`}
          status={getHumidityStatus(latest.humidity)}
        />
        <SeriesCard
          title="Vibración"
          unit="aceleración"
          values={readings.map((reading) => reading.vibration)}
          color="#10b981"
          latestLabel={`${latest.vibration} g`}
          status={getVibrationStatus(latest.vibration)}
        />
      </section>

      <p className="timestamp">
        Última actualización: {latest.timestamp.toLocaleTimeString('es-CO')}
      </p>
    </main>
  )
}

export default App
