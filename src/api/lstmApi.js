import { getJson } from "./http";

export const fetchLstmPredict = (deviceCode = "esp32-node-001") =>
  getJson(`/api/lstm/predict/${deviceCode}`);
