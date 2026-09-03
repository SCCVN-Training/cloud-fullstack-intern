@echo off
REM Opens each service in its own new terminal window, since batch
REM scripts can't cleanly background + interleave output the way a
REM bash "&" can. Closing either window stops that service.
cd /d "%~dp0"
start "identity-service" cmd /k run-identity.bat
start "marketplace-service" cmd /k run-marketplace.bat
