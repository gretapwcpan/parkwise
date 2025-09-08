# OpenStreetMap Setup Guide

## Overview
The application uses OpenStreetMap services for all location features - no API keys required!

## Services Used
- **Map Display**: OpenStreetMap tiles via MapLibre GL JS
- **Geocoding**: Nominatim API for address lookup
- **Nearby Places**: Overpass API for finding POIs

## Quick Start
```bash
# Backend
cd backend && npm start

# Frontend (new terminal)
cd frontend && npm start
```

The app automatically:
- Gets your GPS location
- Fetches real addresses
- Finds nearby places
- Displays on the map

## API Examples

```bash
# Get address from coordinates
curl "http://localhost:3001/api/location/address?lat=25.0330&lng=121.5654"

# Get nearby places
curl "http://localhost:3001/api/location/nearby-places?lat=25.0330&lng=121.5654&category=restaurant"

# Get surrounding info
curl "http://localhost:3001/api/location/surrounding-info?lat=25.0330&lng=121.5654"
```

## Rate Limits
- **Nominatim**: Max 1 request/second
- **Overpass**: Be mindful of query complexity
- Include User-Agent header for Nominatim

## Benefits
- ✅ No API keys needed
- ✅ Free and open-source
- ✅ Community-driven data
- ✅ Privacy-focused
- ✅ No usage limits or costs
