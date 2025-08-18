import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SurroundingInfo.css';

const SurroundingInfo = ({ userLocation }) => {
  const [surroundingInfo, setSurroundingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      fetchSurroundingInfo();
    }
  }, [userLocation]);

  const fetchSurroundingInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:3001/api/location/surrounding-info', {
        params: {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        }
      });
      
      setSurroundingInfo(response.data.surroundingInfo);
    } catch (err) {
      console.error('Error fetching surrounding info:', err);
      setError('Failed to fetch surrounding information');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (!userLocation) {
    return null;
  }

  return (
    <div className={`surrounding-info ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="surrounding-info-header" onClick={() => setExpanded(!expanded)}>
        <h3>📍 Current Location</h3>
        <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="surrounding-info-content">
          {loading && <div className="loading">Loading surrounding information...</div>}
          
          {error && <div className="error">{error}</div>}
          
          {surroundingInfo && !loading && (
            <>
              {/* Current Address */}
              {surroundingInfo.currentLocation && (
                <div className="current-address">
                  <h4>Address</h4>
                  <p className="street-name">{surroundingInfo.currentLocation.streetName}</p>
                  <p className="full-address">{surroundingInfo.currentLocation.fullAddress}</p>
                  {surroundingInfo.currentLocation.neighborhood && (
                    <p className="neighborhood">
                      Neighborhood: {surroundingInfo.currentLocation.neighborhood}
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              {surroundingInfo.summary && (
                <div className="summary">
                  <h4>Quick Info</h4>
                  <p>Total nearby places: {surroundingInfo.summary.totalNearbyPlaces}</p>
                  {surroundingInfo.summary.closestRestaurant && (
                    <p>
                      Closest restaurant: {surroundingInfo.summary.closestRestaurant.name} 
                      ({formatDistance(surroundingInfo.summary.closestRestaurant.distance)})
                    </p>
                  )}
                </div>
              )}

              {/* Nearby Places */}
              <div className="nearby-places">
                <h4>Nearby Places</h4>
                
                {/* Restaurants */}
                {surroundingInfo.nearby.restaurants.length > 0 && (
                  <div className="place-category">
                    <h5>🍽️ Restaurants</h5>
                    <ul>
                      {surroundingInfo.nearby.restaurants.map((place, index) => (
                        <li key={index}>
                          <span className="place-name">{place.name}</span>
                          <span className="place-distance">{formatDistance(place.distance)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cafes */}
                {surroundingInfo.nearby.cafes.length > 0 && (
                  <div className="place-category">
                    <h5>☕ Cafes</h5>
                    <ul>
                      {surroundingInfo.nearby.cafes.map((place, index) => (
                        <li key={index}>
                          <span className="place-name">{place.name}</span>
                          <span className="place-distance">{formatDistance(place.distance)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gas Stations */}
                {surroundingInfo.nearby.gasStations.length > 0 && (
                  <div className="place-category">
                    <h5>⛽ Gas Stations</h5>
                    <ul>
                      {surroundingInfo.nearby.gasStations.map((place, index) => (
                        <li key={index}>
                          <span className="place-name">{place.name}</span>
                          <span className="place-distance">{formatDistance(place.distance)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Shops */}
                {surroundingInfo.nearby.shops.length > 0 && (
                  <div className="place-category">
                    <h5>🛍️ Shops</h5>
                    <ul>
                      {surroundingInfo.nearby.shops.map((place, index) => (
                        <li key={index}>
                          <span className="place-name">{place.name}</span>
                          <span className="place-distance">{formatDistance(place.distance)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SurroundingInfo;
