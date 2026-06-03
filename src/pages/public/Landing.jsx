import { Link } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import s from "./Landing.module.css";

/* ── reveal ── */
function useVis() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}
function A({ d = "up", delay = 0, children, style, className }) {
  const [ref, on] = useVis();
  const base = d === "up" ? s.up : d === "l" ? s.fromL : s.fromR;
  const dd = [s.d1, s.d2, s.d3, s.d4][delay - 1] ?? "";
  return (
    <div ref={ref} style={style}
      className={[base, on && s.in, dd, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/* ── chart ── */
function Chart({ points }) {
  const g = useMemo(() => {
    const hi = Math.max(...points), lo = Math.min(...points), r = hi - lo || 1;
    const c = points.map((p, i) => ({
      x: (i / (points.length - 1)) * 100,
      y: 100 - ((p - lo) / r) * 82 - 9,
    }));
    return {
      dots: c,
      line: c.map((d) => `${d.x},${d.y}`).join(" "),
      area: [...c.map((d) => `${d.x},${d.y}`), "100,100", "0,100"].join(" "),
    };
  }, [points]);
  return (
    <svg className={s.chartSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8b3d14" stopOpacity=".2" />
          <stop offset="100%" stopColor="#8b3d14" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={g.area} fill="url(#cg)" />
      <polyline points={g.line} fill="none" stroke="#8b3d14"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {g.dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="2.2" fill="#8b3d14" />)}
    </svg>
  );
}

/* ── data ── */
const ADMIN_FEATURES = [
  "Dashboard general con estado del sistema",
  "Paneles por sensor: humedad, vibración e inclinación",
  "Histórico con filtros por rango de fechas",
  "Mapa interactivo con ubicación de cada sensor",
];
const CITIZEN_FEATURES = [
  "El mapa es completamente público — sin cuenta",
  "Reporta un evento en segundos desde el navegador",
  "Visualización por nivel de urgencia en tiempo real",
];
const PROCESS = [
  { n:"01", title:"Captura",       desc:"Los sensores registran humedad, vibración e inclinación del terreno de forma continua." },
  { n:"02", title:"Transmisión",   desc:"El ESP32 envía las lecturas al servidor vía protocolo IoT en tiempo real." },
  { n:"03", title:"Procesamiento", desc:"El backend organiza lecturas, calcula estados y genera alertas ante variaciones relevantes." },
  { n:"04", title:"Visualización", desc:"El dashboard convierte los datos en gráficas y alertas interpretables para actuar." },
];
const SENSORS = [
  {
    id:"gen", n:"01", label:"Vista general",
    title:"Estado centralizado del sistema.",
    desc:"El dashboard general muestra el estado de todos los sensores, alertas activas e historial sin necesidad de navegar entre secciones.",
    status:"Operación estable",
    img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80",
    points:[34,38,36,42,46,44,49,54,57,61],
  },
  {
    id:"hum", n:"02", label:"Humedad",
    title:"Saturación del suelo antes de que sea visible.",
    desc:"Variaciones rápidas o sostenidas en humedad pueden anticipar infiltración de agua que aumenta el riesgo de deslizamiento.",
    status:"Monitoreo preventivo",
    img:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=80",
    points:[28,30,34,33,39,44,46,52,58,68],
  },
  {
    id:"vib", n:"03", label:"Vibración",
    title:"Picos sísmicos que anticipan movimientos severos.",
    desc:"El análisis de vibración detecta perturbaciones imperceptibles al ojo humano. La actividad creciente sostenida activa alertas prioritarias.",
    status:"Actividad moderada",
    img:"https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=900&q=80",
    points:[18,25,20,31,28,37,35,42,39,48],
  },
  {
    id:"til", n:"04", label:"Inclinación",
    title:"Desplazamientos graduales con tiempo de reacción.",
    desc:"La inclinación revela desviaciones lentas pero acumulativas. Detectarlas a tiempo permite actuar antes de que escalen a situación crítica.",
    status:"Atención activa",
    img:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80",
    points:[14,16,19,21,24,26,28,31,35,40],
  },
];
const CITIZEN_STEPS = [
  { n:"01", title:"Detectas algo inusual",      desc:"Grietas, hundimientos o deslizamientos activos cerca de ti." },
  { n:"02", title:"Marcas el punto en el mapa", desc:"Sin cuenta. Ubicación y descripción del evento en segundos." },
  { n:"03", title:"El reporte queda en vivo",   desc:"Visible al instante para todos y para las autoridades." },
];
const MAP_PINS = [
  { left:"36%", top:"46%", type:"R", label:"Deslizamiento activo" },
  { left:"64%", top:"26%", type:"O", label:"Grietas detectadas"  },
  { left:"20%", top:"66%", type:"G", label:"Movimiento leve"     },
];

/* ── component ── */
export default function Landing() {
  const [tab, setTab] = useState("gen");
  const sensor = SENSORS.find((t) => t.id === tab) ?? SENSORS[0];

  return (
    <div className={s.root}>

      {/* HEADER */}
      <header className={s.header}>
        <div className={s.hInner}>
          <Link to="/" className={s.logo}>
            <div className={s.logoMark}>SW</div>
            <span className={s.logoName}>SlideWatch</span>
          </Link>
          <nav className={s.nav}>
            <a href="#acceso"   className={s.navA}>Plataforma</a>
            <a href="#proceso"  className={s.navA}>Sistema</a>
            <a href="#sensores" className={s.navA}>Sensores</a>
            <a href="#reportes" className={s.navA}>Reportes</a>
          </nav>
          <Link to="/login"    className={s.hdrLogin}>Iniciar sesión</Link>
          <Link to="/register" className={s.hdrBtn}>Registrarse</Link>
        </div>
      </header>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroTop}>
          <div className={s.heroTopLeft}>
            <A d="up">
              <span className={s.heroEyebrow}>
                <span className={s.heroEyebrowLine} />
                Monitoreo geotécnico · IoT
              </span>
            </A>
            <A d="up" delay={1}>
              <h1 className={s.heroH1}>
                El terreno
                <span className={s.heroH1Em}>siempre avisa.</span>
              </h1>
            </A>
          </div>
          <A d="r" delay={2} className={s.heroTopRight}>
            <p className={s.heroDesc}>
              SlideWatch integra sensores IoT, dashboards en tiempo real y reporte
              ciudadano en un sistema diseñado para detectar señales tempranas
              de deslizamiento y apoyar decisiones preventivas.
            </p>
            <div className={s.heroBtns}>
              <Link to="/login"    className={s.btnDark}>Entrar al sistema →</Link>
              <a href="#acceso"    className={s.btnGhost}>Ver plataforma</a>
            </div>
          </A>
        </div>
        <A d="up" delay={2} style={{ width: "100%" }}>
          <div className={s.heroImgStrip}>
            <img
              src="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=85"
              alt="Terreno montañoso con riesgo de deslizamiento"
            />
            <span className={s.heroImgCaption}>
              Monitoreo activo · Sistema de alerta temprana
            </span>
          </div>
        </A>
      </section>

      {/* INTRO — editorial statement */}
      <section className={s.intro}>
        <div className={s.introInner}>
          <A d="l">
            <div className={s.introSide}>
              <span className={s.introSideLabel}>
                <span className={s.introSideLine} />
                Misión
              </span>
              <span className={s.introSideNum}>01</span>
            </div>
          </A>
          <A d="r">
            <p className={s.introQuote}>
              Una plataforma que conecta{" "}
              <span className={s.introQuoteEm}>sensores en campo</span>{" "}
              con dashboards en tiempo real y con cualquier ciudadano que quiera{" "}
              <span className={s.introQuoteEm}>reportar lo que ve</span>{" "}
              antes de que sea demasiado tarde.
            </p>
          </A>
        </div>
      </section>

      {/* ACCESS — two image cards */}
      <section id="acceso" className={s.access}>
        <div className={s.accessWrap}>
          <div className={s.accessHeader}>
            <A d="l">
              <h2 className={s.accessH2}>
                Dos accesos.
                <span className={s.accessH2Em}> Una sola plataforma.</span>
              </h2>
            </A>
            <A d="r">
              <p className={s.accessSubtitle}>
                Un panel cerrado para equipos técnicos y un mapa público
                para que cualquier persona reporte o consulte eventos
                geotécnicos en su zona.
              </p>
            </A>
          </div>

          <div className={s.accessCards}>
            {/* Admin */}
            <A d="l">
              <div className={s.accessCard}>
                <div className={s.accessCardImg}>
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80"
                    alt="Panel de monitoreo"
                  />
                </div>
                <div className={s.accessCardBody}>
                  <span className={s.accessCardTag}>Administradores · Técnicos</span>
                  <h3 className={s.accessCardH3}>Panel de monitoreo geotécnico</h3>
                  <p className={s.accessCardP}>
                    Acceso restringido con dashboards interactivos, lecturas de sensores
                    en tiempo real, histórico completo y mapa con la ubicación y estado
                    de cada dispositivo en campo.
                  </p>
                  <ul className={s.accessCardList}>
                    {ADMIN_FEATURES.map((f) => (
                      <li key={f} className={s.accessCardItem}>
                        <span className={s.accessCardDot} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/login" className={s.btnDark}>Acceder al panel →</Link>
                </div>
              </div>
            </A>

            {/* Citizen */}
            <A d="r">
              <div className={s.accessCard}>
                <div className={s.accessCardImg}>
                  <img
                    src="https://images.unsplash.com/photo-1599700403969-f77b3aa74837?w=900&q=80"
                    alt="Persona reportando en campo"
                  />
                </div>
                <div className={s.accessCardBody}>
                  <span className={s.accessCardTag}>Acceso público · Ciudadanos</span>
                  <h3 className={s.accessCardH3}>Mapa de alertas y reporte de eventos</h3>
                  <p className={s.accessCardP}>
                    El mapa de alertas es completamente público. No necesitas cuenta
                    para consultarlo. Si detectas algo cerca, reportarlo
                    toma menos de un minuto.
                  </p>
                  <ul className={s.accessCardList}>
                    {CITIZEN_FEATURES.map((f) => (
                      <li key={f} className={s.accessCardItem}>
                        <span className={s.accessCardDot} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className={s.btnRust}>Ver mapa de alertas →</Link>
                </div>
              </div>
            </A>
          </div>
        </div>
      </section>

      {/* PROCESS — dark */}
      <section id="proceso" className={s.process}>
        <div className={s.processWrap}>
          <div className={s.processTop}>
            <A d="l">
              <h2 className={s.processH2}>
                Del sensor
                <span className={s.processH2Em}>al dashboard.</span>
              </h2>
            </A>
            <A d="r">
              <p className={s.processIntro}>
                Cuatro pasos trazables. Los datos del terreno se convierten
                en información útil en segundos, sin intermediarios.
              </p>
            </A>
          </div>
          <div className={s.processSteps}>
            {PROCESS.map((p, i) => (
              <A key={p.n} d="up" delay={i + 1}>
                <div className={s.processStep}>
                  <span className={s.processN}>{p.n}</span>
                  <h3 className={s.processTitle}>{p.title}</h3>
                  <p className={s.processDesc}>{p.desc}</p>
                </div>
              </A>
            ))}
          </div>
        </div>
      </section>

      {/* SENSORS */}
      <section id="sensores" className={s.sensors}>
        <div className={s.sensorsWrap}>
          <div className={s.sensorsTop}>
            <A d="l">
              <h2 className={s.sensorsH2}>
                Cuatro variables.
                <span className={s.sensorsH2Em}> Una sola vista.</span>
              </h2>
            </A>
            <A d="r">
              <p className={s.sensorsNote}>
                Selecciona una variable para ver en qué consiste su monitoreo
                y cómo se comporta su tendencia.
              </p>
            </A>
          </div>

          <div className={s.sTabs}>
            {SENSORS.map((sen) => (
              <button
                key={sen.id} type="button"
                onClick={() => setTab(sen.id)}
                className={[s.sTab, tab === sen.id && s.sTabActive].filter(Boolean).join(" ")}
              >
                <span className={s.sTabN}>{sen.n}</span>
                <span className={s.sTabLabel}>{sen.label}</span>
              </button>
            ))}
          </div>

          <div className={s.sPanel}>
            <div className={s.sPanelImg}>
              <img src={sensor.img} alt={sensor.label} />
            </div>
            <div className={s.sPanelContent}>
              <span className={s.sPanelKicker}>{sensor.n} · {sensor.label}</span>
              <h3 className={s.sPanelH3}>{sensor.title}</h3>
              <p className={s.sPanelP}>{sensor.desc}</p>
              <span className={s.sPill}>
                <span className={s.sPillDot} />{sensor.status}
              </span>
              <div className={s.chartWrap}>
                <div className={s.chartTop}>
                  <span className={s.chartTopLabel}>Tendencia del sensor</span>
                  <span className={s.chartTopNote}>datos ilustrativos</span>
                </div>
                <div className={s.chartBox}><Chart points={sensor.points} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CITIZEN — image hero + map */}
      <section id="reportes" className={s.citizen}>
        <div className={s.citizenWrap}>
          <A d="up">
            <div className={s.citizenHero}>
              <div className={s.citizenHeroBg}>
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=85"
                  alt="Vista aérea de montañas con riesgo geológico"
                />
              </div>
              <div className={s.citizenHeroContent}>
                <div>
                  <h2 className={s.citizenH2}>
                    Cualquier persona puede
                    <span className={s.citizenH2Em}> ver y reportar</span> un desastre.
                  </h2>
                  <p className={s.citizenNote}>
                    No necesitas cuenta. No necesitas conocimientos técnicos.
                  </p>
                </div>
                <div className={s.citizenRight}>
                  {CITIZEN_STEPS.map((cs) => (
                    <div key={cs.n} className={s.citizenStep}>
                      <span className={s.citizenStepNum}>{cs.n}</span>
                      <div>
                        <p className={s.citizenStepTitle}>{cs.title}</p>
                        <p className={s.citizenStepDesc}>{cs.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </A>

          <div className={s.citizenBottom}>
            <A d="l" className={s.citizenBottomLeft}>
              <span className={s.citizenKicker}>
                <span className={s.citizenKickerLine} />Mapa en vivo
              </span>
              <h3 className={s.citizenSubH}>
                El mapa de alertas es completamente público.
              </h3>
              <p className={s.citizenSubP}>
                Consulta eventos activos en tu zona sin necesidad de registrarte.
                Si detectas algo, repórtalo desde el mismo mapa en segundos.
              </p>
              <Link to="/register" className={s.btnRust}>Ver mapa de alertas →</Link>
            </A>

            <A d="r">
              <div className={s.mapCard}>
                <div className={s.mapCardHead}>
                  <span className={s.mapCardTitle}>Mapa de reportes</span>
                  <span className={s.mapLive}><span className={s.mapLiveDot} />En vivo</span>
                </div>
                <div className={s.mapCanvas}>
                  <div className={s.mapBg} />
                  <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="40%" x2="100%" y2="40%" stroke="rgba(28,17,8,.07)" strokeWidth="3"/>
                    <line x1="0" y1="68%" x2="100%" y2="68%" stroke="rgba(28,17,8,.05)" strokeWidth="2"/>
                    <line x1="32%" y1="0" x2="32%" y2="100%" stroke="rgba(28,17,8,.07)" strokeWidth="3"/>
                    <line x1="65%" y1="0" x2="65%" y2="100%" stroke="rgba(28,17,8,.05)" strokeWidth="2"/>
                  </svg>
                  {MAP_PINS.map((pin, i) => (
                    <div key={i} className={s.mapPin} style={{left:pin.left,top:pin.top}}>
                      <div className={[s.pinH, s[`pin${pin.type}`]].join(" ")}>
                        {pin.type !== "G" && <span className={s.pinRipple} />}
                      </div>
                      <span className={s.pinLabel}>{pin.label}</span>
                    </div>
                  ))}
                </div>
                <div className={s.mapCardFoot}>
                  <span className={s.mapCardFootTxt}>Reportes activos en tu zona</span>
                  <Link to="/register" className={s.mapCardBtn}>+ Reportar evento</Link>
                </div>
              </div>
            </A>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <A d="up">
          <div className={s.ctaWrap}>
            <div>
              <h2 className={s.ctaH2}>
                Empieza a monitorear.
                <span className={s.ctaH2Em}>O reporta lo que ves.</span>
              </h2>
              <p className={s.ctaP}>
                Accede al panel de administración o regístrate para empezar de inmediato.
                El mapa de alertas es público para todos.
              </p>
            </div>
            <div className={s.ctaBtns}>
              <Link to="/login"    className={s.btnCtaRust}>Iniciar sesión</Link>
              <Link to="/register" className={s.btnCtaGhost}>Crear cuenta</Link>
            </div>
          </div>
        </A>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <span className={s.footerBrand}>SlideWatch</span>
          <span className={s.footerCopy}>© {new Date().getFullYear()} · Monitoreo geotécnico</span>
          <div className={s.footerLinks}>
            <Link to="/login"    className={s.footerLink}>Iniciar sesión</Link>
            <Link to="/register" className={s.footerLink}>Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}