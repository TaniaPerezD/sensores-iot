import { useCallback, useEffect, useState } from "react";
import { fetchWeather } from "../api/weatherApi";

/**
 * useWeather — clima actual para la ubicación del dispositivo.
 * Se refresca automáticamente cada 10 minutos.
 */
export const useWeather = (lat = -16.5, lon = -68.15) => {
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await fetchWeather(lat, lon);
      setWeather(data);
    } catch (err) {
      setError(err.message || "Error al obtener clima");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    load();
    // Refresca cada 10 minutos
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  return { weather, loading, error, reload: load };
};