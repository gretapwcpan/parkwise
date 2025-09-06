const axios = require('axios');
const parkingSpotService = require('./parkingSpotService');
const geocodingService = require('./geocodingService');

class NLSearchService {
    constructor() {
        this.llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8001';
    }

    /**
     * Process natural language query through LLM and search parking
     */
    async processQuery(query, userLocation = null) {
        try {
            console.log('Processing NL query:', query);
            
            // Check for common non-parking queries first (before calling LLM)
            const lowerQuery = query.toLowerCase().trim();
            
            // System inquiry patterns
            if (lowerQuery.includes('who are you') || lowerQuery.includes('what are you')) {
                return {
                    success: true,
                    query: query,
                    source: 'keyword_fallback',
                    understanding: {
                        intent: { type: 'system_inquiry', confidence: 1.0 },
                        entities: {},
                        filters: {}
                    },
                    isSystemResponse: true,
                    results: [],
                    resultCount: 0,
                    message: this.getDefaultResponse('system_inquiry')
                };
            }
            
            // Greeting patterns
            if (lowerQuery === 'hello' || lowerQuery === 'hi' || lowerQuery === 'hey' || 
                lowerQuery.startsWith('good morning') || lowerQuery.startsWith('good afternoon')) {
                return {
                    success: true,
                    query: query,
                    source: 'keyword_fallback',
                    understanding: {
                        intent: { type: 'greeting', confidence: 1.0 },
                        entities: {},
                        filters: {}
                    },
                    isSystemResponse: true,
                    results: [],
                    resultCount: 0,
                    message: this.getDefaultResponse('greeting')
                };
            }
            
            // Location inquiry patterns
            if (lowerQuery.includes('where am i') || lowerQuery.includes('my location') || 
                lowerQuery.includes('current location') || lowerQuery.includes('what is my address') ||
                lowerQuery.includes('tell me where')) {
                // Get user's location and provide address
                let locationResponse = "I can see you're currently located ";
                
                if (userLocation && userLocation.lat && userLocation.lng) {
                    // Try to get address from coordinates
                    try {
                        const address = await geocodingService.reverseGeocode(userLocation.lat, userLocation.lng);
                        if (address) {
                            locationResponse += `at ${address}. `;
                        } else {
                            locationResponse += `at coordinates ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}. `;
                        }
                    } catch (error) {
                        locationResponse += `at coordinates ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}. `;
                    }
                    
                    locationResponse += "I can help you find parking spots nearby. Just ask!";
                } else {
                    locationResponse = "I don't have access to your current location. Please enable location services to get your address and find nearby parking.";
                }
                
                return {
                    success: true,
                    query: query,
                    source: 'keyword_fallback',
                    understanding: {
                        intent: { type: 'location_inquiry', confidence: 1.0 },
                        entities: {},
                        filters: {}
                    },
                    isSystemResponse: true,
                    results: [],
                    resultCount: 0,
                    message: locationResponse
                };
            }
            
            // Off-topic patterns
            if (lowerQuery.includes('weather') || lowerQuery.includes('joke') || 
                lowerQuery.includes('time') || lowerQuery.includes('news') || 
                lowerQuery.includes('sing')) {
                return {
                    success: true,
                    query: query,
                    source: 'keyword_fallback',
                    understanding: {
                        intent: { type: 'off_topic', confidence: 1.0 },
                        entities: {},
                        filters: {}
                    },
                    isSystemResponse: true,
                    results: [],
                    resultCount: 0,
                    message: this.getDefaultResponse('off_topic')
                };
            }
            
            // Step 1: Call LLM service to parse parking queries
            const llmResponse = await this.callLLMService(query);
            
            if (!llmResponse.success) {
                console.error('LLM processing failed:', llmResponse.error);
                // Fallback to basic keyword search
                return this.fallbackSearch(query, userLocation);
            }

            // Step 2: Extract structured data from LLM response
            const { intent, entities, filters, response } = llmResponse;
            console.log('LLM extracted:', { intent, entities, filters, response });

            // Step 3: Check if LLM detected a non-parking query (backup check)
            if (intent && intent.type !== 'parking_search') {
                console.log('Non-parking query detected by LLM:', intent.type);
                
                // Return the natural language response for non-parking queries
                return {
                    success: true,
                    query: query,
                    source: 'llm',
                    understanding: {
                        intent: intent,
                        entities: {},
                        filters: {}
                    },
                    isSystemResponse: true,
                    results: [],
                    resultCount: 0,
                    message: response || this.getDefaultResponse(intent.type)
                };
            }

            // Step 4: For parking queries, proceed as normal
            const searchParams = await this.buildSearchParams(entities, filters, userLocation);
            
            // Step 5: Search parking spots
            const spots = await this.searchParkingSpots(searchParams);
            
            // Step 6: Format response
            return {
                success: true,
                query: query,
                source: 'llm',
                understanding: {
                    intent: intent,
                    entities: entities,
                    filters: filters
                },
                searchParams: searchParams,
                results: spots,
                resultCount: spots.length,
                message: this.generateResponseMessage(spots, entities)
            };

        } catch (error) {
            console.error('NL search error:', error);
            return {
                success: false,
                error: error.message,
                results: [],
                message: "I had trouble understanding your request. Please try again."
            };
        }
    }

