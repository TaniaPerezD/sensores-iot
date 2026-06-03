import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, AlertTriangle, RefreshCw, X, Clock,
  Wifi, WifiOff, CheckCircle, LayoutGrid, Droplets,
  Activity, Compass, History, Settings, LogOut, Map, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMapReports, getMapDevices, getMapAlerts, updateReportStatus } from '../../api/mapApi';
import { useMapSocket } from '../../hooks/useMapSocket';
import '../../styles/dashboard.css';
import '../../styles/map.css';

// ─── Leaflet ─────────────────────────────────────────────────────────────────
let L = null;
const loadLeaflet = () =>
  new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });

// ─── Constantes ──────────────────────────────────────────────────────────────
const URGENCY = {
  alta:  { color: '#8b2020', stroke: '#fff', bg: '#fcebeb' },
  media: { color: '#b7791f', stroke: '#fff', bg: '#faeeda' },
  baja:  { color: '#5a7a3a', stroke: '#fff', bg: '#eaf3de' },
};
const DEVICE_STATUS_COLOR = {
  active: '#5a7a3a', inactive: '#7d6a5b', error: '#8b2020',
};
const ALERT_COLOR = {
  critical: '#8b2020', warning: '#b7791f', info: '#3a5560',
};
const STATUS_COLOR = {
  pendiente: '#b7791f', en_revision: '#3a5560',
  atendido: '#5a7a3a', descartado: '#b09b8c',
};
const STATUS_LABEL = {
  pendiente: 'Pendiente', en_revision: 'En revisión',
  atendido: 'Atendido', descartado: 'Descartado',
};
const STATUS_LIST = [
  { value: 'pendiente',   label: 'Pendiente',   icon: 'clock' },
  { value: 'en_revision', label: 'En revisión', icon: 'eye' },
  { value: 'atendido',    label: 'Atendido',    icon: 'check' },
  { value: 'descartado',  label: 'Descartado',  icon: 'x' },
];
const INCIDENT_LABEL = {
  deslizamiento: 'Deslizamiento', grieta: 'Grieta',
  inundacion: 'Inundación', derrumbe: 'Derrumbe', otro: 'Otro',
};
const INCIDENT_PATHS = {
  deslizamiento: 'M3 20 Q6 10 12 12 Q18 14 21 6 M3 20 L21 20',
  grieta:        'M12 3 L10 10 L14 10 L12 17 M8 20 L16 20',
  inundacion:    'M3 14 Q7 10 12 14 Q17 18 21 14 M3 18 Q7 14 12 18 Q17 22 21 18',
  derrumbe:      'M4 20 L8 10 L12 14 L16 6 L20 20 Z',
  otro:          'M12 4 a8 8 0 1 0 0 16 a8 8 0 1 0 0-16 M12 9 L12 13 M12 15 L12 16',
};
const RANGE_OPTIONS = [
  { value: '1h', label: 'Última hora' }, { value: '6h', label: '6 horas' },
  { value: '12h', label: '12 horas' },  { value: '24h', label: '24 horas' },
  { value: '2d', label: '2 días' },     { value: '7d', label: 'Esta semana' },
  { value: '30d', label: 'Este mes' },
];

