import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import BookingPanel from './components/BookingPanel';
import LocationTracker from './components/LocationTracker';
import NotificationHandler from './components/NotificationHandler';
import SurroundingInfo from './components/SurroundingInfo';
import VoiceAssistant from './components/VoiceAssistant';
import DraggablePanel from './components/DraggablePanel';
import LocationDebug from './components/LocationDebug';
import MyBookings from './components/MyBookings';
import NavigationPanel from './components/NavigationPanel';
import LocationVibe from './components/LocationVibe';
import { SocketProvider } from './services/socketService';
import { ApiProvider } from './services/apiService';
import './App.css';

// Helper function to generate mock locations with hashtags
function generateMockHashtagLocations(hashtag, center) {
  const locations = [];
  const count = 5 + Math.floor(Math.random() * 10); // 5-15 locations
  
  const hashtagColors = {
    '#FoodieParadise': '#FF6B6B',
    '#BusyArea': '#4ECDC4',
    '#CafeHopping': '#95E77E',
    '#ShoppingDistrict': '#FFD93D',
    '#NightlifeHub': '#6C5CE7',
    '#QuietArea': '#74B9FF',
    '#EasyParking': '#55A3FF',
    '#HardToFind': '#FF7675',
    '#ExpensiveParking': '#FD79A8',
    '#CheapParking': '#00B894'
  };
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const distance = 0.002 + Math.random() * 0.008; // Random distance
    
    locations.push({
      id: `hashtag-${hashtag}-${i}`,
      lat: (center.latitude || center.lat) + Math.sin(angle) * distance,
      lng: (center.longitude || center.lng) + Math.cos(angle) * distance,
      hashtag: hashtag,
      color: hashtagColors[hashtag] || '#667EEA',
      matchStrength: 0.5 + Math.random() * 0.5 // 50-100% match
    });
  }
  
  return locations;
}

