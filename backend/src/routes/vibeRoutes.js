const express = require('express');
const router = express.Router();
const locationVibeService = require('../services/locationVibeService');

// Analyze location vibe
router.post('/analyze', async (req, res) => {
  try {
    const { lat, lng, radius } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const result = await locationVibeService.analyzeLocationVibe(
      parseFloat(lat),
      parseFloat(lng),
      radius || 500
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in vibe analysis route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze location vibe'
    });
  }
});

// Find similar vibes
router.post('/similar', async (req, res) => {
  try {
    const { hashtags, currentLocation, limit } = req.body;
    
    if (!hashtags || hashtags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hashtags are required to find similar locations'
      });
    }

    const result = await locationVibeService.findSimilarVibes(
      hashtags,
      currentLocation,
      limit || 5
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error finding similar vibes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find similar locations'
    });
  }
});

// Get vibe by coordinates (GET method for easy testing)
router.get('/analyze/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius } = req.query;
    
    const result = await locationVibeService.analyzeLocationVibe(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : 500
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in vibe analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze location'
    });
  }
});

module.exports = router;
