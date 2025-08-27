"""Entity Extractor Node - Extracts entities like location, price, features from the query"""

from typing import Dict, Any, List
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from src.config import config
import json
import logging
from datetime import datetime, timedelta
import re
import boto3

logger = logging.getLogger(__name__)

class EntityExtractorNode:
    def __init__(self):
        # Initialize LLM based on config
        if config.LLM_API_TYPE == "bedrock":
            # Use AWS Bedrock
            from langchain_aws import ChatBedrock
            
            # Configure AWS credentials if provided
            session_config = {}
            if config.AWS_ACCESS_KEY_ID and config.AWS_SECRET_ACCESS_KEY:
                session_config = {
                    'aws_access_key_id': config.AWS_ACCESS_KEY_ID,
                    'aws_secret_access_key': config.AWS_SECRET_ACCESS_KEY,
                }
                if config.AWS_SESSION_TOKEN:
                    session_config['aws_session_token'] = config.AWS_SESSION_TOKEN
            
            # Create boto3 session
            if session_config:
                session = boto3.Session(**session_config, region_name=config.AWS_REGION)
            else:
                # Use default credentials (IAM role, AWS CLI config, etc.)
                session = boto3.Session(region_name=config.AWS_REGION)
            
            # Initialize Bedrock client
            bedrock_client = session.client('bedrock-runtime')
            
            self.llm = ChatBedrock(
                client=bedrock_client,
                model_id=config.BEDROCK_MODEL_ID,
                model_kwargs={
                    "temperature": config.TEMPERATURE,
                    "max_tokens": 4096
                }
            )
            logger.info(f"Initialized Bedrock LLM with model: {config.BEDROCK_MODEL_ID}")
            
        elif config.LLM_API_TYPE == "openai-compatible":
            # Use OpenAI client with custom base URL
            self.llm = ChatOpenAI(
                model=config.LLM_MODEL,
                temperature=config.TEMPERATURE,
                api_key=config.LLM_API_KEY,
                base_url=config.LLM_API_BASE_URL
            )
        elif config.LLM_API_TYPE == "openai":
            self.llm = ChatOpenAI(
                model=config.LLM_MODEL,
                temperature=config.TEMPERATURE,
                api_key=config.OPENAI_API_KEY
            )
        elif config.LLM_API_TYPE == "anthropic":
            self.llm = ChatAnthropic(
                model=config.LLM_MODEL,
                temperature=config.TEMPERATURE,
                api_key=config.ANTHROPIC_API_KEY
            )
        else:
            raise ValueError(f"Invalid LLM_API_TYPE: {config.LLM_API_TYPE}")
        
        # Common parking features
        self.known_features = [
            "covered", "uncovered", "indoor", "outdoor",
            "ev_charging", "electric_charging", "tesla_charging",
            "handicap", "disabled", "accessible",
            "24/7", "24_hours", "overnight",
            "secure", "guarded", "surveillance",
            "valet", "self_park",
            "motorcycle", "bike", "bicycle",
            "wide_space", "compact", "large_vehicle"
        ]
    
    async def extract_entities(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Extract entities from the search query"""
        query = state.get("query", "")
        user_location = state.get("user_location", {})
        
        system_prompt = f"""You are a parking search entity extractor. Extract relevant information from the user's query.

Known parking features: {', '.join(self.known_features)}

Extract and return a JSON object with these fields (use null for missing values):
{{
    "location": "specific location or landmark mentioned",
    "features": ["list", "of", "requested", "features"],
    "max_price": null or number (per hour),
    "min_price": null or number (per hour),
    "radius": null or number (in meters, default 1000),
    "time_expressions": ["tomorrow morning", "2pm", etc],
    "duration_hours": null or number
}}

Examples:
- "cheap parking" -> max_price: 5
- "under $10" -> max_price: 10
- "within 500m" -> radius: 500
- "covered spot with EV charging" -> features: ["covered", "ev_charging"]
- "tomorrow 2pm for 3 hours" -> time_expressions: ["tomorrow 2pm"], duration_hours: 3
"""

        user_prompt = f"Query: {query}"
        if user_location:
            user_prompt += f"\nUser is currently at: lat={user_location.get('lat')}, lng={user_location.get('lng')}"
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            # Parse the JSON response
            result = json.loads(response.content)
            
            # Process time expressions
            time_start, time_end = self._parse_time_expressions(
                result.get("time_expressions", []),
                result.get("duration_hours")
            )
            
            # Update state with extracted entities
            state["entities"] = {
                "location": result.get("location"),
                "features": result.get("features", []),
                "max_price": result.get("max_price"),
                "min_price": result.get("min_price"),
                "radius": result.get("radius", 1000),
                "time_start": time_start,
                "time_end": time_end,
                "duration": result.get("duration_hours") * 60 if result.get("duration_hours") else None
            }
            
            logger.info(f"Extracted entities: {state['entities']}")
            
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            state["entities"] = {
                "location": None,
                "features": [],
                "max_price": None,
                "min_price": None,
                "radius": 1000,
                "time_start": None,
                "time_end": None,
                "duration": None
            }
            state["error"] = str(e)
        
        return state
    
    def _parse_time_expressions(self, expressions: List[str], duration_hours: float = None) -> tuple:
        """Parse time expressions into datetime objects"""
        if not expressions:
            return None, None
        
        now = datetime.now()
        time_start = None
        
        for expr in expressions:
            expr_lower = expr.lower()
            
            # Handle relative times
            if "tomorrow" in expr_lower:
                time_start = now.replace(hour=9, minute=0, second=0) + timedelta(days=1)
                # Extract specific time if mentioned
                time_match = re.search(r'(\d{1,2})\s*(am|pm)?', expr_lower)
                if time_match:
                    hour = int(time_match.group(1))
                    if time_match.group(2) == 'pm' and hour != 12:
                        hour += 12
                    elif time_match.group(2) == 'am' and hour == 12:
                        hour = 0
                    time_start = time_start.replace(hour=hour)
            
            elif "today" in expr_lower or re.match(r'^\d{1,2}\s*(am|pm)?', expr_lower):
                time_start = now
                time_match = re.search(r'(\d{1,2})\s*(am|pm)?', expr_lower)
                if time_match:
                    hour = int(time_match.group(1))
                    if time_match.group(2) == 'pm' and hour != 12:
                        hour += 12
                    elif time_match.group(2) == 'am' and hour == 12:
                        hour = 0
                    time_start = time_start.replace(hour=hour, minute=0, second=0)
            
            elif "now" in expr_lower:
                time_start = now
            
            elif "morning" in expr_lower:
                time_start = now.replace(hour=9, minute=0, second=0)
                if "tomorrow" in expr_lower:
                    time_start += timedelta(days=1)
            
            elif "afternoon" in expr_lower:
                time_start = now.replace(hour=14, minute=0, second=0)
                if "tomorrow" in expr_lower:
                    time_start += timedelta(days=1)
            
            elif "evening" in expr_lower:
                time_start = now.replace(hour=18, minute=0, second=0)
                if "tomorrow" in expr_lower:
                    time_start += timedelta(days=1)
        
        # Calculate end time based on duration
        time_end = None
        if time_start and duration_hours:
            time_end = time_start + timedelta(hours=duration_hours)
        
        return time_start, time_end
