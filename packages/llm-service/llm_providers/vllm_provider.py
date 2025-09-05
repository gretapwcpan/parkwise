"""
vLLM Provider for Local GPU Inference
Optimized for OpenAI GPT-OSS 20B with native support
"""

import os
import logging
from typing import Dict, Any
from vllm import LLM, SamplingParams

logger = logging.getLogger(__name__)


class VLLMProvider:
    """Provider for vLLM with GPU acceleration"""
    
    def __init__(self):
        # Get configuration from environment
        self.model_name = os.getenv("VLLM_MODEL", "openai/gpt-oss-20b")
        self.trust_remote_code = os.getenv("VLLM_TRUST_REMOTE_CODE", "true").lower() == "true"
        self.gpu_memory_utilization = float(os.getenv("VLLM_GPU_MEMORY", "0.9"))
        self.max_model_len = int(os.getenv("VLLM_MAX_MODEL_LEN", "4096"))
        self.temperature = float(os.getenv("VLLM_TEMPERATURE", "0.3"))
        self.max_tokens = int(os.getenv("VLLM_MAX_TOKENS", "500"))
        
        # Initialize vLLM
        try:
            logger.info(f"Initializing vLLM with model: {self.model_name}")
            
            # Special handling for GPT-OSS models
            if "gpt-oss" in self.model_name.lower():
                logger.info("Detected GPT-OSS model, enabling trust_remote_code")
                self.trust_remote_code = True
            
            self.llm = LLM(
                model=self.model_name,
                trust_remote_code=self.trust_remote_code,  # Required for GPT-OSS
                gpu_memory_utilization=self.gpu_memory_utilization,
                max_model_len=self.max_model_len,
                dtype="auto",  # Let vLLM choose the best dtype
                download_dir=os.getenv("VLLM_DOWNLOAD_DIR", None)
            )
            
            logger.info(f"✓ vLLM initialized successfully with {self.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize vLLM with {self.model_name}: {e}")
            
            # Fallback to Mistral if GPT-OSS fails
            if "gpt-oss" in self.model_name.lower():
                logger.info("Falling back to Mistral-7B...")
                self.model_name = "mistralai/Mistral-7B-Instruct-v0.2"
                self.llm = LLM(
                    model=self.model_name,
                    gpu_memory_utilization=self.gpu_memory_utilization,
                    max_model_len=self.max_model_len
                )
                logger.info("✓ Fallback to Mistral-7B successful")
            else:
                raise e
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using vLLM"""
        try:
            # Override with kwargs if provided
            temperature = kwargs.get('temperature', self.temperature)
            max_tokens = kwargs.get('max_tokens', self.max_tokens)
            top_p = kwargs.get('top_p', 0.9)
            
            # Set sampling parameters
            sampling_params = SamplingParams(
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                stop=kwargs.get('stop', None)
            )
            
            # Generate
            outputs = self.llm.generate([prompt], sampling_params)
            
            # Extract text from first output
            generated_text = outputs[0].outputs[0].text
            
            return generated_text
            
        except Exception as e:
            logger.error(f"vLLM generation error: {e}")
            raise e
    
    def generate_structured(self, prompt: str, system_prompt: str = None) -> str:
        """Generate with system prompt for structured output"""
        # Combine system and user prompts
        if system_prompt:
            # Format for instruction-following models
            if "instruct" in self.model_name.lower() or "gpt-oss" in self.model_name.lower():
                full_prompt = f"System: {system_prompt}\n\nUser: {prompt}\n\nAssistant:"
            else:
                full_prompt = f"{system_prompt}\n\n{prompt}"
        else:
            full_prompt = prompt
        
        return self.generate(full_prompt)
    
    def batch_generate(self, prompts: list, **kwargs) -> list:
        """Generate for multiple prompts efficiently"""
        try:
            sampling_params = SamplingParams(
                temperature=kwargs.get('temperature', self.temperature),
                max_tokens=kwargs.get('max_tokens', self.max_tokens),
                top_p=kwargs.get('top_p', 0.9)
            )
            
            # vLLM handles batching efficiently
            outputs = self.llm.generate(prompts, sampling_params)
            
            # Extract text from outputs
            return [output.outputs[0].text for output in outputs]
            
        except Exception as e:
            logger.error(f"Batch generation error: {e}")
            raise e
    
    def health_check(self) -> Dict[str, Any]:
        """Check vLLM status"""
        try:
            # Try a simple generation
            test_prompt = "Hello"
            sampling_params = SamplingParams(
                temperature=0.1,
                max_tokens=5
            )
            outputs = self.llm.generate([test_prompt], sampling_params)
            
            return {
                "status": "healthy",
                "model": self.model_name,
                "backend": "vLLM",
                "gpu_memory_utilization": self.gpu_memory_utilization,
                "max_model_len": self.max_model_len,
                "available": True
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "model": self.model_name,
                "backend": "vLLM",
                "available": False,
                "error": str(e)
            }
    
    @staticmethod
    def check_gpu_available() -> bool:
        """Check if GPU is available for vLLM"""
        try:
            import torch
            return torch.cuda.is_available()
        except:
            return False
    
    @staticmethod
    def get_gpu_info() -> Dict[str, Any]:
        """Get GPU information"""
        try:
            import torch
            if torch.cuda.is_available():
                return {
                    "available": True,
                    "device_count": torch.cuda.device_count(),
                    "device_name": torch.cuda.get_device_name(0),
                    "memory_allocated": torch.cuda.memory_allocated(0),
                    "memory_reserved": torch.cuda.memory_reserved(0),
                }
            else:
                return {"available": False}
        except Exception as e:
            return {"available": False, "error": str(e)}
