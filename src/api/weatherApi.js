// Open-Meteo — gratuita, sin API key, perfecta para producción
// Docs: https://open-meteo.com/en/docs

const WMO_CODES = {
  0:  { label: "Despejado",          icon: "☀️" },
  1:  { label: "Mayormente despejado", icon: "🌤️" },
  2:  { label: "Parcialmente nublado", icon: "⛅" },
  3:  { label: "Nublado",            icon: "☁️" },
  45: { label: "Niebla",             icon: "🌫️" },
  48: { label: "Niebla con escarcha", icon: "🌫️" },
  51: { label: "Llovizna ligera",    icon: "🌦️" },
  53: { label: "Llovizna moderada",  icon: "🌦️" },
  55: { label: "Llovizna intensa",   icon: "🌧️" },
  61: { label: "Lluvia ligera",      icon: "🌧️" },
  63: { label: "Lluvia moderada",    icon: "🌧️" },
  65: { label: "Lluvia intensa",     icon: "🌧️" },
  71: { label: "Nieve ligera",       icon: "🌨️" },
  73: { label: "Nieve moderada",     icon: "❄️" },
  75: { label: "Nieve intensa",      icon: "❄️" },
  80: { label: "Chubascos",          icon: "🌦️" },
  81: { label: "Chubascos moderados",icon: "🌧️" },
  82: { label: "Chubascos fuertes",  icon: "⛈️" },
  95: { label: "Tormenta",           icon: "⛈️" },
  99: { label: "Tormenta con granizo", icon: "⛈️" },
};

/**
 * Obtiene clima actual para las coordenadas del dispositivo.
 * Por defecto usa La Paz, Bolivia (donde está esp32-node-001).
 * lat/lon pueden venir de la tabla devices si la tienes disponible.
 */
export const fetchWeather = async (lat = -16.5, lon = -68.15) => {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "precipitation",
    ].join(","),
    hourly: "precipitation_probability",
    forecast_days: 1,
    timezone: "America/La_Paz",
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  if (!res.ok) throw new Error("No se pudo obtener el clima");

  const json = await res.json();
  const c = json.current;

  const wmo = WMO_CODES[c.weather_code] ?? {
    label: "Desconocido",
    icon: "🌡️",
  };

  // Probabilidad de lluvia de la próxima hora
  const now = new Date();
  const hourIndex = now.getHours();
  const rainProb =
    Array.isArray(json.hourly?.precipitation_probability)
      ? json.hourly.precipitation_probability[hourIndex] ?? 0
      : 0;

  return {
    temperature:        Math.round(c.temperature_2m),
    feelsLike:          Math.round(c.apparent_temperature),
    humidity:           c.relative_humidity_2m,
    windSpeed:          Math.round(c.wind_speed_10m),
    precipitation:      c.precipitation,
    rainProbability:    rainProb,
    weatherCode:        c.weather_code,
    weatherLabel:       wmo.label,
    weatherIcon:        wmo.icon,
    // Riesgo de deslizamiento asociado al clima
    soilRisk:           rainProb >= 70 ? "high" : rainProb >= 40 ? "med" : "low",
  };
};