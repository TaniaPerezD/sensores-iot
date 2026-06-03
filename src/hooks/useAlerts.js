import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOpenAlerts, resolveAlert } from "../api/alertsApi";

export const useAlerts = (
  deviceCode = "esp32-node-001",
  initialRange = "24h"
) => {
  const hasLoadedRef = useRef(false);

  const [range, setRange]         = useState(initialRange);
  const [rawAlerts, setRawAlerts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState("");
  const [resolving, setResolving] = useState(null); // id de la alerta que se está resolviendo

  const loadAlerts = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      else setRefreshing(true);

      setError("");

      const response = await fetchOpenAlerts(deviceCode, range);
      const data = response?.data ?? [];
      setRawAlerts(Array.isArray(data) ? data : []);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message || "Error al cargar alertas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceCode, range]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  /**
   * Resuelve una alerta con actualización optimista:
   * la marca como resuelta localmente de inmediato,
   * luego confirma con el backend.
   */
  const handleResolve = useCallback(async (alertId) => {
    setResolving(alertId);
    // Actualización optimista
    setRawAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() }
          : a
      )
    );
    try {
      await resolveAlert(alertId);
    } catch (err) {
      // Rollback si falla
      setRawAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, is_resolved: false, resolved_at: null }
            : a
        )
      );
    } finally {
      setResolving(null);
    }
  }, []);

  // ─── Formato para AlertPanel ─────────────────────────────────────────────
  const alerts = rawAlerts.map((a) => ({
    id: a.id,
    title: a.title ?? `Alerta en ${a.code ?? "sensor"}`,
    description: buildDescription(a),
    type: levelToType(a.level),
    level: a.level,
    code: a.code,
    currentValue: a.current_value,
    thresholdValue: a.threshold_value,
    createdAt: a.created_at,
    deviceCode: a.device_code,
    isResolved: a.is_resolved,
  }));

  /**
   * previewAlerts — máximo 3 alertas para el AlertPanel del dashboard.
   * Deduplica por código de métrica para no repetir "Alerta en gyroMagnitude"
   * 274 veces: muestra solo la más reciente de cada código.
   */
  const openAlerts = alerts.filter((a) => !a.isResolved);
  const seenCodes  = new Set();
  const previewAlerts = [];
  for (const a of openAlerts) {
    const key = a.code ?? a.title;
    if (!seenCodes.has(key)) {
      seenCodes.add(key);
      previewAlerts.push(a);
    }
    if (previewAlerts.length >= 4) break;
  }

  const alertsWithFallback =
    !loading && !error && previewAlerts.length === 0
      ? [{ title: "Terreno estable", description: "Sin anomalías activas", type: "ok" }]
      : previewAlerts;

  const criticalCount = openAlerts.filter((a) => a.type === "high").length;

  return {
    alerts: alertsWithFallback,   // ← máx 3, para AlertPanel del dashboard
    rawAlerts,                    // ← todos, para AlertasHistorico
    criticalCount,
    loading,
    refreshing,
    error,
    range,
    setRange,
    reload: loadAlerts,
    handleResolve,
    resolving,
  };
};

// ─── helpers ────────────────────────────────────────────────────────────────

function levelToType(level) {
  if (level === "danger") return "high";
  if (level === "warning") return "med";
  return "ok";
}

function buildDescription(a) {
  const parts = [];
  if (a.message) parts.push(a.message);
  if (a.current_value != null) {
    const val = Number(a.current_value).toFixed(2);
    const threshold = a.threshold_value != null
      ? ` / umbral ${Number(a.threshold_value).toFixed(2)}`
      : "";
    parts.push(`Valor: ${val}${threshold}`);
  }
  return parts.join(" · ") || "Revisar sensor";
}