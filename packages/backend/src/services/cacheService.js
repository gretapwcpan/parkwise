/**
 * In-memory cache service for location vibe data and hashtag indexing
 * Provides fast retrieval and reduces external API calls
 */

class CacheService {
  constructor() {
    // Main cache for location data
    this.locationCache = new Map();
    
    // Reverse index: hashtag -> locations
    this.hashtagIndex = new Map();
    
    // Grid-based cache for pre-computed areas
    this.gridCache = new Map();
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
    
    // Default TTL: 24 hours
    this.defaultTTL = 24 * 60 * 60 * 1000;
    
    // Start cleanup interval (every hour)
    this.startCleanupInterval();
  }

  /**
   * Generate cache key for a location
   */
  getLocationKey(lat, lng, radius = 500) {
    // Round to 4 decimal places for cache key
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    return `location:${roundedLat}:${roundedLng}:${radius}`;
  }

  /**
   * Generate grid key for pre-computed areas
   */
  getGridKey(lat, lng, gridSize = 0.005) {
    // Grid size ~500m (0.005 degrees)
    const gridLat = Math.floor(lat / gridSize) * gridSize;
    const gridLng = Math.floor(lng / gridSize) * gridSize;
    return `grid:${gridLat}:${gridLng}`;
  }

  /**
   * Store location vibe data in cache
   */
  setLocation(lat, lng, radius, data, ttl = this.defaultTTL) {
    const key = this.getLocationKey(lat, lng, radius);
    const expiry = Date.now() + ttl;
    
    // Store in location cache
    this.locationCache.set(key, {
      data,
      expiry,
      timestamp: Date.now(),
      hits: 0
    });
    
    // Update hashtag index
    if (data.vibe?.hashtags) {
      this.updateHashtagIndex(data.vibe.hashtags, { lat, lng, data });
    }
    if (data.parking?.hashtags) {
      this.updateHashtagIndex(data.parking.hashtags, { lat, lng, data });
    }
    
    // Update grid cache
    const gridKey = this.getGridKey(lat, lng);
    if (!this.gridCache.has(gridKey)) {
      this.gridCache.set(gridKey, new Set());
    }
    this.gridCache.get(gridKey).add(key);
    
    return true;
  }

