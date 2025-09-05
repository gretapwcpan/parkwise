"""Query Parser Node - Understands the intent of the search query"""

from typing import Dict, Any
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from openai import OpenAI
from src.config import config
import json
import logging
import boto3

logger = logging.getLogger(__name__)

class QueryParserNode:
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
