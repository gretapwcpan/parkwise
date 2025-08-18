# Surrounding Information Feature

This feature enables the parking space prototype to fetch and display surrounding information based on GPS coordinates, including street addresses, nearby restaurants, cafes, gas stations, and shops.

## Overview

The application can now:
- **Reverse Geocode** GPS coordinates to get street addresses
- **Search for nearby places** like restaurants, cafes, gas stations, and shops
- **Display comprehensive surrounding information** in the UI
- **Enrich parking spots** with address information

## Implementation Details

### Backend Components

1. **Geocoding Service** (`backend/src/services/geocodingService.js`)
   - Uses Mapbox Geocoding API for reverse geocoding and place search
   - Provides methods for:
     - `getAddressFromCoordinates()` - Convert lat/lng to street address
     - `getNearbyPlaces()` - Search for specific types of places
     - `getSurroundingInfo()` - Get comprehensive surrounding information
     - `enrichParkingSpots()` - Add address info to parking spots

2. **Location Routes** (`backend/src/routes/locationRoutes.js`)
   - New endpoints:
     - `GET /api/locations/address` - Get address from coordinates
     - `GET /api/locations/nearby-places` - Search nearby places by category
     - `GET /api/locations/surrounding-info` - Get all surrounding information
     - `GET /api/locations/parking-spots-enriched` - Get parking spots with addresses

### Frontend Components

1. **SurroundingInfo Component** (`frontend/src/components/SurroundingInfo.js`)
   - Displays current location address
   - Shows nearby places organized by category
   - Collapsible/expandable UI for better space management
   - Auto-updates when user location changes

2. **LocationTracker Updates**
   - Now passes location updates to parent component
   - Enables SurroundingInfo component to receive real-time location data

## API Endpoints

### Get Address from Coordinates
```
GET /api/locations/address?lat=25.0330&lng=121.5654
```

Response:
```json
{
  "address": {
    "fullAddress": "No. 7, Section 5, Xinyi Road, Xinyi District, Taipei City, Taiwan",
    "streetName": "Xinyi Road",
    "neighborhood": "Xinyi District",
    "city": "Taipei City",
    "country": "Taiwan",
    "coordinates": {
      "latitude": 25.0330,
      "longitude": 121.5654
    }
  }
}
```

### Get Nearby Places
```
GET /api/locations/nearby-places?lat=25.0330&lng=121.5654&category=restaurant&radius=500
```

Parameters:
- `lat` (required): Latitude
- `lng` (required): Longitude
- `category` (optional): Type of places (restaurant, cafe, fuel, shop, etc.)
- `radius` (optional): Search radius in meters (default: 1000)

### Get Surrounding Information
```
GET /api/locations/surrounding-info?lat=25.0330&lng=121.5654
```

Response includes:
- Current location address
- Nearby restaurants, cafes, gas stations, and shops
- Summary with closest places and total count

## Configuration

### Environment Variables

Add to your `.env` file:
```
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

The Mapbox token is required for the geocoding functionality to work properly.

## Testing

1. **Test HTML Page**: Open `test-surrounding-info.html` in a browser to test the API endpoints directly

2. **Backend Testing**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Frontend Testing**:
   ```bash
   cd frontend
   npm start
   ```

## Usage

1. When the app loads, it will request location permission
2. Once location is obtained, the SurroundingInfo component appears in the top-right
3. Click on "📍 Current Location" to expand and see:
   - Current street address
   - Nearby restaurants
   - Nearby cafes
   - Gas stations within 1km
   - Nearby shops

## Future Enhancements

- Add more place categories (ATMs, parking lots, hospitals, etc.)
- Implement caching to reduce API calls
- Add distance-based filtering in the UI
- Show places on the map with markers
- Add navigation/directions to selected places
- Implement place details (ratings, hours, contact info)
