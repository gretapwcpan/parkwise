# Setting up GPT-OSS 20B with Ollama

## Important Considerations

### Technical Challenges

1. **Model Size**: GPT-OSS 20B is approximately 40GB in size, requiring significant RAM/VRAM
2. **Hardware Requirements**: 
   - Minimum 48GB RAM for CPU inference (very slow)
   - Recommended: 40GB+ VRAM GPU for acceptable performance
3. **Ollama Limitations**: 
   - Ollama is optimized for smaller models (7B-13B parameters)
   - 20B models will run significantly slower than with vLLM

### Why vLLM is Preferred for GPT-OSS 20B

- **vLLM** is specifically optimized for large model inference with tensor parallelism
- **Ollama** is designed for accessibility and smaller models
- For production use of GPT-OSS 20B, vLLM remains the recommended approach

## Setup Instructions

### Step 1: Create Ollama Modelfile

Create a file named `Modelfile.gpt-oss` with the following content:

```dockerfile
FROM /path/to/gpt-oss-20b.gguf

# Model parameters
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 500

# System prompt for parking assistant
SYSTEM """You are a helpful parking assistant. Provide clear, concise responses about parking locations, availability, and navigation."""

# Context window
PARAMETER num_ctx 4096

# GPU layers (adjust based on your GPU memory)
PARAMETER num_gpu 35
```

### Step 2: Convert GPT-OSS to GGUF Format

Since GPT-OSS is not available in GGUF format by default, you'll need to convert it:

```bash
# Install conversion tools
pip install transformers accelerate gguf

# Download and convert the model
python -m transformers.models.gpt2.convert_gpt2_original_tf_checkpoint_to_pytorch \
  --gpt2_checkpoint_path openai/gpt-oss-20b \
  --pytorch_dump_path ./gpt-oss-20b-pytorch

# Convert to GGUF
python convert.py ./gpt-oss-20b-pytorch \
  --outfile gpt-oss-20b.gguf \
  --outtype q4_K_M  # Use quantization for smaller size
```

### Step 3: Create Ollama Model

```bash
# Create the model in Ollama
ollama create gpt-oss-20b -f Modelfile.gpt-oss

# Verify the model is created
ollama list
```

### Step 4: Update LLM Service Configuration

Update `packages/llm-service/.env`:

```env
# Ollama Configuration for GPT-OSS 20B
LLM_MODE=api
API_BASE_URL=http://localhost:11434/v1
API_KEY=dummy
API_MODEL=gpt-oss-20b
API_TEMPERATURE=0.3
API_MAX_TOKENS=500

# Increase timeout for larger model
API_TIMEOUT=120
```

### Step 5: Run Ollama with GPT-OSS

```bash
# Start Ollama server (if not already running)
ollama serve

# In another terminal, load the model
ollama run gpt-oss-20b

# Test the model
curl http://localhost:11434/api/generate -d '{
  "model": "gpt-oss-20b",
  "prompt": "Find parking near me",
  "stream": false
}'
```

## Performance Optimization

### For CPU Inference

```bash
# Set environment variables for CPU optimization
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_NUM_THREAD=8
export OLLAMA_MAX_LOADED_MODELS=1

# Run with CPU optimizations
ollama serve
```

### For GPU Inference

```bash
# Check GPU memory
nvidia-smi

# Set GPU layers based on available memory
# 40GB VRAM: num_gpu 35
# 24GB VRAM: num_gpu 20 (with quantization)
# 16GB VRAM: num_gpu 10 (heavy quantization, degraded quality)
```

## Alternative: Quantized Version

For systems with limited resources, use a quantized version:

```dockerfile
# Modelfile.gpt-oss-quantized
FROM gpt-oss-20b-q4.gguf

PARAMETER temperature 0.3
PARAMETER num_ctx 2048  # Reduced context
PARAMETER num_gpu 20    # Fewer GPU layers
```

## Fallback Strategy

If GPT-OSS 20B doesn't work well with Ollama, consider these alternatives:

1. **Use vLLM** (recommended for GPT-OSS 20B)
2. **Use smaller models** with Ollama:
   - `mistral:7b-instruct`
   - `llama2:13b`
   - `mixtral:8x7b`

## Testing the Integration

```bash
# Test with the parking app
cd packages/llm-service
python app.py

# In another terminal
curl -X POST http://localhost:8001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find cheap parking near cafes"}'
```

## Troubleshooting

### Out of Memory
- Reduce `num_gpu` parameter
- Use more aggressive quantization (q4_0 instead of q4_K_M)
- Consider using CPU-only inference

### Slow Performance
- This is expected with Ollama for 20B models
- Consider using vLLM for production
- Use smaller models for development

### Model Not Found
- Ensure the GGUF conversion completed successfully
- Check Ollama model list: `ollama list`
- Verify model name matches in configuration

## Recommendation

While it's technically possible to run GPT-OSS 20B with Ollama, **we strongly recommend using vLLM** for this model size:

- **vLLM**: 5-10x faster inference for large models
- **Ollama**: Better suited for 7B-13B parameter models

For the best experience with GPT-OSS 20B, use the vLLM deployment option documented in the main README.
