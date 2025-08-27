import React, { useState, useEffect } from 'react';
import './NavigationPanel.css';

const NavigationPanel = ({ 
  userLocation, 
  destination, 
  onRouteCalculated, 
  onClose,
  selectedSpot 
}) => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [navigationMode, setNavigationMode] = useState('driving-car');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Calculate route when destination changes
  useEffect(() => {
    if (userLocation && destination) {
      calculateRoute();
    }
  }, [userLocation, destination, navigationMode]);

  const calculateRoute = async () => {
    if (!userLocation || !destination) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/navigation/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: {
            lat: userLocation.latitude,
            lng: userLocation.longitude
          },
          end: destination,
          profile: navigationMode
        })
      });

      const data = await response.json();

      if (data.success) {
        setRoute(data.route);
        setShowInstructions(true);
        
        // Notify parent component about the route
        if (onRouteCalculated) {
          onRouteCalculated(data.route);
        }
      } else {
        setError(data.error || 'Failed to calculate route');
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Failed to connect to navigation service');
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = () => {
    if (!route) return;
    setIsNavigating(true);
    setCurrentStepIndex(0);
    
    // In a real app, you would track user position and update current step
    // For now, we'll just show the navigation UI
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (currentStepIndex < route.instructions.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const getDirectionIcon = (type) => {
    const iconMap = {
      'straight': '⬆️',
      'turn-left': '⬅️',
      'turn-right': '➡️',
      'turn-slight-left': '↖️',
      'turn-slight-right': '↗️',
      'turn-sharp-left': '↰',
      'turn-sharp-right': '↱',
      'uturn-left': '↩️',
      'uturn-right': '↪️',
      'roundabout': '🔄',
      'depart': '🚗',
      'arrive': '🏁'
    };
    return iconMap[type] || '➡️';
  };

  const formatInstruction = (instruction) => {
    // Clean up instruction text
    let text = instruction.replace(/\s+/g, ' ').trim();
    
    // Highlight important parts
    text = text.replace(/(\d+\s*m(?:eters)?)/gi, '<strong>$1</strong>');
    text = text.replace(/(\d+\s*km)/gi, '<strong>$1</strong>');
    
    return text;
  };

  return (
    <div className="navigation-panel">
      <div className="navigation-header">
        <h3>🧭 Navigation</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {!route && !loading && (
        <div className="navigation-setup">
          <div className="mode-selector">
            <label>Travel Mode:</label>
            <div className="mode-buttons">
              <button 
                className={navigationMode === 'driving-car' ? 'active' : ''}
                onClick={() => setNavigationMode('driving-car')}
                title="Driving"
              >
                🚗
              </button>
              <button 
                className={navigationMode === 'foot-walking' ? 'active' : ''}
                onClick={() => setNavigationMode('foot-walking')}
                title="Walking"
              >
                🚶
              </button>
              <button 
                className={navigationMode === 'cycling-regular' ? 'active' : ''}
                onClick={() => setNavigationMode('cycling-regular')}
                title="Cycling"
              >
                🚴
              </button>
            </div>
          </div>

          {destination && (
            <button className="calculate-route-btn" onClick={calculateRoute}>
              Calculate Route
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating route...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
          <button onClick={calculateRoute}>Retry</button>
        </div>
      )}

      {route && (
        <div className="route-info">
          <div className="route-summary">
            <div className="summary-item">
              <span className="label">Distance:</span>
              <span className="value">{route.distanceText}</span>
            </div>
            <div className="summary-item">
              <span className="label">Duration:</span>
              <span className="value">{route.durationText}</span>
            </div>
            {selectedSpot && (
              <div className="summary-item">
                <span className="label">Parking:</span>
                <span className="value">{selectedSpot.name}</span>
              </div>
            )}
          </div>

          {!isNavigating ? (
            <div className="navigation-controls">
              <button 
                className="start-navigation-btn"
                onClick={startNavigation}
              >
                🚀 Start Navigation
              </button>
              <button 
                className="toggle-instructions-btn"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                {showInstructions ? '📋 Hide' : '📋 Show'} Instructions
              </button>
            </div>
          ) : (
            <div className="active-navigation">
              <div className="current-instruction">
                <div className="step-number">
                  Step {currentStepIndex + 1} of {route.instructions.length}
                </div>
                <div className="instruction-content">
                  <span className="direction-icon">
                    {getDirectionIcon(route.instructions[currentStepIndex].type)}
                  </span>
                  <div className="instruction-text">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatInstruction(route.instructions[currentStepIndex].instruction) 
                      }}
                    />
                    <div className="instruction-distance">
                      {route.instructions[currentStepIndex].distanceText}
                    </div>
                  </div>
                </div>
              </div>

              <div className="navigation-buttons">
                <button 
                  onClick={previousStep}
                  disabled={currentStepIndex === 0}
                >
                  ⬅️ Previous
                </button>
                <button 
                  className="stop-btn"
                  onClick={stopNavigation}
                >
                  ⏹️ Stop
                </button>
                <button 
                  onClick={nextStep}
                  disabled={currentStepIndex === route.instructions.length - 1}
                >
                  Next ➡️
                </button>
              </div>
            </div>
          )}

          {showInstructions && !isNavigating && (
            <div className="instructions-list">
              <h4>Turn-by-turn Directions:</h4>
              <ol>
                {route.instructions.map((step, index) => (
                  <li 
                    key={index} 
                    className={index === currentStepIndex ? 'current-step' : ''}
                  >
                    <span className="step-icon">
                      {getDirectionIcon(step.type)}
                    </span>
                    <div className="step-details">
                      <div 
                        className="step-instruction"
                        dangerouslySetInnerHTML={{ 
                          __html: formatInstruction(step.instruction) 
                        }}
                      />
                      <div className="step-meta">
                        <span className="step-distance">{step.distanceText}</span>
                        {step.durationText && (
                          <span className="step-duration"> • {step.durationText}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        {route && (
          <>
            <button 
              className="share-btn"
              onClick={() => {
                // In a real app, this would share the route
                alert('Share functionality would be implemented here');
              }}
              title="Share Route"
            >
              📤
            </button>
            <button 
              className="save-btn"
              onClick={() => {
                // In a real app, this would save the route
                alert('Save functionality would be implemented here');
              }}
              title="Save Route"
            >
              💾
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NavigationPanel;
