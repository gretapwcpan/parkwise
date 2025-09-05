# Parkwise

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
                    │   (Port 5000)  │
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
- CUDA-capable GPU (required for vLLM)
- 16GB+ RAM (32GB recommended for larger models)
- CUDA 11.8+ and PyTorch 2.0+

**See [INSTALL.md](INSTALL.md) for complete installation instructions**

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/gretapwcpan/parkwise.git
cd parkwise

# Install root dependencies (required for monorepo)
npm install

# Install backend dependencies
cd packages/backend && npm install && cd ../..

# Install frontend dependencies
cd packages/frontend && npm install && cd ../..

# Install LLM service dependencies (optional)
cd packages/llm-service && pip install fastapi uvicorn python-dotenv pydantic requests && cd ../..
```

### 🌍 Global Demo Mode

The app now includes demo data for major cities worldwide! No more Taipei-only limitations:

**Available Demo Cities:**
- 🗽 **New York, USA** - Times Square, Central Park, Wall Street
- 🌉 **San Francisco, USA** - Golden Gate, Fisherman's Wharf, Union Square  
- 🇬🇧 **London, UK** - Westminster, Tower Bridge, Covent Garden
- 🗼 **Paris, France** - Eiffel Tower, Champs-Élysées, Louvre
- 🗾 **Tokyo, Japan** - Shibuya, Ginza, Asakusa
- 🏯 **Taipei, Taiwan** - Taipei 101, Xinyi District

**Features:**
- Auto-detects nearest city based on your location
- Proper currency display (USD, EUR, GBP, JPY, TWD)
- Localized distance units (miles for US, kilometers elsewhere)
- Recognizable landmarks for each city
- No API keys required - works immediately!

### 2. Configure LLM with vLLM

**Install vLLM:**
```bash
# Install vLLM (requires CUDA-capable GPU)
pip install vllm

# Verify CUDA is available
python -c "import torch; print(torch.cuda.is_available())"
```

**Start Model Server:**
```bash
# Option 1: If OpenAI OSS 20B becomes available
python -m vllm.entrypoints.openai.api_server \
  --model openai/gpt-oss-20b \
  --port 8080 \
  --max-model-len 4096

# Option 2: Use Mistral 7B (recommended alternative)
python -m vllm.entrypoints.openai.api_server \
  --model mistralai/Mistral-7B-Instruct-v0.2 \
  --port 8080 \
  --max-model-len 4096

# Option 3: Use Mixtral 8x7B (best accuracy, needs 48GB+ VRAM)
python -m vllm.entrypoints.openai.api_server \
  --model mistralai/Mixtral-8x7B-Instruct-v0.1 \
  --port 8080 \
  --tensor-parallel-size 2  # For multi-GPU
```

Configure `llm-service/.env`:
```env
LLM_API_TYPE=openai-compatible
LLM_API_BASE_URL=http://localhost:8080/v1
LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2  # or your chosen model
LLM_API_KEY=dummy  # vLLM doesn't require an API key
TEMPERATURE=0.3
MAX_TOKENS=500
PORT=8001
```

**Note:** OpenAI OSS 20B is a theoretical optimal model. If unavailable, Mistral 7B or Mixtral provide excellent performance for parking queries. See [OpenAI OSS 20B Setup Guide](docs/OPENAI_OSS_20B_SETUP.md) for details.

### 3. Start Services

**Start each service in a separate terminal:**

**Terminal 1 - Backend (Required):**
```bash
cd packages/backend
npm start
# Server will run on port 5000
```

**Terminal 2 - Frontend (Required):**
```bash
cd packages/frontend
npm start
# Application will run on port 3000
# When prompted if port 3000 is in use, choose 'n' to keep it on 3000
```

**Terminal 3 - LLM Service (Optional):**
```bash
cd packages/llm-service
python app.py
# Service will run on port 8001
# Only needed for Location Intelligence feature
```

**Important Notes:**
- The backend MUST be started before the frontend
- The LLM service is optional - the app works without it, but Location Intelligence won't function


### 4. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- LLM Service: http://localhost:8001

**Note:** The backend runs on port 5000 by default, not 3001 as previously documented.

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
PORT=5000
LLM_SERVICE_URL=http://localhost:8001
```

### LLM Service (.env)
```env
LLM_API_TYPE=openai-compatible
LLM_API_BASE_URL=http://localhost:8080/v1
LLM_MODEL=gpt-20b
PORT=8001
```

## Why OpenAI OSS 20B?

Based on research from ["The Super Weight in Large Language Models"](https://arxiv.org/pdf/2508.12461v1), a 20B parameter model represents the optimal size for performance vs. resources.

**Recommended Models for vLLM:**
- **Mistral 7B**: Fast, efficient, great for parking queries
- **Mixtral 8x7B**: Most accurate, closest to theoretical 20B performance
- **Custom Model**: Create your own "OpenAI OSS 20B" using our script

**Benefits of local LLM deployment:**
- **No API costs** - Run on your infrastructure  
- **Data privacy** - Your data stays local
- **Customizable** - Fine-tune for parking queries
- **Offline capable** - Works without internet
- **Fast response** - No network latency

See [OpenAI OSS 20B Setup Guide](docs/OPENAI_OSS_20B_SETUP.md) for complete instructions.

## Project Structure

```
├── packages/
│   ├── frontend/      # React app with voice integration
│   ├── backend/       # Express API
│   ├── llm-service/   # LLM integration
│   └── mcp-server/    # MCP tools for AI assistants
├── docs/              # Documentation
└── package.json       # Root package configuration
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
