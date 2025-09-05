const locationService = require('./locationService');
const osmParkingService = require('./osmParkingService');
const { globalParkingData, getNearestCity, getCityData } = require('../data/globalParkingData');

// Get all parking spots from all cities (for backward compatibility)
const getAllParkingSpots = () => {
  const allSpots = [];
  Object.values(globalParkingData).forEach(cityData => {
    allSpots.push(...cityData.spots);
  });
  return allSpots;
};

// Legacy mock data - now pulls from global data
const mockParkingSpots = getAllParkingSpots();

// Keep original Taipei spots for backward compatibility
const legacyTaipeiSpots = [
  // Near Taipei 101 area
  { id: 'ps-001', name: 'Taipei 101 B1 Parking', lat: 25.0339, lng: 121.5645, available: true, price: 60, type: 'garage', features: ['covered', 'ev_charging'] },
  { id: 'ps-002', name: 'Taipei 101 B2 Parking', lat: 25.0341, lng: 121.5643, available: true, price: 60, type: 'garage', features: ['covered'] },
  { id: 'ps-003', name: 'Xinyi Road Street Parking', lat: 25.0335, lng: 121.5650, available: false, price: 30, type: 'street', features: [] },
  { id: 'ps-004', name: 'Songren Road Parking', lat: 25.0345, lng: 121.5655, available: true, price: 40, type: 'street', features: [] },
  
  // Near Taipei City Hall
  { id: 'ps-005', name: 'City Hall Underground Parking', lat: 25.0375, lng: 121.5637, available: true, price: 50, type: 'garage', features: ['covered', 'security'] },
  { id: 'ps-006', name: 'Keelung Road Parking Lot', lat: 25.0380, lng: 121.5640, available: true, price: 35, type: 'lot', features: [] },
  
  // Xinyi District scattered spots
  { id: 'ps-007', name: 'Songshou Road Parking', lat: 25.0360, lng: 121.5670, available: true, price: 30, type: 'street', features: [] },
  { id: 'ps-008', name: 'Zhongxiao East Road Parking', lat: 25.0410, lng: 121.5650, available: false, price: 40, type: 'street', features: [] },
  { id: 'ps-009', name: 'Breeze Center Parking', lat: 25.0395, lng: 121.5625, available: true, price: 55, type: 'garage', features: ['covered', 'ev_charging'] },
  { id: 'ps-010', name: 'Songshan Cultural Park Parking', lat: 25.0435, lng: 121.5605, available: true, price: 45, type: 'lot', features: ['security'] },
  
  // Further spots (500m - 1km radius)
  { id: 'ps-011', name: 'Renai Road Section 4 Parking', lat: 25.0380, lng: 121.5580, available: true, price: 35, type: 'street', features: [] },
  { id: 'ps-012', name: 'Dunhua South Road Parking', lat: 25.0320, lng: 121.5490, available: true, price: 40, type: 'street', features: [] },
  { id: 'ps-013', name: 'Anhe Road Parking Garage', lat: 25.0290, lng: 121.5520, available: false, price: 50, type: 'garage', features: ['covered'] },
  { id: 'ps-014', name: 'Tonghua Night Market Parking', lat: 25.0305, lng: 121.5535, available: true, price: 30, type: 'lot', features: [] },
  { id: 'ps-015', name: 'Linjiang Street Parking', lat: 25.0315, lng: 121.5545, available: true, price: 25, type: 'street', features: [] },
  
  // More spots around the area
  { id: 'ps-016', name: 'World Trade Center Parking', lat: 25.0330, lng: 121.5610, available: true, price: 60, type: 'garage', features: ['covered', 'security', 'ev_charging'] },
  { id: 'ps-017', name: 'Taipei Medical University Parking', lat: 25.0265, lng: 121.5615, available: true, price: 40, type: 'garage', features: ['covered'] },
  { id: 'ps-018', name: 'Wuxing Street Parking', lat: 25.0275, lng: 121.5625, available: false, price: 25, type: 'street', features: [] },
  { id: 'ps-019', name: 'Zhuangjing Road Parking', lat: 25.0285, lng: 121.5635, available: true, price: 30, type: 'street', features: [] },
  { id: 'ps-020', name: 'Songde Road Parking Lot', lat: 25.0295, lng: 121.5645, available: true, price: 35, type: 'lot', features: [] },
  
  // Additional spots for better coverage
  { id: 'ps-021', name: 'Xinyi Elementary School Parking', lat: 25.0355, lng: 121.5685, available: true, price: 30, type: 'lot', features: [] },
  { id: 'ps-022', name: 'Yongchun Station Parking', lat: 25.0405, lng: 121.5765, available: true, price: 40, type: 'garage', features: ['covered'] },
  { id: 'ps-023', name: 'Houshanpi Station Parking', lat: 25.0445, lng: 121.5825, available: false, price: 35, type: 'garage', features: ['covered'] },
  { id: 'ps-024', name: 'Xiangshan Station Parking', lat: 25.0265, lng: 121.5705, available: true, price: 35, type: 'garage', features: ['covered'] },
  { id: 'ps-025', name: 'Taipei Nanshan Plaza Parking', lat: 25.0338, lng: 121.5668, available: true, price: 70, type: 'garage', features: ['covered', 'security', 'ev_charging', 'valet'] },
];

