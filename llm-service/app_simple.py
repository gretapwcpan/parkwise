#!/usr/bin/env python3
"""Simplified FastAPI app for testing OpenAI-compatible API"""

import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn
import logging
import httpx
from dotenv import load_dotenv

# Load environment from backend/.env
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', '.env')
load_dotenv(backend_env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="LLM Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class SearchRequest(BaseModel):
    query: str
    userLocation: Optional[Dict[str, float]] = None
    language: Optional[str] = "en"

class SearchResponse(BaseModel):
    success: bool
    query: str
    explanation: str
    filters: Dict[str, Any]
    error: Optional[str] = None

# API configuration
API_BASE_URL = os.getenv("LLM_API_BASE_URL", "https://api.openai.com/v1")
API_KEY = os.getenv("LLM_API_KEY", os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("LLM_MODEL", "gpt-4")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "llm-service",
        "api_configured": bool(API_KEY),
        "model": MODEL
    }

@app.post("/api/parse-search")
async def parse_search(request: SearchRequest):
    """Parse natural language search query"""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        # Call the OpenAI-compatible API
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            }
            
            # Create the prompt
            system_prompt = """You are a parking search assistant. Parse the user's query and extract:
1. Location (if mentioned)
2. Price constraints (max_price, min_price)
3. Features requested (covered, ev_charging, handicap, etc.)
4. Time constraints (start_time, duration)

Return a JSON object with these fields:
{
    "location": "location name or null",
    "max_price": number or null,
    "min_price": number or null,
    "features": ["list", "of", "features"],
    "radius": number in meters (default 1000),
    "explanation": "brief explanation of the search"
}"""

            user_prompt = f"Query: {request.query}"
            if request.userLocation:
                user_prompt += f"\nUser is at: lat={request.userLocation.get('lat')}, lng={request.userLocation.get('lng')}"
            
            data = {
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 200
            }
            
            response = await client.post(
                f"{API_BASE_URL}/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse the JSON response
                import json
                try:
                    parsed = json.loads(content)
                except:
                    # Fallback if JSON parsing fails
                    parsed = {
                        "location": None,
                        "max_price": None,
                        "features": [],
                        "explanation": "Searching for parking spots"
                    }
                
                # Build filters
                filters = {
                    "available": True,
                    "radius": parsed.get("radius", 1000)
                }
                
                if parsed.get("location"):
                    # Mock geocoding for demo
                    filters["lat"] = request.userLocation.get("lat", 25.0330) if request.userLocation else 25.0330
                    filters["lng"] = request.userLocation.get("lng", 121.5654) if request.userLocation else 121.5654
                
                if parsed.get("max_price"):
                    filters["max_price"] = parsed["max_price"]
                
                if parsed.get("features"):
                    filters["features"] = parsed["features"]
                
                return SearchResponse(
                    success=True,
                    query=request.query,
                    explanation=parsed.get("explanation", "Searching for parking spots"),
                    filters=filters
                )
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except Exception as e:
        logger.error(f"Error processing search: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            explanation="",
            filters={},
            error=str(e)
        )

@app.get("/api/examples")
async def get_examples():
    """Get example search queries"""
    return {
        "examples": [
            "Find parking near Taipei 101 under $10",
            "Show me covered spots with EV charging within 500m",
            "I need parking for tomorrow 2pm for 3 hours",
            "Cheapest parking near the mall",
            "Handicap accessible parking near NTU"
        ]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting LLM service on {host}:{port}")
    logger.info(f"Using API: {API_BASE_URL}")
    logger.info(f"Model: {MODEL}")
    
    uvicorn.run(app, host=host, port=port)
