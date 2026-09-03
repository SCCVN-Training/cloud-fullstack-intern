@echo off
setlocal enabledelayedexpansion

set IDENTITY_URL=http://localhost:8001
set MARKETPLACE_URL=http://localhost:8002
set FAILCOUNT=0

echo === 1. Health checks ===
for /f %%c in ('curl -s -o nul -w "%%{http_code}" %IDENTITY_URL%/health') do set ID_HEALTH=%%c
if "%ID_HEALTH%"=="200" (echo   OK   identity-service /health) else (echo   FAIL identity-service /health ^(got %ID_HEALTH%^) & set /a FAILCOUNT+=1)

for /f %%c in ('curl -s -o nul -w "%%{http_code}" %MARKETPLACE_URL%/health') do set MKT_HEALTH=%%c
if "%MKT_HEALTH%"=="200" (echo   OK   marketplace-service /health) else (echo   FAIL marketplace-service /health ^(got %MKT_HEALTH%^) & set /a FAILCOUNT+=1)

if %FAILCOUNT% GTR 0 (
  echo.
  echo Both services must be running before continuing - stopping here.
  exit /b 1
)

echo.
echo === 2. Auth flow ^(identity-service, real Postgres^) ===
for /f %%t in ('powershell -command "[int](Get-Date -UFormat %%s)"') do set SUFFIX=%%t
set EMAIL=smoketest_%SUFFIX%@example.com
set USERNAME=smoketest_%SUFFIX%

curl -s -X POST "%IDENTITY_URL%/auth/register" -H "Content-Type: application/json" -d "{\"user_name\":\"%USERNAME%\",\"email\":\"%EMAIL%\",\"password\":\"SmokeTest123\"}" > register_response.json
for /f "delims=" %%u in ('python -c "import json; print(json.load(open('register_response.json')).get('id',''))" 2^>nul') do set USER_ID=%%u

if defined USER_ID (
  echo   OK   register ^(%EMAIL%^)
) else (
  echo   FAIL register - see register_response.json
  set /a FAILCOUNT+=1
)

curl -s -X POST "%IDENTITY_URL%/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"%EMAIL%\",\"password\":\"SmokeTest123\"}" > login_response.json
for /f "delims=" %%t in ('python -c "import json; print(json.load(open('login_response.json')).get('access_token',''))" 2^>nul') do set TOKEN=%%t

if defined TOKEN (
  echo   OK   login ^(JWT acquired^)
) else (
  echo   FAIL login - see login_response.json
  set /a FAILCOUNT+=1
)

if not defined TOKEN goto :cleanup_fail
if not defined USER_ID goto :cleanup_fail

echo.
echo === 3. Stateless auth across services ===
curl -s -X POST "%MARKETPLACE_URL%/skills" -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"title\":\"Smoke Test Skill %SUFFIX%\",\"category\":\"Testing\",\"description\":\"Created by smoke-test.bat\",\"image\":\"https://example.com/i.jpg\",\"duration\":\"30 min\",\"level\":\"Beginner\",\"requirements\":\"none\",\"instructor_id\":\"%USER_ID%\"}" > skill_response.json
for /f "delims=" %%s in ('python -c "import json; print(json.load(open('skill_response.json')).get('id',''))" 2^>nul') do set SKILL_ID=%%s

if defined SKILL_ID (
  echo   OK   create skill using identity-issued JWT
) else (
  echo   FAIL create skill - see skill_response.json
  set /a FAILCOUNT+=1
)

echo.
echo === 4. Cross-service call ===
curl -s "%MARKETPLACE_URL%/skills?search=Smoke+Test+Skill+%SUFFIX%" > list_response.json
for /f "delims=" %%n in ('python -c "import json; d=json.load(open('list_response.json')); s=d.get('skills',[]); print(s[0].get('instructorName','') if s else '')" 2^>nul') do set INSTRUCTOR_NAME=%%n

if "%INSTRUCTOR_NAME%"=="Unknown User" (
  echo   FAIL instructor name fell back to "Unknown User" - identity-service unreachable, or /internal/users/{id}/public is broken
  set /a FAILCOUNT+=1
) else if defined INSTRUCTOR_NAME (
  echo   OK   instructor name resolved live: %INSTRUCTOR_NAME%
) else (
  echo   FAIL could not find the created skill - see list_response.json
  set /a FAILCOUNT+=1
)

echo.
echo === 5. Rate limiting ===
echo   ^(sending 11 rapid login attempts - expect the 11th to return 429^)
for /l %%i in (1,1,11) do (
  for /f %%c in ('curl -s -o nul -w "%%{http_code}" -X POST "%IDENTITY_URL%/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"nonexistent@example.com\",\"password\":\"wrong\"}"') do set LAST_STATUS=%%c
)

if "%LAST_STATUS%"=="429" (
  echo   OK   rate limit triggered ^(429^)
) else (
  echo   FAIL expected 429, got %LAST_STATUS% - rate limiting may not be wired in
  set /a FAILCOUNT+=1
)

:cleanup_fail
del /q register_response.json login_response.json skill_response.json list_response.json 2>nul

echo.
if %FAILCOUNT% EQU 0 (
  echo === ALL CHECKS PASSED ===
  exit /b 0
) else (
  echo === %FAILCOUNT% CHECK^(S^) FAILED - see FAIL lines above ===
  exit /b 1
)
