const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const notificationService = require('../services/notificationService');
const geocodingService = require('../services/geocodingService');

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

// Get enriched parking spots with address information
router.get('/parking-spots-enriched', async (req, res) => {
  try {
    // In a real app, you would fetch parking spots from database
    // For now, using mock data
    const mockParkingSpots = [
      { id: 1, name: 'Spot A', lat: 25.0330, lng: 121.5654, available: true },
      { id: 2, name: 'Spot B', lat: 25.0340, lng: 121.5664, available: false },
      { id: 3, name: 'Spot C', lat: 25.0320, lng: 121.5644, available: true }
    ];
    
    const enrichedSpots = await geocodingService.enrichParkingSpots(mockParkingSpots);
    
    res.json({ parkingSpots: enrichedSpots });
  } catch (error) {
    console.error('Get enriched parking spots error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
