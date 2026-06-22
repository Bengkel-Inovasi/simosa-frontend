"use client";

import { useEffect, useState, useRef } from "react";
import { SensorReading } from "@/types";

export function useSocket() {
  const [lastReading, setLastReading] = useState<SensorReading | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "reading") {
        setLastReading(message.data);
      } else if (message.type === "notification") {
        setNotification(message.data);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      // Could implement reconnect logic here
    };

    return () => {
      socket.close();
    };
  }, []);

  return { lastReading, notification, setNotification };
}
