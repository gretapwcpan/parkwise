import React, { createContext, useContext } from 'react';
import axios from 'axios';

const ApiContext = createContext();

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service methods
const apiService = {
  // Booking endpoints
  bookings: {
    create: async (bookingData) => {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    },
    
    getUserBookings: async (userId) => {
      const response = await api.get(`/bookings/user/${userId}`);
      return response.data;
    },
    
    getById: async (bookingId) => {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    },
    
    checkAvailability: async (spotId, date) => {
      const response = await api.get(`/bookings/availability/${spotId}`, {
        params: { date },
      });
      return response.data;
    },
    
    cancel: async (bookingId, userId) => {
      const response = await api.put(`/bookings/${bookingId}/cancel`, { userId });
      return response.data;
    },
  },
  
  // Location endpoints
  locations: {
    getActive: async () => {
      const response = await api.get('/locations/active');
      return response.data;
    },
    
    getInArea: async (areaId, bounds) => {
      const response = await api.get(`/locations/area/${areaId}`, {
        params: bounds,
      });
      return response.data;
    },
    
    getHistory: async (userId) => {
      const response = await api.get(`/locations/history/${userId}`);
      return response.data;
    },
    
    getNearby: async (lat, lng, radius) => {
      const response = await api.get('/locations/nearby', {
        params: { lat, lng, radius },
      });
      return response.data;
    },
    
    checkProximity: async (userLocation, spotLocation, threshold) => {
      const response = await api.post('/locations/check-proximity', {
        userLocation,
        spotLocation,
        threshold,
      });
      return response.data;
    },
    
    startSimulation: async (userId, startLat, startLng) => {
      const response = await api.post('/locations/simulate', {
        userId,
        startLat,
        startLng,
      });
      return response.data;
    },
    
    stopSimulation: async (userId) => {
      const response = await api.post('/locations/simulate/stop', { userId });
      return response.data;
    },
  },
  
  // Notification endpoints
  notifications: {
    registerToken: async (userId, token) => {
      const response = await api.post('/notifications/register', { userId, token });
      return response.data;
    },
    
    unregisterToken: async (userId) => {
      const response = await api.post('/notifications/unregister', { userId });
      return response.data;
    },
    
    sendTest: async (userId) => {
      const response = await api.post('/notifications/test', { userId });
      return response.data;
    },
  },
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  return (
    <ApiContext.Provider value={apiService}>
      {children}
    </ApiContext.Provider>
  );
};

export default apiService;
