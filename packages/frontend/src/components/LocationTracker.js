import React, { useEffect, useState } from 'react';
import { useSocket } from '../services/socketService';
import { useApi } from '../services/apiService';

const LocationTracker = ({ userId, onLocationUpdate }) => {
  const { sendLocationUpdate } = useSocket();
  const api = useApi();
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Start tracking when component mounts
    startTracking();

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setTracking(true);
    setError(null);

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };

        console.log('Initial location obtained:', location);
        sendLocationUpdate(location);
        setLastLocation(location);
        
        // Call the callback to update parent component
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      },
      (error) => {
        console.error('Initial location error:', error);
        setError(error.message);
        
        // Use default location (Taipei 101 area) when geolocation fails
        const defaultLocation = {
          latitude: 25.0330,
          longitude: 121.5654,
          accuracy: 100,
          heading: null,
          speed: 0,
        };
        
        console.log('Using default location:', defaultLocation);
        sendLocationUpdate(defaultLocation);
        setLastLocation(defaultLocation);
        
        if (onLocationUpdate) {
          onLocationUpdate(defaultLocation);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Then watch for changes
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };

        // Only send update if location has changed significantly (more than 10 meters)
        if (!lastLocation || hasLocationChanged(lastLocation, location)) {
          sendLocationUpdate(location);
          setLastLocation(location);
          
          // Call the callback to update parent component
          if (onLocationUpdate) {
            onLocationUpdate(location);
          }
        }
      },
      (error) => {
        console.error('Location error:', error);
        setError(error.message);
        
        // Use default location when tracking fails
        const defaultLocation = {
          latitude: 25.0330,
          longitude: 121.5654,
          accuracy: 100,
          heading: null,
          speed: 0,
        };
        
        if (!lastLocation) {
          console.log('Using default location for tracking:', defaultLocation);
          sendLocationUpdate(defaultLocation);
          setLastLocation(defaultLocation);
          
          if (onLocationUpdate) {
            onLocationUpdate(defaultLocation);
          }
        }
        
        // If real GPS fails, start simulation for demo
        if (error.code === 1) { // Permission denied
          startSimulation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
  };

  const hasLocationChanged = (loc1, loc2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance > 10; // Return true if moved more than 10 meters
  };

  const startSimulation = async () => {
    try {
      // Start location simulation on backend
      await api.locations.startSimulation(userId, 25.0330, 121.5654);
      console.log('Location simulation started');
    } catch (err) {
      console.error('Failed to start simulation:', err);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default LocationTracker;
