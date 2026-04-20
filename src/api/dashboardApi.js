import { getJson } from "./http";

export const fetchDashboardSnapshot = async (deviceCode = "esp32-node-001") => {
  const params = new URLSearchParams({ deviceCode });
  return getJson(`/api/dashboard/snapshot?${params.toString()}`);
};

export const fetchDashboardSeries = async (
  deviceCode = "esp32-node-001",
  range = "24h"
) => {
  const params = new URLSearchParams({ deviceCode, range });
  return getJson(`/api/dashboard/series?${params.toString()}`);
};