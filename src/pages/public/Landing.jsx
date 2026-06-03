import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import "../../styles/landing.css";

const sensorTabs = [
  {
    id: "general",
    label: "Vista general",
    badge: "Resumen",
    title: "Supervisa el terreno con una vista clara y centralizada.",
    description:
      "SlideWatch reúne métricas, sensores, alertas y estados en una sola interfaz para que el monitoreo sea más rápido, visual y entendible.",
    mainValue: "99.2%",
    mainLabel: "Disponibilidad del sistema",
    secondaryValue: "148",
    secondaryLabel: "Eventos registrados",
    status: "Operación estable",
    points: [34, 38, 36, 42, 46, 44, 49, 54, 57, 61],
  },
  {
    id: "humidity",
    label: "Humedad",
    badge: "Suelo",
    title: "Analiza cambios de humedad que pueden afectar la estabilidad.",
    description:
      "El monitoreo de humedad permite observar variaciones del suelo y detectar comportamientos que puedan relacionarse con condiciones de riesgo.",
    mainValue: "68%",
    mainLabel: "Nivel reciente",
    secondaryValue: "+4.3%",
    secondaryLabel: "Cambio 24h",
    status: "Monitoreo preventivo",
    points: [28, 30, 34, 33, 39, 44, 46, 52, 58, 68],
  },
  {
    id: "vibration",
    label: "Vibración",
    badge: "Movimiento",
    title: "Detecta microeventos y picos anómalos con mayor claridad.",
    description:
      "Las lecturas de vibración ayudan a identificar perturbaciones del entorno y movimientos que merecen seguimiento técnico.",
    mainValue: "0.32g",
    mainLabel: "Lectura media",
    secondaryValue: "12",
    secondaryLabel: "Picos detectados",
    status: "Actividad moderada",
    points: [18, 25, 20, 31, 28, 37, 35, 42, 39, 48],
  },
  {
    id: "tilt",
    label: "Inclinación",
    badge: "Desplazamiento",
    title: "Sigue variaciones graduales del terreno antes de que escalen.",
    description:
      "La inclinación permite observar desviaciones progresivas y detectar patrones que podrían anticipar desplazamientos importantes.",
    mainValue: "4.8°",
    mainLabel: "Ángulo reciente",
    secondaryValue: "+0.6°",
    secondaryLabel: "Cambio semanal",
    status: "Atención activa",
    points: [14, 16, 19, 21, 24, 26, 28, 31, 35, 40],
  },
];

const featureCards = [
  {
    title: "Monitoreo en tiempo real",
    text: "Consulta estados y métricas recientes del terreno sin perder visibilidad del contexto general del sistema.",
    variant: "info",
  },
  {
    title: "Histórico consultable",
    text: "Revisa el comportamiento de los sensores a lo largo del tiempo para comparar eventos y detectar patrones.",
    variant: "success",
  },
  {
    title: "Alertas interpretables",
    text: "Resume lecturas importantes en paneles visuales para identificar señales relevantes con más rapidez.",
    variant: "warning",
  },
];

const workflow = [
  {
    step: "01",
    title: "Captura",
    text: "Los sensores registran humedad, vibración e inclinación del terreno.",
  },
  {
    step: "02",
    title: "Transmisión",
    text: "El ESP32 envía los datos al sistema para actualización continua.",
  },
  {
    step: "03",
    title: "Procesamiento",
    text: "El backend organiza snapshots, históricos y estados del sistema.",
  },
  {
    step: "04",
    title: "Visualización",
    text: "El dashboard muestra gráficos, alertas y métricas para monitoreo.",
  },
];

const stats = [
  { value: "12", label: "Sensores activos" },
  { value: "148", label: "Eventos detectados" },
  { value: "3s", label: "Actualización media" },
  { value: "24/7", label: "Seguimiento continuo" },
];

function LinePreview({ points }) {
  const graph = useMemo(() => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;

    const coords = points.map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return { x, y };
    });

    const polyline = coords.map((p) => `${p.x},${p.y}`).join(" ");
    const polygon = `${polyline} 100,100 0,100`;

    return { coords, polyline, polygon };
  }, [points]);

  return (
    <svg
      className="landing-modern__chart-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="landingLine" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor="#cf7a3b" />
  <stop offset="100%" stopColor="#8f4a27" />
</linearGradient>
<linearGradient id="landingArea" x1="0%" y1="0%" x2="0%" y2="100%">
  <stop offset="0%" stopColor="rgba(207,122,59,0.26)" />
  <stop offset="100%" stopColor="rgba(207,122,59,0.03)" />
</linearGradient>
      </defs>

      <polygon points={graph.polygon} fill="url(#landingArea)" />
      <polyline
        points={graph.polyline}
        fill="none"
        stroke="url(#landingLine)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {graph.coords.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r="2.3"
          fill="#2563eb"
        />
      ))}
    </svg>
  );
}

