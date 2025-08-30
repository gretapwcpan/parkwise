# Hashtag Cache System

## Overview
A multi-layer caching system that stores location vibe analysis results and enables fast hashtag-based location discovery.

## Features

### 1. In-Memory Cache
- **TTL**: 24 hours default
- **Key Format**: `location:lat:lng:radius`
- **Hit Rate Tracking**: Monitors cache performance
- **Automatic Cleanup**: Hourly cleanup of expired entries

### 2. Hashtag Index
- **Reverse Index**: Maps hashtags to locations
- **Limit**: 100 locations per hashtag
- **Sorting**: By score and recency
- **Examples**: #BusyArea, #FoodieParadise, #EasyParking

### 3. Grid-Based Cache
- **Grid Size**: ~500m (0.005 degrees)
- **Purpose**: Pre-computation of popular areas
- **Nearby Search**: Find cached locations within radius

## API Endpoints

### Analyze Location (with caching)
```bash
POST /api/vibe/analyze
{
  "lat": 25.0330,
  "lng": 121.5654,
  "radius": 500
}
```

### Find Similar Locations
```bash
POST /api/vibe/similar
{
  "hashtags": ["#BusyArea", "#FoodieParadise"],
  "currentLocation": { "lat": 25.0330, "lng": 121.5654 },
  "limit": 10
}
```

### Search by Hashtag
```bash
GET /api/vibe/hashtag/{hashtag}?limit=10
# Example: /api/vibe/hashtag/BusyArea
```

### Cache Statistics
```bash
GET /api/vibe/cache/stats
# Returns: hits, misses, hit rate, cache size, hashtag count
```

### Clear Cache
```bash
DELETE /api/vibe/cache/clear
```

### Pre-populate Cache
```bash
POST /api/vibe/cache/prepopulate
{
  "locations": [
    { "lat": 25.0330, "lng": 121.5654 },
    { "lat": 25.0340, "lng": 121.5664 }
  ]
}
```

## Performance Benefits

### Before Cache
- Every location analysis: 3-4 API calls to OpenStreetMap
- Response time: 2-5 seconds
- No hashtag discovery
- No similar location search

### After Cache
- Cache hit response: <50ms (100x faster)
- Hashtag search: Instant
- Similar locations: Instant for cached areas
- Reduced external API load

## Frontend Integration

### Hashtag Clicking
When users click hashtags in the LocationVibe component:
1. Hashtag becomes active (visual feedback)
2. Searches cache for locations with that hashtag
3. Shows similar locations list
4. Can highlight locations on map

### Find Similar Button
Searches for all locations matching the current location's hashtags:
- Shows match count
- Displays distance from current location
- Lists matching hashtags

## Cache Statistics Example

```json
{
  "hits": 45,
  "misses": 15,
  "totalRequests": 60,
  "hitRate": "75.00%",
  "cacheSize": 25,
  "hashtagCount": 150,
  "gridCount": 10
}
```

## Implementation Files

- **Backend Service**: `backend/src/services/cacheService.js`
- **Location Vibe Service**: `backend/src/services/locationVibeService.js`
- **API Routes**: `backend/src/routes/vibeRoutes.js`
- **Frontend Component**: `frontend/src/components/LocationVibe.js`
- **Styles**: `frontend/src/components/LocationVibe.css`

## Usage Example

### 1. User clicks on map location
```javascript
// Location is analyzed and cached
const result = await analyzeLocationVibe(lat, lng);
// Cache stores: location data, hashtags, grid reference
```

### 2. User clicks hashtag
```javascript
// Find all cached locations with #BusyArea
const similar = await findLocationsByHashtag('#BusyArea');
// Returns instantly from cache
```

### 3. Cache grows over time
- More users = more cached locations
- Popular areas stay cached longer
- Hashtag network becomes richer

## Best Practices

1. **Pre-populate popular areas** during off-peak hours
2. **Monitor cache stats** to optimize TTL
3. **Clear cache** periodically to remove stale data
4. **Adjust grid size** based on city density

## Future Enhancements

- Persistent cache with Redis
- Machine learning for hashtag suggestions
- User-specific hashtag preferences
- Trending hashtags by time of day
- Cross-user hashtag recommendations
