"""Simple test script for the Natural Language Search service"""

import asyncio
import httpx
import json
from datetime import datetime

# Test queries
TEST_QUERIES = [
    {
        "query": "Find parking near Taipei 101 under $10",
        "user_location": {"lat": 25.0330, "lng": 121.5654}
    },
    {
        "query": "Show me covered spots with EV charging within 500m",
        "user_location": {"lat": 25.0330, "lng": 121.5654}
    },
    {
        "query": "I need parking for tomorrow 2pm for 3 hours",
        "user_location": None
    },
    {
        "query": "Cheapest parking near the mall",
        "user_location": {"lat": 25.0330, "lng": 121.5654}
    },
    {
        "query": "Handicap accessible parking near NTU",
        "user_location": None
    }
]

async def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check ===")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://localhost:8001/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Health check passed: {data['status']}")
                print(f"  Version: {data['version']}")
                print(f"  LLM Model: {data['llm_model']}")
            else:
                print(f"✗ Health check failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Error connecting to service: {e}")
            return False
    return True

async def test_parse_search(query_data):
    """Test parsing a single search query"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://localhost:8001/api/parse-search",
                json=query_data,
                timeout=30.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Request failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"✗ Error: {e}")
            return None

async def main():
    """Run all tests"""
    print("Natural Language Search Service Test")
    print("=" * 50)
    
    # Check health first
    if not await test_health_check():
        print("\nService is not running. Please start the service first:")
        print("  cd llm-service && python app.py")
        return
    
    # Test each query
    print("\n=== Testing Search Queries ===")
    for i, test_query in enumerate(TEST_QUERIES, 1):
        print(f"\nTest {i}: {test_query['query']}")
        print("-" * 50)
        
        result = await test_parse_search(test_query)
        
        if result:
            if result['success']:
                print(f"✓ Success: {result['explanation']}")
                print(f"  Intent: {result['intent']['intent_type']} (confidence: {result['intent']['confidence']})")
                print(f"  Entities:")
                for key, value in result['entities'].items():
                    if value is not None and value != [] and value != "":
                        print(f"    - {key}: {value}")
                print(f"  Filters:")
                for key, value in result['filters'].items():
                    if value is not None and value != [] and value != "":
                        print(f"    - {key}: {value}")
            else:
                print(f"✗ Failed: {result.get('error', 'Unknown error')}")
        else:
            print("✗ No response received")
    
    # Test examples endpoint
    print("\n=== Testing Examples Endpoint ===")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://localhost:8001/api/examples")
            if response.status_code == 200:
                examples = response.json()['examples']
                print(f"✓ Found {len(examples)} example queries")
                for ex in examples[:3]:  # Show first 3
                    print(f"  - {ex['query']}")
            else:
                print(f"✗ Failed to get examples: {response.status_code}")
        except Exception as e:
            print(f"✗ Error: {e}")

if __name__ == "__main__":
    print(f"Starting tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    asyncio.run(main())
