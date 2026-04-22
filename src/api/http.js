const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const AUTH_STORAGE_KEY = "sensores_iot_auth";

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getAuthToken = () => {
  const session = getStoredSession();
  return session?.token || null;
};

const buildHeaders = (customHeaders = {}, useAuth = true) => {
  const token = useAuth ? getAuthToken() : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

const requestJson = async (
  path,
  { method = "GET", body, headers = {}, useAuth = true } = {}
) => {
  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders(headers, useAuth),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Error en la petición");
  }

  return data;
};

const getJson = (path, options = {}) =>
  requestJson(path, { ...options, method: "GET" });

const postJson = (path, body, options = {}) =>
  requestJson(path, { ...options, method: "POST", body });

const putJson = (path, body, options = {}) =>
  requestJson(path, { ...options, method: "PUT", body });

const patchJson = (path, body, options = {}) =>
  requestJson(path, { ...options, method: "PATCH", body });

const deleteJson = (path, options = {}) =>
  requestJson(path, { ...options, method: "DELETE" });

export {
  API_BASE_URL,
  AUTH_STORAGE_KEY,
  buildUrl,
  getStoredSession,
  getAuthToken,
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
  requestJson,
};