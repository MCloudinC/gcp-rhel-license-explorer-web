import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for WebSocket connection management
 */
export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, connected };
};