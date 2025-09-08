# Real Data Integration

Uses OpenStreetMap (free, global) + mock data fallback.

## API
```
GET /api/locations/parking-spots/radius?lat=25.0330&lng=121.5654&radius=1000
```

## Data Mapping
- `parking=underground` → `garage`
- `parking=street_side` → `street`
- `covered=yes` → `["covered"]`
- `fee=no` → Free

## Config
```env
USE_OSM_DATA=true
OSM_CACHE_TTL=3600
