import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRiskHistoryByRange,
  fetchRiskHistoryByDates,
} from "../api/riskHistoryApi";

function getDefaultDateRange() {
  const end   = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const fmt   = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  return { start: fmt(start), end: fmt(end) };
}

export const useRiskHistory = (
  initialDeviceCode = "esp32-node-001",
  initialRange      = "24h"
) => {
  const defaults       = getDefaultDateRange();
  const hasLoadedRef   = useRef(false);

  const [deviceCode, setDeviceCode] = useState(initialDeviceCode);
  const [range,      setRange]      = useState(initialRange);
  const [rows,       setRows]       = useState([]);
  const [from,       setFrom]       = useState(defaults.start);
  const [to,         setTo]         = useState(defaults.end);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  const loadByRange = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setRefreshing(true);
      setError("");
      const res = await fetchRiskHistoryByRange(deviceCode, range);
      setRows(Array.isArray(res?.data) ? res.data : []);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message || "Error al cargar historial de riesgo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCode, range]);

  const loadByDates = useCallback(async () => {
    if (!from || !to) return;
    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setRefreshing(true);
      setError("");
      const res = await fetchRiskHistoryByDates(deviceCode, from, to);
      setRows(Array.isArray(res?.data) ? res.data : []);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message || "Error al cargar historial por fechas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCode, from, to]);

  useEffect(() => { loadByRange(); }, [loadByRange]);

  return {
    deviceCode, setDeviceCode,
    range,      setRange,
    rows,
    from,       setFrom,
    to,         setTo,
    loading,    refreshing, error,
    reloadByRange: loadByRange,
    reloadByDates: loadByDates,
  };
};