# Natural Language Search Implementation Guide

## Overview

This guide documents the implementation of a Natural Language Search feature for the parking space booking app using LangGraph in a Python microservice architecture.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend  │────▶│ Node.js API  │────▶│ Python LLM      │
│   (React)   │     │   Backend    │     │ Service         │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐      ┌─────────────┐
                    │   Database   │      │  LangGraph  │
                    │  (Future)    │      │  Workflow   │
                    └──────────────┘      └─────────────┘
```

## Components

### 1. Python LLM Service (Port 8001)

**Location**: `/llm-service/`

**Key Files**:
- `app.py` - FastAPI application
- `src/workflows/search_workflow.py` - LangGraph workflow
- `src/nodes/` - Individual processing nodes
- `src/schemas/search_schemas.py` - Data models

**LangGraph Workflow**:
```
Query → Parse Intent → Extract Entities → Map to Filters → Validate → Response
```

### 2. Node.js Integration

**Location**: `/backend/src/services/nlSearchService.js`

**Endpoints Added**:
- `POST /api/locations/search/natural` - Natural language search
- `GET /api/locations/search/examples` - Get example queries
- `GET /api/locations/search/health` - Check LLM service health

### 3. Supported Query Examples

- "Find parking near Taipei 101 under $10"
- "Show me covered spots with EV charging within 500m"
- "I need parking for tomorrow 2pm for 3 hours"
- "Cheapest parking near the mall"
- "找停車位在台北101附近" (Multilingual)
- "Handicap accessible parking near NTU"

## Setup Instructions

### 1. Environment Setup

**All API keys are now managed in a single location: `/backend/.env`**

Update your `/backend/.env` file with one of the following configurations:

#### Option 1: OpenAI (Default)
```env
# Existing configuration...
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/firebase-key.json

# LLM Configuration
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4
```

#### Option 2: Anthropic
```env
# LLM Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
LLM_MODEL=claude-3-sonnet-20240229
```

#### Option 3: OpenAI-Compatible APIs
```env
# LLM Configuration
LLM_API_TYPE=openai-compatible
LLM_API_BASE_URL=https://api.together.xyz/v1  # Your API endpoint
LLM_API_KEY=your_api_key_here
LLM_MODEL=meta-llama/Llama-2-70b-chat-hf  # Your model name
```

**Popular OpenAI-Compatible Providers:**

- **Ollama (Local)**: 
  ```env
  LLM_API_BASE_URL=http://localhost:11434/v1
  LLM_API_KEY=ollama
  LLM_MODEL=llama2
  ```

- **Together AI**:
  ```env
  LLM_API_BASE_URL=https://api.together.xyz/v1
  LLM_API_KEY=your_together_api_key
  LLM_MODEL=meta-llama/Llama-2-70b-chat-hf
  ```

- **Groq**:
  ```env
  LLM_API_BASE_URL=https://api.groq.com/openai/v1
  LLM_API_KEY=your_groq_api_key
  LLM_MODEL=mixtral-8x7b-32768
  ```

The LLM service will automatically inherit these environment variables through Docker Compose.

**Note**: The `/llm-service/.env.example` file is kept for reference but API keys should be set in `/backend/.env`.

### 2. Running with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run services individually
docker-compose up llm-service
docker-compose up backend
docker-compose up frontend
```

### 3. Running Locally (Development)

**Python Service**:
```bash
cd llm-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Node.js Backend**:
```bash
cd backend
npm install
npm run dev
```

## API Usage

### Natural Language Search

**Request**:
```bash
curl -X POST http://localhost:3001/api/locations/search/natural \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find parking near Taipei 101 under $10",
    "userLocation": {"lat": 25.0330, "lng": 121.5654},
    "language": "en"
  }'
```

**Response**:
```json
{
  "success": true,
  "query": "Find parking near Taipei 101 under $10",
  "explanation": "Searching for parking spots near Taipei 101 under $10/hour",
  "filters": {
    "lat": 25.0330,
    "lng": 121.5654,
    "radius": 1000,
    "max_price": 10,
    "available": true
  },
  "results": [
    {
      "id": 1,
      "name": "Premium Parking Spot",
      "lat": 25.0340,
      "lng": 121.5664,
      "price": 8,
      "features": ["covered", "ev_charging"],
      "available": true,
      "distance": 150
    }
  ],
  "totalResults": 1
}
```

## Testing

### 1. Test LLM Service Health
```bash
curl http://localhost:8001/health
```

### 2. Test Natural Language Parsing
```bash
curl -X POST http://localhost:8001/api/parse-search \
  -H "Content-Type: application/json" \
  -d '{"query": "cheap parking with EV charging"}'
```

### 3. Test Full Integration
```bash
# Through Node.js backend
curl -X POST http://localhost:3001/api/locations/search/natural \
  -H "Content-Type: application/json" \
  -d '{"query": "Find covered parking near the mall"}'
```

## Frontend Integration (TODO)

To integrate with the frontend:

1. Add a search toggle component
2. Create a natural language search input
3. Call the API endpoint
4. Display results using existing components

Example React component:
```jsx
const NaturalLanguageSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const response = await fetch('/api/locations/search/natural', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await response.json();
    setResults(data.results);
  };

  return (
    <div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g., Find parking near Taipei 101 under $10"
      />
      <button onClick={handleSearch}>Search</button>
      {/* Display results */}
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **LLM Service Not Responding**
   - Check if Python service is running: `docker ps`
   - Check logs: `docker logs parking-space-prototype_llm-service_1`
   - Verify API key is set in `.env`

2. **Parsing Errors**
   - Check LLM service logs for detailed errors
   - Verify the query format
   - Test with simpler queries first

3. **Connection Refused**
   - Ensure all services are running
   - Check port configurations
   - Verify network connectivity between services

4. **API Key Issues**
   - Verify API keys are set in `/backend/.env` (not in `/llm-service/.env`)
   - Check that docker-compose.yml is using the correct env_file path
   - Restart services after updating environment variables

## Future Enhancements

1. **Database Integration**
   - Replace mock data with real parking spot database
   - Add search result caching

2. **Advanced Features**
   - Multi-turn conversations
   - Booking through natural language
   - Voice input support

3. **Performance Optimization**
   - Implement result caching
   - Add request batching
   - Use smaller, fine-tuned models

4. **Monitoring**
   - Add request logging
   - Implement analytics
   - Track query patterns

## Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - All API keys are centralized in `/backend/.env`
   - Use environment variables
   - Rotate keys regularly
   - The unified configuration reduces the risk of key exposure

2. **Input Validation**
   - Sanitize user queries
   - Implement rate limiting
   - Add request size limits

3. **Error Handling**
   - Don't expose internal errors to users
   - Log errors securely
   - Implement fallback mechanisms
