"""
LLM Provider modules for different deployment scenarios
"""

import logging

logger = logging.getLogger(__name__)

# Conditional imports to avoid failures when packages aren't installed
providers = {}

try:
    from .api_provider import OpenAICompatibleProvider
    providers['OpenAICompatibleProvider'] = OpenAICompatibleProvider
except ImportError as e:
    logger.warning(f"Could not import OpenAICompatibleProvider: {e}")

try:
    from .vllm_provider import VLLMProvider
    providers['VLLMProvider'] = VLLMProvider
except ImportError as e:
    logger.debug(f"Could not import VLLMProvider (expected if vLLM not installed): {e}")

try:
    from .llamacpp_provider import LlamaCppProvider
    providers['LlamaCppProvider'] = LlamaCppProvider
except ImportError as e:
    logger.debug(f"Could not import LlamaCppProvider (expected if llama-cpp-python not installed): {e}")

# Export available providers
__all__ = list(providers.keys())

# Make providers available at module level
for name, cls in providers.items():
    globals()[name] = cls
