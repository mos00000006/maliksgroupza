@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Apply-Recovery.ps1"
if errorlevel 1 (
  echo.
  echo PATCH NOT INSTALLED. Read the error above and send a screenshot.
  pause
  exit /b 1
)
echo.
echo SUCCESS. Open GitHub Desktop and review the four changed files.
pause
