const axios = require('axios');

// Mapbox API configuration
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'pk.test_token';
const MAPBOX_BASE_URL = 'https://api.mapbox.com';

// Mock data for testing when API key is not available
const MOCK_LOCATIONS = {
  '25.0330,121.5654': {
    address: 'No. 7, Section 5, Xinyi Road, Xinyi District',
    street: 'Xinyi Road',
    neighborhood: 'Xinyi District',
    city: 'Taipei City',
    country: 'Taiwan'
  },
  'default': {
    address: '123 Main Street, Downtown',
    street: 'Main Street',
    neighborhood: 'Downtown',
    city: 'Sample City',
    country: 'Sample Country'
  }
};

const MOCK_PLACES = {
  restaurant: [
    { name: 'Din Tai Fung', distance: 150 },
    { name: 'Taipei 101 Food Court', distance: 200 },
    { name: 'Shin Yeh Restaurant', distance: 350 },
    { name: 'RAW', distance: 450 },
    { name: 'Mitsui Cuisine', distance: 500 }
  ],
  cafe: [
    { name: 'Starbucks Xinyi', distance: 100 },
    { name: 'Louisa Coffee', distance: 250 },
    { name: 'Cama Café', distance: 300 },
    { name: '85°C Bakery Cafe', distance: 400 },
    { name: 'Dante Coffee', distance: 480 }
  ],
  fuel: [
    { name: 'CPC Gas Station', distance: 800 },
    { name: 'Formosa Petrochemical', distance: 1200 },
    { name: 'NPC Gas Station', distance: 1500 }
  ],
  shop: [
    { name: 'Taipei 101 Mall', distance: 50 },
    { name: 'Breeze Center', distance: 300 },
    { name: 'ATT 4 FUN', distance: 400 },
    { name: 'Shin Kong Mitsukoshi', distance: 600 },
    { name: 'Eslite Bookstore', distance: 700 }
  ]
};

const geocodingService = {
  // Check if using mock token
  isUsingMockData() {
    return MAPBOX_ACCESS_TOKEN === 'your-mapbox-token' || MAPBOX_ACCESS_TOKEN === 'pk.test_token';
  },

  // Reverse geocoding - get address from coordinates
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      // Use mock data if no real API key
      if (this.isUsingMockData()) {
        const key = `${latitude},${longitude}`;
        const mockData = MOCK_LOCATIONS[key] || MOCK_LOCATIONS.default;
        
        return {
          fullAddress: `${mockData.address}, ${mockData.city}, ${mockData.country}`,
          streetName: mockData.street,
          neighborhood: mockData.neighborhood,
          city: mockData.city,
          country: mockData.country,
          coordinates: {
            latitude,
            longitude
          }
        };
      }

      // Real API call
      const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;
      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          types: 'address,place,neighborhood,locality',
          limit: 1
        }
      });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return {
          fullAddress: feature.place_name,
          streetName: feature.text,
          neighborhood: this.extractNeighborhood(feature),
          city: this.extractCity(feature),
          country: this.extractCountry(feature),
          coordinates: {
            latitude,
            longitude
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      throw new Error('Failed to get address information');
    }
  },

  // Search for nearby places
  async getNearbyPlaces(latitude, longitude, category = 'restaurant', radius = 1000) {
    try {
      // Use mock data if no real API key
      if (this.isUsingMockData()) {
        const mockPlaces = MOCK_PLACES[category] || MOCK_PLACES.restaurant;
        
        return mockPlaces
          .filter(place => place.distance <= radius)
          .map((place, index) => ({
            id: `mock-${category}-${index}`,
            name: place.name,
            category: category,
            address: `${place.name}, Xinyi District, Taipei`,
            distance: place.distance,
            coordinates: {
              latitude: latitude + (Math.random() - 0.5) * 0.01,
              longitude: longitude + (Math.random() - 0.5) * 0.01
            }
          }));
      }

      // Real API call
      const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${category}.json`;
      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          proximity: `${longitude},${latitude}`,
          limit: 10,
          types: 'poi'
        }
      });

      const places = response.data.features.map(feature => ({
        id: feature.id,
        name: feature.text,
        category: feature.properties.category || category,
        address: feature.place_name,
        distance: this.calculateDistance(
          latitude,
          longitude,
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0]
        ),
        coordinates: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        }
      }));

      // Sort by distance
      places.sort((a, b) => a.distance - b.distance);

      return places;
    } catch (error) {
      console.error('Error searching nearby places:', error);
      throw new Error('Failed to search nearby places');
    }
  },

  // Get surrounding information including streets, landmarks, and places
  async getSurroundingInfo(latitude, longitude) {
    try {
      const [addressInfo, restaurants, cafes, gasStations, shops] = await Promise.all([
        this.getAddressFromCoordinates(latitude, longitude),
        this.getNearbyPlaces(latitude, longitude, 'restaurant', 500),
        this.getNearbyPlaces(latitude, longitude, 'cafe', 500),
        this.getNearbyPlaces(latitude, longitude, 'fuel', 1000),
        this.getNearbyPlaces(latitude, longitude, 'shop', 500)
      ]);

      return {
        currentLocation: addressInfo,
        nearby: {
          restaurants: restaurants.slice(0, 5),
          cafes: cafes.slice(0, 5),
          gasStations: gasStations.slice(0, 3),
          shops: shops.slice(0, 5)
        },
        summary: {
          totalNearbyPlaces: restaurants.length + cafes.length + gasStations.length + shops.length,
          closestRestaurant: restaurants[0] || null,
          closestCafe: cafes[0] || null,
          closestGasStation: gasStations[0] || null
        }
      };
    } catch (error) {
      console.error('Error getting surrounding info:', error);
      throw new Error('Failed to get surrounding information');
    }
  },

  // Helper function to extract neighborhood from Mapbox response
  extractNeighborhood(feature) {
    const context = feature.context || [];
    const neighborhood = context.find(c => c.id.startsWith('neighborhood'));
    return neighborhood ? neighborhood.text : null;
  },

  // Helper function to extract city from Mapbox response
  extractCity(feature) {
    const context = feature.context || [];
    const place = context.find(c => c.id.startsWith('place'));
    return place ? place.text : null;
  },

  // Helper function to extract country from Mapbox response
  extractCountry(feature) {
    const context = feature.context || [];
    const country = context.find(c => c.id.startsWith('country'));
    return country ? country.text : null;
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  },

  // Get nearby parking spots with address information
  async enrichParkingSpots(parkingSpots) {
    try {
      const enrichedSpots = await Promise.all(
        parkingSpots.map(async (spot) => {
          const addressInfo = await this.getAddressFromCoordinates(spot.lat, spot.lng);
          return {
            ...spot,
            address: addressInfo ? addressInfo.fullAddress : 'Unknown address',
            streetName: addressInfo ? addressInfo.streetName : null,
            neighborhood: addressInfo ? addressInfo.neighborhood : null
          };
        })
      );

      return enrichedSpots;
    } catch (error) {
      console.error('Error enriching parking spots:', error);
      return parkingSpots; // Return original spots if enrichment fails
    }
  }
};

module.exports = geocodingService;
