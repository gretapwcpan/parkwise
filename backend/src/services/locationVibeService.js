const axios = require('axios');
const cacheService = require('./cacheService');
const geocodingService = require('./geocodingService');

// Overpass API for fetching POI data from OpenStreetMap
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const locationVibeService = {
  /**
   * Analyze a location's vibe based on nearby POIs and characteristics
   */
  async analyzeLocationVibe(lat, lng, radius = 500) {
    try {
      // Check cache first
      const cached = cacheService.getLocation(lat, lng, radius);
      if (cached) {
        console.log(`Cache hit for location ${lat}, ${lng}`);
        return cached;
      }
      
      console.log(`Cache miss for location ${lat}, ${lng} - fetching fresh data`);
      
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
      
      const result = {
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
      
      // Store in cache
      cacheService.setLocation(lat, lng, radius, result);
      
      return result;
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
    try {
      // Use cache to find similar locations
      const similarLocations = cacheService.findSimilarLocations(
        hashtags, 
        currentLocation, 
        limit
      );
      
      // If we have enough cached results, return them with real location names
      if (similarLocations.length >= Math.min(limit, 3)) {
        const enrichedLocations = await Promise.all(
          similarLocations.map(async (loc) => {
            // Generate the location name from the data
            const locationName = this.generateLocationName(loc.data || loc);
            // Get real district name from geocoding
            const districtName = await this.getDistrictFromLocation(loc);
            // Get area description
            const areaDesc = this.getAreaDescription(loc.data || loc);
            
            return {
              lat: loc.lat,
              lng: loc.lng,
              name: locationName,
              district: districtName,
              area: areaDesc,
              score: loc.score,
              summary: loc.summary,
              parkingDifficulty: loc.parkingDifficulty,
              matchingTags: loc.matchingTags,
              matchCount: loc.matchCount
            };
          })
        );
        
        return {
          success: true,
          similarLocations: enrichedLocations,
          fromCache: true,
          message: `Found ${similarLocations.length} similar locations`
        };
      }
      
      // If not enough cached results, get nearby locations and analyze them
      const nearbyLocations = cacheService.getNearbyLocations(
        currentLocation?.lat || 0,
        currentLocation?.lng || 0,
        5 // 5km radius
      );
      
      // Filter by matching hashtags
      const filtered = nearbyLocations.filter(loc => {
        const locHashtags = [
          ...(loc.data.vibe?.hashtags || []),
          ...(loc.data.parking?.hashtags || [])
        ];
        return hashtags.some(tag => locHashtags.includes(tag));
      });
      
      // Enrich filtered locations with real district names
      const enrichedFiltered = await Promise.all(
        filtered.slice(0, limit).map(async (loc) => ({
          lat: loc.lat,
          lng: loc.lng,
          name: this.generateLocationName(loc.data),
          district: await this.getDistrictFromLocation(loc),
          area: this.getAreaDescription(loc.data),
          distance: loc.distance,
          score: loc.data.vibe?.score || 0,
          summary: loc.data.vibe?.summary || '',
          parkingDifficulty: loc.data.parking?.difficulty || 0,
          hashtags: [
            ...(loc.data.vibe?.hashtags || []),
            ...(loc.data.parking?.hashtags || [])
          ]
        }))
      );
      
      return {
        success: true,
        similarLocations: enrichedFiltered,
        fromCache: true,
        message: `Found ${filtered.length} similar locations within 5km`
      };
    } catch (error) {
      console.error('Error finding similar vibes:', error);
      return {
        success: false,
        error: 'Failed to find similar locations',
        similarLocations: []
      };
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  },

  /**
   * Pre-populate cache with popular locations
   */
  async prePopulateCache(popularLocations) {
    const results = [];
    
    for (const location of popularLocations) {
      try {
        // Check if already cached
        const cached = cacheService.getLocation(location.lat, location.lng);
        if (!cached) {
          // Analyze and cache
          const analysis = await this.analyzeLocationVibe(
            location.lat,
            location.lng,
            location.radius || 500
          );
          results.push({
            location: `${location.lat},${location.lng}`,
            success: analysis.success
          });
        }
      } catch (error) {
        console.error(`Failed to pre-populate ${location.lat},${location.lng}:`, error);
      }
    }
    
    return results;
  },

  /**
   * Generate a location name based on its characteristics
   */
  generateLocationName(locData) {
    if (!locData) return 'Unknown Location';
    
    const primaryType = locData.vibe?.primaryType;
    const score = locData.vibe?.score || 0;
    const hashtags = locData.vibe?.hashtags || [];
    
    // More specific location names based on hashtags and type
    if (hashtags.includes('#FoodieParadise')) {
      return score >= 7 ? 'Gourmet Food District' : 'Local Food Hub';
    }
    if (hashtags.includes('#ShoppingDistrict')) {
      return score >= 7 ? 'Premium Shopping Center' : 'Shopping Plaza';
    }
    if (hashtags.includes('#CafeHopping')) {
      return 'Artisan Coffee District';
    }
    if (hashtags.includes('#NightlifeHub')) {
      return 'Entertainment Quarter';
    }
    if (hashtags.includes('#StudentArea')) {
      return 'University Campus Area';
    }
    if (hashtags.includes('#GreenSpaces')) {
      return 'Park & Recreation Zone';
    }
    if (hashtags.includes('#QuietArea')) {
      return 'Peaceful Residential Zone';
    }
    if (hashtags.includes('#BusyArea')) {
      return 'Central Business Hub';
    }
    
    // Fallback to generic names based on primary type
    const nameMap = {
      restaurants: 'Dining District',
      cafes: 'Coffee Quarter',
      shops: 'Retail Center',
      entertainment: 'Entertainment Zone',
      parks: 'Green District',
      education: 'Academic Quarter',
      residential: 'Residential Community',
      mixed: 'Mixed-Use Development'
    };
    
    const baseName = nameMap[primaryType] || 'Urban District';
    
    // Add qualifier based on score
    if (score >= 8) {
      return `Premium ${baseName}`;
    } else if (score >= 6) {
      return baseName;
    } else {
      return `Emerging ${baseName}`;
    }
  },

  /**
   * Get real district/neighborhood name from location using geocoding
   */
  async getDistrictFromLocation(loc) {
    try {
      const lat = loc.lat || 0;
      const lng = loc.lng || 0;
      
      // Use the geocoding service to get real address information
      const addressInfo = await geocodingService.getAddressFromCoordinates(lat, lng);
      
      // Return neighborhood, city, or a combination
      if (addressInfo.neighborhood) {
        return addressInfo.neighborhood;
      } else if (addressInfo.city) {
        return addressInfo.city;
      } else {
        // Fallback to coordinates if no address found
        return `Area near ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
      }
    } catch (error) {
      console.error('Error getting district name:', error);
      // Fallback to simple geographic description
      return 'Local Area';
    }
  },

  /**
   * Get area description based on location data
   */
  getAreaDescription(locData) {
    if (!locData) return 'Urban area';
    
    const vibe = locData.vibe;
    const parking = locData.parking;
    
    if (!vibe) return 'Urban area';
    
    // Build description based on characteristics
    const descriptions = [];
    
    if (vibe.characteristics?.pace === 'Fast-paced') {
      descriptions.push('Bustling');
    } else {
      descriptions.push('Quiet');
    }
    
    if (parking?.level === 'Easy') {
      descriptions.push('accessible');
    } else if (parking?.level === 'Very Difficult') {
      descriptions.push('congested');
    }
    
    if (vibe.primaryType) {
      descriptions.push(vibe.primaryType);
    }
    
    descriptions.push('area');
    
    return descriptions.join(' ');
  }
};

module.exports = locationVibeService;
