# Parkwise Unified LLM Service

A flexible LLM service that supports two deployment scenarios:

1. **API Mode** - Use any OpenAI-compatible API (cloud or local including Ollama)
2. **vLLM Mode** - Local GPU inference with OpenAI GPT-OSS 20B

## Quick Start

### 1. Install Dependencies

```bash
# Core dependencies (all modes)
pip install -r requirements.txt

# For vLLM (GPU):
pip install vllm torch transformers accelerate
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
- Ollama: `http://localhost:11434/v1` (including GPT-OSS 20B with setup)
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

## Performance Comparison

| Mode | Model | Speed | Cost | Requirements |
|------|-------|-------|------|--------------|
| **API** | GPT-4 | ⚡⚡⚡ | $$$ | API Key |
| **vLLM** | GPT-OSS 20B | ⚡⚡⚡ | Free | 40GB+ VRAM |
| **Ollama** | Mistral 7B | ⚡⚡ | Free | 8GB RAM |
| **Ollama** | GPT-OSS 20B* | ⚡ | Free | 48GB+ RAM/VRAM |

*GPT-OSS 20B on Ollama requires special setup and runs slower than vLLM. See [Ollama GPT-OSS Setup Guide](../../docs/setup/OLLAMA_GPT_OSS_SETUP.md).

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

### Test Ollama Mode
```bash
# First, start Ollama with a model
ollama run mistral  # For lightweight setup
# OR
ollama run gpt-oss-20b  # For GPT-OSS (requires setup - see docs)

# Set in .env
LLM_MODE=api
API_BASE_URL=http://localhost:11434/v1
API_KEY=dummy
API_MODEL=mistral  # or gpt-oss-20b

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

### Ollama Mode Issues
- Ensure Ollama is running: `ollama list`
- Check model is downloaded: `ollama pull mistral`
- Verify endpoint is accessible: `curl http://localhost:11434/api/tags`

## Docker Deployment

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies based on mode
COPY requirements.txt .
RUN pip install -r requirements.txt

# For vLLM (GPU)
# RUN pip install vllm torch transformers

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


## License

Apache 2.0
