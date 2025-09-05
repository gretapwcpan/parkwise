// In-memory storage for active user locations
const activeLocations = new Map();

// Location history (last 10 points per user)
const locationHistory = new Map();

const locationService = {
  // Process and validate location update
  async processLocationUpdate(data) {
    const { userId, latitude, longitude, accuracy, heading, speed } = data;
    
    // Validate location data
    if (!userId || !latitude || !longitude) {
      throw new Error('Invalid location data');
    }
    
    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid coordinates');
    }
    
    const timestamp = new Date().toISOString();
    
    const processedLocation = {
      userId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || 10,
      heading: heading || null,
      speed: speed || 0,
      timestamp,
    };
    
    // Update location history
    this.addToHistory(userId, processedLocation);
    
    return processedLocation;
  },
  
  // Update active location for a user
  updateActiveLocation(socketId, location) {
    activeLocations.set(socketId, {
      ...location,
      lastUpdate: Date.now(),
    });
  },
  
  // Remove active location when user disconnects
  removeActiveLocation(socketId) {
    activeLocations.delete(socketId);
  },
  
  // Get all active locations
  getActiveLocations() {
    const locations = [];
    const now = Date.now();
    
    // Filter out stale locations (older than 30 seconds)
    for (const [socketId, location] of activeLocations.entries()) {
      if (now - location.lastUpdate < 30000) {
        locations.push(location);
      } else {
        activeLocations.delete(socketId);
      }
    }
    
    return locations;
  },
  
  // Get active locations in a specific area
  getLocationsInArea(areaId, bounds) {
    const { north, south, east, west } = bounds;
    const locationsInArea = [];
    
    for (const location of this.getActiveLocations()) {
      if (
        location.latitude >= south &&
        location.latitude <= north &&
        location.longitude >= west &&
        location.longitude <= east
      ) {
        locationsInArea.push(location);
      }
    }
    
    return locationsInArea;
  },
  
  // Add location to history
  addToHistory(userId, location) {
    if (!locationHistory.has(userId)) {
      locationHistory.set(userId, []);
    }
    
    const history = locationHistory.get(userId);
    history.push(location);
    
    // Keep only last 10 points
    if (history.length > 10) {
      history.shift();
    }
  },
  
  // Get location history for a user
  getLocationHistory(userId) {
    return locationHistory.get(userId) || [];
  },
  
  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  },
  
  // Check if user is near a parking spot
  isNearParkingSpot(userLocation, spotLocation, thresholdMeters = 50) {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      spotLocation.latitude,
      spotLocation.longitude
    );
    
    return distance <= thresholdMeters;
  },
  
  // Simulate GPS updates for testing
  startSimulation(userId, startLat, startLng, io) {
    let lat = startLat;
    let lng = startLng;
    
    const interval = setInterval(() => {
      // Random walk simulation
      lat += (Math.random() - 0.5) * 0.0001;
      lng += (Math.random() - 0.5) * 0.0001;
      
      const simulatedLocation = {
        userId,
        latitude: lat,
        longitude: lng,
        accuracy: 5 + Math.random() * 10,
        heading: Math.random() * 360,
        speed: Math.random() * 5,
        timestamp: new Date().toISOString(),
      };
      
      // Emit to all connected clients
      io.emit('user-location-update', simulatedLocation);
      
      // Update active location
      this.updateActiveLocation(`sim-${userId}`, simulatedLocation);
    }, 3000); // Update every 3 seconds
    
    // Return function to stop simulation
    return () => clearInterval(interval);
  },
  
  // Get nearby users for a given location
  getNearbyUsers(centerLat, centerLng, radiusMeters = 1000) {
    const nearbyUsers = [];
    
    for (const location of this.getActiveLocations()) {
      const distance = this.calculateDistance(
        centerLat,
        centerLng,
        location.latitude,
        location.longitude
      );
      
      if (distance <= radiusMeters) {
        nearbyUsers.push({
          ...location,
          distance: Math.round(distance),
        });
      }
    }
    
    // Sort by distance
    nearbyUsers.sort((a, b) => a.distance - b.distance);
    
    return nearbyUsers;
  }
};

module.exports = locationService;
