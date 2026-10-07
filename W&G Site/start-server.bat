@echo off
setlocal
cd /d "%~dp0"
echo Starting Wrath & Glory Campaign Manager...
echo Project folder: %CD%
start "Wrath & Glory Campaign Manager" http://127.0.0.1:8000/
python -m http.server 8000 --bind 0.0.0.0
if errorlevel 1 (
  echo.
  echo Failed to start Python HTTP server.
  echo Make sure Python 3 is installed and port 8000 is available.
)
pause
