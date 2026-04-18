export const getSoilStatus = (value) => {
  const v = Number(value || 0);

  if (v >= 80) return { label: "Crítico", type: "high" };
  if (v >= 60) return { label: "Alerta", type: "med" };
  return { label: "Normal", type: "low" };
};

export const getVibrationStatus = (value) => {
  const v = Number(value || 0);

  if (v >= 8) return { label: "Crítico", type: "high" };
  if (v >= 3) return { label: "Alerta", type: "med" };
  return { label: "Normal", type: "low" };
};

export const getAccelStatus = (value) => {
  const v = Number(value || 0);

  if (v >= 2.2) return { label: "Crítico", type: "high" };
  if (v >= 1.3) return { label: "Alerta", type: "med" };
  return { label: "Normal", type: "low" };
};

export const getGyroStatus = (value) => {
  const v = Number(value || 0);

  if (v >= 1.5) return { label: "Crítico", type: "high" };
  if (v >= 0.8) return { label: "Alerta", type: "med" };
  return { label: "Normal", type: "low" };
};

export const getRiskStatus = (riskLevel) => {
  switch (riskLevel) {
    case "danger":
      return { label: "Crítico", type: "high" };
    case "warning":
      return { label: "Alerta", type: "med" };
    default:
      return { label: "Normal", type: "low" };
  }
};

export const getTrend = (values = []) => {
  if (!Array.isArray(values) || values.length < 2) return "stable";

  const last = Number(values[values.length - 1] || 0);
  const prev = Number(values[values.length - 2] || 0);

  if (last > prev) return "up";
  if (last < prev) return "down";
  return "stable";
};