const axios = require('axios');

// Routing service configuration
const USE_OSRM = process.env.USE_OSRM === 'true';
const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';

// Check configuration
if (USE_OSRM) {
  console.log('✅ Using OSRM for navigation (no API key required)');
} else if (!ORS_API_KEY) {
  console.warn('⚠️  OpenRouteService API key not configured!');
  console.warn('   Falling back to OSRM (no API key required)');
} else {
  console.log('✅ Using OpenRouteService for navigation');
}

const navigationService = {
  /**
   * Get driving directions between two points
   * @param {Object} start - Start coordinates {lat, lng}
   * @param {Object} end - End coordinates {lat, lng}
   * @param {String} profile - Routing profile (driving-car, foot-walking, cycling-regular)
   */
  async getDirections(start, end, profile = 'driving-car') {
    try {
      let route;
      
      // Use OSRM if configured or as fallback
      if (USE_OSRM || !ORS_API_KEY) {
        // OSRM profile mapping
        const osrmProfile = profile === 'driving-car' ? 'driving' : 
                           profile === 'foot-walking' ? 'walking' : 
                           profile === 'cycling-regular' ? 'cycling' : 'driving';
        
        // OSRM API call
        const url = `${OSRM_BASE_URL}/route/v1/${osrmProfile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
        
        const response = await axios.get(url);
        
        if (response.data.code !== 'Ok') {
          throw new Error('OSRM routing failed');
        }
        
        // Convert OSRM response to our format
        const osrmRoute = response.data.routes[0];
        route = {
          summary: {
            distance: osrmRoute.distance,
            duration: osrmRoute.duration
          },
          geometry: osrmRoute.geometry,
          segments: [{
            steps: osrmRoute.legs[0].steps.map(step => ({
              instruction: step.maneuver.instruction || `${step.maneuver.type} on ${step.name || 'road'}`,
              distance: step.distance,
              duration: step.duration,
              type: step.maneuver.type,
              maneuver: step.maneuver
            }))
          }]
        };
      } else {
        // Use OpenRouteService
        const coordinates = [
          [start.lng, start.lat],
          [end.lng, end.lat]
        ];

        const response = await axios.post(
          `${ORS_BASE_URL}/v2/directions/${profile}`,
          {
            coordinates,
            instructions: true,
            instructions_format: 'text',
            units: 'm',
            geometry: true,
            elevation: false
          },
          {
            headers: {
              'Authorization': ORS_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        route = response.data.routes[0];
      }
      
      // Process the route data
      const processedRoute = {
        distance: route.summary.distance, // in meters
        duration: route.summary.duration, // in seconds
        distanceText: this.formatDistance(route.summary.distance),
        durationText: this.formatDuration(route.summary.duration),
        geometry: route.geometry, // GeoJSON LineString
        instructions: this.processInstructions(route.segments[0].steps),
        bounds: this.calculateBounds(route.geometry.coordinates)
      };

      return {
        success: true,
        route: processedRoute
      };
    } catch (error) {
      console.error('Error getting directions:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get directions'
      };
    }
  },

  /**
   * Get multi-modal route (driving + walking)
   * Useful for: drive to parking spot, then walk to final destination
   */
  async getMultiModalRoute(userLocation, parkingSpot, finalDestination) {
    try {
      // Part 1: Drive from user location to parking spot
      const drivingRoute = await this.getDirections(
        userLocation,
        { lat: parkingSpot.lat, lng: parkingSpot.lng },
        'driving-car'
      );

      // Part 2: Walk from parking spot to final destination (if provided)
      let walkingRoute = null;
      if (finalDestination) {
        walkingRoute = await this.getDirections(
          { lat: parkingSpot.lat, lng: parkingSpot.lng },
          finalDestination,
          'foot-walking'
        );
      }

      return {
        success: true,
        driving: drivingRoute.route,
        walking: walkingRoute?.route || null,
        totalDistance: (drivingRoute.route?.distance || 0) + (walkingRoute?.route?.distance || 0),
        totalDuration: (drivingRoute.route?.duration || 0) + (walkingRoute?.route?.duration || 0),
        parkingSpot: {
          name: parkingSpot.name,
          lat: parkingSpot.lat,
          lng: parkingSpot.lng,
          price: parkingSpot.price
        }
      };
    } catch (error) {
      console.error('Error getting multi-modal route:', error);
      return {
        success: false,
        error: 'Failed to calculate multi-modal route'
      };
    }
  },

  /**
   * Find optimal parking spot considering route distance
   * @param {Object} userLocation - User's current location
   * @param {Array} parkingSpots - Available parking spots
   * @param {Object} destination - Optional final destination
   */
  async findOptimalParking(userLocation, parkingSpots, destination = null) {
    try {
      const routePromises = parkingSpots.map(async (spot) => {
        const route = await this.getDirections(
          userLocation,
          { lat: spot.lat, lng: spot.lng },
          'driving-car'
        );

        let walkingDistance = 0;
        if (destination) {
          const walkRoute = await this.getDirections(
            { lat: spot.lat, lng: spot.lng },
            destination,
            'foot-walking'
          );
          walkingDistance = walkRoute.route?.distance || 0;
        }

        return {
          spot,
          drivingDistance: route.route?.distance || Infinity,
          drivingDuration: route.route?.duration || Infinity,
          walkingDistance,
          totalDistance: (route.route?.distance || 0) + walkingDistance,
          score: this.calculateParkingScore(
            route.route?.distance || 0,
            walkingDistance,
            spot.price || 0
          )
        };
      });

      const results = await Promise.all(routePromises);
      
      // Sort by score (lower is better)
      results.sort((a, b) => a.score - b.score);

      return {
        success: true,
        recommendations: results.slice(0, 5) // Return top 5 recommendations
      };
    } catch (error) {
      console.error('Error finding optimal parking:', error);
      return {
        success: false,
        error: 'Failed to find optimal parking'
      };
    }
  },

  /**
   * Process turn-by-turn instructions
   */
  processInstructions(steps) {
    return steps.map((step, index) => ({
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration,
      distanceText: this.formatDistance(step.distance),
      durationText: this.formatDuration(step.duration),
      type: step.type,
      maneuver: step.maneuver,
      stepNumber: index + 1
    }));
  },

  /**
   * Calculate bounds for the route
   */
  calculateBounds(coordinates) {
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    coordinates.forEach(coord => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    });

    return {
      southwest: [minLng, minLat],
      northeast: [maxLng, maxLat]
    };
  },

  /**
   * Calculate parking score (lower is better)
   * Considers driving distance, walking distance, and price
   */
  calculateParkingScore(drivingDistance, walkingDistance, price) {
    const drivingWeight = 0.5;  // 50% weight for driving distance
    const walkingWeight = 0.3;  // 30% weight for walking distance
    const priceWeight = 0.2;    // 20% weight for price

    // Normalize values (assuming max values for normalization)
    const normalizedDriving = drivingDistance / 5000;  // Max 5km driving
    const normalizedWalking = walkingDistance / 1000;  // Max 1km walking
    const normalizedPrice = price / 20;                // Max $20/hr

    return (
      normalizedDriving * drivingWeight +
      normalizedWalking * walkingWeight +
      normalizedPrice * priceWeight
    );
  },

  /**
   * Format distance for display
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  },

  /**
   * Format duration for display
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  },

  /**
   * Check if navigation is available
   */
  isAvailable() {
    // Navigation is always available (OSRM doesn't need API key)
    return true;
  },

  /**
   * Get remaining API quota (for monitoring)
   */
  async getQuota() {
    try {
      // OpenRouteService doesn't have a direct quota endpoint
      // This is a placeholder - in production, you'd track usage
      return {
        success: true,
        quota: {
          daily_limit: 2000,
          used: 0, // Would need to track this
          remaining: 2000
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get quota information'
      };
    }
  }
};

module.exports = navigationService;
