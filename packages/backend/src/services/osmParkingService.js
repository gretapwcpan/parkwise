const axios = require('axios');
const locationService = require('./locationService');

/**
 * Service for fetching real parking data from OpenStreetMap
 */
const osmParkingService = {
  /**
   * Fetch parking spots from OpenStreetMap using Overpass API
   * @param {number} lat - Latitude of the center point
   * @param {number} lng - Longitude of the center point
   * @param {number} radius - Radius in meters
   * @returns {Promise<Array>} Array of parking spots
   */
  async fetchParkingFromOSM(lat, lng, radius) {
    try {
      // Overpass QL query to get parking amenities
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="parking"](around:${radius},${lat},${lng});
          way["amenity"="parking"](around:${radius},${lat},${lng});
          relation["amenity"="parking"](around:${radius},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: {
            'Content-Type': 'text/plain'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return this.transformOSMData(response.data.elements, lat, lng);
    } catch (error) {
      console.error('Error fetching OSM parking data:', error.message);
      
      // Fallback to mock data if OSM fails
      return this.getFallbackData(lat, lng, radius);
    }
  },

  /**
   * Transform OSM data to our parking spot format
   * @param {Array} elements - OSM elements
   * @param {number} userLat - User latitude for distance calculation
   * @param {number} userLng - User longitude for distance calculation
   * @returns {Array} Transformed parking spots
   */
  transformOSMData(elements, userLat, userLng) {
    const parkingSpots = [];
    const processedIds = new Set();

    elements.forEach(element => {
      // Skip if already processed or if it's just a node part of a way
      if (processedIds.has(element.id) || (!element.tags && element.type === 'node')) {
        return;
      }

      processedIds.add(element.id);

      // Get coordinates based on element type
      let lat, lng;
      if (element.type === 'node') {
        lat = element.lat;
        lng = element.lon;
      } else if (element.type === 'way' && element.center) {
        lat = element.center.lat;
        lng = element.center.lon;
      } else if (element.type === 'relation' && element.center) {
        lat = element.center.lat;
        lng = element.center.lon;
      } else {
        return; // Skip if no coordinates
      }

      // Extract parking information from tags
      const tags = element.tags || {};
      
      // Determine parking type
      let type = 'lot'; // default
      if (tags.parking === 'underground' || tags.parking === 'multi-storey') {
        type = 'garage';
      } else if (tags.parking === 'street_side' || tags.parking === 'lane') {
        type = 'street';
      } else if (tags.parking === 'surface') {
        type = 'lot';
      }

      // Extract features
      const features = [];
      if (tags.covered === 'yes' || tags.parking === 'underground') {
        features.push('covered');
      }
      if (tags['capacity:charging'] || tags['socket:type2']) {
        features.push('ev_charging');
      }
      if (tags.surveillance === 'yes' || tags.security === 'yes') {
        features.push('security');
      }
      if (tags['capacity:disabled']) {
        features.push('disabled_access');
      }

      // Determine availability (OSM doesn't provide real-time data)
      // Use a consistent availability based on ID to avoid random changes
      let available = true;
      let capacity = null;
      if (tags.capacity) {
        capacity = parseInt(tags.capacity);
        // Use a deterministic availability based on the element ID
        // This ensures the same spot always has the same availability status
        const hashCode = element.id.toString().split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        // About 75% of spots will be available
        available = (Math.abs(hashCode) % 100) > 25;
      }

      // Estimate price (OSM rarely has price data)
      let price = null;
      if (tags.fee === 'yes') {
        // Estimate based on type
        if (type === 'garage') {
          price = Math.floor(Math.random() * 30) + 20; // $20-50
        } else if (type === 'street') {
          price = Math.floor(Math.random() * 15) + 10; // $10-25
        } else {
          price = Math.floor(Math.random() * 20) + 15; // $15-35
        }
      } else if (tags.fee === 'no') {
        price = 0;
      }

      // Calculate distance
      const distance = locationService.calculateDistance(
        userLat,
        userLng,
        lat,
        lng
      );

      // Create parking spot object with better naming
      const spot = {
        id: `osm-${element.type}-${element.id}`,
        name: tags.name || tags.operator || tags['addr:street'] || 
               `${type.charAt(0).toUpperCase() + type.slice(1)} Parking #${element.id.toString().slice(-4)}`,
        lat: lat,
        lng: lng,
        available: available,
        price: price,
        type: type,
        features: features,
        distance: Math.round(distance),
        distanceKm: (distance / 1000).toFixed(2),
        capacity: capacity,
        source: 'openstreetmap',
        osmId: element.id,
        osmType: element.type,
        tags: tags // Keep original tags for reference
      };

      parkingSpots.push(spot);
    });

    // Sort by distance
    parkingSpots.sort((a, b) => a.distance - b.distance);

    return parkingSpots;
  },

  /**
   * Get fallback data when OSM is unavailable
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in meters
   * @returns {Array} Fallback parking spots
   */
  getFallbackData(lat, lng, radius) {
    // Return empty array instead of confusing fallback data
    // The mock data from parkingSpotService will be used instead
    console.log('OpenStreetMap unavailable, using local mock data only');
    return [];
  },

  /**
   * Merge OSM data with existing data
   * @param {Array} osmData - Data from OpenStreetMap
   * @param {Array} existingData - Existing parking data
   * @returns {Array} Merged and deduplicated data
   */
  mergeWithExistingData(osmData, existingData) {
    const merged = [...existingData];
    const existingLocations = new Set(
      existingData.map(spot => `${spot.lat.toFixed(4)},${spot.lng.toFixed(4)}`)
    );

    // Add OSM spots that don't overlap with existing data
    osmData.forEach(osmSpot => {
      const locationKey = `${osmSpot.lat.toFixed(4)},${osmSpot.lng.toFixed(4)}`;
      if (!existingLocations.has(locationKey)) {
        merged.push(osmSpot);
      }
    });

    return merged;
  }
};

module.exports = osmParkingService;
