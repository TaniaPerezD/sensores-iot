import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOpenAlerts } from "../api/alertsApi";

/**
 * useAlerts — consume /api/alerts/open del backend.
 *
 * Retorna alertas con la misma forma que espera AlertPanel:
 *   { title, description, type }   type: "high" | "med" | "ok"
 *
 * También retorna las alertas raw (rawAlerts) por si necesitas
 * mostrar IDs, resolverlas, etc.
 */
export const useAlerts = (
  deviceCode = "esp32-node-001",
  initialRange = "24h"
) => {
  const hasLoadedRef = useRef(false);

  const [range, setRange] = useState(initialRange);
  const [rawAlerts, setRawAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
   * Convierte las alertas del backend al formato que espera AlertPanel.
   * level "danger" → type "high"
   * level "warning" → type "med"
   * resto → type "ok"
   */
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
  }));

  /**
   * Fallback: si el backend no devuelve nada todavía,
   * retorna el ítem "Terreno estable" para que AlertPanel
   * nunca quede vacío.
   */
  const alertsWithFallback =
    !loading && !error && alerts.length === 0
      ? [
          {
            title: "Terreno estable",
            description: "Sin anomalías activas en este momento",
            type: "ok",
          },
        ]
      : alerts;

  const criticalCount = alerts.filter((a) => a.type === "high").length;

  return {
    alerts: alertsWithFallback,
    rawAlerts,
    criticalCount,
    loading,
    refreshing,
    error,
    range,
    setRange,
    reload: loadAlerts,
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