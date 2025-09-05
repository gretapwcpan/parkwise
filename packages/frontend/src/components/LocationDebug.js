import React from 'react';

const LocationDebug = ({ userLocation }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(65, 75, 63, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Location</h4>
      {userLocation ? (
        <div>
          <p>Lat: {userLocation.latitude}</p>
          <p>Lng: {userLocation.longitude}</p>
          <p>Accuracy: {userLocation.accuracy}m</p>
        </div>
      ) : (
        <p>No location data</p>
      )}
    </div>
  );
};

export default LocationDebug;