// ─── SVG Markers ─────────────────────────────────────────────────────────────
function buildReportMarker(incident_type, urgency_level) {
  const u    = URGENCY[urgency_level] || URGENCY.baja;
  const path = INCIDENT_PATHS[incident_type] || INCIDENT_PATHS.otro;
  const size = urgency_level === 'alta' ? 44 : urgency_level === 'media' ? 38 : 32;
  const cx   = size / 2;
  const r    = cx - 2;
  const svg  = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+10}" viewBox="0 0 ${size} ${size+10}">
    <filter id="s"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="${u.color}" flood-opacity="0.35"/></filter>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="${u.color}" filter="url(#s)"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
    <g transform="translate(${cx-7},${cx-7}) scale(0.58)" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="${path}"/>
    </g>
    <polygon points="${cx-6},${size-3} ${cx+6},${size-3} ${cx},${size+9}" fill="${u.color}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildDeviceMarker(status, hasAlert) {
  const color = hasAlert ? '#8b2020' : (DEVICE_STATUS_COLOR[status] || '#3a5560');
  const size  = 38;
  const cx    = size / 2;
  const svg   = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+10}" viewBox="0 0 ${size} ${size+10}">
    <filter id="s2"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="${color}" flood-opacity="0.4"/></filter>
    <rect x="2" y="2" width="${size-4}" height="${size-4}" rx="9" fill="${color}" filter="url(#s2)"/>
    <rect x="2" y="2" width="${size-4}" height="${size-4}" rx="9" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
    <g transform="translate(8,7)" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="11" y1="0" x2="11" y2="6"/>
      <path d="M6 5 Q11 2 16 5"/><path d="M3 2.5 Q11 -2 19 2.5"/>
      <rect x="7" y="6" width="8" height="6" rx="1.5"/>
      <line x1="11" y1="12" x2="11" y2="15"/>
      <line x1="7" y1="15" x2="15" y2="15"/>
    </g>
    ${hasAlert ? `<circle cx="${size-5}" cy="5" r="6" fill="#8b2020" stroke="white" stroke-width="1.5"/>
    <line x1="${size-5}" y1="2.5" x2="${size-5}" y2="5.8" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="${size-5}" cy="7.8" r="0.9" fill="white"/>` : ''}
    <polygon points="${cx-6},${size-2} ${cx+6},${size-2} ${cx},${size+9}" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function buildReportPopupHtml(r) {
  const u  = URGENCY[r.urgency_level] || URGENCY.baja;
  const sc = STATUS_COLOR[r.status] || '#7d6a5b';
  const date = new Date(r.reported_at).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const photo = r.photo_url ? `<div class="mp-popup-photo"><img src="${r.photo_url}" alt="Foto" loading="lazy"/></div>` : '';
  return `
    <div class="mp-popup">
      <div class="mp-popup-header" style="border-left:4px solid ${u.color}">
        <div class="mp-popup-header-row">
          <span class="mp-popup-type">${INCIDENT_LABEL[r.incident_type] || r.incident_type}</span>
          <span class="mp-popup-badge" style="background:${u.bg};color:${u.color}">${r.urgency_level?.toUpperCase()}</span>
        </div>
      </div>
      ${photo}
      <div class="mp-popup-body">
        <p class="mp-popup-desc">${r.description}</p>
        <div class="mp-popup-meta">
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${r.reporter_name || 'Anónimo'}
          </div>
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${r.location_name || 'Sin ubicación'}
          </div>
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${date}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
          <span class="mp-popup-status" style="background:${sc}18;color:${sc}">${STATUS_LABEL[r.status] || r.status}</span>
          <button class="mp-popup-change-btn" data-report-id="${r.id}">Cambiar estado</button>
        </div>
      </div>
    </div>`;
}

function buildDevicePopupHtml(d, alerts) {
  const sc  = DEVICE_STATUS_COLOR[d.status] || '#3a5560';
  const ls  = d.last_seen_at
    ? new Date(d.last_seen_at).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Desconocido';
  const devAlerts = alerts.filter(a => a.device_code === d.code).slice(0, 5);
  const alertsHtml = devAlerts.length
    ? devAlerts.map(a => `
        <div class="mp-popup-alert-row" style="border-left:3px solid ${ALERT_COLOR[a.level]||'#b7791f'}">
          <strong>${a.title}</strong>
          ${a.current_value != null ? `<span>${a.current_value} / ${a.threshold_value}</span>` : ''}
        </div>`).join('')
    : `<div class="mp-popup-no-alerts">Sin alertas activas</div>`;
  return `
    <div class="mp-popup mp-popup--device">
      <div class="mp-popup-header" style="border-left:4px solid ${sc}">
        <div class="mp-popup-header-row">
          <span class="mp-popup-type">${d.name}</span>
          <span class="mp-popup-badge" style="background:${sc}18;color:${sc}">${d.status?.toUpperCase()}</span>
        </div>
      </div>
      <div class="mp-popup-body">
        <div class="mp-popup-meta">
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
            ${d.code}
          </div>
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${d.location_name || '—'}
          </div>
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${ls}
          </div>
        </div>
        <div class="mp-popup-alerts-title">Alertas recientes</div>
        <div class="mp-popup-alerts-body">${alertsHtml}</div>
      </div>
    </div>`;
}

