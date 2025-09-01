import React, { useState, useEffect } from 'react';
import './LocationVibe.css';

const LocationVibe = ({ location, onClose, onFindSimilar, onHashtagClick }) => {
  const [vibeData, setVibeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeHashtags, setActiveHashtags] = useState([]);
  const [similarLocations, setSimilarLocations] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (location) {
      analyzeLocation();
    }
  }, [location]);

  const analyzeLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/vibe/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          radius: 500
        })
      });

      const data = await response.json();
      if (data.success) {
        setVibeData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to analyze location');
    } finally {
      setLoading(false);
    }
  };

  const getParkingDifficultyBar = (difficulty) => {
    const filled = Math.round(difficulty);
    return '⚫'.repeat(filled) + '⚪'.repeat(10 - filled);
  };

  const handleHashtagClick = async (tag) => {
    const isActive = activeHashtags.includes(tag);
    const newActive = isActive 
      ? activeHashtags.filter(t => t !== tag)
      : [...activeHashtags, tag];
    
    setActiveHashtags(newActive);
    
    // Notify parent component
    if (onHashtagClick) {
      onHashtagClick(tag, !isActive);
    }
    
    // Fetch locations with this hashtag
    if (!isActive && newActive.length > 0) {
      await findSimilarByHashtags(newActive);
    } else if (newActive.length === 0) {
      setSimilarLocations([]);
    }
  };

  const findSimilarByHashtags = async (hashtags) => {
    setLoadingSimilar(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/vibe/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtags,
          currentLocation: location,
          limit: 10
        })
      });

      const data = await response.json();
      if (data.success) {
        setSimilarLocations(data.similarLocations);
        
        // Notify parent to show these on the map
        if (onFindSimilar) {
          onFindSimilar(data.similarLocations);
        }
      }
    } catch (err) {
      console.error('Failed to find similar locations:', err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleFindSimilarClick = () => {
    if (vibeData?.vibe?.hashtags) {
      const allHashtags = [
        ...(vibeData.vibe.hashtags || []),
        ...(vibeData.parking?.hashtags || [])
      ];
      setActiveHashtags(allHashtags);
      findSimilarByHashtags(allHashtags);
    }
  };

  if (!location) return null;

  return (
    <div className="location-vibe-panel">
      <div className="vibe-header">
        <h3>📍Location Intelligence</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing location...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>⚠️ {error}</p>
          <button onClick={analyzeLocation}>Retry</button>
        </div>
      )}

      {vibeData && !loading && (
        <div className="vibe-content">
          {/* Vibe Score and Summary */}
          <div className="vibe-summary">
            <div className="vibe-score">
              <span className="score-label">Vibe Score</span>
              <span className="score-value">{vibeData.vibe?.score || 0}/10</span>
            </div>
            <p className="summary-text">{vibeData.vibe?.summary}</p>
          </div>

          {/* Hashtags */}
          <div className="hashtags">
            {vibeData.vibe?.hashtags?.map((tag, idx) => (
              <span 
                key={idx} 
                className={`hashtag clickable ${activeHashtags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleHashtagClick(tag)}
                title="Click to find similar locations"
              >
                {tag}
              </span>
            ))}
            {vibeData.parking?.hashtags?.map((tag, idx) => (
              <span 
                key={`p-${idx}`} 
                className={`hashtag parking-tag clickable ${activeHashtags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleHashtagClick(tag)}
                title="Click to find similar locations"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Similar Locations */}
          {loadingSimilar && (
            <div className="similar-loading">
              <div className="spinner-small"></div>
              <span>Finding similar locations...</span>
            </div>
          )}
          
          {!loadingSimilar && similarLocations.length > 0 && (
            <div className="similar-locations">
              <h4>📍 Similar Locations ({similarLocations.length})</h4>
              <div className="similar-list">
                {similarLocations.slice(0, 5).map((loc, idx) => (
                  <div key={idx} className="similar-item">
                    <div className="similar-header">
                      <div className="similar-name">
                        {loc.name || loc.district || loc.area || `Location ${idx + 1}`}
                      </div>
                      <div className="similar-score">
                        {loc.matchCount ? `${loc.matchCount} matches` : `Score: ${loc.score}/10`}
                      </div>
                    </div>
                    <div className="similar-tags">
                      {Array.isArray(loc.matchingTags) 
                        ? loc.matchingTags.slice(0, 3).join(', ')
                        : (loc.hashtags ? loc.hashtags.slice(0, 3).join(', ') : '')}
                    </div>
                    {loc.distance && (
                      <div className="similar-distance">
                        {loc.distance.toFixed(1)} km away
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parking Analysis */}
          <div className="parking-analysis">
            <h4>🚗 Parking Analysis</h4>
            <div className="difficulty-meter">
              <span className="label">Difficulty:</span>
              <span className="meter">{getParkingDifficultyBar(vibeData.parking?.difficulty || 0)}</span>
              <span className="level">{vibeData.parking?.level}</span>
            </div>
            <ul className="parking-tips">
              {vibeData.parking?.tips?.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Transport Recommendations */}
          <div className="transport-recommendations">
            <h4>🚇 Best Way to Get There</h4>
            {vibeData.transport?.map((rec, idx) => (
              <div key={idx} className="transport-option">
                <strong>{rec.method}:</strong> {rec.reason}
              </div>
            ))}
          </div>

          {/* Find Similar Button */}
          <button 
            className="find-similar-btn"
            onClick={handleFindSimilarClick}
            disabled={loadingSimilar}
          >
            {loadingSimilar ? '🔄 Searching...' : '🔍 Find All Similar Vibes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationVibe;