function App() {
  const [user, setUser] = useState({ id: 'user-' + Date.now() });
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [searchRadius, setSearchRadius] = useState(500); // Default 500m
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [searchCenter, setSearchCenter] = useState(null); // Custom search center
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState(null);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [showLocationVibe, setShowLocationVibe] = useState(false);
  const [activeHashtags, setActiveHashtags] = useState([]);
  const [hashtagLocations, setHashtagLocations] = useState([]);

  // Fetch parking spots when user location changes, radius changes, or search center changes
  useEffect(() => {
    if (userLocation || searchCenter) {
      fetchParkingSpots();
      fetchStatistics();
    }
  }, [userLocation, searchRadius, searchCenter]);

  const fetchParkingSpots = async () => {
    // Use search center if set, otherwise use user location
    const searchLocation = searchCenter || userLocation;
    if (!searchLocation) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/locations/parking-spots/radius?` +
        `lat=${searchLocation.latitude}&lng=${searchLocation.longitude}&radius=${searchRadius}`
      );
      const data = await response.json();
      
      if (data.success) {
        setParkingSpots(data.parkingSpots || []);
        const centerType = searchCenter ? 'custom search center' : 'user location';
        console.log(`Loaded ${data.totalSpots} parking spots within ${searchRadius}m of ${centerType}`);
      }
    } catch (error) {
      console.error('Error fetching parking spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    // Use search center if set, otherwise use user location
    const searchLocation = searchCenter || userLocation;
    if (!searchLocation) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/locations/parking-spots/statistics?` +
        `lat=${searchLocation.latitude}&lng=${searchLocation.longitude}&radius=${searchRadius}`
      );
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSpotSelect = (spot) => {
    setSelectedSpot(spot);
    setShowBookingPanel(true);
    // Also set navigation destination to the selected spot
    setNavigationDestination({ lat: spot.lat, lng: spot.lng });
    setShowNavigation(true);
  };

  const handleBookingComplete = (booking) => {
    setActiveBooking(booking);
    setShowBookingPanel(false);
    setSelectedSpot(null);
  };

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
  };

  const handleSearchCenterChange = (newCenter) => {
    setSearchCenter(newCenter);
    console.log('Search center changed to:', newCenter);
  };

  const resetSearchCenter = () => {
    setSearchCenter(null);
    console.log('Search center reset to user location');
  };

  return (
    <ApiProvider>
      <SocketProvider userId={user.id}>
        <div className="App">
          <header className="app-header">
            <div className="header-left">
              <img 
                src="/logo.png" 
                alt="ParkingPilot Logo" 
                className="app-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.marginLeft = '0';
                }}
              />
              <h1>ParkingPilot</h1>
            </div>
            <div className="header-actions">
              <button 
                className="my-bookings-btn"
                onClick={() => setShowMyBookings(true)}
                style={{
                  padding: '8px 16px',
                  background: '#007cbf',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginRight: '16px'
                }}
              >
                My Bookings
              </button>
              <div className="user-info">User: {user.id}</div>
            </div>
          </header>

          <main className="app-main">
            {/* Radius Selector */}
            <div className="radius-selector">
              <label>Search Radius: </label>
              <select value={searchRadius} onChange={(e) => handleRadiusChange(parseInt(e.target.value))}>
                <option value="100">100m</option>
                <option value="500">500m</option>
                <option value="1000">1km</option>
                <option value="2000">2km</option>
                <option value="5000">5km</option>
              </select>
              {searchCenter && (
                <button 
                  onClick={resetSearchCenter}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    background: '#007cbf',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Reset to My Location
                </button>
              )}
              {loading && <span className="loading-indicator"> Loading...</span>}
            </div>

            {/* Statistics Display - Always show minimized, even without data */}
            <DraggablePanel 
              title="Parking Statistics" 
              className="statistics-panel"
              defaultPosition={{ x: window.innerWidth - 350, y: 120 }}
              minWidth={300}
              startMinimized={true}
              panelId="parking-statistics"
            >
              <div className="parking-statistics">
                <h3>Parking Statistics ({searchRadius}m radius)</h3>
                {statistics ? (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Spots:</span>
                      <span className="stat-value">{statistics.total}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Available:</span>
                      <span className="stat-value available">{statistics.available}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Occupied:</span>
                      <span className="stat-value occupied">{statistics.occupied}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Price:</span>
                      <span className="stat-value">${statistics.averagePrice}/hr</span>
                    </div>
                  </div>
                ) : (
                  <div className="loading-message">Loading statistics...</div>
                )}
              </div>
            </DraggablePanel>

            <MapView 
              parkingSpots={parkingSpots}
              onSpotSelect={handleSpotSelect}
              selectedSpot={selectedSpot}
              userId={user.id}
              userLocation={userLocation}
              searchRadius={searchRadius}
              onSearchCenterChange={handleSearchCenterChange}
              navigationRoute={navigationRoute}
              onLocationPinned={(location) => {
                setPinnedLocation(location);
                setShowLocationVibe(true);
              }}
              hashtagLocations={hashtagLocations}
              activeHashtags={activeHashtags}
            />

            {showBookingPanel && selectedSpot && (
              <BookingPanel
                spot={selectedSpot}
                userId={user.id}
                onClose={() => setShowBookingPanel(false)}
                onBookingComplete={handleBookingComplete}
              />
            )}

            {activeBooking && (
              <div className="active-booking-info">
                <h3>Active Booking</h3>
                <p>Spot: {activeBooking.spotId}</p>
                <p>Time: {new Date(activeBooking.startTime).toLocaleString('en-US')}</p>
              </div>
            )}
          </main>

          <LocationTracker userId={user.id} onLocationUpdate={setUserLocation} />
          <NotificationHandler userId={user.id} />
          <SurroundingInfo userLocation={userLocation} />
          <VoiceAssistant />
          <LocationDebug userLocation={userLocation} />
          
          {showMyBookings && (
            <MyBookings
              userId={user.id}
              onClose={() => setShowMyBookings(false)}
            />
          )}
          
          {showNavigation && (
            <NavigationPanel
              userLocation={userLocation}
              destination={navigationDestination}
              selectedSpot={selectedSpot}
              onRouteCalculated={(route) => setNavigationRoute(route)}
              onClose={() => {
                setShowNavigation(false);
                setNavigationRoute(null);
              }}
            />
          )}
          
          {showLocationVibe && pinnedLocation && (
            <LocationVibe
              location={pinnedLocation}
              onClose={() => {
                setShowLocationVibe(false);
                setPinnedLocation(null);
                setActiveHashtags([]);
                setHashtagLocations([]);
              }}
              onHashtagClick={(hashtag, isActive) => {
                if (isActive) {
                  // Add hashtag and generate mock locations
                  setActiveHashtags([...activeHashtags, hashtag]);
                  
                  // Generate mock locations around the PINNED location, not user location
                  const centerLocation = pinnedLocation || userLocation || {latitude: 25.0330, longitude: 121.5654};
                  const mockLocations = generateMockHashtagLocations(hashtag, centerLocation);
                  setHashtagLocations([...hashtagLocations, ...mockLocations]);
                } else {
                  // Remove hashtag and its locations
                  setActiveHashtags(activeHashtags.filter(h => h !== hashtag));
                  setHashtagLocations(hashtagLocations.filter(loc => loc.hashtag !== hashtag));
                }
              }}
              onFindSimilar={(similarLocs) => {
                // If similarLocs is an array of locations from the API
                if (Array.isArray(similarLocs) && similarLocs.length > 0) {
                  // Use the actual similar locations from the API
                  const message = `Similar Locations Found:\n\n${similarLocs.slice(0, 5).map(loc => 
                    `📍 Location (Score: ${loc.score || 'N/A'}/10)\n   Tags: ${
                      Array.isArray(loc.matchingTags) ? loc.matchingTags.join(', ') : 
                      Array.isArray(loc.hashtags) ? loc.hashtags.join(', ') : 'No tags'
                    }${loc.distance ? `\n   Distance: ${loc.distance.toFixed(1)} km` : ''}`
                  ).join('\n\n')}`;
                  
                  alert(message);
                } else {
                  // Fallback for when no similar locations are found
                  alert('No similar locations found in the cache. Try analyzing more locations first!');
                }
              }}
            />
          )}
        </div>
      </SocketProvider>
    </ApiProvider>
  );
}

export default App;
