@echo off
title Bookmark Manager
echo.
echo  ==============================
echo   Bookmark Manager - Starting
echo  ==============================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Please download and install from https://nodejs.org/
    echo.
    start https://nodejs.org/en/download/
    pause
    exit /b 1
)

:: Kill any existing instance on port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
)

:: Start server (serves both API and frontend build)
echo Starting server on http://localhost:3001 ...
cd /d "%~dp0server"
set NODE_ENV=production
start /b node index.js

:: Wait for server to be ready
echo Waiting for server...
set /a retries=0
:healthcheck
timeout /t 1 /nobreak >nul
curl.exe -s -o nul -w "" http://localhost:3001/api/health >nul 2>nul
if %errorlevel% equ 0 goto ready
set /a retries+=1
if %retries% geq 15 (
    echo  [ERROR] Server failed to start within 15 seconds.
    pause
    exit /b 1
)
goto healthcheck

:ready
echo.
echo  Server is running at http://localhost:3001
echo  Opening browser...
start http://localhost:3001
echo.
echo  Press any key to stop the server...
pause >nul

:: Stop server
taskkill /f /im node.exe >nul 2>nul
echo  Server stopped.
