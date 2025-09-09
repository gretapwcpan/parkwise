#!/bin/bash

# Simple vLLM local server startup script
# Based on OpenAI Cookbook: https://cookbook.openai.com/articles/gpt-oss/run-vllm

echo "Starting vLLM server locally..."
echo "================================"

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set defaults if not provided
MODEL_NAME=${VLLM_MODEL:-"openai/gpt-oss-20b"}
PORT=${VLLM_PORT:-8002}
HOST=${VLLM_HOST:-"0.0.0.0"}

echo "Configuration:"
echo "  Model: $MODEL_NAME"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo ""

# Check if vLLM is installed
if ! command -v vllm &> /dev/null; then
    echo "Error: vLLM is not installed!"
    echo "Please install it with: pip install vllm"
    exit 1
fi

# Start vLLM server
echo "Starting vLLM server..."
echo "The server will be available at http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"
echo ""

vllm serve "$MODEL_NAME" \
    --host "$HOST" \
    --port "$PORT" \
    --trust-remote-code
