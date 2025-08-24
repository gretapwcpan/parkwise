import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSocket } from '../services/socketService';
import './MapView.css';

// MapLibre GL JS doesn't require access tokens for OpenStreetMap
// maplibregl.accessToken is not needed

const MapView = ({ parkingSpots, onSpotSelect, selectedSpot, userId, userLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // Use actual user location from props, with fallback
  const [lng, setLng] = useState(userLocation?.longitude || 121.5650);
  const [lat, setLat] = useState(userLocation?.latitude || 25.0325);
  const [zoom, setZoom] = useState(15);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  
  const { locationUpdates, connected } = useSocket();

  // Update local state when userLocation prop changes
  useEffect(() => {
    if (userLocation) {
      setLng(userLocation.longitude);
      setLat(userLocation.latitude);
      
      // Update map center and user marker if map exists
      if (map.current) {
        map.current.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 16,
        });
        
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
        }
      }
    }
  }, [userLocation]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [lng, lat],
      zoom: zoom,
    });
  }, []); // Remove dependencies to only init once

  // Add/update user marker when location changes
  useEffect(() => {
    if (!map.current || !userLocation) return;
    
    // Remove existing user marker if it exists
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    
    // Create new user marker at actual location
    const userEl = document.createElement('div');
    userEl.innerHTML = '📍';
    userEl.style.fontSize = '30px';
    userEl.style.filter = 'drop-shadow(0 0 10px rgba(33, 150, 243, 0.8))';
    
    console.log('Creating user marker at actual location:', [userLocation.longitude, userLocation.latitude]);
    userMarkerRef.current = new maplibregl.Marker({
      element: userEl,
      anchor: 'bottom'
    })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);
  }, [userLocation]);

  // Add parking spot markers
  useEffect(() => {
    if (!map.current || parkingSpots.length === 0) return;
    
    // Clear existing parking markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current = {};
    
    // Add parking spots as markers
    parkingSpots.forEach(spot => {
      const el = document.createElement('div');
      el.style.fontSize = '24px';
      el.style.cursor = 'pointer';
      el.innerHTML = spot.available ? '🟢' : '🔴';
      el.title = `${spot.name} - ${spot.available ? 'Available' : 'Occupied'}`;
      
      const marker = new maplibregl.Marker(el)
        .setLngLat([spot.lng, spot.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <h3>${spot.name}</h3>
              <p>Status: ${spot.available ? 'Available' : 'Occupied'}</p>
              ${spot.available ? '<button class="book-btn">Book Now</button>' : ''}
            `)
        )
        .addTo(map.current);
      
      // Handle popup events
      marker.getPopup().on('open', () => {
        const bookBtn = document.querySelector('.book-btn');
        if (bookBtn) {
          bookBtn.addEventListener('click', () => {
            onSpotSelect(spot);
          });
        }
      });
      
      markersRef.current[spot.id] = marker;
    });
  }, [parkingSpots, onSpotSelect]);

  // Update map with real-time location updates
  useEffect(() => {
    if (!map.current || locationUpdates.length === 0) return;

    const latestUpdate = locationUpdates[locationUpdates.length - 1];
    
    // Create or update other users' markers
    if (latestUpdate.userId !== userId) {
      if (!markersRef.current[`user-${latestUpdate.userId}`]) {
        const el = document.createElement('div');
        el.className = 'other-user-marker';
        el.innerHTML = '🚗';
        
        const marker = new maplibregl.Marker(el)
          .setLngLat([latestUpdate.longitude, latestUpdate.latitude])
          .addTo(map.current);
        
        markersRef.current[`user-${latestUpdate.userId}`] = marker;
      } else {
        markersRef.current[`user-${latestUpdate.userId}`]
          .setLngLat([latestUpdate.longitude, latestUpdate.latitude]);
      }
    }
  }, [locationUpdates, userId]);

  // Highlight selected spot
  useEffect(() => {
    if (!selectedSpot || !map.current) return;

    map.current.flyTo({
      center: [selectedSpot.lng, selectedSpot.lat],
      zoom: 17,
    });
  }, [selectedSpot]);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <div className="map-overlay">
        <div className="connection-status">
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>
    </div>
  );
};

export default MapView;
