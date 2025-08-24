import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import BookingPanel from './components/BookingPanel';
import LocationTracker from './components/LocationTracker';
import NotificationHandler from './components/NotificationHandler';
import SurroundingInfo from './components/SurroundingInfo';
import VoiceAssistant from './components/VoiceAssistant';
import { SocketProvider } from './services/socketService';
import { ApiProvider } from './services/apiService';
import './App.css';

function App() {
  const [user, setUser] = useState({ id: 'user-' + Date.now() });
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [searchRadius, setSearchRadius] = useState(1000); // Default 1km
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  // Fetch parking spots when user location changes or radius changes
  useEffect(() => {
    if (userLocation) {
      fetchParkingSpots();
      fetchStatistics();
    }
  }, [userLocation, searchRadius]);

  const fetchParkingSpots = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/locations/parking-spots/radius?` +
        `lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=${searchRadius}`
      );
      const data = await response.json();
      
      if (data.success) {
        setParkingSpots(data.parkingSpots || []);
        console.log(`Loaded ${data.totalSpots} parking spots within ${searchRadius}m`);
      }
    } catch (error) {
      console.error('Error fetching parking spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!userLocation) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/locations/parking-spots/statistics?` +
        `lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=${searchRadius}`
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
  };

  const handleBookingComplete = (booking) => {
    setActiveBooking(booking);
    setShowBookingPanel(false);
    setSelectedSpot(null);
  };

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
  };

  return (
    <ApiProvider>
      <SocketProvider userId={user.id}>
        <div className="App">
          <header className="app-header">
            <h1>Parking Space Booking</h1>
            <div className="user-info">User: {user.id}</div>
          </header>

          <main className="app-main">
            {/* Radius Selector */}
            <div className="radius-selector">
              <label>Search Radius: </label>
              <select value={searchRadius} onChange={(e) => handleRadiusChange(parseInt(e.target.value))}>
                <option value="500">500m</option>
                <option value="1000">1km</option>
                <option value="2000">2km</option>
                <option value="5000">5km</option>
              </select>
              {loading && <span className="loading-indicator"> Loading...</span>}
            </div>

            {/* Statistics Display */}
            {statistics && (
              <div className="parking-statistics">
                <h3>Parking Statistics ({searchRadius}m radius)</h3>
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
              </div>
            )}

            <MapView 
              parkingSpots={parkingSpots}
              onSpotSelect={handleSpotSelect}
              selectedSpot={selectedSpot}
              userId={user.id}
              userLocation={userLocation}
              searchRadius={searchRadius}
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
                <p>Time: {new Date(activeBooking.startTime).toLocaleString()}</p>
              </div>
            )}
          </main>

          <LocationTracker userId={user.id} onLocationUpdate={setUserLocation} />
          <NotificationHandler userId={user.id} />
          <SurroundingInfo userLocation={userLocation} />
          <VoiceAssistant />
        </div>
      </SocketProvider>
    </ApiProvider>
  );
}

export default App;
