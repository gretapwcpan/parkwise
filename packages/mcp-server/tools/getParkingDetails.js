import axios from 'axios';

/**
 * Get detailed information about a specific parking spot
 * @param {Object} args - Tool arguments
 * @param {Object} config - Server configuration
 * @returns {Object} MCP response
 */
export async function getParkingDetailsTool(args, config) {
  const { BACKEND_URL } = config;
  const { spotId } = args;

  try {
    // Fetch parking spot details from backend
    const response = await axios.get(
      `${BACKEND_URL}/api/locations/${spotId}`,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const spot = response.data;

    // Format detailed response
    let responseText = `🅿️ **Parking Spot Details**\n\n`;
    
    // Basic Information
    responseText += `📋 **Basic Information:**\n`;
    responseText += `• Name: ${spot.name}\n`;
    responseText += `• ID: ${spot.id || spotId}\n`;
    responseText += `• Type: ${spot.type || 'Standard Parking'}\n`;
    
    if (spot.capacity) {
      responseText += `• Total Capacity: ${spot.capacity} spaces\n`;
    }
    
    if (spot.availableSpaces !== undefined) {
      responseText += `• Available Spaces: ${spot.availableSpaces}/${spot.capacity || 'N/A'}\n`;
    }
    
    responseText += '\n';

    // Location Information
    responseText += `📍 **Location:**\n`;
    responseText += `• Address: ${spot.address}\n`;
    
    if (spot.coordinates) {
      responseText += `• Coordinates: ${spot.coordinates.lat}, ${spot.coordinates.lng}\n`;
    }
    
    if (spot.floor || spot.level) {
      responseText += `• Level/Floor: ${spot.floor || spot.level}\n`;
    }
    
    if (spot.section) {
      responseText += `• Section: ${spot.section}\n`;
    }
    
    if (spot.nearbyLandmarks && spot.nearbyLandmarks.length > 0) {
      responseText += `• Nearby: ${spot.nearbyLandmarks.join(', ')}\n`;
    }
    
    responseText += '\n';

    // Pricing Information
    responseText += `💰 **Pricing:**\n`;
    
    if (spot.hourlyRate !== undefined) {
      responseText += `• Hourly Rate: $${spot.hourlyRate}/hour\n`;
    }
    
    if (spot.dailyRate !== undefined) {
      responseText += `• Daily Rate: $${spot.dailyRate}/day\n`;
    }
    
    if (spot.monthlyRate !== undefined) {
      responseText += `• Monthly Pass: $${spot.monthlyRate}/month\n`;
    }
    
    if (spot.minimumDuration) {
      responseText += `• Minimum Duration: ${spot.minimumDuration} hour${spot.minimumDuration > 1 ? 's' : ''}\n`;
    }
    
    if (spot.maximumDuration) {
      responseText += `• Maximum Duration: ${spot.maximumDuration} hour${spot.maximumDuration > 1 ? 's' : ''}\n`;
    }
    
    responseText += '\n';

    // Features and Amenities
    if (spot.features && spot.features.length > 0) {
      responseText += `✨ **Features & Amenities:**\n`;
      spot.features.forEach(feature => {
        const featureEmoji = getFeatureEmoji(feature);
        responseText += `• ${featureEmoji} ${feature}\n`;
      });
      responseText += '\n';
    }

    // Operating Hours
    if (spot.operatingHours) {
      responseText += `🕐 **Operating Hours:**\n`;
      
      if (spot.operatingHours === '24/7') {
        responseText += `• Open 24/7\n`;
      } else if (typeof spot.operatingHours === 'object') {
        Object.entries(spot.operatingHours).forEach(([day, hours]) => {
          responseText += `• ${day}: ${hours}\n`;
        });
      } else {
        responseText += `• ${spot.operatingHours}\n`;
      }
      
      responseText += '\n';
    }

    // Availability Status
    responseText += `✅ **Current Availability:**\n`;
    
    if (spot.isAvailable !== undefined) {
      responseText += `• Status: ${spot.isAvailable ? '🟢 Available' : '🔴 Full'}\n`;
    }
    
    if (spot.nextAvailable) {
      responseText += `• Next Available: ${new Date(spot.nextAvailable).toLocaleString()}\n`;
    }
    
    if (spot.peakHours) {
      responseText += `• Peak Hours: ${spot.peakHours}\n`;
    }
    
    responseText += '\n';

    // Access Information
    if (spot.accessInstructions || spot.entryCode || spot.accessType) {
      responseText += `🔑 **Access Information:**\n`;
      
      if (spot.accessType) {
        responseText += `• Access Type: ${spot.accessType}\n`;
      }
      
      if (spot.entryCode) {
        responseText += `• Entry Code: Will be provided upon booking\n`;
      }
      
      if (spot.accessInstructions) {
        responseText += `• Instructions: ${spot.accessInstructions}\n`;
      }
      
      responseText += '\n';
    }

    // Restrictions
    if (spot.restrictions && spot.restrictions.length > 0) {
      responseText += `⚠️ **Restrictions:**\n`;
      spot.restrictions.forEach(restriction => {
        responseText += `• ${restriction}\n`;
      });
      responseText += '\n';
    }

    // Contact Information
    if (spot.contactPhone || spot.contactEmail) {
      responseText += `📞 **Contact:**\n`;
      
      if (spot.contactPhone) {
        responseText += `• Phone: ${spot.contactPhone}\n`;
      }
      
      if (spot.contactEmail) {
        responseText += `• Email: ${spot.contactEmail}\n`;
      }
      
      responseText += '\n';
    }

    // Ratings and Reviews
    if (spot.rating !== undefined) {
      responseText += `⭐ **Ratings:**\n`;
      responseText += `• Average Rating: ${spot.rating}/5.0`;
      
      if (spot.totalReviews) {
        responseText += ` (${spot.totalReviews} reviews)`;
      }
      
      responseText += '\n';
      
      if (spot.recentReviews && spot.recentReviews.length > 0) {
        responseText += `• Recent Feedback:\n`;
        spot.recentReviews.slice(0, 2).forEach(review => {
          responseText += `  - "${review.comment}" - ${review.rating}⭐\n`;
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      metadata: {
        spotId: spotId,
        spotDetails: spot,
      },
    };

  } catch (error) {
    console.error('Get parking details error:', error);

    if (error.response && error.response.status === 404) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Parking spot not found. The spot ID "${spotId}" does not exist in our system.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `❌ Failed to retrieve parking spot details: ${error.message}. Please try again or verify the spot ID.`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Get emoji for feature type
 * @param {string} feature - Feature name
 * @returns {string} Emoji
 */
function getFeatureEmoji(feature) {
  const featureLower = feature.toLowerCase();
  
  if (featureLower.includes('ev') || featureLower.includes('electric')) return '🔌';
  if (featureLower.includes('covered') || featureLower.includes('garage')) return '🏢';
  if (featureLower.includes('handicap') || featureLower.includes('accessible')) return '♿';
  if (featureLower.includes('security') || featureLower.includes('guard')) return '👮';
  if (featureLower.includes('camera') || featureLower.includes('surveillance')) return '📹';
  if (featureLower.includes('light') || featureLower.includes('lit')) return '💡';
  if (featureLower.includes('valet')) return '🎩';
  if (featureLower.includes('wash')) return '🚿';
  if (featureLower.includes('motorcycle')) return '🏍️';
  if (featureLower.includes('bicycle') || featureLower.includes('bike')) return '🚲';
  if (featureLower.includes('restroom') || featureLower.includes('bathroom')) return '🚻';
  if (featureLower.includes('elevator')) return '🛗';
  
  return '✓';
}
