import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useSocket } from '../services/socketService';
import './MapView.css';

// Set your Mapbox token here or in environment variable
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.test_token';

const MapView = ({ parkingSpots, onSpotSelect, selectedSpot, userId }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(121.5654);
  const [lat, setLat] = useState(25.0330);
  const [zoom, setZoom] = useState(15);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  
  const { locationUpdates, connected } = useSocket();

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on('load', () => {
      // Add parking spots as markers
      parkingSpots.forEach(spot => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';
        // Use different colors for available vs occupied
        el.innerHTML = spot.available ? '🟢' : '🔴';
        el.title = `${spot.name} - ${spot.available ? 'Available' : 'Occupied'}`;
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([spot.lng, spot.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
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

      // Add user location marker
      const userEl = document.createElement('div');
      userEl.className = 'user-marker';
      userEl.innerHTML = '📍';
      
      userMarkerRef.current = new mapboxgl.Marker(userEl)
        .setLngLat([lng, lat])
        .addTo(map.current);
    });

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLng = position.coords.longitude;
          const userLat = position.coords.latitude;
          
          map.current.flyTo({
            center: [userLng, userLat],
            zoom: 16,
          });
          
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([userLng, userLat]);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [parkingSpots, onSpotSelect, lng, lat, zoom]);

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
        
        const marker = new mapboxgl.Marker(el)
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
