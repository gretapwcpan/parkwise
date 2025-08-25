import axios from 'axios';

/**
 * Search for available parking spots
 * @param {Object} args - Tool arguments
 * @param {Object} config - Server configuration
 * @returns {Object} MCP response
 */
export async function searchParkingTool(args, config) {
  const { BACKEND_URL, LLM_SERVICE_URL } = config;
  const { location, startTime, duration, maxPrice, features, radius } = args;

  try {
    // Step 1: Use the LLM service to parse the location into structured data
    let searchFilters = {};
    
    if (location) {
      // Create a natural language query for the LLM service
      const nlQuery = `Find parking at ${location}${maxPrice ? ` under $${maxPrice}/hour` : ''}${features && features.length > 0 ? ` with ${features.join(', ')}` : ''}`;
      
      try {
        const llmResponse = await axios.post(
          `${LLM_SERVICE_URL}/api/parse-search`,
          {
            query: nlQuery,
            user_location: null, // Could be enhanced with actual user location
          },
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (llmResponse.data && llmResponse.data.filters) {
          searchFilters = llmResponse.data.filters;
        }
      } catch (llmError) {
        console.error('LLM service error, falling back to basic search:', llmError.message);
        // Fallback to basic search parameters
        searchFilters = {
          location_query: location,
          max_price: maxPrice,
          features: features,
          radius: radius || 1000,
        };
      }
    }

    // Step 2: Add time constraints
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + duration);
    
    searchFilters.start_time = startTime;
    searchFilters.end_time = endTime.toISOString();

    // Step 3: Search for parking spots using the backend API
    const searchResponse = await axios.post(
      `${BACKEND_URL}/api/locations/search`,
      searchFilters,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const spots = searchResponse.data.locations || [];

    // Step 4: Format the response for the AI assistant
    if (spots.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No parking spots found near ${location} for the requested time period.`,
          },
        ],
      };
    }

    // Create a formatted response
    let responseText = `Found ${spots.length} parking spot${spots.length > 1 ? 's' : ''} near ${location}:\n\n`;

    spots.slice(0, 5).forEach((spot, index) => {
      responseText += `${index + 1}. **${spot.name}** (ID: ${spot.id})\n`;
      responseText += `   📍 ${spot.address}\n`;
      responseText += `   💰 $${spot.hourlyRate}/hour\n`;
      
      if (spot.features && spot.features.length > 0) {
        responseText += `   ✨ Features: ${spot.features.join(', ')}\n`;
      }
      
      if (spot.availability) {
        responseText += `   ✅ Available: ${spot.availability.available ? 'Yes' : 'No'}\n`;
      }
      
      if (spot.distance) {
        responseText += `   📏 Distance: ${(spot.distance / 1000).toFixed(1)} km\n`;
      }
      
      responseText += '\n';
    });

    if (spots.length > 5) {
      responseText += `... and ${spots.length - 5} more spots available.`;
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      // Include structured data for the AI to process
      metadata: {
        total_spots: spots.length,
        spots: spots.slice(0, 10), // Include up to 10 spots in metadata
      },
    };

  } catch (error) {
    console.error('Search parking error:', error);
    
    return {
      content: [
        {
          type: 'text',
          text: `Failed to search for parking: ${error.message}. Please try again or provide more specific location details.`,
        },
      ],
      isError: true,
    };
  }
}
