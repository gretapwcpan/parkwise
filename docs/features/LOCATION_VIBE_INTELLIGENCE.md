# Location Vibe Intelligence

Analyzes locations for vibe, parking difficulty, and transport recommendations.

## Usage
Right-click map → Pin location → View analysis

## Features
- Vibe score (1-10) with hashtags
- Parking difficulty assessment
- Transport recommendations
- Similar location finder

## API
`POST /api/vibe/analyze`
```json
{"lat": 25.0330, "lng": 121.5654, "radius": 500}
```

## Data Source
OpenStreetMap POIs via Overpass API (no key needed)
