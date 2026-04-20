const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const getJson = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error en la petición");
  }

  return data;
};

const postJson = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error en la petición");
  }

  return data;
};

export { API_BASE_URL, buildUrl, getJson, postJson };