  /**
   * Get location vibe data from cache
   */
  getLocation(lat, lng, radius = 500) {
    const key = this.getLocationKey(lat, lng, radius);
    this.stats.totalRequests++;
    
    const cached = this.locationCache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (cached.expiry < Date.now()) {
      this.locationCache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update hit count and stats
    cached.hits++;
    this.stats.hits++;
    
    return cached.data;
  }

  /**
   * Update hashtag index
   */
  updateHashtagIndex(hashtags, locationInfo) {
    hashtags.forEach(hashtag => {
      if (!this.hashtagIndex.has(hashtag)) {
        this.hashtagIndex.set(hashtag, []);
      }
      
      const locations = this.hashtagIndex.get(hashtag);
      
      // Check if location already exists
      const exists = locations.some(loc => 
        Math.abs(loc.lat - locationInfo.lat) < 0.0001 && 
        Math.abs(loc.lng - locationInfo.lng) < 0.0001
      );
      
      if (!exists) {
        locations.push({
          lat: locationInfo.lat,
          lng: locationInfo.lng,
          score: locationInfo.data.vibe?.score || 0,
          summary: locationInfo.data.vibe?.summary || '',
          parkingDifficulty: locationInfo.data.parking?.difficulty || 0,
          timestamp: Date.now()
        });
        
        // Keep only the most recent 100 locations per hashtag
        if (locations.length > 100) {
          locations.sort((a, b) => b.timestamp - a.timestamp);
          locations.splice(100);
        }
      }
    });
  }

  /**
   * Find locations by hashtag
   */
  findLocationsByHashtag(hashtag, limit = 10) {
    const locations = this.hashtagIndex.get(hashtag) || [];
    
    // Sort by score and timestamp
    const sorted = [...locations].sort((a, b) => {
      // Prioritize higher scores
      if (Math.abs(a.score - b.score) > 1) {
        return b.score - a.score;
      }
      // Then by recency
      return b.timestamp - a.timestamp;
    });
    
    return sorted.slice(0, limit);
  }

  /**
   * Find similar locations based on multiple hashtags
   */
  findSimilarLocations(hashtags, currentLocation, limit = 10) {
    const locationScores = new Map();
    
    // Score locations based on matching hashtags
    hashtags.forEach(hashtag => {
      const locations = this.findLocationsByHashtag(hashtag, 50);
      
      locations.forEach(loc => {
        // Skip current location
        if (currentLocation && 
            Math.abs(loc.lat - currentLocation.lat) < 0.0001 && 
            Math.abs(loc.lng - currentLocation.lng) < 0.0001) {
          return;
        }
        
        const key = `${loc.lat}:${loc.lng}`;
        const current = locationScores.get(key) || { ...loc, matchCount: 0, matchingTags: [] };
        current.matchCount++;
        current.matchingTags.push(hashtag);
        locationScores.set(key, current);
      });
    });
    
    // Convert to array and sort by match count
    const results = Array.from(locationScores.values())
      .sort((a, b) => {
        // First by number of matching hashtags
        if (a.matchCount !== b.matchCount) {
          return b.matchCount - a.matchCount;
        }
        // Then by vibe score
        return b.score - a.score;
      })
      .slice(0, limit);
    
    return results;
  }

  /**
   * Get nearby cached locations
   */
  getNearbyLocations(lat, lng, radiusKm = 2) {
    const results = [];
    const radiusDegrees = radiusKm / 111; // Rough conversion
    
    // Check grid cells in the area
    const gridSize = 0.005;
    const gridsToCheck = Math.ceil(radiusDegrees / gridSize);
    
    for (let i = -gridsToCheck; i <= gridsToCheck; i++) {
      for (let j = -gridsToCheck; j <= gridsToCheck; j++) {
        const checkLat = lat + (i * gridSize);
        const checkLng = lng + (j * gridSize);
        const gridKey = this.getGridKey(checkLat, checkLng);
        
        const locationKeys = this.gridCache.get(gridKey);
        if (locationKeys) {
          locationKeys.forEach(key => {
            const cached = this.locationCache.get(key);
            if (cached && cached.expiry > Date.now()) {
              // Extract coordinates from key
              const parts = key.split(':');
              const locLat = parseFloat(parts[1]);
              const locLng = parseFloat(parts[2]);
              
              // Calculate distance
              const distance = this.calculateDistance(lat, lng, locLat, locLng);
              if (distance <= radiusKm) {
                results.push({
                  lat: locLat,
                  lng: locLng,
                  distance,
                  data: cached.data
                });
              }
            }
          });
        }
      }
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    
    return results;
  }

  /**
   * Calculate distance between two points (in km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.locationCache.size,
      hashtagCount: this.hashtagIndex.size,
      gridCount: this.gridCache.size
    };
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    // Clean location cache
    for (const [key, value] of this.locationCache.entries()) {
      if (value.expiry < now) {
        this.locationCache.delete(key);
        removed++;
        
        // Also remove from grid cache
        const gridKey = this.getGridKey(value.data.location?.lat || 0, value.data.location?.lng || 0);
        const gridSet = this.gridCache.get(gridKey);
        if (gridSet) {
          gridSet.delete(key);
          if (gridSet.size === 0) {
            this.gridCache.delete(gridKey);
          }
        }
      }
    }
    
    // Clean old entries from hashtag index
    for (const [hashtag, locations] of this.hashtagIndex.entries()) {
      const filtered = locations.filter(loc => 
        now - loc.timestamp < this.defaultTTL
      );
      
      if (filtered.length === 0) {
        this.hashtagIndex.delete(hashtag);
      } else if (filtered.length < locations.length) {
        this.hashtagIndex.set(hashtag, filtered);
      }
    }
    
    console.log(`Cache cleanup: removed ${removed} expired entries`);
    return removed;
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.locationCache.clear();
    this.hashtagIndex.clear();
    this.gridCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
    console.log('Cache cleared');
  }

  /**
   * Pre-populate cache with popular areas
   */
  async prePopulate(locations) {
    let added = 0;
    
    for (const location of locations) {
      if (location.lat && location.lng && location.data) {
        this.setLocation(location.lat, location.lng, location.radius || 500, location.data);
        added++;
      }
    }
    
    console.log(`Pre-populated cache with ${added} locations`);
    return added;
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
