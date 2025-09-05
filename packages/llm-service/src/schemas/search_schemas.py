from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SearchQuery(BaseModel):
    """Input schema for natural language search"""
    query: str = Field(..., description="Natural language search query")
    user_location: Optional[Dict[str, float]] = Field(
        None, 
        description="User's current location (lat, lng)"
    )
    language: Optional[str] = Field("en", description="Language code")

class ExtractedEntities(BaseModel):
    """Entities extracted from the search query"""
    location: Optional[str] = Field(None, description="Location mentioned in query")
    location_coords: Optional[Dict[str, float]] = Field(None, description="Geocoded coordinates")
    features: Optional[List[str]] = Field(default_factory=list, description="Requested features")
    max_price: Optional[float] = Field(None, description="Maximum price per hour")
    min_price: Optional[float] = Field(None, description="Minimum price per hour")
    radius: Optional[int] = Field(None, description="Search radius in meters")
    time_start: Optional[datetime] = Field(None, description="Parking start time")
    time_end: Optional[datetime] = Field(None, description="Parking end time")
    duration: Optional[int] = Field(None, description="Parking duration in minutes")
    
class SearchFilters(BaseModel):
    """Filters to be used for the actual search"""
    lat: Optional[float] = Field(None, description="Latitude for search center")
    lng: Optional[float] = Field(None, description="Longitude for search center")
    radius: Optional[int] = Field(1000, description="Search radius in meters")
    max_price: Optional[float] = Field(None, description="Maximum price filter")
    min_price: Optional[float] = Field(None, description="Minimum price filter")
    features: Optional[List[str]] = Field(default_factory=list, description="Required features")
    available: Optional[bool] = Field(True, description="Only show available spots")
    start_time: Optional[str] = Field(None, description="ISO format start time")
    end_time: Optional[str] = Field(None, description="ISO format end time")

class SearchIntent(BaseModel):
    """Classified intent of the search"""
    intent_type: str = Field(..., description="Type of search intent")
    confidence: float = Field(..., description="Confidence score 0-1")
    
    class Config:
        json_schema_extra = {
            "example": {
                "intent_type": "find_parking",
                "confidence": 0.95
            }
        }

class ParsedSearchResponse(BaseModel):
    """Response from the natural language parser"""
    success: bool = Field(..., description="Whether parsing was successful")
    original_query: str = Field(..., description="Original search query")
    intent: SearchIntent = Field(..., description="Detected search intent")
    entities: ExtractedEntities = Field(..., description="Extracted entities")
    filters: SearchFilters = Field(..., description="Generated search filters")
    explanation: Optional[str] = Field(None, description="Explanation of parsing")
    error: Optional[str] = Field(None, description="Error message if parsing failed")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Service version")
    llm_model: str = Field(..., description="Active LLM model")
    timestamp: datetime = Field(..., description="Current timestamp")
