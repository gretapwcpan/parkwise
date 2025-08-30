const express = require('express');
const router = express.Router();
const locationVibeService = require('../services/locationVibeService');
const cacheService = require('../services/cacheService');

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

// Get locations by hashtag
router.get('/hashtag/:hashtag', async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { limit } = req.query;
    
    // Ensure hashtag starts with #
    const formattedHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    const locations = cacheService.findLocationsByHashtag(
      formattedHashtag,
      limit ? parseInt(limit) : 10
    );
    
    res.json({
      success: true,
      hashtag: formattedHashtag,
      locations,
      count: locations.length
    });
  } catch (error) {
    console.error('Error finding locations by hashtag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find locations by hashtag'
    });
  }
});

// Get cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = locationVibeService.getCacheStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

// Clear cache (admin endpoint)
router.delete('/cache/clear', async (req, res) => {
  try {
    cacheService.clearAll();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Pre-populate cache with popular locations
router.post('/cache/prepopulate', async (req, res) => {
  try {
    const { locations } = req.body;
    
    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({
        success: false,
        error: 'Locations array is required'
      });
    }
    
    // Run pre-population in background
    locationVibeService.prePopulateCache(locations).then(results => {
      console.log('Pre-population completed:', results);
    });
    
    res.json({
      success: true,
      message: `Started pre-populating cache with ${locations.length} locations`
    });
  } catch (error) {
    console.error('Error pre-populating cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start cache pre-population'
    });
  }
});

module.exports = router;
