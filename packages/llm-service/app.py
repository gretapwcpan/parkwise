"""
Unified LLM Service for Parkwise
Supports three scenarios:
1. OpenAI-compatible API (cloud or local endpoints)
2. vLLM with GPU (OpenAI GPT-OSS 20B)
3. llama.cpp with CPU
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Parkwise Unified LLM Service",
    description="Supports API, vLLM (GPU), and llama.cpp (CPU) modes",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class SearchRequest(BaseModel):
    query: str

class SearchResponse(BaseModel):
    success: bool
    query: str
    intent: Dict[str, Any]
    entities: Dict[str, Any]
    filters: Dict[str, Any]
    mode: str
    error: Optional[str] = None

class VibeRequest(BaseModel):
    lat: float
    lng: float
    radius: int = 500
    poi_data: list = []

class VibeResponse(BaseModel):
    success: bool
    vibe: Dict[str, Any]
    parking: Dict[str, Any]
    transport: list
    mode: str
    error: Optional[str] = None

# Prompts
SEARCH_PROMPT = """You are a parking search assistant. Analyze the user's query and extract structured information.

Query: "{query}"

Return a JSON object with:
{{
  "intent": {{
    "type": "find_parking|check_availability|get_directions|price_inquiry",
    "confidence": 0.0-1.0
  }},
  "entities": {{
    "location": "specific place if mentioned",
    "price_range": "budget constraints",
    "duration": "hourly|daily|monthly",
    "features": ["list", "of", "features"],
    "time": "when needed"
  }},
  "filters": {{
    "max_price": null or number,
    "min_price": null or number,
    "required_features": [],
    "radius": 500
  }}
}}

Return ONLY valid JSON."""

VIBE_PROMPT = """Analyze this location and provide parking insights.

Location: ({lat}, {lng})
Nearby POIs: {pois}

Return a JSON object with:
{{
  "vibe": {{
    "score": 1-10,
    "summary": "brief description",
    "hashtags": ["#tag1", "#tag2", "#tag3"]
  }},
  "parking": {{
    "difficulty": 1-10,
    "level": "Easy|Moderate|Hard",
    "tips": ["tip1", "tip2"],
    "hashtags": ["#parking-tags"]
  }},
  "transport": [
    {{"method": "Car|Public|Walk", "reason": "why"}}
  ]
}}

