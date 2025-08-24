# OpenStreetMap Setup Guide

## Current Implementation
The application now uses OpenStreetMap services for all location and geocoding features:
- **Map Display**: OpenStreetMap tiles via MapLibre GL JS
- **Geocoding**: OpenStreetMap Nominatim API (no key required)
- **Nearby Places**: OpenStreetMap Overpass API (no key required)

## Features Available
Your app has these features working with real data:
- Street addresses from GPS coordinates
- Nearby restaurants, cafes, shops, gas stations
- Distance calculations to nearby places
- Real-time location tracking

## No API Keys Required
The application uses free, open-source services that don't require API keys:
- OpenStreetMap for map tiles
- Nominatim for geocoding (address lookup)
- Overpass API for finding nearby places

## Testing the Features

### Get Street Address:
```bash
curl "http://localhost:3001/api/location/address?lat=25.0330&lng=121.5654"
```

### Get Nearby Places:
```bash
curl "http://localhost:3001/api/location/nearby-places?lat=25.0330&lng=121.5654&category=restaurant&radius=500"
```

### Get All Surrounding Info:
```bash
curl "http://localhost:3001/api/location/surrounding-info?lat=25.0330&lng=121.5654"
```

## Map Implementation Details

The frontend uses MapLibre GL JS with OpenStreetMap tiles:
```javascript
map.current = new maplibregl.Map({
  container: mapContainer.current,
  style: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  },
  center: [lng, lat],
  zoom: zoom,
});
```

## Geocoding Service Details

The backend uses Nominatim for reverse geocoding:
```javascript
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Get address from coordinates
const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
  params: {
    lat: latitude,
    lon: longitude,
    format: 'json',
    addressdetails: 1,
    zoom: 18
  },
  headers: {
    'User-Agent': 'ParkingSpaceApp/1.0' // Required by Nominatim
  }
});
```

## Nearby Places Service

The backend uses Overpass API to find nearby places:
```javascript
// Overpass API query for restaurants within 500m
const query = `
  [out:json][timeout:25];
  (
    node[amenity=restaurant](around:500,${latitude},${longitude});
    way[amenity=restaurant](around:500,${latitude},${longitude});
  );
  out body;
`;
```

## Rate Limits and Best Practices

### Nominatim (Geocoding)
- Maximum 1 request per second
- Include a User-Agent header
- Consider caching results

### Overpass API (Nearby Places)
- Be mindful of query complexity
- Use appropriate timeouts
- Cache results when possible

## Quick Start
1. The application is already configured to use OpenStreetMap
2. No API keys needed
3. Just run the application:
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend (in another terminal)
   cd frontend
   npm start
   ```
4. The app will automatically:
   - Get your current GPS location
   - Fetch real address information
   - Find actual nearby places
   - Display everything on the map

## Advantages of OpenStreetMap
- **No API keys required** - Works immediately without registration
- **Free and open-source** - No usage limits or costs
- **Community-driven data** - Constantly updated by contributors worldwide
- **Privacy-focused** - No tracking or data collection
- **Reliable** - Backed by a large community and infrastructure
