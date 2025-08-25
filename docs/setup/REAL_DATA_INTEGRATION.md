# Real Parking Data Integration Guide

## Current Implementation

The parking spot system now integrates **real-world parking data** from OpenStreetMap alongside mock data for comprehensive coverage.

## Data Sources

### 1. OpenStreetMap (Currently Active)
- **Status**: ✅ Implemented and working
- **Coverage**: Global
- **Real-time availability**: No (static data)
- **Cost**: Free
- **API**: Overpass API

### 2. Mock Data
- **Status**: ✅ Active (fallback)
- **Coverage**: Taipei area
- **Purpose**: Demo and fallback when OSM fails

## How It Works

### Data Flow
1. User requests parking spots within radius
2. System queries OpenStreetMap via Overpass API
3. OSM data is transformed to our format
4. Mock data is merged with OSM data
5. Duplicates are removed based on location proximity
6. Results are sorted by distance and returned

### API Endpoint
```
GET /api/locations/parking-spots/radius?lat=25.0330&lng=121.5654&radius=1000&useOSM=true
```

Parameters:
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Search radius in meters (default: 1000)
- `useOSM`: Enable/disable OSM data (default: true)

### Response Example
```json
{
  "success": true,
  "center": { "lat": 25.033, "lng": 121.5654 },
  "radius": 500,
  "totalSpots": 13,
  "dataSource": "mixed",
  "parkingSpots": [
    {
      "id": "osm-node-12388351796",
      "name": "信義廣場地下停車場",
      "lat": 25.0335286,
      "lng": 121.5665531,
      "available": true,
      "price": 28,
      "type": "garage",
      "features": ["covered"],
      "distance": 125,
      "distanceKm": "0.13",
      "source": "openstreetmap"
    }
  ]
}
```

## OSM Data Transformation

### Parking Types Mapping
- `parking=underground` → `type: "garage"`
- `parking=multi-storey` → `type: "garage"`
- `parking=street_side` → `type: "street"`
- `parking=surface` → `type: "lot"`

### Features Extraction
- `covered=yes` → `features: ["covered"]`
- `capacity:charging` → `features: ["ev_charging"]`
- `surveillance=yes` → `features: ["security"]`
- `capacity:disabled` → `features: ["disabled_access"]`

### Price Estimation
Since OSM rarely includes pricing:
- Garage: $20-50/hr (random)
- Street: $10-25/hr (random)
- Lot: $15-35/hr (random)
- `fee=no` → $0/hr

## Future Enhancements

### 1. Database Integration (PostgreSQL + PostGIS)
```sql
CREATE TABLE parking_spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),
    price DECIMAL(10,2),
    type VARCHAR(50),
    features TEXT[],
    available BOOLEAN,
    updated_at TIMESTAMP
);
```

### 2. Real-time Availability Sources
- **IoT Sensors**: WebSocket connections for live updates
- **Government APIs**: Taiwan parking APIs
- **Commercial APIs**: ParkWhiz, JustPark, Parkopedia

###