Return ONLY valid JSON."""

# Global LLM provider instance
llm_provider = None
current_mode = None

def detect_and_initialize_llm():
    """Auto-detect and initialize the best available LLM provider"""
    global llm_provider, current_mode
    
    # Check environment for explicit mode
    mode = os.getenv("LLM_MODE", "auto").lower()
    
    if mode == "api" or (mode == "auto" and os.getenv("API_BASE_URL")):
        # Scenario 1: OpenAI-compatible API
        try:
            from llm_providers.api_provider import OpenAICompatibleProvider
            llm_provider = OpenAICompatibleProvider()
            current_mode = "api"
            logger.info(f"✓ Initialized API mode with endpoint: {os.getenv('API_BASE_URL')}")
            return
        except Exception as e:
            logger.error(f"Failed to initialize API provider: {e}")
            if mode == "api":
                raise
    
    if mode == "vllm" or mode == "auto":
        # Scenario 2: vLLM with GPU
        try:
            import torch
            if torch.cuda.is_available():
                from llm_providers.vllm_provider import VLLMProvider
                llm_provider = VLLMProvider()
                current_mode = "vllm"
                logger.info(f"✓ Initialized vLLM mode with model: {os.getenv('VLLM_MODEL', 'openai/gpt-oss-20b')}")
                return
        except Exception as e:
            logger.error(f"Failed to initialize vLLM provider: {e}")
            if mode == "vllm":
                raise
    
    if mode == "llamacpp" or mode == "auto":
        # Scenario 3: llama.cpp with CPU
        try:
            from llm_providers.llamacpp_provider import LlamaCppProvider
            llm_provider = LlamaCppProvider()
            current_mode = "llamacpp"
            logger.info(f"✓ Initialized llama.cpp mode")
            return
        except Exception as e:
            logger.error(f"Failed to initialize llama.cpp provider: {e}")
            if mode == "llamacpp":
                raise
    
    # If we get here, no provider could be initialized
    raise RuntimeError("No LLM provider could be initialized. Please check your configuration.")

# Initialize LLM on startup
try:
    detect_and_initialize_llm()
except Exception as e:
    logger.error(f"Failed to initialize LLM service: {e}")
    logger.info("Service will start but LLM features will be unavailable")

def extract_json(text: str) -> Dict:
    """Extract JSON from LLM response"""
    try:
        # Try to find JSON in the response
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return json.loads(text)
    except:
        # Fallback response
        return {}

@app.get("/")
async def root():
    """Service information endpoint"""
    return {
        "service": "Parkwise Unified LLM Service",
        "version": "2.0.0",
        "mode": current_mode,
        "status": "ready" if llm_provider else "no_provider",
        "endpoints": ["/api/search", "/api/vibe/analyze", "/health", "/config"],
        "modes": {
            "api": "OpenAI-compatible API (cloud or local)",
            "vllm": "vLLM with GPU (OpenAI GPT-OSS 20B)",
            "llamacpp": "llama.cpp with CPU"
        }
    }

@app.get("/config")
async def get_config():
    """Get current configuration"""
    config = {
        "mode": current_mode,
        "available": llm_provider is not None
    }
    
    if current_mode == "api":
        config["api"] = {
            "endpoint": os.getenv("API_BASE_URL"),
            "model": os.getenv("API_MODEL")
        }
    elif current_mode == "vllm":
        config["vllm"] = {
            "model": os.getenv("VLLM_MODEL", "openai/gpt-oss-20b"),
            "gpu_memory": os.getenv("VLLM_GPU_MEMORY", "0.9")
        }
    elif current_mode == "llamacpp":
        config["llamacpp"] = {
            "model": os.getenv("LLAMACPP_MODEL_PATH"),
            "threads": os.getenv("LLAMACPP_THREADS", "8")
        }
    
    return config

@app.post("/api/search", response_model=SearchResponse)
async def search_parking(request: SearchRequest):
    """Process natural language parking search queries"""
    if not llm_provider:
        return SearchResponse(
            success=False,
            query=request.query,
            intent={},
            entities={},
            filters={},
            mode="none",
            error="No LLM provider available"
        )
    
    try:
        # Format prompt
        prompt = SEARCH_PROMPT.format(query=request.query)
        
        # Generate response
        response_text = llm_provider.generate_structured(
            prompt,
            system_prompt="You are a parking assistant. Always return valid JSON."
        )
        
        # Parse JSON response
        result = extract_json(response_text)
        
        return SearchResponse(
            success=True,
            query=request.query,
            intent=result.get("intent", {"type": "find_parking", "confidence": 0.8}),
            entities=result.get("entities", {}),
            filters=result.get("filters", {"radius": 500}),
            mode=current_mode
        )
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            intent={"type": "find_parking", "confidence": 0.5},
            entities={},
            filters={"radius": 500},
            mode=current_mode,
            error=str(e)
        )

@app.post("/api/vibe/analyze", response_model=VibeResponse)
async def analyze_vibe(request: VibeRequest):
    """Analyze location vibe and parking difficulty"""
    if not llm_provider:
        return VibeResponse(
            success=False,
            vibe={},
            parking={},
            transport=[],
            mode="none",
            error="No LLM provider available"
        )
    
    try:
        # Format POI data
        pois = ", ".join([
            f"{poi.get('name', 'Unknown')} ({poi.get('type', 'place')})"
            for poi in request.poi_data[:10]
        ]) if request.poi_data else "No POI data"
        
        # Format prompt
        prompt = VIBE_PROMPT.format(
            lat=request.lat,
            lng=request.lng,
            pois=pois
        )
        
        # Generate response
        response_text = llm_provider.generate_structured(
            prompt,
            system_prompt="You are a location analyst. Always return valid JSON."
        )
        
        # Parse JSON response
        result = extract_json(response_text)
        
        return VibeResponse(
            success=True,
            vibe=result.get("vibe", {
                "score": 5,
                "summary": "Average location",
                "hashtags": ["#parking"]
            }),
            parking=result.get("parking", {
                "difficulty": 5,
                "level": "Moderate",
                "tips": ["Check peak hours"],
                "hashtags": ["#street-parking"]
            }),
            transport=result.get("transport", [
                {"method": "Car", "reason": "Most convenient"}
            ]),
            mode=current_mode
        )
        
    except Exception as e:
        logger.error(f"Vibe analysis error: {e}")
        return VibeResponse(
            success=False,
            vibe={"score": 5, "summary": "Analysis failed", "hashtags": []},
            parking={"difficulty": 5, "level": "Unknown", "tips": [], "hashtags": []},
            transport=[],
            mode=current_mode,
            error=str(e)
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health = {
        "status": "healthy" if llm_provider else "degraded",
        "mode": current_mode,
        "provider_available": llm_provider is not None
    }
    
    if llm_provider and hasattr(llm_provider, 'health_check'):
        health["provider_status"] = llm_provider.health_check()
    
    return health

@app.post("/reload")
async def reload_provider():
    """Reload LLM provider (useful for switching modes)"""
    try:
        detect_and_initialize_llm()
        return {
            "success": True,
            "mode": current_mode,
            "message": f"Reloaded with {current_mode} mode"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    logger.info(f"Starting Unified LLM Service on port {port}")
    logger.info(f"Mode: {current_mode}")
    uvicorn.run(app, host="0.0.0.0", port=port)
