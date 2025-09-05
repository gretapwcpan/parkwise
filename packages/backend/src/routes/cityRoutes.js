const express = require('express');
const router = express.Router();
const { getAvailableCities, getCityData, getNearestCity } = require('../data/globalParkingData');

/**
 * Get all available cities
 */
router.get('/available', (req, res) => {
  try {
    const cities = getAvailableCities();
    res.json({
      success: true,
      cities
    });
  } catch (error) {
    console.error('Error getting available cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available cities'
    });
  }
});

/**
 * Get data for a specific city
 */
router.get('/:cityKey', (req, res) => {
  try {
    const { cityKey } = req.params;
    const cityData = getCityData(cityKey);
    
    if (!cityData) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }
    
    res.json({
      success: true,
      city: cityData
    });
  } catch (error) {
    console.error('Error getting city data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get city data'
    });
  }
});

/**
 * Get parking spots for a specific city
 */
router.get('/:cityKey/parking-spots', (req, res) => {
  try {
    const { cityKey } = req.params;
    const cityData = getCityData(cityKey);
    
    if (!cityData) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }
    
    res.json({
      success: true,
      city: cityData.city,
      country: cityData.country,
      currency: cityData.currency,
      locale: cityData.locale,
      center: cityData.center,
      parkingSpots: cityData.spots,
      totalSpots: cityData.spots.length
    });
  } catch (error) {
    console.error('Error getting city parking spots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get parking spots'
    });
  }
});

/**
 * Find nearest city based on coordinates
 */
router.post('/nearest', (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const nearestCityKey = getNearestCity(lat, lng);
    const cityData = getCityData(nearestCityKey);
    
    res.json({
      success: true,
      nearestCity: {
        key: nearestCityKey,
        ...cityData
      }
    });
  } catch (error) {
    console.error('Error finding nearest city:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearest city'
    });
  }
});

module.exports = router;
