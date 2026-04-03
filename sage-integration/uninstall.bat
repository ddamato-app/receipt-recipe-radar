@echo off
:: SAGE 300 POS Integration - Windows Service Uninstaller
:: Run this script as Administrator

echo ============================================
echo  SAGE 300 POS Integration - Uninstall
echo ============================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    pause
    exit /b 1
)

cd /d "%~dp0"
node dist\install.js --uninstall

echo.
echo Service uninstalled.
pause
