"""LangGraph workflow for natural language search processing"""

from typing import Dict, Any, TypedDict, Optional
from langgraph.graph import StateGraph, END
from src.nodes.query_parser import QueryParserNode
from src.nodes.entity_extractor import EntityExtractorNode
from src.nodes.filter_mapper import FilterMapperNode
import logging

logger = logging.getLogger(__name__)

class SearchState(TypedDict):
    """State definition for the search workflow"""
    query: str
    user_location: Optional[Dict[str, float]]
    language: Optional[str]
    intent: Optional[Dict[str, Any]]
    entities: Optional[Dict[str, Any]]
    filters: Optional[Dict[str, Any]]
    error: Optional[str]
    explanation: Optional[str]

class SearchWorkflow:
    def __init__(self):
        # Initialize nodes
        self.query_parser = QueryParserNode()
        self.entity_extractor = EntityExtractorNode()
        self.filter_mapper = FilterMapperNode()
        
        # Build the workflow
        self.workflow = self._build_workflow()
        self.app = self.workflow.compile()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        # Create a new graph
        workflow = StateGraph(SearchState)
        
        # Add nodes
        workflow.add_node("parse_intent", self.query_parser.parse_intent)
        workflow.add_node("extract_entities", self.entity_extractor.extract_entities)
        workflow.add_node("map_filters", self.filter_mapper.map_to_filters)
        workflow.add_node("validate_result", self._validate_result)
        
        # Define the flow
        workflow.set_entry_point("parse_intent")
        
        # Add edges
        workflow.add_edge("parse_intent", "extract_entities")
        workflow.add_edge("extract_entities", "map_filters")
        workflow.add_edge("map_filters", "validate_result")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "validate_result",
            self._should_end,
            {
                "end": END,
                "retry": "parse_intent"  # Could retry on validation failure
            }
        )
        
        return workflow
    
    async def _validate_result(self, state: SearchState) -> SearchState:
        """Validate the final result and add explanation"""
        try:
            # Check if we have minimum required data
            filters = state.get("filters", {})
            
            if not filters.get("lat") and not filters.get("lng"):
                # No location could be determined
                state["error"] = "Could not determine search location. Please specify a location or enable location services."
            
            # Generate explanation
            explanation_parts = []
            
            if state.get("intent", {}).get("intent_type") == "find_parking":
                explanation_parts.append("Searching for parking spots")
            
            if filters.get("lat") and filters.get("lng"):
                location_name = state.get("entities", {}).get("location", "your location")
                explanation_parts.append(f"near {location_name}")
            
            if filters.get("max_price"):
                explanation_parts.append(f"under ${filters['max_price']}/hour")
            
            if filters.get("features"):
                features_str = ", ".join(filters["features"])
                explanation_parts.append(f"with {features_str}")
            
            if filters.get("start_time"):
                explanation_parts.append(f"starting {filters['start_time']}")
            
            state["explanation"] = " ".join(explanation_parts)
            
        except Exception as e:
            logger.error(f"Validation error: {e}")
            state["error"] = str(e)
        
        return state
    
    def _should_end(self, state: SearchState) -> str:
        """Determine if workflow should end or retry"""
        # For now, always end. In production, could implement retry logic
        return "end"
    
    async def process_search(self, query: str, user_location: Optional[Dict[str, float]] = None, language: str = "en") -> Dict[str, Any]:
        """Process a natural language search query"""
        # Initialize state
        initial_state = {
            "query": query,
            "user_location": user_location,
            "language": language
        }
        
        try:
            # Run the workflow
            result = await self.app.ainvoke(initial_state)
            
            # Format the response
            return {
                "success": not bool(result.get("error")),
                "original_query": query,
                "intent": result.get("intent", {}),
                "entities": result.get("entities", {}),
                "filters": result.get("filters", {}),
                "explanation": result.get("explanation", ""),
                "error": result.get("error")
            }
            
        except Exception as e:
            logger.error(f"Workflow processing error: {e}")
            return {
                "success": False,
                "original_query": query,
                "intent": {"intent_type": "unknown", "confidence": 0},
                "entities": {},
                "filters": {},
                "explanation": "",
                "error": str(e)
            }

# Singleton instance
search_workflow = SearchWorkflow()
