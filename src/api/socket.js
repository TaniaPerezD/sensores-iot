import { io } from "socket.io-client";
import { API_BASE_URL } from "./http";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};