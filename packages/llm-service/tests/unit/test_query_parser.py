"""
Unit tests for the QueryParser node.
"""
import pytest
import json
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys

# Mock the problematic imports before they're imported
sys.modules['langchain_core'] = MagicMock()
sys.modules['langchain_core.messages'] = MagicMock()
sys.modules['langchain_openai'] = MagicMock()
sys.modules['langchain_anthropic'] = MagicMock()
sys.modules['langchain_aws'] = MagicMock()
sys.modules['openai'] = MagicMock()
sys.modules['boto3'] = MagicMock()

# Now we can import the module
from src.nodes.query_parser import QueryParserNode


class TestQueryParserNode:
    """Test suite for QueryParserNode functionality."""
    
    @pytest.fixture
    def mock_config(self):
        """Mock configuration for testing."""
        with patch('src.nodes.query_parser.config') as mock_cfg:
            mock_cfg.LLM_API_TYPE = "openai"
            mock_cfg.LLM_MODEL = "gpt-3.5-turbo"
            mock_cfg.TEMPERATURE = 0.7
            mock_cfg.OPENAI_API_KEY = "test-key"
            yield mock_cfg
    
    @pytest.fixture
    def parser_node(self, mock_config):
        """Create a QueryParserNode instance for testing."""
        with patch('src.nodes.query_parser.ChatOpenAI') as mock_llm:
            mock_llm.return_value = MagicMock()
            node = QueryParserNode()
            return node
    
    @pytest.mark.asyncio
    async def test_parse_intent_search(self, parser_node):
        """Test parsing search intent from query."""
        state = {"query": "Find parking near downtown"}
        
        # Mock the LLM response
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "find_parking",
            "confidence": 0.95,
            "reasoning": "User wants to find parking spots"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert "intent" in result
        assert result["intent"]["intent_type"] == "find_parking"
        assert result["intent"]["confidence"] == 0.95
        assert "reasoning" in result["intent"]
    
    @pytest.mark.asyncio
    async def test_parse_intent_availability(self, parser_node):
        """Test parsing availability check intent."""
        state = {"query": "Is spot A123 available?"}
        
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "check_availability",
            "confidence": 0.9,
            "reasoning": "User checking specific spot availability"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert result["intent"]["intent_type"] == "check_availability"
        assert result["intent"]["confidence"] == 0.9
    
    @pytest.mark.asyncio
    async def test_parse_intent_directions(self, parser_node):
        """Test parsing directions intent."""
        state = {"query": "How do I get to parking lot B?"}
        
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "get_directions",
            "confidence": 0.88,
            "reasoning": "User needs navigation assistance"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert result["intent"]["intent_type"] == "get_directions"
    
    @pytest.mark.asyncio
    async def test_parse_intent_price_inquiry(self, parser_node):
        """Test parsing price inquiry intent."""
        state = {"query": "What are the parking rates?"}
        
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "price_inquiry",
            "confidence": 0.92,
            "reasoning": "User asking about pricing"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert result["intent"]["intent_type"] == "price_inquiry"
    
    @pytest.mark.asyncio
    async def test_parse_intent_feature_inquiry(self, parser_node):
        """Test parsing feature inquiry intent."""
        state = {"query": "Does this parking have EV charging?"}
        
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "feature_inquiry",
            "confidence": 0.85,
            "reasoning": "User asking about specific features"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert result["intent"]["intent_type"] == "feature_inquiry"
    
    @pytest.mark.asyncio
    async def test_handle_llm_error(self, parser_node):
        """Test error handling when LLM fails."""
        state = {"query": "Find parking"}
        
        # Mock LLM to raise an exception
        parser_node.llm.ainvoke = AsyncMock(side_effect=Exception("LLM API Error"))
        
        result = await parser_node.parse_intent(state)
        
        assert "intent" in result
        assert result["intent"]["intent_type"] == "find_parking"  # Default
        assert result["intent"]["confidence"] == 0.5  # Low confidence due to error
        assert "error" in result
        assert "LLM API Error" in result["error"]
    
    @pytest.mark.asyncio
    async def test_handle_invalid_json_response(self, parser_node):
        """Test handling of invalid JSON from LLM."""
        state = {"query": "Find parking"}
        
        mock_response = MagicMock()
        mock_response.content = "This is not valid JSON"
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert "intent" in result
        assert result["intent"]["intent_type"] == "find_parking"  # Default
        assert result["intent"]["confidence"] == 0.5
        assert "error" in result
    
    @pytest.mark.asyncio
    async def test_empty_query_handling(self, parser_node):
        """Test handling of empty query."""
        state = {"query": ""}
        
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "find_parking",
            "confidence": 0.3,
            "reasoning": "No clear intent from empty query"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert result["intent"]["confidence"] < 0.5
    
    @pytest.mark.asyncio
    async def test_state_preservation(self, parser_node):
        """Test that existing state is preserved."""
        state = {
            "query": "Find parking",
            "existing_data": "should_be_preserved",
            "user_id": "12345"
        }
        
        mock_response = MagicMock()
        mock_response.content = json.dumps({
            "intent_type": "find_parking",
            "confidence": 0.9,
            "reasoning": "User wants parking"
        })
        
        parser_node.llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await parser_node.parse_intent(state)
        
        assert "existing_data" in result
        assert result["existing_data"] == "should_be_preserved"
        assert "user_id" in result
        assert result["user_id"] == "12345"
        assert "intent" in result
    
    def test_bedrock_initialization(self, mock_config):
        """Test initialization with AWS Bedrock configuration."""
        mock_config.LLM_API_TYPE = "bedrock"
        mock_config.AWS_ACCESS_KEY_ID = "test-key"
        mock_config.AWS_SECRET_ACCESS_KEY = "test-secret"
        mock_config.AWS_SESSION_TOKEN = "test-token"
        mock_config.AWS_REGION = "us-east-1"
        mock_config.BEDROCK_MODEL_ID = "anthropic.claude-v2"
        mock_config.TEMPERATURE = 0.7
        
        with patch('src.nodes.query_parser.boto3.Session') as mock_session:
            # Mock the ChatBedrock import that happens inside the if statement
            with patch('langchain_aws.ChatBedrock') as mock_bedrock:
                mock_session.return_value.client.return_value = MagicMock()
                mock_bedrock.return_value = MagicMock()
                
                node = QueryParserNode()
                
                mock_session.assert_called_once()
                mock_bedrock.assert_called_once()
    
    def test_openai_compatible_initialization(self, mock_config):
        """Test initialization with OpenAI-compatible API."""
        mock_config.LLM_API_TYPE = "openai-compatible"
        mock_config.LLM_API_KEY = "test-key"
        mock_config.LLM_API_BASE_URL = "http://localhost:8000"
        
        with patch('src.nodes.query_parser.ChatOpenAI') as mock_openai:
            mock_openai.return_value = MagicMock()
            
            node = QueryParserNode()
            
            mock_openai.assert_called_with(
                model=mock_config.LLM_MODEL,
                temperature=mock_config.TEMPERATURE,
                api_key=mock_config.LLM_API_KEY,
                base_url=mock_config.LLM_API_BASE_URL
            )
    
    def test_anthropic_initialization(self, mock_config):
        """Test initialization with Anthropic API."""
        mock_config.LLM_API_TYPE = "anthropic"
        mock_config.ANTHROPIC_API_KEY = "test-anthropic-key"
        
        with patch('src.nodes.query_parser.ChatAnthropic') as mock_anthropic:
            mock_anthropic.return_value = MagicMock()
            
            node = QueryParserNode()
            
            mock_anthropic.assert_called_with(
                model=mock_config.LLM_MODEL,
                temperature=mock_config.TEMPERATURE,
                api_key=mock_config.ANTHROPIC_API_KEY
            )
    
    def test_invalid_api_type(self, mock_config):
        """Test that invalid API type raises error."""
        mock_config.LLM_API_TYPE = "invalid_type"
        
        with pytest.raises(ValueError, match="Invalid LLM_API_TYPE"):
            QueryParserNode()
