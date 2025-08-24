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

  // Generate parking spots near user's location (will update when location is available)
  const parkingSpots = userLocation ? [
    { id: 'spot-1', name: 'Spot A1', lat: userLocation.latitude + 0.002, lng: userLocation.longitude + 0.002, available: true },
    { id: 'spot-2', name: 'Spot A2', lat: userLocation.latitude + 0.0025, lng: userLocation.longitude + 0.0025, available: true },
    { id: 'spot-3', name: 'Spot B1', lat: userLocation.latitude - 0.002, lng: userLocation.longitude + 0.002, available: false },
    { id: 'spot-4', name: 'Spot B2', lat: userLocation.latitude - 0.0025, lng: userLocation.longitude - 0.0025, available: true },
  ] : [];

  const handleSpotSelect = (spot) => {
    setSelectedSpot(spot);
    setShowBookingPanel(true);
  };

  const handleBookingComplete = (booking) => {
    setActiveBooking(booking);
    setShowBookingPanel(false);
    setSelectedSpot(null);
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
            <MapView 
              parkingSpots={parkingSpots}
              onSpotSelect={handleSpotSelect}
              selectedSpot={selectedSpot}
              userId={user.id}
              userLocation={userLocation}
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
