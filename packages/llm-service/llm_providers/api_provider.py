"""
OpenAI-Compatible API Provider
Supports: OpenAI, Azure OpenAI, local vLLM/Ollama endpoints, and any OpenAI-compatible service
"""

import os
import logging
from typing import Dict, Any, List
from openai import OpenAI

logger = logging.getLogger(__name__)


class OpenAICompatibleProvider:
    """Provider for any OpenAI-compatible API endpoint"""
    
    def __init__(self):
        # Get configuration from environment
        self.base_url = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
        self.api_key = os.getenv("API_KEY", "dummy")
        self.model = os.getenv("API_MODEL", "gpt-4-turbo")
        self.temperature = float(os.getenv("API_TEMPERATURE", "0.3"))
        self.max_tokens = int(os.getenv("API_MAX_TOKENS", "500"))
        
        # Initialize OpenAI client with custom endpoint
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )
        
        logger.info(f"Initialized OpenAI-compatible API provider")
        logger.info(f"Endpoint: {self.base_url}")
        logger.info(f"Model: {self.model}")
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using OpenAI-compatible API"""
        try:
            # Override with kwargs if provided
            temperature = kwargs.get('temperature', self.temperature)
            max_tokens = kwargs.get('max_tokens', self.max_tokens)
            
            # Use chat completions format (standard for OpenAI-compatible APIs)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful parking assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"API generation error: {e}")
            # Try completion format as fallback (for older APIs)
            try:
                response = self.client.completions.create(
                    model=self.model,
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].text
            except:
                raise e
    
    def generate_structured(self, prompt: str, system_prompt: str = None) -> str:
        """Generate with explicit system prompt for structured output"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Structured generation error: {e}")
            # Fallback to simple generation
            return self.generate(f"{system_prompt}\n\n{prompt}" if system_prompt else prompt)
    
    def health_check(self) -> Dict[str, Any]:
        """Check if the API is accessible"""
        try:
            # Try to list models (works with most OpenAI-compatible APIs)
            models = self.client.models.list()
            return {
                "status": "healthy",
                "endpoint": self.base_url,
                "model": self.model,
                "available": True
            }
        except Exception as e:
            logger.warning(f"Health check failed: {e}")
            return {
                "status": "degraded",
                "endpoint": self.base_url,
                "model": self.model,
                "available": False,
                "error": str(e)
            }
    
    @staticmethod
    def get_example_configs() -> Dict[str, Dict[str, str]]:
        """Return example configurations for different services"""
        return {
            "openai": {
                "API_BASE_URL": "https://api.openai.com/v1",
                "API_KEY": "sk-...",
                "API_MODEL": "gpt-4-turbo"
            },
            "azure": {
                "API_BASE_URL": "https://your-resource.openai.azure.com/openai/deployments/your-deployment",
                "API_KEY": "your-azure-key",
                "API_MODEL": "gpt-4"
            },
            "local_vllm": {
                "API_BASE_URL": "http://localhost:8080/v1",
                "API_KEY": "dummy",
                "API_MODEL": "openai/gpt-oss-20b"
            },
            "ollama": {
                "API_BASE_URL": "http://localhost:11434/v1",
                "API_KEY": "dummy",
                "API_MODEL": "mistral"
            },
            "together": {
                "API_BASE_URL": "https://api.together.xyz/v1",
                "API_KEY": "your-together-key",
                "API_MODEL": "mistralai/Mixtral-8x7B-Instruct-v0.1"
            }
        }
