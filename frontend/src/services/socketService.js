import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [locationUpdates, setLocationUpdates] = useState([]);

  useEffect(() => {
    // Connect to backend socket server
    const socketInstance = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Listen for location updates from other users
    socketInstance.on('user-location-update', (location) => {
      setLocationUpdates(prev => [...prev, location]);
    });

    // Listen for errors
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Send location update
  const sendLocationUpdate = (location) => {
    if (socket && connected) {
      socket.emit('location-update', {
        userId,
        ...location,
      });
    }
  };

  // Join a parking area
  const joinArea = (areaId) => {
    if (socket && connected) {
      socket.emit('join-area', areaId);
    }
  };

  // Leave a parking area
  const leaveArea = (areaId) => {
    if (socket && connected) {
      socket.emit('leave-area', areaId);
    }
  };

  const value = {
    socket,
    connected,
    locationUpdates,
    sendLocationUpdate,
    joinArea,
    leaveArea,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
