import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSocket } from '../services/socketService';
import './MapView.css';

// MapLibre GL JS doesn't require access tokens for OpenStreetMap
// maplibregl.accessToken is not needed

const MapView = ({ parkingSpots, onSpotSelect, selectedSpot, userId, userLocation, searchRadius, onSearchCenterChange, navigationRoute, onLocationPinned, hashtagLocations, activeHashtags, selectedCity, mapCenter }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // Use map center if provided (from selected city), otherwise use user location
  const [lng, setLng] = useState(mapCenter?.longitude || userLocation?.longitude || 121.5650);
  const [lat, setLat] = useState(mapCenter?.latitude || userLocation?.latitude || 25.0325);
  const [zoom, setZoom] = useState(15);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const [searchCenter, setSearchCenter] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const routeLayerRef = useRef(null);
  const pinnedLocationRef = useRef(null);
  const hashtagMarkersRef = useRef({});
  
  const { locationUpdates, connected } = useSocket();

  // Update map when mapCenter changes (city selection or similar location click)
  useEffect(() => {
    console.log('MapView - mapCenter changed:', mapCenter);
    
    if (mapCenter && map.current) {
      // Handle both longitude/latitude and lng/lat formats
      const lng = mapCenter.longitude || mapCenter.lng;
      const lat = mapCenter.latitude || mapCenter.lat;
      
      console.log('MapView - Flying to:', { lng, lat });
      
      if (lng && lat) {
        setLng(lng);
        setLat(lat);
        
        // Fly to the new center
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 2000
        });
        
        console.log('Map centered on location:', { lng, lat });
      } else {
        console.error('MapView - Invalid coordinates in mapCenter:', mapCenter);
      }
    }
  }, [mapCenter]);
  
  // Update local state when userLocation prop changes (only if no city is selected)
  useEffect(() => {
    if (userLocation && !mapCenter) {
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
  }, [userLocation, mapCenter]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO'
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
    
    // Function to handle location pinning
    const handleLocationPin = (e) => {
      e.preventDefault();
      const { lng, lat } = e.lngLat;
      
      // Remove existing pinned location marker
      if (pinnedLocationRef.current) {
        pinnedLocationRef.current.remove();
      }
      
      // Create pin marker
      const el = document.createElement('div');
      el.innerHTML = '📍';
      el.style.fontSize = '24px';
      el.style.filter = 'hue-rotate(45deg)'; // Different color for parking spots
      el.style.cursor = 'pointer';
      
      pinnedLocationRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
      
      // Notify parent component
      if (onLocationPinned) {
        onLocationPinned({ lat, lng });
      }
    };
    
    // Add right-click handler for pinning locations
    map.current.on('contextmenu', handleLocationPin);
    
    // Also add double-click handler for easier testing
    map.current.on('dblclick', handleLocationPin);
  }, []); // Remove dependencies to only init once

  // Display navigation route on map
  useEffect(() => {
    if (!map.current || !navigationRoute) return;

    // Remove existing route layers and source if they exist
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getLayer('route-outline')) {
      map.current.removeLayer('route-outline');
    }
    if (map.current.getLayer('route-arrows')) {
      map.current.removeLayer('route-arrows');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Add the route as a source
    map.current.addSource('route', {
      type: 'geojson',
      data: navigationRoute.geometry
    });

    // Add route outline layer (for better visibility)
    map.current.addLayer({
      id: 'route-outline',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 8,
        'line-opacity': 0.8
      }
    });

    // Add main route layer
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#007cbf',
        'line-width': 5,
        'line-opacity': 0.9
      }
    });

    // Add direction arrows along the route
    map.current.addLayer({
      id: 'route-arrows',
      type: 'symbol',
      source: 'route',
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 50,
        'text-field': '→',
        'text-size': 20,
        'text-rotation-alignment': 'map',
        'text-keep-upright': false
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#007cbf',
        'text-halo-width': 2
      }
    });

    // Fit map to route bounds
    if (navigationRoute.bounds) {
      map.current.fitBounds(
        [navigationRoute.bounds.southwest, navigationRoute.bounds.northeast],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000
        }
      );
    }
  }, [navigationRoute]);

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
    userEl.style.cursor = 'move';
    userEl.title = 'Drag to adjust your location';
    
    console.log('Creating user marker at actual location:', [userLocation.longitude, userLocation.latitude]);
    userMarkerRef.current = new maplibregl.Marker({
      element: userEl,
      anchor: 'bottom',
      draggable: true  // Make the user marker draggable
    })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);
    
    // Add drag event listeners
    userMarkerRef.current.on('dragstart', () => {
      map.current.getCanvas().style.cursor = 'grabbing';
      userEl.style.filter = 'drop-shadow(0 0 15px rgba(255, 107, 107, 0.8))';
    });
    
    userMarkerRef.current.on('drag', () => {
      const lngLat = userMarkerRef.current.getLngLat();
      // Update the search center to follow the dragged user location
      setSearchCenter({
        longitude: lngLat.lng,
        latitude: lngLat.lat
      });
      setIsDragging(true);
    });
    
    userMarkerRef.current.on('dragend', () => {
      map.current.getCanvas().style.cursor = '';
      userEl.style.filter = 'drop-shadow(0 0 10px rgba(33, 150, 243, 0.8))';
      setIsDragging(false);
      const lngLat = userMarkerRef.current.getLngLat();
      const newLocation = {
        longitude: lngLat.lng,
        latitude: lngLat.lat
      };
      
      // Update search center
      setSearchCenter(newLocation);
      
      // Notify parent component about the new search center
      if (onSearchCenterChange) {
        onSearchCenterChange(newLocation);
      }
      
      console.log('User location manually adjusted to:', [newLocation.longitude, newLocation.latitude]);
    });
  }, [userLocation, onSearchCenterChange]);

  // Draw search radius circle
  useEffect(() => {
    if (!map.current || !searchRadius) return;

    // Use search center if set, otherwise use user location
    const centerPoint = searchCenter || userLocation;
    if (!centerPoint) return;

    // Remove existing circle layers and source if they exist
    if (map.current.getLayer('radius-circle-fill')) {
      map.current.removeLayer('radius-circle-fill');
    }
    if (map.current.getLayer('radius-circle-line')) {
      map.current.removeLayer('radius-circle-line');
    }
    if (map.current.getSource('radius-circle')) {
      map.current.removeSource('radius-circle');
    }

    // Create circle coordinates
    const center = [centerPoint.longitude, centerPoint.latitude];
    const radius = searchRadius;
    const options = { steps: 64, units: 'meters' };
    
    // Create a circle using small line segments
    const coordinates = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const dx = radius * Math.cos(angle);
      const dy = radius * Math.sin(angle);
      
      // Convert meters to degrees (approximate)
      const dLng = dx / (111320 * Math.cos(centerPoint.latitude * Math.PI / 180));
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
        'fill-color': isDragging ? '#ff6b6b' : '#007cbf',
        'fill-opacity': isDragging ? 0.2 : 0.1
      }
    });

    // Add outline layer
    map.current.addLayer({
      id: 'radius-circle-line',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': isDragging ? '#ff6b6b' : '#007cbf',
        'line-width': isDragging ? 3 : 2,
        'line-opacity': isDragging ? 0.8 : 0.5
      }
    });

  }, [userLocation, searchRadius, searchCenter, isDragging, onSearchCenterChange]);

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

  // Display hashtag locations as animated circles
  useEffect(() => {
    if (!map.current) return;

    // Clear existing hashtag markers
    Object.keys(hashtagMarkersRef.current).forEach(key => {
      hashtagMarkersRef.current[key].remove();
      delete hashtagMarkersRef.current[key];
    });

    // Add new hashtag location markers
    if (hashtagLocations && hashtagLocations.length > 0) {
      hashtagLocations.forEach(location => {
        // Create animated circle element
        const el = document.createElement('div');
        el.className = 'hashtag-circle';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.border = `3px solid ${location.color}`;
        el.style.backgroundColor = `${location.color}33`; // 20% opacity
        el.style.animation = 'pulse 2s infinite';
        el.style.cursor = 'pointer';
        
        // Add inner circle for better visibility
        const inner = document.createElement('div');
        inner.style.width = '20px';
        inner.style.height = '20px';
        inner.style.borderRadius = '50%';
        inner.style.backgroundColor = location.color;
        inner.style.margin = '10px';
        inner.style.opacity = `${location.matchStrength}`;
        el.appendChild(inner);

        // Create marker
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 10px;">
                  <h4 style="margin: 0 0 5px 0; color: ${location.color};">${location.hashtag}</h4>
                  <p style="margin: 0;">Match: ${Math.round(location.matchStrength * 100)}%</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px;">Click to explore this location</p>
                </div>
              `)
          )
          .addTo(map.current);

        hashtagMarkersRef.current[location.id] = marker;
      });

      // Add CSS animation if not already present
      if (!document.querySelector('#hashtag-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'hashtag-pulse-style';
        style.textContent = `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 currentColor;
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 0 10px transparent;
              transform: scale(1.1);
            }
            100% {
              box-shadow: 0 0 0 0 transparent;
              transform: scale(1);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [hashtagLocations]);

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
        {searchCenter && (
          <div className="search-center-info" style={{
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '5px 10px',
            borderRadius: '4px',
            marginTop: '5px',
            fontSize: '12px'
          }}>
          </div>
        )}
        {activeHashtags && activeHashtags.length > 0 && (
          <div className="active-hashtags-info" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 12px',
            borderRadius: '8px',
            marginTop: '5px',
            fontSize: '14px',
            maxWidth: '300px'
          }}>
            <strong>Active Hashtags:</strong>
            <div style={{ marginTop: '5px' }}>
              {activeHashtags.map((tag, idx) => (
                <span key={idx} style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  margin: '2px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
              {hashtagLocations ? `${hashtagLocations.length} locations found` : 'Searching...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
