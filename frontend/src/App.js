import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import BookingPanel from './components/BookingPanel';
import LocationTracker from './components/LocationTracker';
import NotificationHandler from './components/NotificationHandler';
import SurroundingInfo from './components/SurroundingInfo';
import { SocketProvider } from './services/socketService';
import { ApiProvider } from './services/apiService';
import './App.css';

function App() {
  const [user, setUser] = useState({ id: 'user-' + Date.now() });
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [userLocation, setUserLocation] = useState({
    latitude: 25.0330,
    longitude: 121.5654,
    accuracy: 10
  });

  // Mock parking spots for demo
  const parkingSpots = [
    { id: 'spot-1', name: 'Spot A1', lat: 25.0330, lng: 121.5654, available: true },
    { id: 'spot-2', name: 'Spot A2', lat: 25.0335, lng: 121.5659, available: true },
    { id: 'spot-3', name: 'Spot B1', lat: 25.0340, lng: 121.5664, available: false },
    { id: 'spot-4', name: 'Spot B2', lat: 25.0345, lng: 121.5669, available: true },
  ];

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
        </div>
      </SocketProvider>
    </ApiProvider>
  );
}

export default App;
