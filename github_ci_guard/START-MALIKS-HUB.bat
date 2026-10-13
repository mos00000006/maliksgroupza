@echo off
setlocal
title Maliks Group Hub
cd /d "%~dp0"

echo ================================================
echo            MALIKS GROUP HUB
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.13 or newer is required.
  echo Download it from https://nodejs.org/ and then run this file again.
  pause
  exit /b 1
)

if not exist .dev.vars copy .dev.vars.example .dev.vars >nul
if not exist node_modules (
  echo Installing the Maliks Group Hub packages...
  call npm ci
  if errorlevel 1 goto :failed
)

echo Preparing the local Hub database...
set "CI=true"
call npm run db:migrate:local
set "CI="
if errorlevel 1 goto :failed

echo Starting Maliks Group Hub...
echo Please wait. The browser will open only when the Hub is ready.
start "" powershell -NoProfile -WindowStyle Hidden -Command "$url='http://127.0.0.1:5173'; for($i=0; $i -lt 180; $i++){ try { $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if($response.StatusCode -ge 200){ Start-Process $url; exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
call npm run dev
set "HUB_EXIT=%errorlevel%"
echo.
echo The Hub server has stopped with code %HUB_EXIT%.
echo This window will remain open so the message can be reviewed.
pause
exit /b %HUB_EXIT%

:failed
echo.
echo The Hub could not start. The error is shown above.
echo Take a clear photo of the last error lines if technical help is needed.
pause
exit /b 1
