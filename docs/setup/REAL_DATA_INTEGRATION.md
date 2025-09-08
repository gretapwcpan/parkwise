# Real Parking Data Integration Guide

## Overview
The system integrates real-world parking data from OpenStreetMap with mock data for comprehensive coverage.

## Data Sources

### OpenStreetMap (Active)
- **Coverage**: Global
- **Cost**: Free
- **API**: Overpass API
- **Status**: ✅ Implemented

### Mock Data (Fallback)
- **Coverage**: Demo areas
- **Purpose**: Fallback when OSM unavailable

## API Usage

### Get Parking Spots
```
GET /api/locations/parking-spots/radius?lat=25.0330&lng=121.5654&radius=1000&useOSM=true
```

Parameters:
- `lat`, `lng`: Coordinates (required)
- `radius`: Search radius in meters (default: 1000)
- `useOSM`: Enable OSM data (default: true)

## Data Transformation

### Parking Types
- `parking=underground` → `garage`
- `parking=street_side` → `street`
- `parking=surface` → `lot`

### Features Extraction
- `covered=yes` → `["covered"]`
- `capacity:charging` → `["ev_charging"]`
- `fee=no` → Free parking

## Configuration

Add to `backend/.env`:
```env
USE_OSM_DATA=true
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSM_CACHE_TTL=3600
```

## Testing

```bash
# With OSM data
curl "http://localhost:3001/api/locations/parking-spots/radius?lat=25.0330&lng=121.5654"

# Mock data only
curl "http://localhost:3001/api/locations/parking-spots/radius?lat=25.0330&lng=121.5654&useOSM=false"
```

## Future Enhancements
- PostgreSQL + PostGIS for persistence
- Real-time availability via IoT sensors
- Government API integration
- ML-based availability prediction

## Contributing to OpenStreetMap
Help improve data by adding parking spots with proper tags:
- `amenity=parking`
- `parking=surface/underground/multi-storey`
- `capacity=<number>`
- `fee=yes/no`
