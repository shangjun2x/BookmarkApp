@echo off
setlocal

echo.
echo  ========================================
echo   Bookmark Manager - Package Builder
echo  ========================================
echo.

set "SRC=%~dp0"
set "DIST=%~dp0dist\BookmarkManager"

:: Clean previous build
if exist "%~dp0dist" rmdir /s /q "%~dp0dist"
mkdir "%DIST%"

echo [1/4] Copying server files...
mkdir "%DIST%\server"
mkdir "%DIST%\server\routes"
mkdir "%DIST%\server\middleware"
copy "%SRC%server\index.js" "%DIST%\server\" >nul
copy "%SRC%server\db.js" "%DIST%\server\" >nul
copy "%SRC%server\package.json" "%DIST%\server\" >nul
copy "%SRC%server\routes\*.js" "%DIST%\server\routes\" >nul
copy "%SRC%server\middleware\*.js" "%DIST%\server\middleware\" >nul

echo [2/4] Copying frontend build...
xcopy "%SRC%client\build" "%DIST%\client\build\" /E /Q /Y >nul

echo [3/4] Installing production dependencies...
cd /d "%DIST%\server"
call npm install --omit=dev --silent 2>nul

echo [4/4] Creating launcher...

:: Create run.bat
(
:: Copy run.bat from dist source
copy "%SRC%dist\BookmarkManager\run.bat" "%DIST%\run.bat" >nul

:: Create README
(
echo # Bookmark Manager
echo.
echo ## How to Run
echo.
echo 1. Make sure Node.js is installed ^(https://nodejs.org^)
echo 2. Double-click **run.bat**
echo 3. Open http://localhost:3001 in your browser
echo 4. Register a new account and start bookmarking!
echo.
echo ## Requirements
echo.
echo - Node.js 16+
echo.
echo ## Data
echo.
echo Your data is stored in `server/bookmarks.db` ^(SQLite^).
echo Back up this file to preserve your bookmarks.
) > "%DIST%\README.md"

echo.
echo  ========================================
echo   Package created at: dist\BookmarkManager
echo  ========================================
echo.
echo  You can zip the dist\BookmarkManager folder
echo  and share it. Users just need Node.js
echo  installed, then double-click run.bat
echo.
pause
