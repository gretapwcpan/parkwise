"""Filter Mapper Node - Maps extracted entities to API filters"""

from typing import Dict, Any, Optional
import logging
from datetime import datetime
import httpx
from src.config import config

logger = logging.getLogger(__name__)

class FilterMapperNode:
    def __init__(self):
        self.geocoding_api_url = "https://api.mapbox.com/geocoding/v5/mapbox.places"
        # In production, this would come from config
        self.mapbox_token = None
    
    async def map_to_filters(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Map extracted entities to search filters"""
        entities = state.get("entities", {})
        user_location = state.get("user_location", {})
        
        try:
            # Initialize filters
            filters = {
                "available": True,  # Default to showing only available spots
                "radius": entities.get("radius", 1000),
                "features": []
            }
            
            # Map location to coordinates
            if entities.get("location"):
                # In a real implementation, we would geocode the location
                # For now, we'll use a mock geocoding
                coords = await self._geocode_location(entities["location"])
                if coords:
                    filters["lat"] = coords["lat"]
                    filters["lng"] = coords["lng"]
                else:
                    # Fall back to user location if geocoding fails
                    if user_location:
                        filters["lat"] = user_location.get("lat")
                        filters["lng"] = user_location.get("lng")
            elif user_location:
                # Use user's current location if no location specified
                filters["lat"] = user_location.get("lat")
                filters["lng"] = user_location.get("lng")
            
            # Map price constraints
            if entities.get("max_price") is not None:
                filters["max_price"] = float(entities["max_price"])
            if entities.get("min_price") is not None:
                filters["min_price"] = float(entities["min_price"])
            
            # Map features
            if entities.get("features"):
                filters["features"] = self._normalize_features(entities["features"])
            
            # Map time constraints
            if entities.get("time_start"):
                filters["start_time"] = entities["time_start"].isoformat()
            if entities.get("time_end"):
                filters["end_time"] = entities["time_end"].isoformat()
            
            # Update state
            state["filters"] = filters
            logger.info(f"Mapped filters: {filters}")
            
        except Exception as e:
            logger.error(f"Error mapping filters: {e}")
            state["filters"] = {
                "available": True,
                "radius": 1000
            }
            state["error"] = str(e)
        
        return state
    
    async def _geocode_location(self, location: str) -> Optional[Dict[str, float]]:
        """Geocode a location string to coordinates"""
        # Mock geocoding for common Taipei locations
        mock_locations = {
            "taipei 101": {"lat": 25.0330, "lng": 121.5654},
            "taipei main station": {"lat": 25.0478, "lng": 121.5170},
            "xinyi district": {"lat": 25.0329, "lng": 121.5670},
            "da'an district": {"lat": 25.0261, "lng": 121.5462},
            "zhongshan district": {"lat": 25.0642, "lng": 121.5331},
            "ximending": {"lat": 25.0420, "lng": 121.5069},
            "national taiwan university": {"lat": 25.0174, "lng": 121.5405},
            "ntu": {"lat": 25.0174, "lng": 121.5405},
            "shilin night market": {"lat": 25.0880, "lng": 121.5240},
            "beitou": {"lat": 25.1321, "lng": 121.5011},
            "the mall": {"lat": 25.0330, "lng": 121.5654},  # Default to Taipei 101 area
        }
        
        # Check if location matches any mock location
        location_lower = location.lower()
        for key, coords in mock_locations.items():
            if key in location_lower:
                logger.info(f"Geocoded '{location}' to {coords}")
                return coords
        
        # In production, make actual geocoding API call
        if self.mapbox_token:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.geocoding_api_url}/{location}.json",
                        params={
                            "access_token": self.mapbox_token,
                            "limit": 1,
                            "proximity": "121.5654,25.0330"  # Taipei center
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("features"):
                            coords = data["features"][0]["geometry"]["coordinates"]
                            return {"lat": coords[1], "lng": coords[0]}
            except Exception as e:
                logger.error(f"Geocoding API error: {e}")
        
        logger.warning(f"Could not geocode location: {location}")
        return None
    
    def _normalize_features(self, features: list) -> list:
        """Normalize feature names to match API expectations"""
        feature_mapping = {
            # Charging
            "ev_charging": "ev_charging",
            "electric_charging": "ev_charging",
            "tesla_charging": "tesla_supercharger",
            "charging": "ev_charging",
            
            # Coverage
            "covered": "covered",
            "indoor": "covered",
            "uncovered": "uncovered",
            "outdoor": "uncovered",
            
            # Accessibility
            "handicap": "handicap_accessible",
            "disabled": "handicap_accessible",
            "accessible": "handicap_accessible",
            "wheelchair": "handicap_accessible",
            
            # Security
            "secure": "security_patrol",
            "guarded": "security_patrol",
            "surveillance": "cctv",
            "camera": "cctv",
            
            # Time
            "24/7": "24_7_access",
            "24_hours": "24_7_access",
            "overnight": "overnight_allowed",
            
            # Vehicle types
            "motorcycle": "motorcycle_allowed",
            "bike": "motorcycle_allowed",
            "bicycle": "bicycle_parking",
            
            # Space size
            "wide_space": "wide_space",
            "large_vehicle": "wide_space",
            "compact": "compact_only",
            
            # Service
            "valet": "valet_service",
            "self_park": "self_park"
        }
        
        normalized = []
        for feature in features:
            feature_lower = feature.lower().replace(" ", "_")
            if feature_lower in feature_mapping:
                normalized.append(feature_mapping[feature_lower])
            else:
                # Keep original if no mapping found
                normalized.append(feature_lower)
        
        # Remove duplicates
        return list(set(normalized))
