"""FastAPI application for Natural Language Search Service"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import uvicorn

from src.config import config
from src.schemas.search_schemas import SearchQuery, ParsedSearchResponse, HealthResponse
from src.workflows.search_workflow import search_workflow
from src import __version__

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting Natural Language Search Service")
    try:
        config.validate()
        logger.info(f"Using LLM model: {config.LLM_MODEL}")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Natural Language Search Service")

# Create FastAPI app
app = FastAPI(
    title="Natural Language Search Service",
    description="LangGraph-powered natural language search for parking spots",
    version=__version__,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - returns service information"""
    return HealthResponse(
        status="healthy",
        version=__version__,
        llm_model=config.LLM_MODEL,
        timestamp=datetime.now()
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=__version__,
        llm_model=config.LLM_MODEL,
        timestamp=datetime.now()
    )

@app.post("/api/parse-search", response_model=ParsedSearchResponse)
async def parse_search(search_query: SearchQuery):
    """
    Parse a natural language search query into structured filters
    
    Examples:
    - "Find parking near Taipei 101 under $10"
    - "Show me covered spots with EV charging"
    - "I need parking for tomorrow morning near the mall"
    """
    try:
        logger.info(f"Processing search query: {search_query.query}")
        
        # Process the search query through LangGraph workflow
        result = await search_workflow.process_search(
            query=search_query.query,
            user_location=search_query.user_location,
            language=search_query.language
        )
        
        # Convert to response schema
        response = ParsedSearchResponse(**result)
        
        if response.success:
            logger.info(f"Successfully parsed query: {response.explanation}")
        else:
            logger.warning(f"Failed to parse query: {response.error}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing search query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/examples")
async def get_examples():
    """Get example queries for testing"""
    return {
        "examples": [
            {
                "query": "Find parking near Taipei 101 under $10",
                "description": "Location-based search with price constraint"
            },
            {
                "query": "Show me covered spots with EV charging within 500m",
                "description": "Feature-based search with distance constraint"
            },
            {
                "query": "I need parking for tomorrow 2pm for 3 hours",
                "description": "Time-based search with duration"
            },
            {
                "query": "Cheapest parking near the mall",
                "description": "Price-optimized search"
            },
            {
                "query": "找停車位在台北101附近",
                "description": "Multilingual search (Chinese)"
            },
            {
                "query": "Handicap accessible parking near NTU",
                "description": "Accessibility-focused search"
            }
        ]
    }

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "app:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower()
    )
