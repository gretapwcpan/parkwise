# Parkwise Unified LLM Service

A flexible LLM service that supports three deployment scenarios:

1. **API Mode** - Use any OpenAI-compatible API (cloud or local)
2. **vLLM Mode** - Local GPU inference with OpenAI GPT-OSS 20B
3. **llama.cpp Mode** - Local CPU inference for systems without GPU

## Quick Start

### 1. Install Dependencies

```bash
# Core dependencies (all modes)
pip install -r requirements.txt

# For vLLM (GPU):
pip install vllm torch transformers accelerate

# For llama.cpp (CPU):
pip install llama-cpp-python
```

### 2. Configure Environment

Copy `.env.example` to `.env` and choose your scenario:

```bash
cp .env.example .env
```

### 3. Start the Service

```bash
python app.py
```

The service will auto-detect the best available mode or use your configured preference.

## Configuration Examples

### Scenario 1: OpenAI-Compatible API

Works with OpenAI, Azure, local vLLM servers, Ollama, and more:

```env
LLM_MODE=api
API_BASE_URL=https://api.openai.com/v1
API_KEY=sk-your-key-here
API_MODEL=gpt-4-turbo
```

**Supported Endpoints:**
- OpenAI: `https://api.openai.com/v1`
- Azure: `https://your-resource.openai.azure.com/...`
- Local vLLM: `http://localhost:8080/v1`
- Ollama: `http://localhost:11434/v1`
- Together AI: `https://api.together.xyz/v1`
- Any OpenAI-compatible endpoint

### Scenario 2: vLLM with GPU

For local GPU inference with OpenAI GPT-OSS 20B:

```env
LLM_MODE=vllm
VLLM_MODEL=openai/gpt-oss-20b
VLLM_TRUST_REMOTE_CODE=true
VLLM_GPU_MEMORY=0.9
```

**Requirements:**
- NVIDIA GPU with 40GB+ VRAM for GPT-OSS 20B
- CUDA 11.8+ and PyTorch 2.0+
- Falls back to Mistral-7B if GPT-OSS unavailable

### Scenario 3: llama.cpp with CPU

For systems without GPU:

```env
LLM_MODE=llamacpp
LLAMACPP_MODEL_PATH=models/mistral-7b-instruct-v0.2.Q4_K_M.gguf
LLAMACPP_THREADS=8
```

**Download Models:**
```python
# Download recommended GGUF models
from llm_providers.llamacpp_provider import LlamaCppProvider

# Download Mistral 7B (recommended)
model_path = LlamaCppProvider.download_model("mistral-7b")

# Or Phi-3 (smaller, faster)
model_path = LlamaCppProvider.download_model("phi-3")

# Or TinyLlama (tiny, very fast)
model_path = LlamaCppProvider.download_model("tinyllama")
```

## API Endpoints

All modes provide the same endpoints:

### Service Info
```bash
GET /
# Returns service status and current mode
```

### Configuration
```bash
GET /config
# Returns current configuration
```

### Search Parking
```bash
POST /api/search
Content-Type: application/json

{
  "query": "Find cheap parking near cafes with EV charging"
}
```

### Analyze Location
```bash
POST /api/vibe/analyze
Content-Type: application/json

{
  "lat": 25.0330,
  "lng": 121.5654,
  "radius": 500,
  "poi_data": []
}
```

### Health Check
```bash
GET /health
# Returns health status
```

### Reload Provider
```bash
POST /reload
# Reload LLM provider (useful for switching modes)
```

## Auto-Detection Logic

When `LLM_MODE=auto` (default), the service detects in this order:

1. **API Mode** - If `API_BASE_URL` is configured
2. **vLLM Mode** - If GPU is available
3. **llama.cpp Mode** - Fallback for CPU-only systems

## Performance Comparison

| Mode | Model | Speed | Cost | Requirements |
|------|-------|-------|------|--------------|
| **API** | GPT-4 | ⚡⚡⚡ | $$$ | API Key |
| **vLLM** | GPT-OSS 20B | ⚡⚡ | Free | 40GB+ VRAM |
| **llama.cpp** | Mistral 7B Q4 | ⚡ | Free | 8GB RAM |

## Testing

### Test API Mode
```bash
# Set in .env
LLM_MODE=api
API_BASE_URL=https://api.openai.com/v1
API_KEY=your-key

# Start and test
python app.py
curl http://localhost:8001/
```

### Test vLLM Mode
```bash
# Set in .env
LLM_MODE=vllm
VLLM_MODEL=openai/gpt-oss-20b

# Start and test
python app.py
curl http://localhost:8001/config
```

### Test llama.cpp Mode
```bash
# Set in .env
LLM_MODE=llamacpp
LLAMACPP_MODEL_PATH=models/mistral-7b.gguf

# Start and test
python app.py
curl -X POST http://localhost:8001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "parking near me"}'
```

## Troubleshooting

### API Mode Issues
- Check API key is valid
- Verify endpoint URL is correct
- Ensure network connectivity

### vLLM Mode Issues
- Check CUDA is available: `python -c "import torch; print(torch.cuda.is_available())"`
- Verify GPU memory: `nvidia-smi`
- Try smaller model if OOM

### llama.cpp Mode Issues
- Ensure model file exists in specified path
- Check CPU threads setting
- Try smaller quantized models

## Docker Deployment

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies based on mode
COPY requirements.txt .
RUN pip install -r requirements.txt

# For vLLM (GPU)
# RUN pip install vllm torch transformers

# For llama.cpp (CPU)
# RUN pip install llama-cpp-python

COPY . .

CMD ["python", "app.py"]
```

## Environment Variables Reference

### API Mode
- `API_BASE_URL` - API endpoint URL
- `API_KEY` - API authentication key
- `API_MODEL` - Model name
- `API_TEMPERATURE` - Generation temperature (0-1)
- `API_MAX_TOKENS` - Maximum tokens to generate

### vLLM Mode
- `VLLM_MODEL` - Model name (default: openai/gpt-oss-20b)
- `VLLM_TRUST_REMOTE_CODE` - Trust remote code (required for GPT-OSS)
- `VLLM_GPU_MEMORY` - GPU memory utilization (0-1)
- `VLLM_MAX_MODEL_LEN` - Maximum model context length
- `VLLM_TEMPERATURE` - Generation temperature
- `VLLM_MAX_TOKENS` - Maximum tokens to generate

### llama.cpp Mode
- `LLAMACPP_MODEL_PATH` - Path to GGUF model file
- `LLAMACPP_THREADS` - Number of CPU threads
- `LLAMACPP_CONTEXT_SIZE` - Context window size
- `LLAMACPP_BATCH_SIZE` - Batch size for processing
- `LLAMACPP_TEMPERATURE` - Generation temperature
- `LLAMACPP_MAX_TOKENS` - Maximum tokens to generate

## License

Apache 2.0
