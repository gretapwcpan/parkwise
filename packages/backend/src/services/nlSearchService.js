const axios = require('axios');

// Configuration for the Python LLM service
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8001';

const nlSearchService = {
  /**
   * Parse a natural language search query
   * @param {string} query - The natural language query
   * @param {Object} userLocation - User's current location {lat, lng}
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object>} Parsed search filters
   */
  async parseSearchQuery(query, userLocation = null, language = 'en') {
    try {
      const response = await axios.post(`${LLM_SERVICE_URL}/api/parse-search`, {
        query,
        user_location: userLocation,
        language
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error calling LLM service:', error.message);
      
      // Return a fallback response
      return {
        success: false,
        original_query: query,
        intent: { intent_type: 'unknown', confidence: 0 },
        entities: {},
        filters: {},
        explanation: '',
        error: error.message || 'Failed to parse search query'
      };
    }
  },

  /**
   * Check if the LLM service is healthy
   * @returns {Promise<boolean>} True if service is healthy
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${LLM_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('LLM service health check failed:', error.message);
      return false;
    }
  },

  /**
   * Get example queries from the LLM service
   * @returns {Promise<Array>} Array of example queries
   */
  async getExamples() {
    try {
      const response = await axios.get(`${LLM_SERVICE_URL}/api/examples`, {
        timeout: 5000
      });
      return response.data.examples || [];
    } catch (error) {
      console.error('Failed to get examples:', error.message);
      return [];
    }
  },

  /**
   * Convert LLM filters to location service parameters
   * @param {Object} filters - Filters from LLM service
   * @returns {Object} Parameters for location service
   */
  formatFiltersForSearch(filters) {
    const searchParams = {};

    // Location parameters
    if (filters.lat && filters.lng) {
      searchParams.lat = filters.lat;
      searchParams.lng = filters.lng;
    }

    // Radius
    if (filters.radius) {
      searchParams.radius = filters.radius;
    }

    // Price filters
    if (filters.max_price !== undefined) {
      searchParams.maxPrice = filters.max_price;
    }
    if (filters.min_price !== undefined) {
      searchParams.minPrice = filters.min_price;
    }

    // Features
    if (filters.features && filters.features.length > 0) {
      searchParams.features = filters.features;
    }

    // Availability
    if (filters.available !== undefined) {
      searchParams.available = filters.available;
    }

    // Time constraints
    if (filters.start_time) {
      searchParams.startTime = filters.start_time;
    }
    if (filters.end_time) {
      searchParams.endTime = filters.end_time;
    }

    return searchParams;
  }
};

module.exports = nlSearchService;
