const axios = require('axios');

// Overpass API for fetching POI data from OpenStreetMap
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const locationVibeService = {
  /**
   * Analyze a location's vibe based on nearby POIs and characteristics
   */
  async analyzeLocationVibe(lat, lng, radius = 500) {
    try {
      // 1. Fetch nearby POIs from OpenStreetMap
      const pois = await this.fetchNearbyPOIs(lat, lng, radius);
      
      // 2. Analyze street and parking data
      const streetData = await this.analyzeStreetData(lat, lng, radius);
      
      // 3. Get public transport accessibility
      const transitData = await this.getTransitAccess(lat, lng, radius);
      
      // 4. Categorize and analyze the data
      const analysis = this.categorizeLocation(pois, streetData, transitData);
      
      // 5. Generate vibe description and hashtags
      const vibeData = await this.generateVibeAnalysis(analysis);
      
      // 6. Calculate parking difficulty
      const parkingAnalysis = this.analyzeParkingDifficulty(streetData, pois);
      
      // 7. Generate transportation recommendations
      const transportRecommendations = this.generateTransportRecommendations(
        parkingAnalysis,
        transitData
      );
      
      return {
        success: true,
        location: {
          lat,
          lng,
          radius
        },
        vibe: vibeData,
        parking: parkingAnalysis,
        transport: transportRecommendations,
        rawData: {
          poisCount: pois.length,
          categories: analysis.categories
        }
      };
    } catch (error) {
      console.error('Error analyzing location vibe:', error);
      return {
        success: false,
        error: 'Failed to analyze location vibe'
      };
    }
  },

  /**
   * Fetch nearby POIs from OpenStreetMap using Overpass API
   */
  async fetchNearbyPOIs(lat, lng, radius) {
    try {
      // Overpass QL query to get various POIs
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"](around:${radius},${lat},${lng});
          node["shop"](around:${radius},${lat},${lng});
          node["leisure"](around:${radius},${lat},${lng});
          node["tourism"](around:${radius},${lat},${lng});
          node["office"](around:${radius},${lat},${lng});
          way["building"](around:${radius},${lat},${lng});
          node["public_transport"](around:${radius},${lat},${lng});
        );
        out body;
      `;

      const response = await axios.post(OVERPASS_API_URL, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      return response.data.elements || [];
    } catch (error) {
      console.error('Error fetching POIs:', error);
      return [];
    }
  },

  /**
   * Analyze street characteristics for parking difficulty
   */
  async analyzeStreetData(lat, lng, radius) {
    try {
      const query = `
        [out:json][timeout:25];
        (
          way["highway"](around:${radius},${lat},${lng});
          way["parking:lane"](around:${radius},${lat},${lng});
          way["width"](around:${radius},${lat},${lng});
        );
        out body;
      `;

      const response = await axios.post(OVERPASS_API_URL, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      const streets = response.data.elements || [];
      
      // Analyze street characteristics
      let narrowStreets = 0;
      let hasParking = 0;
      let totalStreets = streets.length;

      streets.forEach(street => {
        if (street.tags) {
          // Check for narrow streets (width < 6 meters)
          if (street.tags.width && parseFloat(street.tags.width) < 6) {
            narrowStreets++;
          }
          // Check for parking lanes
          if (street.tags['parking:lane:left'] || street.tags['parking:lane:right']) {
            hasParking++;
          }
        }
      });

      return {
        totalStreets,
        narrowStreets,
        hasParking,
        narrowStreetRatio: totalStreets > 0 ? narrowStreets / totalStreets : 0,
        parkingAvailability: totalStreets > 0 ? hasParking / totalStreets : 0
      };
    } catch (error) {
      console.error('Error analyzing street data:', error);
      return {
        totalStreets: 0,
        narrowStreets: 0,
        hasParking: 0,
        narrowStreetRatio: 0,
        parkingAvailability: 0
      };
    }
  },

  /**
   * Get public transport accessibility
   */
  async getTransitAccess(lat, lng, radius) {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["railway"="station"](around:${radius},${lat},${lng});
          node["railway"="subway_entrance"](around:${radius},${lat},${lng});
          node["highway"="bus_stop"](around:${radius},${lat},${lng});
          node["amenity"="bus_station"](around:${radius},${lat},${lng});
        );
        out body;
      `;

      const response = await axios.post(OVERPASS_API_URL, query, {
        headers: { 'Content-Type': 'text/plain' }
      });

      const transitStops = response.data.elements || [];
      
      return {
        totalStops: transitStops.length,
        hasMetro: transitStops.some(stop => 
          stop.tags?.railway === 'station' || 
          stop.tags?.railway === 'subway_entrance'
        ),
        hasBus: transitStops.some(stop => 
          stop.tags?.highway === 'bus_stop' || 
          stop.tags?.amenity === 'bus_station'
        ),
        nearestMetroDistance: this.calculateNearestDistance(lat, lng, 
          transitStops.filter(s => s.tags?.railway))
      };
    } catch (error) {
      console.error('Error getting transit access:', error);
      return {
        totalStops: 0,
        hasMetro: false,
        hasBus: false,
        nearestMetroDistance: Infinity
      };
    }
  },

  /**
   * Categorize location based on POIs
   */
  categorizeLocation(pois, streetData, transitData) {
    const categories = {
      restaurants: 0,
      cafes: 0,
      shops: 0,
      entertainment: 0,
      services: 0,
      parks: 0,
      education: 0,
      residential: 0
    };

    pois.forEach(poi => {
      if (!poi.tags) return;
      
      // Categorize amenities
      if (poi.tags.amenity) {
        if (['restaurant', 'fast_food'].includes(poi.tags.amenity)) {
          categories.restaurants++;
        } else if (['cafe', 'bar', 'pub'].includes(poi.tags.amenity)) {
          categories.cafes++;
        } else if (['bank', 'pharmacy', 'clinic', 'hospital'].includes(poi.tags.amenity)) {
          categories.services++;
        } else if (['school', 'university', 'college'].includes(poi.tags.amenity)) {
          categories.education++;
        }
      }
      
      // Categorize shops
      if (poi.tags.shop) {
        categories.shops++;
      }
      
      // Categorize leisure
      if (poi.tags.leisure) {
        if (['park', 'garden', 'playground'].includes(poi.tags.leisure)) {
          categories.parks++;
        } else {
          categories.entertainment++;
        }
      }
      
      // Count residential buildings
      if (poi.tags.building === 'residential' || poi.tags.building === 'apartments') {
        categories.residential++;
      }
    });

    return {
      categories,
      totalPOIs: pois.length,
      density: pois.length > 100 ? 'high' : pois.length > 50 ? 'medium' : 'low',
      primaryType: this.determinePrimaryType(categories)
    };
  },

  /**
   * Generate vibe analysis with hashtags
   */
  async generateVibeAnalysis(analysis) {
    const { categories, density, primaryType } = analysis;
    
    // Generate hashtags based on location characteristics
    const hashtags = [];
    const vibeDescriptions = [];
    
    // Density-based tags
    if (density === 'high') {
      hashtags.push('#BusyArea', '#UrbanHub');
      vibeDescriptions.push('bustling urban area');
    } else if (density === 'low') {
      hashtags.push('#QuietArea', '#Peaceful');
      vibeDescriptions.push('quiet neighborhood');
    }
    
    // Category-based tags
    if (categories.restaurants > 10) {
      hashtags.push('#FoodieParadise', '#DiningHub');
      vibeDescriptions.push('food lover\'s destination');
    }
    if (categories.cafes > 5) {
      hashtags.push('#CafeHopping', '#CoffeeLovers');
      vibeDescriptions.push('great cafe scene');
    }
    if (categories.shops > 15) {
      hashtags.push('#ShoppingDistrict', '#RetailTherapy');
      vibeDescriptions.push('shopping paradise');
    }
    if (categories.parks > 2) {
      hashtags.push('#GreenSpaces', '#NatureFriendly');
      vibeDescriptions.push('plenty of green spaces');
    }
    if (categories.education > 3) {
      hashtags.push('#StudentArea', '#UniversityDistrict');
      vibeDescriptions.push('student-friendly area');
    }
    if (categories.entertainment > 5) {
      hashtags.push('#NightlifeHub', '#Entertainment');
      vibeDescriptions.push('vibrant nightlife');
    }
    
    // Time-based tags (simplified for now)
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      hashtags.push('#LateNight');
    } else if (hour >= 6 && hour < 12) {
      hashtags.push('#MorningVibes');
    } else if (hour >= 17 && hour < 22) {
      hashtags.push('#EveningBuzz');
    }
    
    // Generate vibe score (1-10)
    const vibeScore = Math.min(10, 
      5 + 
      (categories.restaurants > 5 ? 1 : 0) +
      (categories.cafes > 3 ? 1 : 0) +
      (categories.shops > 10 ? 1 : 0) +
      (categories.entertainment > 3 ? 1 : 0) +
      (categories.parks > 1 ? 1 : 0)
    );
    
    // Create summary
    const summary = `This ${vibeDescriptions[0] || 'area'} features ${
      vibeDescriptions.slice(1).join(', ') || 'various amenities'
    }. ${this.getVibeRecommendation(primaryType)}`;
    
    return {
      summary,
      score: vibeScore,
      hashtags: hashtags.slice(0, 8), // Limit to 8 hashtags
      primaryType,
      characteristics: {
        pace: density === 'high' ? 'Fast-paced' : 'Relaxed',
        bestFor: this.getBestFor(categories),
        atmosphere: this.getAtmosphere(categories, density)
      }
    };
  },

  /**
   * Analyze parking difficulty
   */
  analyzeParkingDifficulty(streetData, pois) {
    let difficulty = 5; // Base difficulty
    
    // Increase difficulty for narrow streets
    difficulty += streetData.narrowStreetRatio * 3;
    
    // Decrease if parking lanes available
    difficulty -= streetData.parkingAvailability * 2;
    
    // Increase based on density
    if (pois.length > 100) difficulty += 2;
    if (pois.length > 200) difficulty += 1;
    
    // Cap between 1 and 10
    difficulty = Math.max(1, Math.min(10, difficulty));
    
    const reasons = [];
    if (streetData.narrowStreetRatio > 0.5) {
      reasons.push('Narrow streets make parking challenging');
    }
    if (streetData.parkingAvailability < 0.3) {
      reasons.push('Limited street parking available');
    }
    if (pois.length > 100) {
      reasons.push('High density area with competition for spots');
    }
    
    const tips = [];
    if (difficulty > 7) {
      tips.push('Consider using public transport');
      tips.push('Look for nearby parking garages');
      tips.push('Avoid peak hours if possible');
    } else if (difficulty > 4) {
      tips.push('Arrive early for better spot availability');
      tips.push('Check side streets for parking');
    } else {
      tips.push('Parking is generally available');
      tips.push('Street parking should be easy to find');
    }
    
    return {
      difficulty: Math.round(difficulty * 10) / 10,
      level: difficulty > 7 ? 'Very Difficult' : 
             difficulty > 5 ? 'Challenging' : 
             difficulty > 3 ? 'Moderate' : 'Easy',
      reasons,
      tips,
      hashtags: this.getParkingHashtags(difficulty)
    };
  },

  /**
   * Generate transportation recommendations
   */
  generateTransportRecommendations(parkingAnalysis, transitData) {
    const recommendations = [];
    
    // Primary recommendation based on parking difficulty and transit
    if (parkingAnalysis.difficulty > 7 && transitData.hasMetro) {
      recommendations.push({
        method: 'MRT/Metro',
        reason: 'Parking is very difficult and metro access is excellent',
        confidence: 0.9
      });
    } else if (parkingAnalysis.difficulty > 5 && transitData.hasBus) {
      recommendations.push({
        method: 'Public Bus',
        reason: 'Limited parking but good bus connections available',
        confidence: 0.7
      });
    } else if (parkingAnalysis.difficulty <= 5) {
      recommendations.push({
        method: 'Drive',
        reason: 'Parking is manageable in this area',
        confidence: 0.8
      });
    }
    
    // Alternative recommendations
    if (transitData.hasMetro && transitData.nearestMetroDistance < 500) {
      recommendations.push({
        method: 'Park & Ride',
        reason: `Park at metro station (${Math.round(transitData.nearestMetroDistance)}m away) and take train`,
        confidence: 0.6
      });
    }
    
    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      recommendations.push({
        method: 'Taxi/Ride-share',
        reason: 'Late night - limited public transport options',
        confidence: 0.5
      });
    }
    
    return recommendations;
  },

  /**
   * Helper: Calculate nearest distance to a location
   */
  calculateNearestDistance(lat, lng, points) {
    if (!points || points.length === 0) return Infinity;
    
    let minDistance = Infinity;
    points.forEach(point => {
      if (point.lat && point.lon) {
        const distance = this.getDistance(lat, lng, point.lat, point.lon);
        minDistance = Math.min(minDistance, distance);
      }
    });
    
    return minDistance;
  },

  /**
   * Helper: Calculate distance between two points
   */
  getDistance(lat1, lon1, lat2, lon2) {
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

  /**
   * Helper: Determine primary type of location
   */
  determinePrimaryType(categories) {
    const types = Object.entries(categories)
      .filter(([key, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
    
    return types.length > 0 ? types[0][0] : 'mixed';
  },

  /**
   * Helper: Get vibe recommendation based on type
   */
  getVibeRecommendation(primaryType) {
    const recommendations = {
      restaurants: 'Perfect for food enthusiasts and dining experiences.',
      cafes: 'Great for coffee lovers and casual meetings.',
      shops: 'Ideal for shopping and retail therapy.',
      entertainment: 'Excellent for nightlife and entertainment seekers.',
      parks: 'Perfect for outdoor activities and relaxation.',
      education: 'Student-friendly with academic atmosphere.',
      residential: 'Quiet residential area with local charm.',
      mixed: 'Diverse area with various activities.'
    };
    
    return recommendations[primaryType] || recommendations.mixed;
  },

  /**
   * Helper: Determine best suited for
   */
  getBestFor(categories) {
    const suited = [];
    
    if (categories.education > 3) suited.push('Students');
    if (categories.restaurants > 10) suited.push('Food lovers');
    if (categories.shops > 15) suited.push('Shoppers');
    if (categories.parks > 2) suited.push('Families');
    if (categories.entertainment > 5) suited.push('Night owls');
    if (categories.cafes > 5) suited.push('Remote workers');
    
    return suited.length > 0 ? suited.join(', ') : 'Everyone';
  },

  /**
   * Helper: Get atmosphere description
   */
  getAtmosphere(categories, density) {
    if (density === 'high' && categories.entertainment > 5) {
      return 'Vibrant and energetic';
    } else if (density === 'low' && categories.parks > 2) {
      return 'Peaceful and green';
    } else if (categories.shops > 15) {
      return 'Commercial and busy';
    } else if (categories.residential > 10) {
      return 'Residential and quiet';
    } else {
      return 'Balanced and diverse';
    }
  },

  /**
   * Helper: Get parking-related hashtags
   */
  getParkingHashtags(difficulty) {
    if (difficulty >= 8) {
      return ['#ParkingNightmare', '#TakePublicTransport'];
    } else if (difficulty >= 6) {
      return ['#ChallengingParking', '#PlanAhead'];
    } else if (difficulty >= 4) {
      return ['#ModerateParking'];
    } else {
      return ['#EasyParking', '#PlentyOfSpots'];
    }
  },

  /**
   * Find similar locations based on hashtags
   */
  async findSimilarVibes(hashtags, currentLocation, limit = 5) {
    // This would typically query a database of previously analyzed locations
    // For now, returning a placeholder structure
    return {
      success: true,
      similarLocations: [],
      message: 'Similar location search will be implemented with database integration'
    };
  }
};

module.exports = locationVibeService;
