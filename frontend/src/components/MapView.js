import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSocket } from '../services/socketService';
import './MapView.css';

// MapLibre GL JS doesn't require access tokens for OpenStreetMap
// maplibregl.accessToken is not needed

const MapView = ({ parkingSpots, onSpotSelect, selectedSpot, userId, userLocation, searchRadius }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // Use actual user location from props, with fallback
  const [lng, setLng] = useState(userLocation?.longitude || 121.5650);
  const [lat, setLat] = useState(userLocation?.latitude || 25.0325);
  const [zoom, setZoom] = useState(15);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  
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
          zoom: 15,
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

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
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

  // Draw search radius circle
  useEffect(() => {
    if (!map.current || !userLocation || !searchRadius) return;

    // Remove existing circle if it exists
    if (map.current.getSource('radius-circle')) {
      map.current.removeLayer('radius-circle-fill');
      map.current.removeLayer('radius-circle-line');
      map.current.removeSource('radius-circle');
    }

    // Create circle coordinates
    const center = [userLocation.longitude, userLocation.latitude];
    const radius = searchRadius;
    const options = { steps: 64, units: 'meters' };
    
    // Create a circle using small line segments
    const coordinates = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const dx = radius * Math.cos(angle);
      const dy = radius * Math.sin(angle);
      
      // Convert meters to degrees (approximate)
      const dLng = dx / (111320 * Math.cos(userLocation.latitude * Math.PI / 180));
      const dLat = dy / 110540;
      
      coordinates.push([
        center[0] + dLng,
        center[1] + dLat
      ]);
    }

    // Add circle as a source
    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    });

    // Add fill layer
    map.current.addLayer({
      id: 'radius-circle-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#007cbf',
        'fill-opacity': 0.1
      }
    });

    // Add outline layer
    map.current.addLayer({
      id: 'radius-circle-line',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#007cbf',
        'line-width': 2,
        'line-opacity': 0.5
      }
    });
  }, [userLocation, searchRadius]);

  // Add parking spot markers
  useEffect(() => {
    if (!map.current || !parkingSpots || parkingSpots.length === 0) return;
    
    // Clear existing parking markers (but not user markers)
    Object.keys(markersRef.current).forEach(key => {
      if (!key.startsWith('user-')) {
        const marker = markersRef.current[key];
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
        delete markersRef.current[key];
      }
    });
    
    // Add parking spots as markers with different icons based on type
    parkingSpots.forEach(spot => {
      const el = document.createElement('div');
      el.style.fontSize = '20px';
      el.style.cursor = 'pointer';
      
      // Different icons for different parking types
      let icon = '🅿️';
      if (spot.type === 'garage') {
        icon = '🏢';
      } else if (spot.type === 'street') {
        icon = '🛣️';
      } else if (spot.type === 'lot') {
        icon = '🚗';
      }
      
      // Add availability indicator
      el.innerHTML = spot.available ? icon : '🚫';
      el.style.opacity = spot.available ? '1' : '0.5';
      el.title = `${spot.name} - ${spot.available ? 'Available' : 'Occupied'}`;
      
      // Format features for display
      const featuresHtml = spot.features && spot.features.length > 0 
        ? `<p>Features: ${spot.features.map(f => f.replace(/_/g, ' ')).join(', ')}</p>`
        : '';
      
      // Format distance for display
      const distanceText = spot.distance 
        ? spot.distance < 1000 
          ? `${spot.distance}m away`
          : `${spot.distanceKm}km away`
        : '';
      
      const marker = new maplibregl.Marker(el)
        .setLngLat([spot.lng, spot.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0;">${spot.name}</h3>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${spot.available ? '✅ Available' : '❌ Occupied'}</p>
                ${spot.price ? `<p style="margin: 5px 0;"><strong>Price:</strong> $${spot.price}/hr</p>` : ''}
                ${distanceText ? `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distanceText}</p>` : ''}
                ${spot.type ? `<p style="margin: 5px 0;"><strong>Type:</strong> ${spot.type}</p>` : ''}
                ${featuresHtml}
                ${spot.available ? '<button class="book-btn" style="margin-top: 10px; padding: 5px 10px; background: #007cbf; color: white; border: none; border-radius: 4px; cursor: pointer;">Book Now</button>' : ''}
              </div>
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

    console.log(`Added ${parkingSpots.length} parking spot markers to the map`);
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

  // Adjust zoom based on search radius
  useEffect(() => {
    if (!map.current || !searchRadius || !userLocation) return;
    
    let zoomLevel = 15;
    if (searchRadius <= 500) {
      zoomLevel = 16;
    } else if (searchRadius <= 1000) {
      zoomLevel = 15;
    } else if (searchRadius <= 2000) {
      zoomLevel = 14;
    } else {
      zoomLevel = 13;
    }
    
    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: zoomLevel,
    });
  }, [searchRadius, userLocation]);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <div className="map-overlay">
        <div className="connection-status">
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        {parkingSpots && parkingSpots.length > 0 && (
          <div className="parking-count">
            📍 {parkingSpots.length} spots within {searchRadius}m
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
