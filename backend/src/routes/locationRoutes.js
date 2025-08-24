const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const notificationService = require('../services/notificationService');
const geocodingService = require('../services/geocodingService');
const nlSearchService = require('../services/nlSearchService');
const parkingSpotService = require('../services/parkingSpotService');

// Get all active locations
router.get('/active', async (req, res) => {
  try {
    const locations = locationService.getActiveLocations();
    res.json({ locations });
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get locations in a specific area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { north, south, east, west } = req.query;
    
    if (!north || !south || !east || !west) {
      return res.status(400).json({ 
        error: 'Bounds parameters (north, south, east, west) are required' 
      });
    }
    
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west),
    };
    
    const locations = locationService.getLocationsInArea(areaId, bounds);
    res.json({ locations });
  } catch (error) {
    console.error('Get area locations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = locationService.getLocationHistory(userId);
    res.json({ history });
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get nearby users
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radiusMeters = radius ? parseInt(radius) : 1000;
    
    const nearbyUsers = locationService.getNearbyUsers(centerLat, centerLng, radiusMeters);
    res.json({ nearbyUsers });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user is near a parking spot
router.post('/check-proximity', async (req, res) => {
  try {
    const { userLocation, spotLocation, threshold } = req.body;
    
    if (!userLocation || !spotLocation) {
      return res.status(400).json({ 
        error: 'User location and spot location are required' 
      });
    }
    
    const isNear = locationService.isNearParkingSpot(
      userLocation,
      spotLocation,
      threshold || 50
    );
    
    if (isNear && userLocation.userId) {
      // Send arrival notification
      await notificationService.sendArrivalNotification(
        userLocation.userId,
        spotLocation.spotId
      );
    }
    
    res.json({ isNear });
  } catch (error) {
    console.error('Check proximity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start location simulation (for testing)
router.post('/simulate', async (req, res) => {
  try {
    const { userId, startLat, startLng } = req.body;
    
    if (!userId || !startLat || !startLng) {
      return res.status(400).json({ 
        error: 'User ID, start latitude, and start longitude are required' 
      });
    }
    
    // Get io instance from app
    const io = req.app.get('io');
    if (!io) {
      return res.status(500).json({ error: 'Socket.io not initialized' });
    }
    
    // Start simulation
    const stopSimulation = locationService.startSimulation(
      userId,
      parseFloat(startLat),
      parseFloat(startLng),
      io
    );
    
    // Store stop function (in production, use proper session management)
    global.activeSimulations = global.activeSimulations || {};
    global.activeSimulations[userId] = stopSimulation;
    
    res.json({ 
      message: 'Location simulation started',
      userId,
      startLocation: { lat: startLat, lng: startLng }
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop location simulation
router.post('/simulate/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Stop simulation if exists
    if (global.activeSimulations && global.activeSimulations[userId]) {
      global.activeSimulations[userId]();
      delete global.activeSimulations[userId];
      
      res.json({ message: 'Location simulation stopped', userId });
    } else {
      res.status(404).json({ error: 'No active simulation found for user' });
    }
  } catch (error) {
    console.error('Stop simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get address from coordinates (reverse geocoding)
router.get('/address', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    const addressInfo = await geocodingService.getAddressFromCoordinates(latitude, longitude);
    
    if (!addressInfo) {
      return res.status(404).json({ error: 'Address not found for given coordinates' });
    }
    
    res.json({ address: addressInfo });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get nearby places
router.get('/nearby-places', async (req, res) => {
  try {
    const { lat, lng, category, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = radius ? parseInt(radius) : 1000;
    
    const places = await geocodingService.getNearbyPlaces(
      latitude, 
      longitude, 
      category || 'restaurant',
      searchRadius
    );
    
    res.json({ places });
  } catch (error) {
    console.error('Get nearby places error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive surrounding information
router.get('/surrounding-info', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    const surroundingInfo = await geocodingService.getSurroundingInfo(latitude, longitude);
    
    res.json({ surroundingInfo });
  } catch (error) {
    console.error('Get surrounding info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get parking spots within radius
router.get('/parking-spots/radius', async (req, res) => {
  try {
    const { lat, lng, radius, available, maxPrice, minPrice, type, features } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = radius ? parseInt(radius) : 1000; // Default 1km
    
    // Build filters object
    const filters = {};
    if (available !== undefined) {
      filters.available = available === 'true';
    }
    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice);
    }
    if (minPrice) {
      filters.minPrice = parseFloat(minPrice);
    }
    if (type) {
      filters.type = type;
    }
    if (features) {
      filters.features = Array.isArray(features) ? features : [features];
    }
    
    const parkingSpots = parkingSpotService.getParkingSpotsInRadius(
      latitude,
      longitude,
      radiusMeters,
      filters
    );
    
    res.json({ 
      success: true,
      center: { lat: latitude, lng: longitude },
      radius: radiusMeters,
      totalSpots: parkingSpots.length,
      parkingSpots 
    });
  } catch (error) {
    console.error('Get parking spots in radius error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get parking spot statistics for an area
router.get('/parking-spots/statistics', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = radius ? parseInt(radius) : 1000;
    
    const statistics = parkingSpotService.getAreaStatistics(
      latitude,
      longitude,
      radiusMeters
    );
    
    res.json({ 
      success: true,
      center: { lat: latitude, lng: longitude },
      radius: radiusMeters,
      statistics 
    });
  } catch (error) {
    console.error('Get parking statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific parking spot by ID
router.get('/parking-spots/:spotId', async (req, res) => {
  try {
    const { spotId } = req.params;
    const spot = parkingSpotService.getParkingSpotById(spotId);
    
    if (!spot) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }
    
    res.json({ success: true, parkingSpot: spot });
  } catch (error) {
    console.error('Get parking spot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update parking spot availability
router.patch('/parking-spots/:spotId/availability', async (req, res) => {
  try {
    const { spotId } = req.params;
    const { available } = req.body;
    
    if (available === undefined) {
      return res.status(400).json({ error: 'Available status is required' });
    }
    
    const updatedSpot = parkingSpotService.updateAvailability(spotId, available);
    
    if (!updatedSpot) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }
    
    // Emit update to all connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('parking-spot-update', updatedSpot);
    }
    
    res.json({ success: true, parkingSpot: updatedSpot });
  } catch (error) {
    console.error('Update parking spot availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get enriched parking spots with address information
router.get('/parking-spots-enriched', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) parameters are required' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = radius ? parseInt(radius) : 1000;
    
    const parkingSpots = parkingSpotService.getParkingSpotsInRadius(
      latitude,
      longitude,
      radiusMeters
    );
    
    const enrichedSpots = await geocodingService.enrichParkingSpots(parkingSpots);
    
    res.json({ parkingSpots: enrichedSpots });
  } catch (error) {
    console.error('Get enriched parking spots error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Natural language search endpoint
router.post('/search/natural', async (req, res) => {
  try {
    const { query, userLocation, language } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }
    
    // Parse the natural language query
    const parseResult = await nlSearchService.parseSearchQuery(
      query,
      userLocation,
      language
    );
    
    // Check if parsing was successful
    if (parseResult.success === false) {
      // Even if LLM parsing fails, provide mock results
      console.log('LLM service unavailable, using fallback results');
    }
    
    // Convert filters to search parameters
    const searchParams = nlSearchService.formatFiltersForSearch(parseResult.filters || {});
    
    // Use the new parking spot service to get real data
    const parkingSpots = parkingSpotService.searchWithNLParams(searchParams, userLocation || { lat: 25.0330, lng: 121.5654 });
    
    // Limit results for voice response
    const limitedResults = parkingSpots.slice(0, 10);
    
    res.json({
      success: true,
      query: query,
      explanation: parseResult.explanation || `Found ${limitedResults.length} parking spots matching your request`,
      filters: parseResult.filters || {},
      results: limitedResults,
      totalResults: limitedResults.length
    });
  } catch (error) {
    console.error('Natural language search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get natural language search examples
router.get('/search/examples', async (req, res) => {
  try {
    const examples = await nlSearchService.getExamples();
    res.json({ examples });
  } catch (error) {
    console.error('Get search examples error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check LLM service health
router.get('/search/health', async (req, res) => {
  try {
    const isHealthy = await nlSearchService.checkHealth();
    res.json({ 
      llmServiceHealthy: isHealthy,
      message: isHealthy ? 'LLM service is operational' : 'LLM service is unavailable'
    });
  } catch (error) {
    console.error('LLM health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
