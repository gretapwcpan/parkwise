# Natural Language Search Implementation with Python LangGraph Microservice

## Architecture Overview

```
Frontend → Node.js Backend → Python LangGraph Service → Search Results
```

## Implementation Plan

### 1. Python Microservice Structure
```
llm-service/
├── requirements.txt
├── .env.example
├── app.py
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── workflows/
│   │   ├── __init__.py
│   │   └── search_workflow.py
│   ├── nodes/
│   │   ├── __init__.py
│   │   ├── query_parser.py
│   │   ├── entity_extractor.py
│   │   ├── filter_mapper.py
│   │   └── search_executor.py
│   └── schemas/
│       ├── __init__.py
│       └── search_schemas.py
└── tests/
    └── test_search.py
```

### 2. Communication Flow
1. User enters natural language query in frontend
2. Frontend sends query to Node.js backend
3. Node.js backend forwards to Python microservice
4. Python service processes with LangGraph workflow
5. Returns structured search parameters
6. Node.js backend executes search with existing APIs
7. Results returned to frontend

### 3. Python Service Endpoints
- `POST /api/parse-search` - Parse natural language search query
- `GET /health` - Health check endpoint

### 4. LangGraph Workflow Nodes
1. **Query Parser Node**: Understand search intent
2. **Entity Extractor Node**: Extract location, features, price, time
3. **Filter Mapper Node**: Map to API parameters
4. **Validation Node**: Ensure valid parameters

### 5. Example Queries to Support
- "Find parking near Taipei 101 under $10"
- "Show me covered spots with EV charging"
- "I need parking for tomorrow morning near the mall"
- "Cheapest parking within 500m"
- "找停車位在台北101附近" (multilingual support)

### 6. Technology Stack
- **Python**: 3.9+
- **Framework**: FastAPI
- **LangGraph**: Latest version
- **LLM**: OpenAI GPT-4 or Claude
- **Deployment**: Docker container

### 7. Integration with Node.js Backend
- Add axios call to Python service
- Create new route `/api/search/natural`
- Handle errors and fallbacks
