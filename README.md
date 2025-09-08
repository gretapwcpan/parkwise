# ParkWise - Smart Parking Space Booking System

A real-time parking space booking application with intelligent search and navigation features.

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gretapwcpan/parkwise.git
cd parkwise
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your configuration
```

### Running the Application

Start both backend and frontend:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Building for Production

```bash
npm run build
```

## Project Structure

```
parkwise/
├── packages/
│   ├── backend/          # Express.js API server
│   ├── frontend/         # React application
│   ├── llm-service/      # Python LLM service (optional)
│   └── mcp-server/       # MCP tools server (optional)
└── docs/                 # Additional documentation
```

## Features

- 🗺️ Real-time parking space search
- 📍 Interactive map with OpenStreetMap
- 🎯 Smart location-based recommendations
- 🚗 Turn-by-turn navigation
- 🎤 Voice assistant integration
- 📱 Responsive design

## Troubleshooting

### Port Already in Use

If you see an error about ports being in use, find and stop the existing process:

```bash
# Find process on port 3000 or 5000
lsof -i :3000
lsof -i :5000

# Stop the process
kill -9 <PID>
```

### Dependencies Issues

If you encounter module errors, clean and reinstall:

```bash
rm -rf packages/*/node_modules
npm run install:all
```

## License

Apache-2.0

## Support

For issues or questions, please check our [GitHub Issues](https://github.com/gretapwcpan/parkwise/issues).
