import React, { useState, useEffect, useRef } from 'react';
import { formatCityName } from '../utils/localization';
import './CitySelector.css';

function CitySelector({ onCityChange, currentLocation, headerStyle, compact }) {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('auto'); // Default to auto-detect
  const [loading, setLoading] = useState(false);
  const [nearestCity, setNearestCity] = useState(null);
  const [lastFetchedLocation, setLastFetchedLocation] = useState(null);
  const hasInitializedRef = useRef(false);
  const hasFetchedNearestRef = useRef(false);

  // Fetch available cities on mount
  useEffect(() => {
    fetchAvailableCities();
  }, []); // Empty dependency array - only run once

  // Find nearest city when user location becomes available (only once for auto mode)
  useEffect(() => {
    if (currentLocation && selectedCity === 'auto' && !hasFetchedNearestRef.current) {
      const currentLat = currentLocation.latitude || currentLocation.lat;
      const currentLng = currentLocation.longitude || currentLocation.lng;
      
      // Skip if invalid coordinates
      if (!currentLat || !currentLng || currentLat === 0 || currentLng === 0) {
        return;
      }
      
      // Mark as fetched to prevent multiple calls
      hasFetchedNearestRef.current = true;
      
      const newLocation = {
        lat: currentLat,
        lng: currentLng
      };
      setLastFetchedLocation(newLocation);
      
      // Delay slightly to ensure component is stable
      setTimeout(() => {
        findNearestCity(currentLocation);
      }, 500);
    }
  }, [currentLocation, selectedCity]); // Dependencies are intentional

  const fetchAvailableCities = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/cities/available`);
      const data = await response.json();
      
      if (data.success) {
        setCities(data.cities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const findNearestCity = async (location) => {
    if (!location || loading) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/cities/nearest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.latitude || location.lat,
          lng: location.longitude || location.lng
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.nearestCity) {
        // Only update if the city has actually changed
        if (!nearestCity || nearestCity.key !== data.nearestCity.key) {
          setNearestCity(data.nearestCity);
          // Notify parent component only if city changed
          onCityChange(data.nearestCity);
        }
      }
    } catch (error) {
      console.error('Error finding nearest city:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = async (event) => {
    const cityKey = event.target.value;
    setSelectedCity(cityKey);
    
    if (cityKey === 'auto') {
      // Reset the fetch flag when user manually selects auto
      hasFetchedNearestRef.current = false;
      // Use current location to find nearest city
      if (currentLocation) {
        findNearestCity(currentLocation);
      }
    } else {
      // Fetch specific city data
      setLoading(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE_URL}/api/cities/${cityKey}`);
        const data = await response.json();
        
        if (data.success && data.city) {
          onCityChange({
            key: cityKey,
            ...data.city
          });
        }
      } catch (error) {
        console.error('Error fetching city data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // If headerStyle is true, render as a button-style selector for the header
  if (headerStyle) {
    return (
      <div className="city-selector-header">
        <select 
          id="city-select"
          value={selectedCity} 
          onChange={handleCityChange}
          disabled={loading}
          className="city-select-header"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="auto">📍 Auto</option>
          <option value="new-york">🗽 New York</option>
          <option value="san-francisco">🌉 San Francisco</option>
          <option value="london">🇬🇧 London</option>
          <option value="paris">🗼 Paris</option>
          <option value="tokyo">🗾 Tokyo</option>
          <option value="taipei">🏯 Taipei</option>
        </select>
      </div>
    );
  }

  return (
    <div className={compact ? "city-selector-compact" : "city-selector"}>
      {!compact && (
        <label htmlFor="city-select">
          <span className="city-icon">🌍</span>
          Demo City:
        </label>
      )}
      <select 
        id="city-select"
        value={selectedCity} 
        onChange={handleCityChange}
        disabled={loading}
        className={compact ? "city-select-compact" : "city-select"}
      >
        <option value="auto">
          📍 Auto-detect Location
          {nearestCity && selectedCity === 'auto' && 
            ` (${nearestCity.city})`
          }
        </option>
        <optgroup label="North America">
          <option value="new-york">🗽 New York, USA</option>
          <option value="san-francisco">🌉 San Francisco, USA</option>
        </optgroup>
        <optgroup label="Europe">
          <option value="london">🇬🇧 London, UK</option>
          <option value="paris">🗼 Paris, France</option>
        </optgroup>
        <optgroup label="Asia">
          <option value="tokyo">🗾 Tokyo, Japan</option>
          <option value="taipei">🏯 Taipei, Taiwan</option>
        </optgroup>
      </select>
      {loading && <span className="loading-indicator">Loading...</span>}
    </div>
  );
}

export default CitySelector;
