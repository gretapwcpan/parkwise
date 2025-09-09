#!/bin/bash

# Simple script to stop the vLLM server

echo "Stopping vLLM server..."

# Find and kill vLLM processes
if pgrep -f "vllm serve" > /dev/null; then
    pkill -f "vllm serve"
    echo "vLLM server stopped successfully."
else
    echo "No vLLM server process found running."
fi

# Also check for any Python processes running vLLM
if pgrep -f "python.*vllm" > /dev/null; then
    pkill -f "python.*vllm"
    echo "Additional vLLM processes stopped."
fi

echo "Done."
