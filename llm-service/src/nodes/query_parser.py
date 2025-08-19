"""Query Parser Node - Understands the intent of the search query"""

from typing import Dict, Any
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from src.config import config
import json
import logging

logger = logging.getLogger(__name__)

class QueryParserNode:
    def __init__(self):
        # Initialize LLM based on config
        if config.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                model=config.LLM_MODEL,
                temperature=config.TEMPERATURE,
                api_key=config.OPENAI_API_KEY
            )
        elif config.ANTHROPIC_API_KEY:
            self.llm = ChatAnthropic(
                model=config.LLM_MODEL,
                temperature=config.TEMPERATURE,
                api_key=config.ANTHROPIC_API_KEY
            )
        else:
            raise ValueError("No LLM API key configured")
    
    async def parse_intent(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Parse the intent from the search query"""
        query = state.get("query", "")
        
        system_prompt = """You are a parking search intent classifier. Analyze the user's query and determine their intent.

Possible intents:
- find_parking: User wants to find parking spots
- check_availability: User wants to check if specific spots are available
- get_directions: User wants directions to a parking spot
- price_inquiry: User is asking about parking prices
- feature_inquiry: User is asking about parking features

Return a JSON object with:
{
    "intent_type": "the intent type",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
}"""

        user_prompt = f"Query: {query}"
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            # Parse the JSON response
            result = json.loads(response.content)
            
            # Update state
            state["intent"] = {
                "intent_type": result.get("intent_type", "find_parking"),
                "confidence": result.get("confidence", 0.8),
                "reasoning": result.get("reasoning", "")
            }
            
            logger.info(f"Parsed intent: {state['intent']}")
            
        except Exception as e:
            logger.error(f"Error parsing intent: {e}")
            state["intent"] = {
                "intent_type": "find_parking",
                "confidence": 0.5,
                "reasoning": "Error in parsing, defaulting to find_parking"
            }
            state["error"] = str(e)
        
        return state
