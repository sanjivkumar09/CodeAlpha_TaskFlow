import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin);
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected to TaskFlow live server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Live connection warning:', err.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  const joinProject = (projectId) => {
    if (socket && connected && projectId) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && connected && projectId) {
      socket.emit('project:leave', projectId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinProject, leaveProject }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || { socket: null, connected: false, joinProject: () => {}, leaveProject: () => {} };
};
