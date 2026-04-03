@echo off
:: SAGE 300 POS Integration - Windows Service Installer
:: Run this script as Administrator

echo ============================================
echo  SAGE 300 POS Integration - Install
echo ============================================
echo.

:: Check for Administrator rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    echo Right-click install.bat and choose "Run as administrator"
    pause
    exit /b 1
)

:: Check Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Download from https://nodejs.org
    pause
    exit /b 1
)

:: Check config.json exists
if not exist "%~dp0config.json" (
    echo ERROR: config.json not found.
    echo Copy config.example.json to config.json and fill in your SAGE 300 credentials.
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
cd /d "%~dp0"
call npm install --omit=dev
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: TypeScript build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Installing Windows service...
node dist\install.js --install
if %errorlevel% neq 0 (
    echo ERROR: Service installation failed.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Installation complete!
echo  The service will start automatically.
echo  Check Services (services.msc) to confirm.
echo ============================================
pause
