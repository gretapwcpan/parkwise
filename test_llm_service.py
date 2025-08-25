#!/usr/bin/env python3
import requests
import json
import sys

def test_llm_service():
    """Test the LLM service endpoints"""
    base_url = "http://localhost:8001"
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
            print("   ✓ Health check passed")
        else:
            print(f"   ✗ Health check failed: {response.text}")
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot connect to LLM service at http://localhost:8001")
        print("   Make sure the service is running: docker-compose up -d llm-service")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # Test 2: Parse endpoint
    print("\n2. Testing parse endpoint...")
    test_query = "Find parking near me"
    try:
        response = requests.post(
            f"{base_url}/api/search/parse",
            json={"query": test_query},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Response: {json.dumps(result, indent=2)}")
            print("   ✓ Parse endpoint working")
            return True
        else:
            print(f"   ✗ Parse failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing LLM Service...")
    print("=" * 50)
    success = test_llm_service()
    print("=" * 50)
    if success:
        print("✓ LLM Service is working properly!")
        sys.exit(0)
    else:
        print("✗ LLM Service has issues. Please check the logs:")
        print("  docker-compose logs llm-service")
        sys.exit(1)
