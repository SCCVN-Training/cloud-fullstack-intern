@echo off
cd /d "%~dp0..\services\marketplace-service"

if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

if not exist ".env" (
    echo No .env found — copy .env.example to .env and fill in real values first.
    exit /b 1
)

echo Starting marketplace-service on http://localhost:8002 ...
uvicorn app.main:app --reload --port 8002
