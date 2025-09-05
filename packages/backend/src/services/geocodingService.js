const axios = require('axios');

// OpenStreetMap Nominatim API (free, no key required)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

const geocodingService = {
  // Reverse geocoding - get address from coordinates
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      // Use Nominatim for real geocoding (free, no API key required)
      const url = `${NOMINATIM_BASE_URL}/reverse`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          zoom: 18,
          'accept-language': 'en-US,en' // Force English language results
        },
        headers: {
          'User-Agent': 'ParkingSpaceApp/1.0', // Required by Nominatim
          'Accept-Language': 'en-US,en;q=0.9' // Also set in headers for better compatibility
        }
      });

      if (response.data && response.data.address) {
        const addr = response.data.address;
        const displayName = response.data.display_name;
        
        // Build street name from various possible fields
        const streetName = addr.road || addr.pedestrian || addr.footway || 
                         addr.street || addr.path || 'Unknown Street';
        
        // Get neighborhood/suburb
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || 
                           addr.city_district || addr.district || '';
        
        // Get city
        const city = addr.city || addr.town || addr.village || 
                    addr.municipality || addr.county || '';
        
        // Get country
        const country = addr.country || '';
        
        // Build full address
        let fullAddress = displayName || '';
        if (!fullAddress && (streetName || city || country)) {
          const parts = [];
          if (addr.house_number) parts.push(addr.house_number);
          if (streetName) parts.push(streetName);
          if (neighborhood && neighborhood !== city) parts.push(neighborhood);
          if (city) parts.push(city);
          if (addr.state) parts.push(addr.state);
          if (country) parts.push(country);
          fullAddress = parts.filter(p => p).join(', ');
        }
        
        return {
          fullAddress: fullAddress || 'Location found',
          streetName: streetName,
          neighborhood: neighborhood,
          city: city,
          country: country,
          coordinates: {
            latitude,
            longitude
          }
        };
      }

      // Fall back to basic location info if no address found
      return {
        fullAddress: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        streetName: 'Current Location',
        neighborhood: '',
        city: '',
        country: '',
        coordinates: {
          latitude,
          longitude
        }
      };
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      // Return basic location info on error
      return {
        fullAddress: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        streetName: 'Current Location',
        neighborhood: '',
        city: '',
        country: '',
        coordinates: {
          latitude,
          longitude
        }
      };
    }
  },

  // Search for nearby places using OpenStreetMap Overpass API
  async searchNearbyWithOverpass(latitude, longitude, category, radius) {
    try {
      // Map categories to OpenStreetMap tags
      const categoryToTag = {
        'restaurant': 'amenity=restaurant',
        'cafe': 'amenity=cafe',
        'fuel': 'amenity=fuel',
        'shop': 'shop',  // Use just 'shop' without =* for any shop type
        'parking': 'amenity=parking'
      };
      
      const tag = categoryToTag[category] || 'amenity';
      
      // Build the query based on whether we need a specific value or any value
      let nodeQuery, wayQuery;
      if (tag.includes('=')) {
        // Specific tag value (e.g., amenity=restaurant)
        nodeQuery = `node[${tag}](around:${radius},${latitude},${longitude});`;
        wayQuery = `way[${tag}](around:${radius},${latitude},${longitude});`;
      } else {
        // Any value for the tag (e.g., shop for any shop type)
        nodeQuery = `node[${tag}](around:${radius},${latitude},${longitude});`;
        wayQuery = `way[${tag}](around:${radius},${latitude},${longitude});`;
      }
      
      // Overpass API query
      const query = `
        [out:json][timeout:25];
        (
          ${nodeQuery}
          ${wayQuery}
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      );
      
      if (response.data && response.data.elements) {
        const places = response.data.elements
          .filter(el => el.tags && el.tags.name)
          .map(el => ({
            id: `osm-${el.id}`,
            name: el.tags.name,
            category: category,
            address: el.tags['addr:full'] || el.tags['addr:street'] || '',
            distance: this.calculateDistance(
              latitude,
              longitude,
              el.lat || el.center?.lat,
              el.lon || el.center?.lon
            ),
            coordinates: {
              latitude: el.lat || el.center?.lat,
              longitude: el.lon || el.center?.lon
            }
          }))
          .filter(place => place.coordinates.latitude && place.coordinates.longitude)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);
        
        return places;
      }
      
      return [];
    } catch (error) {
      console.error('Overpass API error:', error);
      return [];
    }
  },

  // Search for nearby places
  async getNearbyPlaces(latitude, longitude, category = 'restaurant', radius = 1000) {
    try {
      // Use OpenStreetMap Overpass API for real data
      const places = await this.searchNearbyWithOverpass(latitude, longitude, category, radius);
      
      if (places.length > 0) {
        return places;
      }
      
      // If no results, return empty array
      return [];
    } catch (error) {
      console.error('Error searching nearby places:', error);
      return [];
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
