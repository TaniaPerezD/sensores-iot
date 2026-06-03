import { buildUrl, getAuthToken, getJson, patchJson } from "./http";

// POST con multipart/form-data (para la foto)
const postFormData = async (path, formData) => {
  const token = getAuthToken();

  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO poner Content-Type, fetch lo agrega solo con el boundary
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Error al enviar reporte");
  }

  return data;
};

export const createReport = (formData) =>
  postFormData("/api/reports", formData);

export const getMyReports = () =>
  getJson("/api/reports/my");

export const getAllReports = () =>
  getJson("/api/reports");

export const getReportById = (id) =>
  getJson(`/api/reports/${id}`);

export const updateReportStatus = (id, status) =>
  patchJson(`/api/reports/${id}/status`, { status });