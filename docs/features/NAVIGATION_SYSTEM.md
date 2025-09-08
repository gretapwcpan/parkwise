# Navigation System

Turn-by-turn directions to parking spots using OpenRouteService.

## Features
- Driving/walking/cycling routes
- Visual route on map
- Step-by-step directions
- Auto-navigation mode

## Setup
Add to `backend/.env`:
```
ORS_API_KEY=your-key
```
Free: 2,000 requests/day

## API
`POST /api/navigation/directions`
```json
{"start": {...}, "end": {...}, "profile": "driving-car"}
```

## Usage
Click parking spot → "Book Now" → Navigation opens
