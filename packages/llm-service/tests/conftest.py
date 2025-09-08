"""
Shared test fixtures and configuration for pytest.
"""
import os
import sys
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any, Generator
from pathlib import Path
from dotenv import load_dotenv

# Add src to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'src'))

# Load test environment variables
test_env_path = project_root / '.env.test'
if test_env_path.exists():
    load_dotenv(test_env_path)
else:
    # Fallback test environment setup
    os.environ['TESTING'] = 'true'
    os.environ['LLM_MODE'] = 'api'
    os.environ['API_BASE_URL'] = 'http://test-api.example.com'
    os.environ['API_KEY'] = 'test-api-key'
    os.environ['MODEL_NAME'] = 'test-model'
    os.environ['MOCK_LLM_RESPONSES'] = 'true'


@pytest.fixture(scope='session')
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_llm_response():
    """Mock LLM API response."""
    return {
        "choices": [{
            "message": {
                "content": '{"intent": "search", "location": "downtown", "filters": {"price": "low"}}'
            }
        }]
    }


@pytest.fixture
def mock_search_query():
    """Sample search query for testing."""
    return "Find cheap parking near downtown coffee shops"


@pytest.fixture
def mock_parking_data():
    """Sample parking spot data."""
    return [
        {
            "id": "spot-001",
            "name": "Downtown Garage A",
            "address": "123 Main St",
            "lat": 40.7128,
            "lng": -74.0060,
            "price": 3.50,
            "available": True,
            "features": ["covered", "security"],
            "distance": 0.5
        },
        {
            "id": "spot-002",
            "name": "Street Parking B",
            "address": "456 Oak Ave",
            "lat": 40.7130,
            "lng": -74.0062,
            "price": 2.00,
            "available": True,
            "features": ["street"],
            "distance": 0.3
        }
    ]


@pytest.fixture
def mock_api_client():
    """Mock API client for LLM providers."""
    client = Mock()
    client.chat = Mock()
    client.chat.completions = Mock()
    client.chat.completions.create = AsyncMock(
        return_value=Mock(
            choices=[Mock(
                message=Mock(
                    content='{"result": "test response"}'
                )
            )]
        )
    )
    return client


@pytest.fixture
def mock_vllm_engine():
    """Mock vLLM engine."""
    engine = Mock()
    engine.generate = AsyncMock(
        return_value=Mock(
            outputs=[Mock(
                text='{"result": "test response"}'
            )]
        )
    )
    return engine


@pytest.fixture
def sample_search_state():
    """Sample state for search workflow."""
    return {
        "query": "Find parking near Starbucks",
        "parsed_query": {
            "intent": "search",
            "landmarks": ["Starbucks"],
            "filters": {}
        },
        "entities": {
            "location": "near Starbucks",
            "price_preference": None,
            "features": []
        },
        "search_filters": {
            "max_distance": 1.0,
            "min_rating": 3.0
        },
        "results": []
    }


@pytest.fixture
def mock_http_client():
    """Mock httpx client for API testing."""
    with patch('httpx.AsyncClient') as mock_client:
        instance = mock_client.return_value
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=None)
        instance.post = AsyncMock(
            return_value=Mock(
                status_code=200,
                json=lambda: {"status": "success", "data": {}}
            )
        )
        yield instance


@pytest.fixture
def sample_entity_extraction_prompt():
    """Sample prompt for entity extraction."""
    return """
    Extract entities from the following parking search query:
    Query: "Find cheap covered parking near the mall with EV charging"
    
    Return as JSON with:
    - location: extracted location reference
    - price_preference: low/medium/high/null
    - features: list of requested features
    - time_preference: specific time if mentioned
    """


@pytest.fixture
def sample_filter_mapping_prompt():
    """Sample prompt for filter mapping."""
    return """
    Convert the following entities to search filters:
    Entities: {
        "location": "downtown",
        "price_preference": "low",
        "features": ["covered", "security"]
    }
    
    Return as JSON with appropriate filter values.
    """


class MockLLMProvider:
    """Mock LLM provider for testing."""
    
    def __init__(self, default_response=None):
        self.default_response = default_response or '{"status": "success"}'
        self.call_count = 0
        self.last_prompt = None
    
    async def generate(self, prompt: str, **kwargs) -> str:
        self.call_count += 1
        self.last_prompt = prompt
        return self.default_response
    
    async def chat(self, messages: list, **kwargs) -> str:
        self.call_count += 1
        self.last_prompt = messages[-1]["content"] if messages else None
        return self.default_response


@pytest.fixture
def mock_llm_provider():
    """Create a mock LLM provider instance."""
    return MockLLMProvider()


@pytest.fixture
def cleanup_test_files():
    """Cleanup any test files created during tests."""
    test_files = []
    
    yield test_files
    
    # Cleanup
    for file_path in test_files:
        if os.path.exists(file_path):
            os.remove(file_path)


@pytest.fixture
def mock_environment_variables():
    """Mock environment variables for testing."""
    original_env = os.environ.copy()
    
    test_env = {
        'LLM_MODE': 'api',
        'API_BASE_URL': 'http://localhost:8000',
        'API_KEY': 'test-key-123',
        'MODEL_NAME': 'test-model',
        'MAX_TOKENS': '1000',
        'TEMPERATURE': '0.7'
    }
    
    os.environ.update(test_env)
    
    yield test_env
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)


# Markers for test categorization
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "llm: mark test as requiring LLM API"
    )
    config.addinivalue_line(
        "markers", "asyncio: mark test as async"
    )
