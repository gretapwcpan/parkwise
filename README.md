# Parking Space Booking Prototype

A cross-platform parking space booking system with real-time navigation, booking management, and admin moderation capabilities.

## Features

- **Real-time Navigation**: Live GPS tracking with mock location feed for testing
- **Smart Booking System**: Conflict prevention with alternative slot suggestions
- **Push Notifications**: Firebase Cloud Messaging integration (with mock fallback)
- **Admin Dashboard**: Manual moderation for booking approvals/rejections
- **Cross-platform**: Works on both web and mobile browsers
- **Progressive Web App**: Installable on mobile devices
- **Natural Language Search**: AI-powered search using LangGraph - "Find parking near Taipei 101 under $10"

## Architecture

- **Frontend**: React with MapLibre GL JS and OpenStreetMap
- **Backend**: Node.js with Express and Socket.io
- **LLM Service**: Python FastAPI with LangGraph for natural language processing
- **Database**: Firebase Firestore (with in-memory fallback)
- **Notifications**: Firebase Cloud Messaging
- **Real-time**: Socket.io for live updates
- **Maps & Geocoding**: OpenStreetMap (no API keys required)

## Prerequisites

- Node.js (v14 or higher)
- Python 3.9+ (for Natural Language Search feature)
- npm or yarn
- Firebase project (optional - system works with mock data)
- OpenAI or Anthropic API key (for Natural Language Search)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/gretapwcpan/parking-space-prototype.git
cd parking-space-prototype
```

### 2. Quick Setup (Recommended)

The project supports multiple modern build tools and package managers:

#### Option A: Using Turborepo (Fastest - with caching)
```bash
# Install dependencies
npm install

# Start all services with Turborepo
npx turbo dev
```

#### Option B: Using pnpm (Most efficient disk space)
```bash
# Install pnpm globally
npm install -g pnpm

# Install all dependencies
pnpm install

# Start all services
pnpm run dev
```

#### Option C: Using nx (Best for large monorepos)
```bash
# Install dependencies
npm install

# Start all services with nx
npx nx run-many --target=dev --all
```

#### Option D: Using Make (Traditional Unix approach)
```bash
# First time setup
make quickstart

# Start all services
make dev
```

#### Option E: Using npm workspaces
```bash
# Install all dependencies
npm install

# Start all services concurrently
npm run dev
```

### 3. Configure Environment

Edit `backend/.env` file with your credentials:
- (Optional) Add Firebase credentials for database
- (Optional) Add OpenAI/Anthropic API key for natural language search
- The app works without any API keys using OpenStreetMap

### 4. Access the Applications

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Admin Dashboard: http://localhost:3002
- LLM Service (Natural Language Search): http://localhost:8001

## Available Commands

### Modern Build Tools Comparison

| Tool | Command | Speed | Caching | Best For |
|------|---------|-------|---------|----------|
| **Turborepo** | `npx turbo dev` | ⚡⚡⚡ | ✅ Remote + Local | Fast builds, CI/CD |
| **pnpm** | `pnpm run dev` | ⚡⚡ | ✅ Local | Disk space efficiency |
| **nx** | `npx nx run-many --target=dev` | ⚡⚡ | ✅ Local + Cloud | Large enterprise monorepos |
| **npm workspaces** | `npm run dev` | ⚡ | ❌ | Simple projects |
| **Make** | `make dev` | ⚡ | ❌ | Unix environments |

### Common Commands

```bash
# Install dependencies (choose one)
npm install          # npm workspaces
pnpm install         # pnpm workspaces
make install         # Makefile

# Run development servers (choose one)
npx turbo dev        # Turborepo (fastest)
pnpm run dev         # pnpm
npx nx run-many --target=dev --all  # nx
npm run dev          # npm workspaces
make dev             # Makefile

# Build for production
npx turbo build      # Turborepo
npm run build        # npm workspaces
make build           # Makefile

