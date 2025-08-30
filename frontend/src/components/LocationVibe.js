import React, { useState, useEffect } from 'react';
import './LocationVibe.css';

const LocationVibe = ({ location, onClose, onFindSimilar, onHashtagClick }) => {
  const [vibeData, setVibeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeHashtags, setActiveHashtags] = useState([]);

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
                onClick={() => {
                  const newActive = activeHashtags.includes(tag) 
                    ? activeHashtags.filter(t => t !== tag)
                    : [...activeHashtags, tag];
                  setActiveHashtags(newActive);
                  onHashtagClick && onHashtagClick(tag, !activeHashtags.includes(tag));
                }}
                title="Click to highlight similar locations"
              >
                {tag}
              </span>
            ))}
            {vibeData.parking?.hashtags?.map((tag, idx) => (
              <span 
                key={`p-${idx}`} 
                className={`hashtag parking-tag clickable ${activeHashtags.includes(tag) ? 'active' : ''}`}
                onClick={() => {
                  const newActive = activeHashtags.includes(tag) 
                    ? activeHashtags.filter(t => t !== tag)
                    : [...activeHashtags, tag];
                  setActiveHashtags(newActive);
                  onHashtagClick && onHashtagClick(tag, !activeHashtags.includes(tag));
                }}
                title="Click to highlight similar locations"
              >
                {tag}
              </span>
            ))}
          </div>

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
            onClick={() => onFindSimilar && onFindSimilar(vibeData.vibe?.hashtags)}
          >
            🔍 Find Similar Vibes
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationVibe;
