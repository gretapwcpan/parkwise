"""
llama.cpp Provider for CPU-only Inference
Optimized for systems without GPU
"""

import os
import logging
from typing import Dict, Any, List
from llama_cpp import Llama

logger = logging.getLogger(__name__)


class LlamaCppProvider:
    """Provider for llama.cpp CPU inference"""
    
    def __init__(self):
        # Get configuration from environment
        self.model_path = os.getenv("LLAMACPP_MODEL_PATH", "models/mistral-7b-instruct-v0.2.Q4_K_M.gguf")
        self.n_threads = int(os.getenv("LLAMACPP_THREADS", "8"))
        self.n_ctx = int(os.getenv("LLAMACPP_CONTEXT_SIZE", "4096"))
        self.n_batch = int(os.getenv("LLAMACPP_BATCH_SIZE", "512"))
        self.temperature = float(os.getenv("LLAMACPP_TEMPERATURE", "0.3"))
        self.max_tokens = int(os.getenv("LLAMACPP_MAX_TOKENS", "500"))
        self.use_mmap = os.getenv("LLAMACPP_USE_MMAP", "true").lower() == "true"
        self.use_mlock = os.getenv("LLAMACPP_USE_MLOCK", "false").lower() == "true"
        
        # Initialize llama.cpp
        try:
            logger.info(f"Initializing llama.cpp with model: {self.model_path}")
            
            # Check if model file exists
            if not os.path.exists(self.model_path):
                logger.warning(f"Model file not found: {self.model_path}")
                logger.info("Please download a GGUF model file")
                logger.info("Recommended models:")
                logger.info("  - Mistral 7B: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF")
                logger.info("  - Phi-3: https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf")
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            self.llm = Llama(
                model_path=self.model_path,
                n_ctx=self.n_ctx,
                n_batch=self.n_batch,
                n_threads=self.n_threads,
                use_mmap=self.use_mmap,
                use_mlock=self.use_mlock,
                verbose=False
            )
            
            logger.info(f"✓ llama.cpp initialized successfully")
            logger.info(f"  Model: {self.model_path}")
            logger.info(f"  Threads: {self.n_threads}")
            logger.info(f"  Context: {self.n_ctx}")
            
        except Exception as e:
            logger.error(f"Failed to initialize llama.cpp: {e}")
            raise e
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using llama.cpp"""
        try:
            # Override with kwargs if provided
            temperature = kwargs.get('temperature', self.temperature)
            max_tokens = kwargs.get('max_tokens', self.max_tokens)
            top_p = kwargs.get('top_p', 0.9)
            top_k = kwargs.get('top_k', 40)
            
            # Generate
            output = self.llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                stop=kwargs.get('stop', None),
                echo=False  # Don't include prompt in output
            )
            
            # Extract text from output
            if isinstance(output, dict) and 'choices' in output:
                return output['choices'][0]['text']
            else:
                return str(output)
            
        except Exception as e:
            logger.error(f"llama.cpp generation error: {e}")
            raise e
    
    def generate_structured(self, prompt: str, system_prompt: str = None) -> str:
        """Generate with system prompt for structured output"""
        # Format prompt based on model type
        if system_prompt:
            # Check if it's an instruction model
            if "instruct" in self.model_path.lower():
                # Use instruction format
                full_prompt = f"[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n{prompt} [/INST]"
            else:
                full_prompt = f"{system_prompt}\n\n{prompt}"
        else:
            full_prompt = prompt
        
        return self.generate(full_prompt)
    
    def health_check(self) -> Dict[str, Any]:
        """Check llama.cpp status"""
        try:
            # Try a simple generation
            test_output = self.llm(
                "Hello",
                max_tokens=5,
                temperature=0.1,
                echo=False
            )
            
            return {
                "status": "healthy",
                "model": os.path.basename(self.model_path),
                "backend": "llama.cpp",
                "threads": self.n_threads,
                "context_size": self.n_ctx,
                "available": True
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "model": os.path.basename(self.model_path),
                "backend": "llama.cpp",
                "available": False,
                "error": str(e)
            }
    
    @staticmethod
    def download_model(model_name: str = "mistral-7b") -> str:
        """Helper to download recommended GGUF models"""
        import requests
        import os
        
        models = {
            "mistral-7b": {
                "url": "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
                "filename": "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
            },
            "phi-3": {
                "url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
                "filename": "phi-3-mini-4k-instruct-q4.gguf"
            },
            "tinyllama": {
                "url": "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
                "filename": "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
            }
        }
        
        if model_name not in models:
            raise ValueError(f"Unknown model: {model_name}. Available: {list(models.keys())}")
        
        model_info = models[model_name]
        
        # Create models directory
        os.makedirs("models", exist_ok=True)
        filepath = os.path.join("models", model_info["filename"])
        
        # Download if not exists
        if not os.path.exists(filepath):
            logger.info(f"Downloading {model_name} model...")
            response = requests.get(model_info["url"], stream=True)
            total_size = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        logger.info(f"Progress: {percent:.1f}%")
            
            logger.info(f"✓ Downloaded {model_name} to {filepath}")
        
        return filepath
    
    @staticmethod
    def get_cpu_info() -> Dict[str, Any]:
        """Get CPU information for optimization"""
        import platform
        import multiprocessing
        
        return {
            "processor": platform.processor(),
            "cpu_count": multiprocessing.cpu_count(),
            "platform": platform.platform(),
            "architecture": platform.machine(),
            "recommended_threads": min(multiprocessing.cpu_count() - 1, 8)
        }
