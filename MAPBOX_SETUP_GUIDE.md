# Mapbox Setup Guide - Seeing Parks and Streets

## Current Status
Your app is already set up to fetch surrounding information including:
- Street addresses from GPS coordinates
- Nearby restaurants, cafes, shops, etc.
- Distance calculations to nearby places

The map is configured to show parks and streets using Mapbox's `outdoors-v12` style, but you need a real Mapbox token to see these features.

## Option 1: Get a Free Mapbox Token

1. Go to [Mapbox.com](https://www.mapbox.com/)
2. Sign up for a free account
3. Go to your [Account Dashboard](https://account.mapbox.com/)
4. Copy your default public token (starts with `pk.`)
5. Update your `frontend/.env` file:
   ```
   REACT_APP_MAPBOX_TOKEN=pk.your_actual_token_here
   ```
6. Restart your frontend server

### Available Mapbox Styles (with real token):
- `streets-v12` - Standard street map with labels
- `outdoors-v12` - Shows parks, terrain, hiking trails (currently selected)
- `light-v11` - Minimal, light theme
- `dark-v11` - Dark theme
- `satellite-v9` - Satellite imagery
- `satellite-streets-v12` - Satellite with street labels

## Option 2: Use OpenStreetMap (No API Key Required)

If you prefer not to use Mapbox, here's how to switch to OpenStreetMap with Leaflet:

### Install Leaflet:
```bash
cd frontend
npm install leaflet react-leaflet
```

### Create a new Leaflet-based MapView:
```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// In your component:
<MapContainer center={[25.0330, 121.5654]} zoom={15}>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  {/* Add markers here */}
</MapContainer>
```

## Option 3: Use MapTiler (Free tier available)

MapTiler provides beautiful map styles with a generous free tier:

1. Sign up at [MapTiler.com](https://www.maptiler.com/)
2. Get your API key
3. Use their styles with Mapbox GL JS:
   ```javascript
   map.current = new mapboxgl.Map({
     container: mapContainer.current,
     style: `https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY`,
     center: [lng, lat],
     zoom: zoom,
   });
   ```

## Testing Your Current Features

Your app already has these endpoints working:

### Get Street Address:
```bash
curl http://localhost:3000/api/location/address?lat=25.0330&lng=121.5654
```

### Get Nearby Places:
```bash
curl http://localhost:3000/api/location/nearby-places?lat=25.0330&lng=121.5654&radius=500
```

### Get All Surrounding Info:
```bash
curl http://localhost:3000/api/location/surrounding-info?lat=25.0330&lng=121.5654
```

## Current Mock Data
Since you're using a test token, the app returns mock data including:
- Sample street addresses
- Mock nearby places (restaurants, cafes, shops)
- Calculated distances

Once you add a real Mapbox token, the app will fetch real data from Mapbox's Geocoding API.

## Quick Start
1. Get a free Mapbox token from https://www.mapbox.com/
2. Update `frontend/.env`:
   ```
   REACT_APP_MAPBOX_TOKEN=your_token_here
   ```
3. Restart the frontend:
   ```bash
   cd frontend
   npm start
   ```
4. You'll now see parks, streets, and real surrounding information!