// ─── Sidebar del mapa ─────────────────────────────────────────────────────────
function MapSidebar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const items = [
    { label: 'Resumen del terreno',     icon: <LayoutGrid size={16}/> },
    { label: 'Humedad del suelo',       icon: <Droplets size={16}/> },
    { label: 'Sismicidad / vibración',  icon: <Activity size={16}/> },
    { label: 'Inclinación / movimiento',icon: <Compass size={16}/> },
    { label: 'Histórico',               icon: <History size={16}/> },
  ];
  return (
    <aside className="sw-sidebar">
      <div className="sw-sidebar-head">
        <div className="sw-logo">
          <div className="sw-logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 13 Q4 7 8 9 Q12 11 14 5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 13 L14 13" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="8" cy="9" r="1.5" fill="white" opacity="0.85"/>
            </svg>
          </div>
          <div>
            <div className="sw-logo-name">SlideWatch</div>
            <div className="sw-logo-sub">Sistema de alerta temprana</div>
          </div>
        </div>
      </div>
      <div className="sw-sidebar-scroll">
        <div className="sw-sidebar-section-label">Monitoreo</div>
        <nav className="sw-nav">
          {items.map(item => (
            <button key={item.label} className="sw-nav-btn" onClick={() => navigate('/dashboard')} type="button">
              <span className="sw-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sw-sidebar-section-label">Herramientas</div>
        <button className="sw-nav-btn active" type="button">
          <span className="sw-nav-icon"><Map size={16}/></span>
          <span>Mapa interactivo</span>
        </button>
        <div className="sw-sidebar-section-label">Sistema</div>
        <button className="sw-nav-btn" type="button">
          <span className="sw-nav-icon"><Settings size={16}/></span>
          <span>Configuración</span>
        </button>
      </div>
      <div className="sw-sidebar-footer">
        <button className="sw-logout-btn" onClick={logout} type="button">
          <LogOut size={15}/><span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Modal confirmación de estado ─────────────────────────────────────────────
function StatusModal({ report, onConfirm, onClose, loading }) {
  const [selected, setSelected] = useState(report.status);
  const u  = URGENCY[report.urgency_level] || URGENCY.baja;
  const changed = selected !== report.status;

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal" onClick={e => e.stopPropagation()}>
        <div className="mp-modal-header">
          <div>
            <div className="mp-modal-title">Cambiar estado del reporte</div>
            <div className="mp-modal-sub" style={{ color: u.color }}>
              {INCIDENT_LABEL[report.incident_type] || report.incident_type} · {report.urgency_level?.toUpperCase()}
            </div>
          </div>
          <button className="mp-modal-close" onClick={onClose}><X size={16}/></button>
        </div>

        {report.description && (
          <p className="mp-modal-desc">{report.description}</p>
        )}

        <div className="mp-modal-options">
          {STATUS_LIST.map(s => {
            const sc = STATUS_COLOR[s.value];
            const isActive = selected === s.value;
            return (
              <button
                key={s.value}
                className={`mp-modal-option${isActive ? ' mp-modal-option--active' : ''}`}
                style={isActive ? { borderColor: sc, background: `${sc}12`, color: sc } : {}}
                onClick={() => setSelected(s.value)}
                type="button"
              >
                <span className="mp-modal-option-dot" style={{ background: sc }}/>
                {s.label}
                {report.status === s.value && (
                  <span className="mp-modal-option-current">actual</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mp-modal-footer">
          <button className="mp-modal-cancel" onClick={onClose} type="button">Cancelar</button>
          <button
            className="mp-modal-confirm"
            onClick={() => onConfirm(selected)}
            disabled={!changed || loading}
            type="button"
          >
            {loading ? <RefreshCw size={14} className="mp-spin"/> : <CheckCircle size={14}/>}
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detalle panel lateral ────────────────────────────────────────────────────
function ReportDetail({ report, onChangeStatus }) {
  const u  = URGENCY[report.urgency_level] || URGENCY.baja;
  const sc = STATUS_COLOR[report.status] || '#7d6a5b';
  const dateStr = new Date(report.reported_at).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div className="mp-detail">
      <div className="mp-detail-badge" style={{ background: u.bg, color: u.color }}>
        {INCIDENT_LABEL[report.incident_type] || report.incident_type}
        <span className="mp-detail-badge-urg">{report.urgency_level?.toUpperCase()}</span>
      </div>
      {report.photo_url && (
        <div className="mp-detail-photo"><img src={report.photo_url} alt="Foto del reporte"/></div>
      )}
      <p className="mp-detail-desc">{report.description}</p>
      <div className="mp-detail-meta">
        <div><strong>Reportado por</strong><span>{report.reporter_name || 'Anónimo'}</span></div>
        <div><strong>Ubicación</strong><span>{report.location_name || '—'}</span></div>
        <div><strong>Fecha</strong><span>{dateStr}</span></div>
        <div><strong>Coordenadas</strong><span>{Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}</span></div>
      </div>
      <div className="mp-detail-status-row">
        <span className="mp-detail-status" style={{ background: `${sc}18`, color: sc }}>
          {STATUS_LABEL[report.status] || report.status}
        </span>
        <button className="mp-detail-change-btn" onClick={() => onChangeStatus(report)}>
          <ChevronDown size={13}/> Cambiar estado
        </button>
      </div>
    </div>
  );
}

function DeviceDetail({ device, alerts }) {
  const sc  = DEVICE_STATUS_COLOR[device.status] || '#3a5560';
  const devAlerts = alerts.filter(a => a.device_code === device.code);
  const lastSeen  = device.last_seen_at
    ? new Date(device.last_seen_at).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Desconocido';
  return (
    <div className="mp-detail">
      <div className="mp-detail-badge" style={{ background: `${sc}18`, color: sc }}>
        {device.status === 'active' ? <Wifi size={13}/> : <WifiOff size={13}/>}
        {device.name}
        <span className="mp-detail-badge-urg">{device.status?.toUpperCase()}</span>
      </div>
      <div className="mp-detail-meta">
        <div><strong>Código</strong><code>{device.code}</code></div>
        <div><strong>Ubicación</strong><span>{device.location_name || '—'}</span></div>
        <div><strong>Último visto</strong><span>{lastSeen}</span></div>
        <div><strong>Conexión</strong><span>{device.connection_mode || '—'}</span></div>
        <div><strong>Firmware</strong><span>{device.firmware_version || '—'}</span></div>
      </div>
      <div className="mp-detail-section-title">
        <AlertTriangle size={14}/>
        Alertas abiertas ({devAlerts.length})
      </div>
      {devAlerts.length === 0 ? (
        <div className="mp-detail-no-alerts"><CheckCircle size={15}/> Sin alertas activas</div>
      ) : (
        <div className="mp-detail-alerts-wrap">
        <div className="mp-detail-alerts">
          {devAlerts.map(a => (
            <div key={a.id} className="mp-detail-alert" style={{ borderLeft: `3px solid ${ALERT_COLOR[a.level]||'#b7791f'}` }}>
              <div className="mp-detail-alert-top">
                <strong>{a.title}</strong>
                <span style={{ color: ALERT_COLOR[a.level] }}>{a.level}</span>
              </div>
              {a.message && <p>{a.message}</p>}
              {a.current_value != null && (
                <div className="mp-detail-alert-vals">Valor: <b>{a.current_value} {a.unit||''}</b> · Umbral: {a.threshold_value}</div>
              )}
              <div className="mp-detail-alert-time">
                {new Date(a.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminMap() {
  const mapRef     = useRef(null);
  const mapObj     = useRef(null);
  const layerGroup = useRef(null);
  const alertsRef  = useRef([]);  // ref para acceso en popup click handler

  const [reports,     setReports]     = useState([]);
  const [devices,     setDevices]     = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [range,       setRange]       = useState('24h');
  const [alertRange,  setAlertRange]  = useState('24h');
  const [showReports, setShowReports] = useState(true);
  const [showDevices, setShowDevices] = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [modal,       setModal]       = useState(null);   // report para el modal
  const [modalLoading,setModalLoading]= useState(false);
  const [toast,       setToast]       = useState(null);   // { msg, ok }

  // Mantener ref de alerts actualizado para el handler del popup
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);

  // ── Fetch inicial ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rRes, dRes, aRes] = await Promise.all([
        getMapReports(range), getMapDevices(), getMapAlerts(alertRange),
      ]);
      setReports(rRes?.data || []);
      setDevices(dRes?.data || []);
      setAlerts(aRes?.data  || []);
    } catch (e) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [range, alertRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Tiempo real ───────────────────────────────────────────────────────────
  const handleReportNew = useCallback((report) => {
    if (!report.latitude || !report.longitude) return;
    setReports(prev => prev.some(r => r.id === report.id) ? prev : [report, ...prev]);
  }, []);

  const handleReportStatusUpdated = useCallback((report) => {
    // Admin ve todos los estados incluyendo descartado
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, ...report } : r));
    // Si el panel lateral está abierto con ese reporte, actualizarlo
    setSelected(prev =>
      prev?.type === 'report' && prev.data.id === report.id
        ? { type: 'report', data: { ...prev.data, ...report } }
        : prev
    );
  }, []);

  const handleAlertNew = useCallback((alert) => {
    setAlerts(prev => prev.some(a => a.id === alert.id) ? prev : [alert, ...prev]);
  }, []);

  const handleAlertResolved = useCallback(({ id }) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleDeviceSeen = useCallback(({ device_code, last_seen_at }) => {
    setDevices(prev => prev.map(d => d.code === device_code ? { ...d, last_seen_at } : d));
  }, []);

  useMapSocket({
    onReportNew:           handleReportNew,
    onReportStatusUpdated: handleReportStatusUpdated,
    onAlertNew:            handleAlertNew,
    onAlertResolved:       handleAlertResolved,
    onDeviceSeen:          handleDeviceSeen,
  });

  // ── Leaflet init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapObj.current || !mapRef.current) return;
    loadLeaflet().then((Lx) => {
      L = Lx;
      mapObj.current = L.map(mapRef.current, { center: [-16.5, -68.15], zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapObj.current);
      layerGroup.current = L.layerGroup().addTo(mapObj.current);
    });
    return () => { if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; } };
  }, []);

  // ── Dibujar marcadores ────────────────────────────────────────────────────
  useEffect(() => {
    if (!L || !mapObj.current || !layerGroup.current) return;
    layerGroup.current.clearLayers();

    if (showReports) {
      reports.forEach(r => {
        if (!r.latitude || !r.longitude) return;
        const size = r.urgency_level === 'alta' ? 44 : r.urgency_level === 'media' ? 38 : 32;
        const icon = L.icon({
          iconUrl:    buildReportMarker(r.incident_type, r.urgency_level),
          iconSize:   [size, size + 10],
          iconAnchor: [size / 2, size + 10],
          popupAnchor:[0, -(size + 12)],
        });
        const marker = L.marker([parseFloat(r.latitude), parseFloat(r.longitude)], { icon })
          .addTo(layerGroup.current)
          .bindPopup(buildReportPopupHtml(r), { maxWidth: 320, className: 'mp-leaflet-popup' });

        marker.on('click', () => setSelected({ type: 'report', data: r }));

        // Delegar click en el botón del popup (Leaflet renderiza HTML estático)
        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.querySelector(`.mp-popup-change-btn[data-report-id="${r.id}"]`);
            if (btn) btn.onclick = () => setModal(r);
          }, 50);
        });
      });
    }

    if (showDevices) {
      devices.forEach(d => {
        if (!d.latitude || !d.longitude) return;
        const hasAlert = alerts.some(a => a.device_code === d.code);
        const icon = L.icon({
          iconUrl:    buildDeviceMarker(d.status, hasAlert),
          iconSize:   [38, 48],
          iconAnchor: [19, 48],
          popupAnchor:[0, -50],
        });
        L.marker([parseFloat(d.latitude), parseFloat(d.longitude)], { icon })
          .addTo(layerGroup.current)
          .bindPopup(buildDevicePopupHtml(d, alerts), { maxWidth: 340, className: 'mp-leaflet-popup' })
          .on('click', () => setSelected({ type: 'device', data: d }));
      });
    }
  }, [reports, devices, alerts, showReports, showDevices]);

  // ── Cambio de estado ──────────────────────────────────────────────────────
  const handleConfirmStatus = async (newStatus) => {
    if (!modal) return;
    setModalLoading(true);
    try {
      await updateReportStatus(modal.id, newStatus);
      showToast('Estado actualizado correctamente', true);
      setModal(null);
      // El WS actualizará el estado localmente vía handleReportStatusUpdated
    } catch (e) {
      showToast(e.message || 'Error al actualizar estado', false);
    } finally {
      setModalLoading(false);
    }
  };

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const criticalAlerts = alerts.filter(a => a.level === 'critical').length;
  const highReports    = reports.filter(r => r.urgency_level === 'alta').length;

  return (
    <div className="sw-layout">
      <MapSidebar/>

      <div className="sw-main" style={{ minHeight: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <div className="sw-topbar sw-topbar--glass">
          <div>
            <div className="sw-page-title">Mapa interactivo</div>
            <div className="sw-page-sub">Vista administrador · Tiempo real</div>
          </div>
          <div className="sw-topbar-right mp-topbar-controls">
            <div className="mp-filter-group">
              <Clock size={13}/><label>Reportes</label>
              <select value={range} onChange={e => setRange(e.target.value)}>
                {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="mp-filter-group">
              <AlertTriangle size={13}/><label>Alertas</label>
              <select value={alertRange} onChange={e => setAlertRange(e.target.value)}>
                {RANGE_OPTIONS.filter(o => ['1h','6h','12h','24h','2d','7d'].includes(o.value))
                  .map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="mp-layer-toggles">
              <button className={`mp-layer-btn${showReports?' active':''}`} onClick={() => setShowReports(v => !v)}>
                <MapPin size={13}/> Reportes
              </button>
              <button className={`mp-layer-btn${showDevices?' active':''}`} onClick={() => setShowDevices(v => !v)}>
                <Activity size={13}/> Dispositivos
              </button>
            </div>
            <button className="mp-refresh-btn" onClick={fetchData} disabled={loading} title="Actualizar">
              <RefreshCw size={15} className={loading ? 'mp-spin' : ''}/>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mp-stats-row">
          <div className="mp-stat"><span className="mp-stat-val">{reports.length}</span><span className="mp-stat-lbl">Reportes</span></div>
          <div className="mp-stat mp-stat--warn"><span className="mp-stat-val">{highReports}</span><span className="mp-stat-lbl">Urgencia alta</span></div>
          <div className="mp-stat"><span className="mp-stat-val">{devices.length}</span><span className="mp-stat-lbl">Dispositivos</span></div>
          <div className="mp-stat mp-stat--danger"><span className="mp-stat-val">{alerts.length}</span><span className="mp-stat-lbl">Alertas abiertas</span></div>
          {criticalAlerts > 0 && (
            <div className="mp-stat mp-stat--critical">
              <span className="mp-stat-val">{criticalAlerts}</span>
              <span className="mp-stat-lbl">Críticas</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mp-error-banner">
            <AlertTriangle size={14}/> {error}
            <button onClick={fetchData}>Reintentar</button>
          </div>
        )}

        {/* Body */}
        <div className="mp-body">
          <div className="mp-map-wrap">
            {loading && (
              <div className="mp-map-loading">
                <RefreshCw size={22} className="mp-spin"/>
                <span>Cargando datos…</span>
              </div>
            )}
            <div ref={mapRef} className="mp-leaflet-container"/>
          </div>

          {selected && (
            <div className="mp-side-panel">
              <div className="mp-side-panel-header">
                <span>{selected.type === 'report' ? 'Reporte ciudadano' : 'Dispositivo IoT'}</span>
                <button onClick={() => setSelected(null)}><X size={16}/></button>
              </div>
              <div className="mp-side-panel-body">
                {selected.type === 'report'
                  ? <ReportDetail report={selected.data} onChangeStatus={setModal}/>
                  : <DeviceDetail device={selected.data} alerts={alerts}/>}
              </div>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mp-legend">
          <span className="mp-legend-title">Reportes</span>
          {Object.entries(URGENCY).map(([k, v]) => (
            <div key={k} className="mp-legend-item">
              <span className="mp-legend-dot" style={{ background: v.color }}/>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </div>
          ))}
          <span className="mp-legend-sep"/>
          <span className="mp-legend-title">Dispositivos</span>
          <div className="mp-legend-item"><span className="mp-legend-dot" style={{ background: '#5a7a3a', borderRadius: 3 }}/>Activo</div>
          <div className="mp-legend-item"><span className="mp-legend-dot" style={{ background: '#8b2020', borderRadius: 3 }}/>Con alerta</div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <StatusModal
          report={modal}
          onConfirm={handleConfirmStatus}
          onClose={() => setModal(null)}
          loading={modalLoading}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`mp-toast${toast.ok ? ' mp-toast--ok' : ' mp-toast--err'}`}>
          {toast.ok ? <CheckCircle size={15}/> : <AlertTriangle size={15}/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
