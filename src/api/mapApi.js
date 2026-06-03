import { getJson } from './http';

/**
 * Reportes ciudadanos geolocalizados.
 * @param {string} range - '1h' | '6h' | '12h' | '24h' | '2d' | '7d' | '30d'
 */
export const getMapReports = (range = '7d') =>
  getJson(`/api/map/reports?range=${range}`);

/**
 * Dispositivos IoT con coordenadas (solo admin).
 */
export const getMapDevices = () =>
  getJson('/api/map/devices');

/**
 * Alertas abiertas para el mapa.
 * Admin: detalladas. Ciudadano: reducidas.
 * @param {string} range - para admin, ej '24h' | '7d'
 */
export const getMapAlerts = (range = '24h') =>
  getJson(`/api/map/alerts?range=${range}`);
