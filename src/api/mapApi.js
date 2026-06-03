import { getJson, patchJson } from './http';

export const getMapReports = (range = '7d') =>
  getJson(`/api/map/reports?range=${range}`);

export const getMapDevices = () =>
  getJson('/api/map/devices');

export const getMapAlerts = (range = '24h') =>
  getJson(`/api/map/alerts?range=${range}`);

/**
 * Cambia el estado de un reporte ciudadano.
 * Solo para admin. Usa la ruta ya existente en el backend.
 * @param {number|string} id
 * @param {'pendiente'|'en_revision'|'atendido'|'descartado'} status
 */
export const updateReportStatus = (id, status) =>
  patchJson(`/api/reports/${id}/status`, { status });
