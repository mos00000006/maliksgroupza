@echo off
setlocal
cd /d "%~dp0"
echo.
echo PowerBuild / Maliks Group - Touch365 Branch Diagnostic
echo ------------------------------------------------------
echo This tool only reads Windows connection/configuration information.
echo It does NOT collect or display passwords.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Touch365-Branch-Diagnostic.ps1"
echo.
echo Finished. Check your Desktop for: Touch365-Branch-Diagnostic.txt
echo.
pause
