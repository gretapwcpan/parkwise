import axios from 'axios';

/**
 * Get user's favorite parking spots
 * @param {Object} config - Server configuration
 * @returns {Object} MCP resource response
 */
export async function getFavoriteSpots(config) {
  const { BACKEND_URL } = config;
  
  try {
    // Note: In a real implementation, userId would come from authentication
    const userId = 'mcp-user-default';
    
    // Fetch favorite spots from backend
    const response = await axios.get(
      `${BACKEND_URL}/api/users/${userId}/favorites`,
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const favorites = response.data.favorites || [];

    // Format favorite spots data
    const formattedFavorites = {
      userId: userId,
      totalFavorites: favorites.length,
      favorites: favorites.map(spot => ({
        spotId: spot.id || spot.spotId,
        spotName: spot.name || spot.spotName,
        nickname: spot.nickname,
        address: spot.address,
        coordinates: spot.coordinates || {
          lat: spot.latitude,
          lng: spot.longitude,
        },
        type: spot.type || 'standard',
        pricing: {
          hourlyRate: spot.hourlyRate,
          dailyRate: spot.dailyRate,
          monthlyRate: spot.monthlyRate,
        },
        features: spot.features || [],
        ratings: {
          overall: spot.rating || spot.overallRating,
          userRating: spot.userRating,
          totalReviews: spot.totalReviews,
        },
        usage: {
          timesBooked: spot.timesBooked || 0,
          lastBooked: spot.lastBooked,
          totalSpent: spot.totalSpent || 0,
          averageDuration: spot.averageDuration || 0,
        },
        preferences: {
          preferredSpot: spot.preferredSpot,
          preferredLevel: spot.preferredLevel,
          notes: spot.notes,
        },
        availability: {
          currentStatus: spot.isAvailable ? 'available' : 'occupied',
          typicalAvailability: spot.typicalAvailability || {},
        },
        addedAt: spot.addedAt || spot.createdAt,
        tags: spot.tags || [],
      })),
      categories: categorizeFavorites(favorites),
      recommendations: generateRecommendations(favorites),
      lastUpdated: new Date().toISOString(),
    };

    return {
      contents: [
        {
          uri: 'parking://user/favorite-spots',
          mimeType: 'application/json',
          text: JSON.stringify(formattedFavorites, null, 2),
        },
      ],
    };

  } catch (error) {
    console.error('Get favorite spots error:', error);

    // Return sample favorites if backend call fails
    const sampleFavorites = {
      userId: 'mcp-user-default',
      totalFavorites: 3,
      favorites: [
        {
          spotId: 'fav-001',
          spotName: 'Office Building Garage',
          nickname: 'Work Parking',
          address: '100 Business Park Dr, Downtown',
          coordinates: { lat: 25.0330, lng: 121.5654 },
          type: 'garage',
          pricing: {
            hourlyRate: 5,
            dailyRate: 30,
            monthlyRate: 150,
          },
          features: ['covered', 'security', 'elevator access', 'EV charging'],
          ratings: {
            overall: 4.5,
            userRating: 5,
            totalReviews: 234,
          },
          usage: {
            timesBooked: 45,
            lastBooked: new Date(Date.now() - 86400000).toISOString(),
            totalSpent: 675,
            averageDuration: 8.5,
          },
          preferences: {
            preferredSpot: 'B2-15',
            preferredLevel: 'B2',
            notes: 'Close to elevator, easy exit to main road',
          },
          availability: {
            currentStatus: 'available',
            typicalAvailability: {
              weekday: 'Usually available after 6pm',
              weekend: 'Generally available',
            },
          },
          addedAt: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
          tags: ['work', 'daily', 'covered'],
        },
        {
          spotId: 'fav-002',
          spotName: 'Shopping Mall Parking',
          nickname: 'Weekend Shopping',
          address: '500 Retail Ave',
          coordinates: { lat: 25.0478, lng: 121.5318 },
          type: 'lot',
          pricing: {
            hourlyRate: 3,
            dailyRate: 20,
            monthlyRate: null,
          },
          features: ['covered', 'handicap accessible', 'family spots'],
          ratings: {
            overall: 4.2,
            userRating: 4,
            totalReviews: 567,
          },
          usage: {
            timesBooked: 12,
            lastBooked: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
            totalSpent: 108,
            averageDuration: 3,
          },
          preferences: {
            preferredSpot: null,
            preferredLevel: 'Level 2',
            notes: 'Near mall entrance C',
          },
          availability: {
            currentStatus: 'occupied',
            typicalAvailability: {
              weekday: 'Usually available',
              weekend: 'Busy 11am-4pm',
            },
          },
          addedAt: new Date(Date.now() - 7776000000).toISOString(), // 3 months ago
          tags: ['shopping', 'weekend', 'family'],
        },
        {
          spotId: 'fav-003',
          spotName: 'Gym Parking Lot',
          nickname: 'Fitness Center',
          address: '789 Health Blvd',
          coordinates: { lat: 25.0234, lng: 121.5432 },
          type: 'surface',
          pricing: {
            hourlyRate: 2,
            dailyRate: 10,
            monthlyRate: 50,
          },
          features: ['well-lit', '24/7 access', 'security cameras'],
          ratings: {
            overall: 4.0,
            userRating: 4,
            totalReviews: 123,
          },
          usage: {
            timesBooked: 28,
            lastBooked: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            totalSpent: 84,
            averageDuration: 1.5,
          },
          preferences: {
            preferredSpot: 'Near entrance',
            preferredLevel: null,
            notes: 'Free first 30 minutes with gym membership',
          },
          availability: {
            currentStatus: 'available',
            typicalAvailability: {
              weekday: 'Busy 6-8am and 5-7pm',
              weekend: 'Usually available',
            },
          },
          addedAt: new Date(Date.now() - 15552000000).toISOString(), // 6 months ago
          tags: ['gym', 'fitness', 'regular'],
        },
      ],
      categories: {
        byUsageFrequency: [
          { category: 'Daily', spotIds: ['fav-001'] },
          { category: 'Weekly', spotIds: ['fav-003'] },
          { category: 'Occasional', spotIds: ['fav-002'] },
        ],
        byType: [
          { type: 'garage', spotIds: ['fav-001'] },
          { type: 'lot', spotIds: ['fav-002'] },
          { type: 'surface', spotIds: ['fav-003'] },
        ],
        byPurpose: [
          { purpose: 'work', spotIds: ['fav-001'] },
          { purpose: 'shopping', spotIds: ['fav-002'] },
          { purpose: 'fitness', spotIds: ['fav-003'] },
        ],
      },
      recommendations: [
        {
          spotId: 'rec-001',
          reason: 'Similar to your favorite work parking',
          matchScore: 0.85,
        },
        {
          spotId: 'rec-002',
          reason: 'Near your gym with better rates',
          matchScore: 0.78,
        },
      ],
      lastUpdated: new Date().toISOString(),
      error: 'Using sample favorites - backend unavailable',
    };

    return {
      contents: [
        {
          uri: 'parking://user/favorite-spots',
          mimeType: 'application/json',
          text: JSON.stringify(sampleFavorites, null, 2),
        },
      ],
    };
  }
}

/**
 * Categorize favorite spots
 * @param {Array} favorites - Array of favorite spots
 * @returns {Object} Categorized spots
 */
function categorizeFavorites(favorites) {
  const categories = {
    byUsageFrequency: [],
    byType: {},
    byPurpose: {},
  };

  // Categorize by usage frequency
  const frequencyGroups = {
    Daily: [],
    Weekly: [],
    Monthly: [],
    Occasional: [],
  };

  favorites.forEach(spot => {
    const timesBooked = spot.timesBooked || 0;
    const spotId = spot.id || spot.spotId;
    
    if (timesBooked > 40) {
      frequencyGroups.Daily.push(spotId);
    } else if (timesBooked > 20) {
      frequencyGroups.Weekly.push(spotId);
    } else if (timesBooked > 5) {
      frequencyGroups.Monthly.push(spotId);
    } else {
      frequencyGroups.Occasional.push(spotId);
    }

    // Categorize by type
    const type = spot.type || 'standard';
    if (!categories.byType[type]) {
      categories.byType[type] = [];
    }
    categories.byType[type].push(spotId);
  });

  // Convert frequency groups to array format
  Object.entries(frequencyGroups).forEach(([category, spotIds]) => {
    if (spotIds.length > 0) {
      categories.byUsageFrequency.push({ category, spotIds });
    }
  });

  // Convert type groups to array format
  categories.byType = Object.entries(categories.byType).map(([type, spotIds]) => ({
    type,
    spotIds,
  }));

  return categories;
}

/**
 * Generate recommendations based on favorites
 * @param {Array} favorites - Array of favorite spots
 * @returns {Array} Recommendations
 */
function generateRecommendations(favorites) {
  // This is a simplified recommendation system
  // In a real implementation, this would use ML or more sophisticated algorithms
  
  const recommendations = [];
  
  // Find common features in favorites
  const featureCounts = {};
  favorites.forEach(spot => {
    (spot.features || []).forEach(feature => {
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });
  });

  // Sort features by frequency
  const topFeatures = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([feature]) => feature);

  // Generate mock recommendations based on top features
  if (topFeatures.length > 0) {
    recommendations.push({
      spotId: 'rec-001',
      reason: `Has your preferred features: ${topFeatures.join(', ')}`,
      matchScore: 0.85,
    });
  }

  // Add location-based recommendation
  if (favorites.length > 0) {
    recommendations.push({
      spotId: 'rec-002',
      reason: 'Near your frequently visited areas',
      matchScore: 0.78,
    });
  }

  return recommendations.slice(0, 5);
}
