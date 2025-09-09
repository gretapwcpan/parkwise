#!/usr/bin/env python3
"""
Simple test script for vLLM server
Based on OpenAI Cookbook: https://cookbook.openai.com/articles/gpt-oss/run-vllm
"""

import os
import sys
from openai import OpenAI

def test_vllm_server():
    """Test the vLLM server with a simple request"""
    
    # Get configuration from environment or use defaults
    base_url = os.getenv("VLLM_BASE_URL", "http://localhost:8002/v1")
    model_name = os.getenv("VLLM_MODEL", "openai/gpt-oss-20b")
    
    print(f"Testing vLLM server at {base_url}")
    print(f"Using model: {model_name}")
    print("-" * 50)
    
    try:
        # Initialize OpenAI client pointing to local vLLM server
        client = OpenAI(
            base_url=base_url,
            api_key="EMPTY"  # vLLM doesn't require a real API key for local deployment
        )
        
        # Test 1: Simple chat completion
        print("\nTest 1: Simple chat completion")
        result = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Explain what MXFP4 quantization is in one sentence."}
            ]
        )
        
        print("Response:", result.choices[0].message.content)
        print("✓ Chat completion test passed")
        
        # Test 2: Completion with instructions
        print("\n" + "-" * 50)
        print("Test 2: Instruction following")
        response = client.completions.create(
            model=model_name,
            prompt="You are a helpful assistant.\n\nUser: What is 2+2?\n\nAssistant:",
            max_tokens=50
        )
        
        print("Response:", response.choices[0].text.strip())
        print("✓ Completion test passed")
        
        # Test 3: Check model info
        print("\n" + "-" * 50)
        print("Test 3: Model availability")
        models = client.models.list()
        print(f"Available models: {[model.id for model in models.data]}")
        print("✓ Model listing test passed")
        
        print("\n" + "=" * 50)
        print("All tests passed successfully! ✓")
        print("vLLM server is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure the vLLM server is running:")
        print("  ./start.sh")
        sys.exit(1)

if __name__ == "__main__":
    test_vllm_server()
