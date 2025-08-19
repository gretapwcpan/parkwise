#!/usr/bin/env python3
"""Simple test for OpenAI-compatible API without full dependencies"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment from backend/.env
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', '.env')
load_dotenv(backend_env_path)

# Test configuration loading
print("Testing API Configuration...")
print("-" * 50)

api_type = os.getenv("LLM_API_TYPE")
api_base_url = os.getenv("LLM_API_BASE_URL")
api_key = os.getenv("LLM_API_KEY")
model = os.getenv("LLM_MODEL")

print(f"API Type: {api_type}")
print(f"Base URL: {api_base_url}")
print(f"API Key: {'*' * 20}...{api_key[-10:] if api_key else 'Not set'}")
print(f"Model: {model}")
print("-" * 50)

# Test with requests library (simpler than full LangChain)
try:
    import requests
    
    if api_type == "openai-compatible" and api_base_url and api_key:
        print("\nTesting API connection...")
        
        # Test chat completions endpoint
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'API test successful' if you can read this."}
            ],
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        try:
            response = requests.post(
                f"{api_base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    print(f"✓ API Response: {content}")
                    print("\n✅ API configuration is working correctly!")
                else:
                    print("✗ Unexpected response format")
                    print(f"Response: {result}")
            else:
                print(f"✗ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Connection Error: {str(e)}")
            
    else:
        print("\n⚠️  Configuration incomplete. Please check your backend/.env file.")
        
except ImportError:
    print("\n⚠️  'requests' library not installed. Install with: pip install requests")
