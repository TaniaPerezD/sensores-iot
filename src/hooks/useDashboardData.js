import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchDashboardSeries,
  fetchDashboardSnapshot,
} from "../api/dashboardApi";

export const useDashboardData = (
  initialDeviceCode = "esp32-node-001",
  initialRange = "24h"
) => {
  const hasLoadedRef = useRef(false);

  const [deviceCode, setDeviceCode] = useState(initialDeviceCode);
  const [range, setRange] = useState(initialRange);

  const [snapshot, setSnapshot] = useState(null);
  const [series, setSeries] = useState({
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
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboardData = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [snapshotResponse, seriesResponse] = await Promise.all([
        fetchDashboardSnapshot(deviceCode),
        fetchDashboardSeries(deviceCode, range),
      ]);

      setSnapshot(snapshotResponse.data);
      setSeries(seriesResponse.data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message || "Error al cargar dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCode, range]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    deviceCode,
    setDeviceCode,
    range,
    setRange,
    snapshot,
    setSnapshot,
    series,
    setSeries,
    loading,
    refreshing,
    error,
    reload: loadDashboardData,
  };
};