# ParkingPilot

AI-powered parking space booking system with real-time navigation and natural language search.

## Features

- **Voice-Controlled Hands-Free Operation**: Complete voice integration for safe driving - book parking without touching your phone
- **MCP (Model Context Protocol) Support**: Built-in MCP server for AI tool integration and extensibility
- **Natural Language Search**: "Find cheap parking near cafes" - powered by OpenAI OSS models
- **Real-time Navigation**: Live GPS tracking and route guidance
- **Smart Booking**: Conflict prevention with alternative slot suggestions
- **Cross-platform**: Works on web and iOS browsers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Web Browser  │  │ iOS Safari   │  │   Voice UI   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼─────────────────┼─────────────────┘
          │                  │                 │
          └──────────────────┼─────────────────┘
                            │
                    ┌───────▼────────┐
                    │                │
                    │  React Frontend│◄────── Voice Commands
                    │   (Port 3000)  │        (Web Speech API)
                    │                │
                    └───────┬────────┘
                            │ HTTP/WebSocket
                    ┌───────▼────────┐
                    │                │
                    │  Express Backend│
                    │   (Port 3001)  │
                    │                │
                    └───┬────────┬───┘
                        │        │
            ┌───────────▼──┐  ┌──▼──────────────┐
            │              │  │                 │
            │ LLM Service  │  │  MCP Server     │
            │ (Port 8001)  │  │  (AI Tools)     │
            │              │  │                 │
            └──────┬───────┘  └─────────────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
        │  OpenAI OSS 20B     │
        │  (Local/Port 8080)  │
        │                     │
        └─────────────────────┘

External Services (No API keys needed):
├── OpenStreetMap (Maps & Geocoding)
└── OSRM (Navigation & Routing)
```

## Tech Stack

- **Frontend**: React + MapLibre GL + OpenStreetMap
- **Backend**: Node.js + Express + Socket.io with in-memory storage
- **LLM Service**: Python + FastAPI + OpenAI-compatible models
- **MCP Server**: Node.js-based tool server for AI assistants
- **Voice**: Web Speech API for hands-free operation
- **Database**: In-memory storage (no external database required)

## Prerequisites

- Node.js 14+
- Python 3.9+
- GPU recommended for local LLM deployment

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/gretapwcpan/parking-space-prototype.git
cd parking-space-prototype
npm install
```

### 2. Configure LLM (Recommended: OpenAI OSS 20B)

Deploy your model with vLLM:
```bash
pip install vllm
vllm serve openai/gpt-20b --port 8080
```

Configure `llm-service/.env`:
```env
LLM_API_TYPE=openai-compatible
LLM_API_BASE_URL=http://localhost:8080/v1
LLM_MODEL=gpt-20b
```

### 3. Start Services

```bash
npm run dev
```

### 4. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- LLM Service: http://localhost:8001

## Testing

### Web Browser
1. Open http://localhost:3000
2. Allow location permissions
3. Click parking spots to book
4. Try natural language search: "Find parking under $10"

### iOS Browser
1. Find your local IP: `ifconfig | grep inet`
2. Open Safari: `http://[YOUR-IP]:3000`
3. Test all features including GPS tracking

## Environment Variables

### Backend (.env)
```env
PORT=3001
LLM_SERVICE_URL=http://localhost:8001
```

### LLM Service (.env)
```env
LLM_API_TYPE=openai-compatible
LLM_API_BASE_URL=http://localhost:8080/v1
LLM_MODEL=gpt-20b
PORT=8001
```

## Why OpenAI OSS 20B Models?

Based on research from ["The Super Weight in Large Language Models"](https://arxiv.org/pdf/2508.12461v1), a hypothetical OpenAI OSS 20B model would be ideal because:

- **Optimal Size**: 20B parameters hits the sweet spot - large enough for complex understanding, small enough for practical deployment
- **Super Weights**: Research shows certain weight parameters have disproportionate impact on performance
- **No API costs** - Run on your infrastructure  
- **Data privacy** - Your data stays local
- **Customizable** - Fine-tune for parking queries
- **Offline capable** - Works without internet

## Project Structure

```
├── frontend/          # React app with voice integration
├── backend/           # Express API
├── llm-service/       # LLM integration
├── mcp-server/        # MCP tools for AI assistants
└── docs/             # Documentation
```

## Voice & Hands-Free Features

Perfect for drivers who need to find parking without distraction:

- **Voice Commands**: "Find parking near me", "Book the cheapest spot"
- **Audio Feedback**: Spoken confirmations and navigation instructions
- **Hands-Free Booking**: Complete the entire booking flow by voice
- **Safety First**: No need to touch your phone while driving

## MCP (Model Context Protocol) Integration

The built-in MCP server enables AI assistants to:

- **Search Parking**: Find spots based on complex criteria
- **Book Parking**: Complete bookings programmatically
- **Get Details**: Retrieve parking information and availability
- **Manage Bookings**: View, modify, or cancel existing bookings

Configure MCP in your AI assistant (Claude, etc.) by pointing to:
```json
{
  "mcpServers": {
    "parking": {
      "command": "node",
      "args": ["mcp-server/server.js"]
    }
  }
}
```

## License

Apache License 2.0

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.
