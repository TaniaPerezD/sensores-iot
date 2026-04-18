import { useEffect } from "react";
import { getSocket } from "../api/socket";

export const useSocketSnapshot = (onSnapshotUpdate) => {
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      console.log("Socket conectado:", socket.id);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket desconectado:", reason);
    };

    const handleSnapshotUpdate = (snapshot) => {
      console.log("Evento snapshot:update recibido:", snapshot);

      if (typeof onSnapshotUpdate === "function") {
        onSnapshotUpdate(snapshot);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("snapshot:update", handleSnapshotUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("snapshot:update", handleSnapshotUpdate);
    };
  }, [onSnapshotUpdate]);
};