# Clean everything
npm run clean        # npm workspaces
make clean           # Makefile
```

## Testing the System

### 1. User Flow Testing

1. Open the frontend at http://localhost:3000
2. Allow location permissions (or use simulated location)
3. View available parking spots on the map
4. Click on a parking spot to book
5. Select date and time
6. Submit booking request

### 2. Admin Flow Testing

1. Open the admin dashboard at http://localhost:3002
2. View pending bookings
3. Approve or reject bookings
4. See real-time updates

### 3. Mobile Testing

1. Open the frontend on your mobile device browser
2. Use your local IP address instead of localhost:
   ```
   http://[YOUR-LOCAL-IP]:3000
   ```
3. Test all features including:
   - GPS tracking
   - Map interaction
   - Booking flow
   - Push notifications (if configured)

### 4. Cross-Platform Compatibility

Test on various devices and browsers:
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Chrome Android
- Tablet: iPad Safari, Android Chrome

## Key Features to Test

### Booking Conflict Prevention
1. Create a booking for a specific time slot
2. Try to book the same spot for overlapping time
3. System should suggest alternative slots

### Real-time Updates
1. Open multiple browser tabs/devices
2. Create a booking in one tab
3. See it appear in admin dashboard
4. Approve/reject and see status update

### GPS Simulation
- If real GPS unavailable, system simulates movement
- Watch the blue dot move on the map
- Location updates every 5 seconds

### Push Notifications
- With Firebase: Real push notifications
- Without Firebase: Console log notifications
- Test booking confirmations and updates

## Environment Variables

### Backend (.env)
```
PORT=3001
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
LLM_SERVICE_URL=http://localhost:8001
```

### LLM Service (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
# Or use Anthropic
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
LLM_MODEL=gpt-4
PORT=8001
```

### Frontend
- Map uses OpenStreetMap tiles (no configuration needed)
- API endpoints are configured in apiService.js

## Troubleshooting

### Map not loading
- Check internet connection (OpenStreetMap tiles load from web)
- Verify backend server is running on port 3001

### Bookings not saving
- Check backend console for errors
- Verify Firebase credentials (or use mock mode)

### Location not updating
- Check browser location permissions
- GPS simulation will activate if real GPS fails

### Admin dashboard not refreshing
- Check WebSocket connection in browser console
- Verify all three servers are running

## Development Notes

### Mock Data Mode
When Firebase credentials are not provided:
- Bookings stored in memory
- Push notifications logged to console
- Perfect for development and testing

### Adding Parking Spots
Edit `backend/src/services/bookingService.js` to add more parking spots in the `parkingSpots` array.

### Customizing Map Style
Modify `frontend/src/components/MapView.js` to change map appearance and behavior.

## Production Deployment

1. Set up Firebase project with Firestore and FCM
2. Configure environment variables
3. Build frontend: `npm run build`
4. Deploy backend to hosting service
5. Serve frontend build files
6. Configure HTTPS for production use

## Documentation

### 📚 Features Documentation
- [Surrounding Information Feature](docs/features/SURROUNDING_INFO_FEATURE.md) - GPS-based location info and nearby places
- [Test Surrounding Info](docs/features/test-surrounding-info.html) - HTML test page for location features

### 🛠️ Setup Guides
- [OpenStreetMap Setup Guide](docs/setup/OPENSTREETMAP_SETUP_GUIDE.md) - Complete guide for OpenStreetMap integration

### 📋 Planning & Architecture
- [LLM Integration Ideas](docs/planning/LLM_INTEGRATION_IDEAS.md) - AI/LLM features brainstorming
- [LLM Implementation Plan](docs/planning/LLM_IMPLEMENTATION_PLAN.md) - Detailed implementation for intelligent features
- [Natural Language Search Guide](docs/planning/NL_SEARCH_IMPLEMENTATION_GUIDE.md) - Complete guide for the AI-powered search feature
- [Project Names](docs/planning/PROJECT_NAMES.md) - Branding and naming suggestions

## License

MIT License - see LICENSE file for details
