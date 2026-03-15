@echo off
echo.
echo  0 DISTRICT ^— STARTING LOCAL SERVER
echo  =====================================
echo.

cd /d "%~dp0"

:: Try Node/npx first
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo  Node.js found. Starting live-server on http://localhost:3000
    echo  Press CTRL+C to stop.
    echo.
    start "" http://localhost:3000
    npx --yes live-server --port=3000 --no-browser
    goto :end
)

:: Fallback to Python
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo  Python found. Starting server on http://localhost:3000
    echo  Press CTRL+C to stop.
    echo.
    start "" http://localhost:3000
    python -m http.server 3000
    goto :end
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo  Python3 found. Starting server on http://localhost:3000
    echo  Press CTRL+C to stop.
    echo.
    start "" http://localhost:3000
    python3 -m http.server 3000
    goto :end
)

echo  ERROR: Node.js or Python required.
echo  Install Node.js from https://nodejs.org
echo  or Python from https://python.org
pause

:end
