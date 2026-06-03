import { io } from "socket.io-client";
import { useEffect, useState } from "react";
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

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    return () => {};
  }, []);

  return socket;
};