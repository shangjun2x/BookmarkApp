@echo off
echo Stopping Bookmark Manager...
taskkill /f /im node.exe >nul 2>&1
echo Done.
timeout /t 2 /nobreak >nul
