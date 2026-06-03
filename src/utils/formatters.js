export function formatHour(date) {
  const d = new Date(date);
  return d.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);

  return date.toLocaleString();
};

export const formatNumber = (value, decimals = 2) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toFixed(decimals);
};

export const toNumeric = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};