@echo off
echo Starting Frontend & Microservices with npm and UV...

@REM set NGINX_DIR=C:\nginx-1.31.3\nginx-1.31.3

@REM start "Nginx" cmd /c "cd /d %NGINX_DIR% && nginx"

:: Run frontend in port 4200
start "Frontend" cmd /k "cd frontend-angular && npm start"

:: Run Auth Service in Port 8001
start "Auth Service" cmd /k "cd microservices/auth-service && uv run uvicorn main:app --port 8001 --reload"

:: Run Profile Service in Port 8002
start "Profile Service" cmd /k "cd microservices/profile-service && uv run uvicorn main:app --port 8002 --reload"

:: Run Anime Service in Port 8003
start "Anime Service" cmd /k "cd microservices/anime-service && uv run uvicorn main:app --port 8003 --reload"
