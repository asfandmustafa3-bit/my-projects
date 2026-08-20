@echo off
TITLE Submind Audio Studio - Automated Setup & Installer
COLOR 0A

echo ===================================================================
echo             SUBMIND AUDIO STUDIO - DESKTOP SETUP
echo             Engineered by Asfand Mustafa
echo ===================================================================
echo.

echo [1/4] Checking Node.js environment...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js (v18 or higher) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
echo.

echo [2/4] Installing project dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully.
echo.

echo [3/4] Building production bundles...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Production build encountered a warning, falling back to dev mode.
) else (
    echo [OK] Production build created in /dist.
)
echo.

echo [4/4] Starting Submind Audio Studio on your device...
echo URL: http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

call npm run dev
pause
