@echo off
cd /d "%~dp0"
title DirectPrint_8085
echo ==================================================
echo   Starting DirectPrint_8085 Print Server
echo   Port: 8085
echo ==================================================
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Please install Node.js (https://nodejs.org) and try again.
  pause
  exit /b 1
)

:: Determine where package.json is (parent or local folder)
if exist "..\package.json" (
  if not exist "..\node_modules" (
    echo Dependencies not found. Installing in parent directory...
    cd ..
    call npm install
    cd print-server
  )
) else (
  if not exist "node_modules" (
    echo Dependencies not found. No parent package.json. Installing locally...
    call npm init -y
    call npm install express puppeteer pdf-to-printer
  )
)

:: Run print server
node server.js
if %errorlevel% neq 0 (
  echo.
  echo Server failed to start. Retrying with npm install...
  if exist "..\package.json" (
    cd ..
    call npm install
    cd print-server
  ) else (
    call npm install express puppeteer pdf-to-printer
  )
  node server.js
)

pause
