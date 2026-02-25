@echo off
cls
echo.
echo  ============================================
echo    🚀 ORBIT - Local Development Server
echo  ============================================
echo.
echo  Starting local development environment...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo  ❌ Node.js is not installed!
    echo.
    echo  Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js detected
echo.

:: Start the server
echo  🌐 Starting server on http://localhost:3000
echo.
echo  📊 Demo dashboard will be available at:
echo     http://localhost:3000
echo.
echo  💡 To test ORBIT:
echo     1. Load the extension in Chrome
echo     2. Visit http://localhost:3000
echo     3. See ORBIT widget appear!
echo.
echo  ⚡ Press Ctrl+C to stop the server
echo.
echo  ============================================
echo.

node server.js

pause