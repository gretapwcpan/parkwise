const express = require('express');
const router = express.Router();
const navigationService = require('../services/navigationService');

// Get directions between two points
router.post('/directions', async (req, res) => {
  try {
    const { start, end, profile } = req.body;
    
    if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Please provide start and end with lat/lng'
      });
    }

    const result = await navigationService.getDirections(start, end, profile);
    res.json(result);
  } catch (error) {
    console.error('Error in directions route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get directions'
    });
  }
});

// Get multi-modal route (driving + walking)
router.post('/multi-modal', async (req, res) => {
  try {
    const { userLocation, parkingSpot, finalDestination } = req.body;
    
    if (!userLocation || !parkingSpot) {
      return res.status(400).json({
        success: false,
        error: 'User location and parking spot are required'
      });
    }

    const result = await navigationService.getMultiModalRoute(
      userLocation,
      parkingSpot,
      finalDestination
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in multi-modal route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate multi-modal route'
    });
  }
});

// Find optimal parking considering route
router.post('/optimal-parking', async (req, res) => {
  try {
    const { userLocation, parkingSpots, destination } = req.body;
    
    if (!userLocation || !parkingSpots || parkingSpots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User location and parking spots are required'
      });
    }

    const result = await navigationService.findOptimalParking(
      userLocation,
      parkingSpots,
      destination
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error finding optimal parking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find optimal parking'
    });
  }
});

// Check navigation service status
router.get('/status', async (req, res) => {
  try {
    const isAvailable = navigationService.isAvailable();
    const quota = await navigationService.getQuota();
    
    res.json({
      success: true,
      available: isAvailable,
      quota: quota.quota
    });
  } catch (error) {
    console.error('Error checking navigation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check navigation status'
    });
  }
});

module.exports = router;