export default function Landing() {
  const [activeTab, setActiveTab] = useState(sensorTabs[0].id);

  const currentTab =
    sensorTabs.find((tab) => tab.id === activeTab) ?? sensorTabs[0];

  return (
    <main className="landing-modern">
      <header className="landing-modern__header">
        <div className="landing-modern__container landing-modern__header-inner">
          <Link to="/" className="landing-modern__brand">
            <div className="landing-modern__brand-mark">SW</div>
            <div>
              <strong>SlideWatch</strong>
              <span>Sistema de monitoreo geotécnico</span>
            </div>
          </Link>

          <nav className="landing-modern__nav">
            <a href="#inicio">Inicio</a>
            <a href="#sensores">Sensores</a>
            <a href="#funcionamiento">Funcionamiento</a>
            <a href="#plataforma">Plataforma</a>
          </nav>

          <div className="landing-modern__header-actions">
            <Link to="/login" className="landing-modern__login">
              Iniciar sesión
            </Link>
            <Link to="/register" className="landing-modern__primary-btn">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <section id="inicio" className="landing-modern__hero">
        <div className="landing-modern__container landing-modern__hero-grid">
          <div className="landing-modern__hero-copy">
            <span className="landing-modern__eyebrow">
              Monitoreo inteligente para prevención de deslizamientos
            </span>

            <h1>
              Visualiza el comportamiento del terreno con una plataforma clara y
              útil.
            </h1>

            <p>
              SlideWatch integra sensores, transmisión IoT e interpretación
              visual de datos para ayudar a detectar cambios relevantes en el
              suelo, revisar históricos y apoyar decisiones preventivas.
            </p>

            <div className="landing-modern__hero-actions">
              <Link to="/login" className="landing-modern__primary-btn">
                Entrar al sistema
              </Link>
              <a href="#plataforma" className="landing-modern__secondary-btn">
                Ver plataforma
              </a>
            </div>

            <div className="landing-modern__hero-tags">
              <span>Tiempo real</span>
              <span>Histórico</span>
              <span>Alertas</span>
              <span>ESP32 + Sensores</span>
            </div>
          </div>

          <div className="landing-modern__hero-panel">
            <div className="landing-modern__preview-window">
              <div className="landing-modern__preview-topbar">
                <span />
                <span />
                <span />
              </div>

              <div className="landing-modern__preview-body">
                <article className="landing-modern__summary-card">
                  <div>
                    <small>Estado general</small>
                    <strong>Riesgo medio</strong>
                    <p>
                      Lecturas recientes muestran variaciones que requieren
                      seguimiento preventivo.
                    </p>
                  </div>
                  <span className="landing-modern__status-pill landing-modern__status-pill--warning">
                    Activo
                  </span>
                </article>

                <div className="landing-modern__preview-grid">
                  <article className="landing-modern__preview-card">
                    <small>Lecturas recientes</small>
                    <div className="landing-modern__bars">
                      <span style={{ height: "36%" }} />
                      <span style={{ height: "48%" }} />
                      <span style={{ height: "42%" }} />
                      <span style={{ height: "61%" }} />
                      <span style={{ height: "54%" }} />
                      <span style={{ height: "67%" }} />
                      <span style={{ height: "59%" }} />
                      <span style={{ height: "76%" }} />
                    </div>
                  </article>

                  <article className="landing-modern__preview-card">
                    <small>Sensores</small>
                    <div className="landing-modern__sensor-values">
                      <div>
                        <span>Humedad</span>
                        <strong>68%</strong>
                      </div>
                      <div>
                        <span>Vibración</span>
                        <strong>0.32g</strong>
                      </div>
                      <div>
                        <span>Inclinación</span>
                        <strong>4.8°</strong>
                      </div>
                    </div>
                  </article>

                  <article className="landing-modern__preview-card landing-modern__preview-card--wide">
                    <small>Alertas recientes</small>
                    <div className="landing-modern__alert-list">
                      <div className="landing-modern__alert-item warning">
                        Variación ascendente en vibración
                      </div>
                      <div className="landing-modern__alert-item info">
                        Incremento gradual de humedad
                      </div>
                      <div className="landing-modern__alert-item danger">
                        Cambio de inclinación fuera del promedio
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-modern__stats-strip">
        <div className="landing-modern__container landing-modern__stats-grid">
          {stats.map((item) => (
            <article key={item.label} className="landing-modern__stat-box">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="sensores" className="landing-modern__section">
        <div className="landing-modern__container">
          <div className="landing-modern__section-head">
            <span className="landing-modern__section-kicker">
              Exploración del sistema
            </span>
            <h2>Consulta cada componente del monitoreo desde una vista más útil</h2>
            <p>
              La landing no solo presenta el sistema: también resume cómo se
              comportan sus variables principales mediante bloques interactivos.
            </p>
          </div>

          <div className="landing-modern__tab-shell">
            <aside className="landing-modern__tabs">
              {sensorTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`landing-modern__tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.badge}</span>
                  <strong>{tab.label}</strong>
                </button>
              ))}
            </aside>

            <div className="landing-modern__tab-panel">
              <div className="landing-modern__tab-copy">
                <span className="landing-modern__tab-kicker">
                  {currentTab.badge}
                </span>
                <h3>{currentTab.title}</h3>
                <p>{currentTab.description}</p>

                <div className="landing-modern__tab-metrics">
                  <article className="landing-modern__metric-card">
                    <small>{currentTab.mainLabel}</small>
                    <strong>{currentTab.mainValue}</strong>
                  </article>
                  <article className="landing-modern__metric-card">
                    <small>{currentTab.secondaryLabel}</small>
                    <strong>{currentTab.secondaryValue}</strong>
                  </article>
                </div>

                <div className="landing-modern__tab-status">
                  <span className="landing-modern__status-pill landing-modern__status-pill--info">
                    {currentTab.status}
                  </span>
                </div>
              </div>

              <div className="landing-modern__tab-chart-card">
                <div className="landing-modern__tab-chart-head">
                  <span>Comportamiento resumido</span>
                  <small>visualización ilustrativa</small>
                </div>

                <div className="landing-modern__chart-box">
                  <LinePreview points={currentTab.points} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-modern__section landing-modern__section--soft">
        <div className="landing-modern__container">
          <div className="landing-modern__section-head">
            <span className="landing-modern__section-kicker">
              Capacidades principales
            </span>
            <h2>Una experiencia consistente con el dashboard que ya construiste</h2>
            <p>
              Mantiene el lenguaje visual del sistema: paneles limpios, tarjetas
              blancas, jerarquía clara y estados fáciles de interpretar.
            </p>
          </div>

          <div className="landing-modern__feature-grid">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className={`landing-modern__feature-card ${feature.variant}`}
              >
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="funcionamiento" className="landing-modern__section">
        <div className="landing-modern__container">
          <div className="landing-modern__section-head">
            <span className="landing-modern__section-kicker">
              Flujo del sistema
            </span>
            <h2>Del sensor al dashboard</h2>
            <p>
              Todo el sistema sigue un flujo simple y entendible: captar datos,
              transmitirlos, procesarlos y convertirlos en información útil.
            </p>
          </div>

          <div className="landing-modern__workflow-grid">
            {workflow.map((item) => (
              <article key={item.step} className="landing-modern__workflow-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="plataforma"
        className="landing-modern__section landing-modern__section--soft"
      >
        <div className="landing-modern__container landing-modern__platform">
          <div className="landing-modern__platform-copy">
            <span className="landing-modern__section-kicker">
              Vista de plataforma
            </span>
            <h2>Un acceso más ordenado a la misma lógica del dashboard</h2>
            <p>
              Esta landing sirve como entrada al sistema, pero la parte interna
              mantiene intacta la lógica que ya construiste en el dashboard.
            </p>

            <ul className="landing-modern__platform-list">
              <li>Acceso a métricas generales</li>
              <li>Vista por sensor y comportamiento</li>
              <li>Histórico para revisión posterior</li>
              <li>Estados y alertas resumidas</li>
            </ul>
          </div>

          <div className="landing-modern__platform-preview">
            <div className="landing-modern__platform-sidebar">
              <span className="active">General</span>
              <span>Humedad</span>
              <span>Vibración</span>
              <span>Inclinación</span>
              <span>Histórico</span>
            </div>

            <div className="landing-modern__platform-main">
              <div className="landing-modern__platform-top">
                <article className="landing-modern__platform-mini">
                  <small>Promedio humedad</small>
                  <strong>66.4%</strong>
                </article>
                <article className="landing-modern__platform-mini">
                  <small>Picos de vibración</small>
                  <strong>12</strong>
                </article>
                <article className="landing-modern__platform-mini">
                  <small>Alertas críticas</small>
                  <strong>03</strong>
                </article>
              </div>

              <article className="landing-modern__platform-chart">
                <div className="landing-modern__tab-chart-head">
                  <span>Resumen reciente</span>
                  <small>últimas muestras</small>
                </div>
                <div className="landing-modern__chart-box">
                  <LinePreview points={[26, 29, 33, 31, 39, 42, 46, 44, 51, 58]} />
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-modern__cta">
        <div className="landing-modern__container">
          <div className="landing-modern__cta-box">
            <div>
              <span className="landing-modern__section-kicker">
                Acceso al sistema
              </span>
              <h2>Continúa hacia el panel de monitoreo</h2>
              <p>
                Inicia sesión o crea tu cuenta para entrar a la plataforma y usar
                el dashboard sin alterar su funcionamiento actual.
              </p>
            </div>

            <div className="landing-modern__cta-actions">
              <Link to="/login" className="landing-modern__primary-btn">
                Iniciar sesión
              </Link>
              <Link to="/register" className="landing-modern__secondary-btn">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}