    /**
     * Call LLM service to parse natural language
     */
    async callLLMService(query) {
        try {
            const response = await axios.post(
                `${this.llmServiceUrl}/api/search`,
                { query },
                { 
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            return response.data;
        } catch (error) {
            console.error('LLM service call failed:', error.message);
            // Return a failed response but don't throw
            return {
                success: false,
                error: error.message,
                intent: {},
                entities: {},
                filters: {},
                response: null
            };
        }
    }

    /**
     * Build search parameters from LLM extracted data
     */
    async buildSearchParams(entities, filters, userLocation) {
        const params = {
            radius: filters.radius || 1000, // Default 1km radius
            limit: 20
        };

        // Handle location
        if (entities.location) {
            // Geocode the location mentioned in query
            try {
                const coords = await geocodingService.geocode(entities.location);
                if (coords) {
                    params.lat = coords.lat;
                    params.lng = coords.lng;
                }
            } catch (error) {
                console.error('Geocoding failed:', error);
            }
        } else if (userLocation) {
            // Use user's current location if no location mentioned
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
        }

        // Handle price filters
        if (filters.max_price !== null && filters.max_price !== undefined) {
            params.maxPrice = filters.max_price;
        }
        if (filters.min_price !== null && filters.min_price !== undefined) {
            params.minPrice = filters.min_price;
        }

        // Handle features
        if (filters.required_features && filters.required_features.length > 0) {
            params.features = filters.required_features;
        }

        // Handle duration from entities
        if (entities.duration) {
            params.duration = entities.duration;
        }

        return params;
    }

    /**
     * Search parking spots based on parameters
     */
    async searchParkingSpots(params) {
        try {
            // Use the existing parking spot service
            const spots = await parkingSpotService.getParkingSpotsInRadius(
                params.lat,
                params.lng,
                params.radius,
                {
                    maxPrice: params.maxPrice,
                    minPrice: params.minPrice,
                    features: params.features,
                    available: true  // Only show available spots
                },
                false  // Don't use OSM for now to speed up testing
            );
            
            // Limit results if specified
            if (params.limit && spots.length > params.limit) {
                return spots.slice(0, params.limit);
            }
            
            return spots;
        } catch (error) {
            console.error('Parking search failed:', error);
            return [];
        }
    }

    /**
     * Fallback search when LLM is not available
     */
    async fallbackSearch(query, userLocation) {
        console.log('Using fallback search for:', query);
        
        // Simple keyword-based search
        const keywords = query.toLowerCase().split(' ');
        const params = {
            radius: 1000,
            limit: 20
        };

        // Check for price keywords
        if (keywords.includes('cheap') || keywords.includes('budget')) {
            params.maxPrice = 10;
        } else if (keywords.includes('expensive') || keywords.includes('premium')) {
            params.minPrice = 20;
        }

        // Check for feature keywords
        const features = [];
        if (keywords.includes('ev') || keywords.includes('charging')) {
            features.push('ev_charging');
        }
        if (keywords.includes('covered') || keywords.includes('garage')) {
            features.push('covered');
        }
        if (keywords.includes('wheelchair') || keywords.includes('accessible')) {
            features.push('wheelchair_accessible');
        }
        if (features.length > 0) {
            params.features = features;
        }

        // Use user location if available
        if (userLocation) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
        }

        const spots = await this.searchParkingSpots(params);

        return {
            success: true,
            query: query,
            source: 'fallback_search',
            understanding: {
                intent: { type: 'find_parking', confidence: 0.5 },
                entities: {},
                filters: params
            },
            searchParams: params,
            results: spots,
            resultCount: spots.length,
            message: `Found ${spots.length} parking spots based on your search.`,
            fallback: true
        };
    }

    /**
     * Generate a natural response message
     */
    generateResponseMessage(spots, entities) {
        const count = spots.length;
        
        if (count === 0) {
            return "I couldn't find any parking spots matching your criteria. Try adjusting your search.";
        }

        let message = `Found ${count} parking spot${count !== 1 ? 's' : ''}`;
        
        if (entities.location) {
            message += ` near ${entities.location}`;
        }
        
        if (entities.price_range) {
            message += ` in your price range`;
        }
        
        if (entities.features && entities.features.length > 0) {
            message += ` with ${entities.features.join(', ')}`;
        }

        message += '.';
        
        if (count > 0 && spots[0].price) {
            message += ` The closest one is ${spots[0].name || 'a parking spot'} at $${spots[0].price}/hour.`;
        }

        return message;
    }

    /**
     * Get default response for different intent types
     */
    getDefaultResponse(intentType) {
        const responses = {
            'system_inquiry': "I'm your parking assistant! I help you find the best parking spots in your area. You can ask me things like 'Find parking near me', 'Show me cheap parking spots', or 'Find covered parking with EV charging'. How can I help you today?",
            'greeting': "Hello! I'm here to help you find parking. Just tell me what you're looking for - like 'Find parking near coffee shops' or 'Show me cheap parking spots nearby'.",
            'off_topic': "I'm specialized in helping you find parking spots. While I can't help with that particular request, I'd be happy to help you find parking! Try asking something like 'Find parking near me' or 'Show me covered parking spots'.",
            'default': "I'm your parking assistant. I can help you find parking spots based on location, price, and features. Try asking 'Find parking near me' or tell me what specific features you need!"
        };

        return responses[intentType] || responses['default'];
    }
}

module.exports = new NLSearchService();
