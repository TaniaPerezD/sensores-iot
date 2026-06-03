import { getJson } from "./http";

export const fetchAllAlerts = async (
  deviceCode = "esp32-node-001",
  range = "24h"
) => {
  const params = new URLSearchParams({ deviceCode, range });
  return getJson(`/api/alerts?${params.toString()}`);
};

export const fetchOpenAlerts = async (
  deviceCode = "esp32-node-001",
  range = "24h"
) => {
  const params = new URLSearchParams({ deviceCode, range });
  return getJson(`/api/alerts/open?${params.toString()}`);
};

// resolveAlert usa fetch directamente porque es PATCH, no GET.
// Si tu http.js expone un postJson o patchJson, reemplaza esto.
export const resolveAlert = async (alertId) => {
  const res = await fetch(`/api/alerts/${alertId}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Error al resolver alerta: ${res.status}`);
  return res.json();
};