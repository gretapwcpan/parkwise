# Navigation System Documentation

## Overview
The parking space prototype now includes a comprehensive navigation system powered by OpenRouteService, providing turn-by-turn directions to parking spots.

## Features

### 1. Multi-Modal Navigation
- **Driving** 🚗 - Optimized routes for cars
- **Walking** 🚶 - Pedestrian-friendly paths
- **Cycling** 🚴 - Bike-friendly routes

### 2. Route Visualization
- Interactive route display on the map
- Color-coded route lines with directional arrows
- Automatic map bounds adjustment to show entire route

### 3. Turn-by-Turn Directions
- Step-by-step navigation instructions
- Distance and duration for each step
- Visual direction indicators (arrows, icons)
- Active navigation mode with current step tracking

### 4. Smart Integration
- Automatic navigation panel when selecting a parking spot
- Route calculation from current location to selected spot
- Real-time route updates based on location changes

## Technical Implementation

### Backend Services

#### Navigation Service (`backend/src/services/navigationService.js`)
- **getDirections()** - Calculate route between two points
- **getMultiModalRoute()** - Combined driving + walking routes
- **findOptimalParking()** - Find best parking spot considering route
- **OpenRouteService API** integration with 2,000 free requests/day

#### API Endpoints (`backend/src/routes/navigationRoutes.js`)
- `POST /api/navigation/directions` - Get directions
- `POST /api/navigation/multi-modal` - Get multi-modal route
- `POST /api/navigation/optimal-parking` - Find optimal parking
- `GET /api/navigation/status` - Check service status

### Frontend Components

#### NavigationPanel (`frontend/src/components/NavigationPanel.js`)
- Mode selection (driving/walking/cycling)
- Route summary (distance, duration)
- Turn-by-turn instructions list
- Active navigation controls
- Share and save route options

#### MapView Integration
- Route polyline rendering
- Route outline for visibility
- Directional arrows along route
- Automatic bounds fitting

## Usage Guide

### Getting Directions to a Parking Spot

1. **Select a Parking Spot**
   - Click on any parking spot marker on the map
   - Click "Book Now" in the popup
   - Navigation panel automatically opens

2. **Choose Travel Mode**
   - Select between driving 🚗, walking 🚶, or cycling 🚴
   - Route automatically recalculates when mode changes

3. **View Route Information**
   - See total distance and estimated duration
   - Review turn-by-turn instructions
   - Route is displayed on the map in blue

4. **Start Navigation**
   - Click "Start Navigation" button
   - View current instruction with direction icon
   - Use Previous/Next buttons to review steps
   - Click Stop to end navigation

### Advanced Features

#### Multi-Modal Routing (Future Enhancement)
```javascript
// Example: Drive to parking, then walk to destination
const route = await navigationService.getMultiModalRoute(
  userLocation,
  parkingSpot,
  finalDestination
);
```

#### Optimal Parking Selection (Future Enhancement)
```javascript
// Find best parking considering route distance and price
const recommendations = await navigationService.findOptimalParking(
  userLocation,
  availableSpots,
  destination
);
```

## API Configuration

### OpenRouteService Setup
1. Default development API key is included
2. For production, get your own key at https://openrouteservice.org
3. Set in environment variable: `ORS_API_KEY`

### Rate Limits
- Free tier: 2,000 requests/day
- 40 requests/minute
- Suitable for development and small-scale deployment

## Testing the Navigation

### Manual Testing
1. Open the application at http://localhost:3000
2. Allow location permissions when prompted
3. Click on any parking spot marker
4. Navigation panel opens automatically
5. Try different travel modes
6. Click "Start Navigation" to begin

### API Testing
```bash
# Test directions endpoint
curl -X POST http://localhost:3001/api/navigation/directions \
  -H "Content-Type: application/json" \
  -d '{
    "start": {"lat": 25.0330, "lng": 121.5654},
    "end": {"lat": 25.0340, "lng": 121.5664},
    "profile": "driving-car"
  }'

# Check service status
curl http://localhost:3001/api/navigation/status
```

## Future Enhancements

### Planned Features
1. **Voice Navigation** - Using Web Speech API
2. **Offline Caching** - Store frequently used routes
3. **Traffic Integration** - Real-time traffic data
4. **Route Preferences** - Avoid tolls, highways
5. **Parking-to-Destination** - Walking directions after parking
6. **Route History** - Save and replay previous routes
7. **Mobile Deep Linking** - Open in Organic Maps/Magic Earth

### Alternative Navigation Providers
- **Organic Maps** - Privacy-focused, offline capable
- **Magic Earth** - Free navigation with traffic
- **GraphHopper** - Self-hostable option
- **Valhalla** - Open-source routing engine

## Troubleshooting

### Common Issues

1. **No Route Found**
   - Check internet connection
   - Verify coordinates are valid
   - Ensure API key is valid

2. **Route Not Displaying**
   - Check browser console for errors
   - Verify MapLibre GL is loaded
   - Clear browser cache

3. **API Rate Limit**
   - Monitor usage in navigation service
   - Implement caching for repeated routes
   - Consider upgrading API plan

## Architecture Diagram

```
User Interface
     ↓
NavigationPanel Component
     ↓
Navigation API (Express)
     ↓
Navigation Service
     ↓
OpenRouteService API
     ↓
Route Data (GeoJSON)
     ↓
MapView Visualization
```

## Performance Considerations

- Route calculations are cached for 5 minutes
- Debounced location updates to reduce API calls
- Lazy loading of navigation components
- Optimized route rendering with MapLibre GL

## Security Notes

- API keys should be stored in environment variables
- Rate limiting implemented on backend
- Input validation for coordinates
- CORS configured for frontend origin only
