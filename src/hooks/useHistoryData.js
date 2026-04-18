import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHistoryByDates, fetchHistoryByRange } from "../api/historyApi";

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

  const toInputValue = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  return {
    start: toInputValue(start),
    end: toInputValue(end),
  };
}

export const useHistoryData = (
  initialDeviceCode = "esp32-node-001",
  initialRange = "24h"
) => {
  const defaults = getDefaultDateRange();
  const hasLoadedRef = useRef(false);

  const [deviceCode, setDeviceCode] = useState(initialDeviceCode);
  const [range, setRange] = useState(initialRange);

  const [history, setHistory] = useState({
    times: [],
    soil: [],
    vib: [],
    accel: [],
    gyro: [],
    raw: [],
    dur: [],
    ax: [],
    ay: [],
    az: [],
    gx: [],
    gy: [],
    gz: [],
    vibrationDetected: [],
    records: [],
  });

  const [from, setFrom] = useState(defaults.start);
  const [to, setTo] = useState(defaults.end);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistoryByRange = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setRefreshing(true);

      setError("");

      const response = await fetchHistoryByRange(deviceCode, range);
      setHistory(response.data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message || "Error al cargar histórico");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCode, range]);

  const loadHistoryByDates = useCallback(async () => {
    if (!from || !to) return;

    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setRefreshing(true);

      setError("");

      const response = await fetchHistoryByDates(deviceCode, from, to);
      setHistory(response.data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message || "Error al cargar histórico por fechas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCode, from, to]);

  useEffect(() => {
    loadHistoryByRange();
  }, [loadHistoryByRange]);

  return {
    deviceCode,
    setDeviceCode,
    range,
    setRange,
    history,
    setHistory,
    from,
    setFrom,
    to,
    setTo,
    loading,
    refreshing,
    error,
    reloadByRange: loadHistoryByRange,
    reloadByDates: loadHistoryByDates,
  };
};