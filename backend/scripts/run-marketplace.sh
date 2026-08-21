#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../services/marketplace-service"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
  echo "No .env found — copy .env.example to .env and fill in real values first."
  exit 1
fi

echo "Starting marketplace-service on http://localhost:8002 ..."
uvicorn app.main:app --reload --port 8002
