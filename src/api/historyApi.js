import { getJson } from "./http";

export const fetchHistoryByRange = async (
  deviceCode = "esp32-node-001",
  range = "24h"
) => {
  const params = new URLSearchParams({ deviceCode, range });
  return getJson(`/api/history?${params.toString()}`);
};

export const fetchHistoryByDates = async (
  deviceCode = "esp32-node-001",
  from,
  to
) => {
  const params = new URLSearchParams({
    deviceCode,
    from,
    to,
  });

  return getJson(`/api/history?${params.toString()}`);
};