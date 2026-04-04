#!/bin/bash
export LLM_API_KEY=$LLM_API_KEY
export LLM_BASE_URL=${LLM_BASE_URL:-https://api.deepseek.com/v1}
export LLM_MODEL_NAME=${LLM_MODEL_NAME:-deepseek-chat}

python -m chromadb.cli.cli run \
  --host 0.0.0.0 --port 8001 \
  --path /app/chroma_data &

cd /app/mirofish
python -m uvicorn app:app --host 0.0.0.0 --port 7860
