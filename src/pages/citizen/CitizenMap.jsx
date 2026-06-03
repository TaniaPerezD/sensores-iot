import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getMapReports, getMapAlerts } from '../../api/mapApi';
import '../../styles/citizen.css';
import '../../styles/map.css';

// ─── Leaflet loader ──────────────────────────────────────────────────────────
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

// ─── Colores ─────────────────────────────────────────────────────────────────
const URGENCY = {
  alta:  { color: '#8b2020', bg: '#fcebeb' },
  media: { color: '#b7791f', bg: '#faeeda' },
  baja:  { color: '#5a7a3a', bg: '#eaf3de' },
};
const STATUS_COLOR = {
  pendiente: '#b7791f', en_revision: '#3a5560',
  atendido: '#5a7a3a', descartado: '#b09b8c',
};
const STATUS_LABEL = {
  pendiente: 'Pendiente', en_revision: 'En revisión',
  atendido: 'Atendido', descartado: 'Descartado',
};
const INCIDENT_LABEL = {
  deslizamiento: 'Deslizamiento', grieta: 'Grieta',
  inundacion: 'Inundación', derrumbe: 'Derrumbe', otro: 'Otro',
};
const INCIDENT_PATHS = {
  deslizamiento: 'M3 20 Q6 10 12 12 Q18 14 21 6 M3 20 L21 20',
  grieta:        'M12 3 L10 10 L14 10 L12 17 M8 20 L16 20',
  inundacion:    'M3 14 Q7 10 12 14 Q17 18 21 14 M3 18 Q7 14 12 18 Q17 22 21 18',
  derrumbe:      'M4 20 L8 10 L12 14 L16 6 L20 20 Z',
  otro:          'M12 12 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0-16 0 M12 8 L12 13 M12 16 L12 17',
};

function buildMarkerSvg(incident_type, urgency_level) {
  const u    = URGENCY[urgency_level] || URGENCY.baja;
  const path = INCIDENT_PATHS[incident_type] || INCIDENT_PATHS.otro;
  const size = urgency_level === 'alta' ? 42 : urgency_level === 'media' ? 36 : 30;
  const r    = size / 2 - 2;
  const cx   = size / 2;
  const svg  = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
    <filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="${u.color}" flood-opacity="0.3"/></filter>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="${u.color}" filter="url(#ds)"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <g transform="translate(${cx - 7},${cx - 7}) scale(0.58)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="${path}"/>
    </g>
    <polygon points="${cx - 5},${size - 3} ${cx + 5},${size - 3} ${cx},${size + 9}" fill="${u.color}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildPopup(r) {
  const u  = URGENCY[r.urgency_level] || URGENCY.baja;
  const sc = STATUS_COLOR[r.status] || '#7d6a5b';
  const date = new Date(r.reported_at).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const photo = r.photo_url
    ? `<div class="mp-popup-photo"><img src="${r.photo_url}" alt="Foto" loading="lazy"/></div>` : '';
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${r.location_name || 'Sin ubicación'}
          </div>
          <div class="mp-popup-meta-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${date}
          </div>
        </div>
        <span class="mp-popup-status" style="background:${sc}18;color:${sc}">${STATUS_LABEL[r.status] || r.status}</span>
      </div>
    </div>`;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function CitizenMap() {
  const mapRef     = useRef(null);
  const mapObj     = useRef(null);
  const layerGroup = useRef(null);

  const [reports, setReports] = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rRes, aRes] = await Promise.all([
        getMapReports('7d'),
        getMapAlerts('7d'),
      ]);
      setReports(rRes?.data || []);
      setAlerts(aRes?.data  || []);
    } catch (e) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (mapObj.current || !mapRef.current) return;
    loadLeaflet().then((Lx) => {
      L = Lx;
      mapObj.current = L.map(mapRef.current, { center: [-16.5, -68.15], zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(mapObj.current);
      layerGroup.current = L.layerGroup().addTo(mapObj.current);
    });
    return () => { if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; } };
  }, []);

  useEffect(() => {
    if (!L || !mapObj.current || !layerGroup.current) return;
    layerGroup.current.clearLayers();
    reports.forEach(r => {
      if (!r.latitude || !r.longitude) return;
      const size = r.urgency_level === 'alta' ? 42 : r.urgency_level === 'media' ? 36 : 30;
      const icon = L.icon({
        iconUrl:    buildMarkerSvg(r.incident_type, r.urgency_level),
        iconSize:   [size, size + 10],
        iconAnchor: [size / 2, size + 10],
        popupAnchor:[0, -(size + 10)],
      });
      L.marker([parseFloat(r.latitude), parseFloat(r.longitude)], { icon })
        .addTo(layerGroup.current)
        .bindPopup(buildPopup(r), { maxWidth: 300, className: 'mp-leaflet-popup' });
    });
  }, [reports]);

  const criticalAlerts = alerts.filter(a => a.level === 'critical').length;

  return (
    <div className="czmap-page">
      {/* Alerta crítica banner */}
      {criticalAlerts > 0 && (
        <div className="czmap-alert-banner">
          <AlertTriangle size={15}/>
          <span>Hay <strong>{criticalAlerts} alerta(s) crítica(s)</strong> activa(s) en la zona.</span>
        </div>
      )}

      {error && (
        <div className="czmap-error-banner">
          <AlertTriangle size={14}/> {error}
          <button onClick={fetchData}>Reintentar</button>
        </div>
      )}

      {/* Mapa ocupa todo el espacio */}
      <div className="czmap-wrap">
        {loading && (
          <div className="czmap-loading">
            <RefreshCw size={20} className="mp-spin"/>
            <span>Cargando mapa…</span>
          </div>
        )}
        <div ref={mapRef} className="czmap-leaflet"/>
      </div>

      {/* Leyenda flotante */}
      <div className="czmap-legend">
        {Object.entries(URGENCY).map(([k, v]) => (
          <div key={k} className="czmap-legend-item">
            <span className="czmap-legend-dot" style={{ background: v.color }}/>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
        <button className="czmap-refresh" onClick={fetchData} disabled={loading} title="Actualizar">
          <RefreshCw size={13} className={loading ? 'mp-spin' : ''}/>
        </button>
      </div>
    </div>
  );
}