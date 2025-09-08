# Hashtag System Documentation

## Overview
Intelligent location analysis with caching that enables users to discover locations based on vibe characteristics through interactive hashtags.

## Core Features

### Location Analysis
- Analyzes locations using OpenStreetMap data
- Generates descriptive hashtags (#FoodieParadise, #BusyArea, etc.)
- Calculates vibe scores and parking difficulty
- Caches results for instant retrieval (<50ms vs 2-5s)

### Interactive Discovery
- Click hashtags to find similar locations
- Visual feedback with color-coded animated circles on map
- Multi-hashtag filtering with match percentages

## How to Use

1. **Right-click** on map to pin a location
2. **Click hashtags** in the Location Intelligence panel
3. **View matches** as colored circles on the map
4. **Click circles** to explore those locations

## API Endpoints

```bash
# Analyze location
POST /api/vibe/analyze
{"lat": 25.0330, "lng": 121.5654, "radius": 500}

# Find similar locations
POST /api/vibe/similar
{"hashtags": ["#BusyArea"], "currentLocation": {...}}

# Search by hashtag
GET /api/vibe/hashtag/{hashtag}

# Cache stats
GET /api/vibe/cache/stats
```

## Technical Implementation

### Backend
- `backend/src/services/cacheService.js` - Caching logic
- `backend/src/services/locationVibeService.js` - Analysis engine
- `backend/src/routes/vibeRoutes.js` - API routes

### Frontend
- `frontend/src/components/LocationVibe.js` - UI component
- `frontend/src/components/MapView.js` - Map integration

## Performance
- **Without cache**: 2-5 seconds per analysis
- **With cache**: <50ms (100x faster)
- **Cache TTL**: 24 hours
- **Grid size**: ~500m for pre-computation

## Future Enhancements
- Redis for persistent cache
- Machine learning for suggestions
- Time-based hashtag variations
- Custom user-created hashtags
