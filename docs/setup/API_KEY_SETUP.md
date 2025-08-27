# API Key Setup Guide

## OpenRouteService Navigation API

### Where to Put Your API Key

The API key should be placed in the backend environment file:

**File Location:** `backend/.env`

```env
# OpenRouteService API Configuration
ORS_API_KEY=your-api-key-here
```

### Step-by-Step Setup

#### 1. Get Your Free API Key

1. Go to [OpenRouteService Sign Up](https://openrouteservice.org/dev/#/signup)
2. Create a free account
3. Verify your email
4. Log in to your dashboard
5. Your API key will be displayed in the dashboard
6. Copy the API key

#### 2. Configure the API Key

**Option A: Using the .env file (Recommended)**

1. Open the file `backend/.env` in your project
2. Find the line with `ORS_API_KEY=`
3. Replace the existing key with your own:
   ```env
   ORS_API_KEY=your-actual-api-key-here
   ```
4. Save the file
5. Restart the backend server

**Option B: Using Environment Variables (Production)**

Set the environment variable in your system:

```bash
# macOS/Linux
export ORS_API_KEY="your-api-key-here"

# Windows Command Prompt
set ORS_API_KEY=your-api-key-here

# Windows PowerShell
$env:ORS_API_KEY="your-api-key-here"
```

#### 3. Verify the Configuration

After setting up your API key:

1. Restart the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Check the console output - you should NOT see the warning message about missing API key

3. Test the navigation by:
   - Opening the app at http://localhost:3000
   - Clicking on a parking spot
   - The navigation panel should calculate routes successfully

### API Key Limits

**Free Tier Includes:**
- 2,000 requests per day
- 40 requests per minute
- All routing profiles (driving, walking, cycling)
- Turn-by-turn instructions
- Route optimization

**When to Upgrade:**
- If you exceed 2,000 requests/day regularly
- Need higher rate limits
- Require SLA guarantees
- Want priority support

### Security Best Practices

#### ✅ DO:
- Keep your API key in `.env` file
- Add `.env` to `.gitignore` (already done)
- Use environment variables in production
- Rotate keys periodically
- Monitor usage in OpenRouteService dashboard

#### ❌ DON'T:
- Commit API keys to Git
- Share keys publicly
- Use the same key for development and production
- Expose keys in frontend code
- Hard-code keys in source files

### Troubleshooting

#### API Key Not Working

1. **Check the .env file location**
   - Must be in `backend/` directory
   - File should be named exactly `.env` (not `.env.txt`)

2. **Verify the key format**
   ```env
   # Correct
   ORS_API_KEY=5b3ce3597851110001cf6248...
   
   # Wrong (no quotes needed)
   ORS_API_KEY="5b3ce3597851110001cf6248..."
   ```

3. **Restart the server**
   - Changes to .env require server restart
   - Stop the server (Ctrl+C)
   - Start again with `npm start`

4. **Check API key validity**
   - Log in to OpenRouteService dashboard
   - Verify key is active
   - Check if daily limit is exceeded

#### Rate Limit Errors

If you see "429 Too Many Requests":
- You've exceeded the rate limit
- Wait a few minutes and try again
- Consider implementing request caching
- Upgrade to a paid plan if needed

### Alternative Navigation Services

If you want to use a different navigation service:

#### Mapbox Directions API
```env
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```
- Sign up at: https://account.mapbox.com/auth/signup/
- 100,000 free requests/month

#### GraphHopper
```env
GRAPHHOPPER_API_KEY=your-graphhopper-key
```
- Sign up at: https://www.graphhopper.com/
- 500 free requests/day

#### Self-Hosted Options
- **Valhalla** - Open source routing engine
- **OSRM** - Open Source Routing Machine
- **GraphHopper** - Community edition

### Environment File Template

Here's the complete `.env` template with all navigation options:

```env
# Backend Environment Variables

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3002

# Primary Navigation Service - OpenRouteService
# Get your free key at: https://openrouteservice.org/dev/#/signup
ORS_API_KEY=your-ors-api-key-here

# Alternative Navigation Services (optional)
# MAPBOX_ACCESS_TOKEN=your-mapbox-token
# GRAPHHOPPER_API_KEY=your-graphhopper-key
# GOOGLE_MAPS_API_KEY=your-google-maps-key

# Firebase Configuration (optional)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-client-email
# FIREBASE_PRIVATE_KEY=your-private-key
```

### Monitoring API Usage

1. **OpenRouteService Dashboard**
   - Log in to your account
   - View daily/monthly usage
   - Set up usage alerts

2. **Application Logging**
   - Check `backend/logs/` for API calls
   - Monitor response times
   - Track error rates

3. **Implement Caching**
   - Cache frequently used routes
   - Store results for 5-10 minutes
   - Reduces API calls significantly

### Support

If you need help with API setup:

1. **OpenRouteService Support**
   - Documentation: https://openrouteservice.org/dev/#/api-docs
   - Forum: https://ask.openrouteservice.org/
   - GitHub: https://github.com/GIScience/openrouteservice

2. **Project Issues**
   - Check `docs/features/NAVIGATION_SYSTEM.md`
   - Review error messages in browser console
   - Check backend server logs

Remember: The provided default key in the .env file is for development only. Always use your own API key for production deployments!
