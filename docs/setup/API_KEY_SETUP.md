# API Key Setup Guide

## Quick Setup

### 1. Get Your Free API Key
Sign up at [OpenRouteService](https://openrouteservice.org/dev/#/signup) and copy your API key from the dashboard.

### 2. Configure the API Key
Add to `backend/.env`:
```env
ORS_API_KEY=your-api-key-here
```

### 3. Restart Backend
```bash
cd backend
npm start
```

## API Limits
- **Free Tier**: 2,000 requests/day, 40 requests/minute
- **Includes**: All routing profiles, turn-by-turn directions

## Troubleshooting

### API Key Not Working
- Ensure `.env` is in `backend/` directory
- No quotes around the key value
- Restart server after changes

### Rate Limit Errors (429)
- Wait a few minutes and retry
- Consider implementing caching
- Upgrade plan if needed

## Alternative Services (Optional)

### Mapbox
```env
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```
100,000 free requests/month

### GraphHopper
```env
GRAPHHOPPER_API_KEY=your-graphhopper-key
```
500 free requests/day

## Security Notes
- Never commit API keys to Git
- Use environment variables in production
- `.env` is already in `.gitignore`