const parkingSpotService = {
  /**
   * Get all parking spots within a radius from a given location
   * Combines mock data with real OpenStreetMap data
   * @param {number} lat - Latitude of the center point
   * @param {number} lng - Longitude of the center point
   * @param {number} radiusMeters - Radius in meters (default 500m = 0.5km)
   * @param {Object} filters - Optional filters (available, maxPrice, features, type)
   * @param {boolean} useOSM - Whether to fetch real OSM data (default true)
   * @returns {Promise<Array>} Array of parking spots with distance information
   */
  async getParkingSpotsInRadius(lat, lng, radiusMeters = 1000, filters = {}, useOSM = true) {
    let allSpots = [...mockParkingSpots];
    
    // Fetch real OSM data if enabled
    if (useOSM) {
      try {
        console.log(`Fetching real parking data from OpenStreetMap for radius ${radiusMeters}m...`);
        const osmSpots = await osmParkingService.fetchParkingFromOSM(lat, lng, radiusMeters);
        
        if (osmSpots && osmSpots.length > 0) {
          console.log(`Found ${osmSpots.length} parking spots from OpenStreetMap`);
          // Merge OSM data with mock data
          allSpots = osmParkingService.mergeWithExistingData(osmSpots, mockParkingSpots);
        }
      } catch (error) {
        console.error('Failed to fetch OSM data, using mock data only:', error.message);
      }
    }
    
    const spotsWithDistance = [];
    
    // Calculate distance for each parking spot
    for (const spot of allSpots) {
      const distance = locationService.calculateDistance(
        lat,
        lng,
        spot.lat,
        spot.lng
      );
      
      // Only include spots within the radius
      if (distance <= radiusMeters) {
        // Apply filters if provided
        if (filters.available !== undefined && spot.available !== filters.available) {
          continue;
        }
        
        if (filters.maxPrice !== undefined && spot.price > filters.maxPrice) {
          continue;
        }
        
        if (filters.minPrice !== undefined && spot.price < filters.minPrice) {
          continue;
        }
        
        if (filters.type && spot.type !== filters.type) {
          continue;
        }
        
        if (filters.features && filters.features.length > 0) {
          const hasAllFeatures = filters.features.every(feature => 
            spot.features.includes(feature)
          );
          if (!hasAllFeatures) {
            continue;
          }
        }
        
        spotsWithDistance.push({
          ...spot,
          distance: Math.round(distance), // Distance in meters
          distanceKm: (distance / 1000).toFixed(2), // Distance in kilometers
        });
      }
    }
    
    // Sort by distance (closest first)
    spotsWithDistance.sort((a, b) => a.distance - b.distance);
    
    return spotsWithDistance;
  },
  
  /**
   * Get a single parking spot by ID
   * @param {string} spotId - The parking spot ID
   * @returns {Object|null} The parking spot or null if not found
   */
  getParkingSpotById(spotId) {
    return mockParkingSpots.find(spot => spot.id === spotId) || null;
  },
  
  /**
   * Update parking spot availability
   * @param {string} spotId - The parking spot ID
   * @param {boolean} available - New availability status
   * @returns {Object|null} Updated parking spot or null if not found
   */
  updateAvailability(spotId, available) {
    const spot = mockParkingSpots.find(s => s.id === spotId);
    if (spot) {
      spot.available = available;
      return spot;
    }
    return null;
  },
  
  /**
   * Get parking spot statistics for an area
   * @param {number} lat - Latitude of the center point
   * @param {number} lng - Longitude of the center point
   * @param {number} radiusMeters - Radius in meters
   * @param {boolean} useOSM - Whether to fetch real OSM data (default true)
   * @returns {Promise<Object>} Statistics about parking spots in the area
   */
  async getAreaStatistics(lat, lng, radiusMeters = 1000, useOSM = true) {
    const spotsInArea = await this.getParkingSpotsInRadius(lat, lng, radiusMeters, {}, useOSM);
    
    const stats = {
      total: spotsInArea.length,
      available: spotsInArea.filter(s => s.available).length,
      occupied: spotsInArea.filter(s => !s.available).length,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      byType: {},
      features: {},
    };
    
    if (spotsInArea.length > 0) {
      // Calculate average price
      const prices = spotsInArea.map(s => s.price);
      stats.averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      stats.priceRange.min = Math.min(...prices);
      stats.priceRange.max = Math.max(...prices);
      
      // Count by type
      spotsInArea.forEach(spot => {
        stats.byType[spot.type] = (stats.byType[spot.type] || 0) + 1;
        
        // Count features
        spot.features.forEach(feature => {
          stats.features[feature] = (stats.features[feature] || 0) + 1;
        });
      });
    }
    
    return stats;
  },
  
  /**
   * Search parking spots with natural language query results
   * @param {Object} searchParams - Search parameters from NL processing
   * @param {Object} userLocation - User's current location
   * @returns {Promise<Array>} Array of matching parking spots
   */
  async searchWithNLParams(searchParams, userLocation) {
    const lat = searchParams.lat || userLocation.lat;
    const lng = searchParams.lng || userLocation.lng;
    const radius = searchParams.radius || 1000;
    
    const filters = {
      available: searchParams.available !== false, // Default to available only
      maxPrice: searchParams.maxPrice,
      minPrice: searchParams.minPrice,
      type: searchParams.type,
      features: searchParams.features || [],
    };
    
    return this.getParkingSpotsInRadius(lat, lng, radius, filters);
  }
};

module.exports = parkingSpotService;
