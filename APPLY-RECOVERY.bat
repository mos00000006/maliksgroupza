@echo off
setlocal
node "%~dp0apply-recovery.mjs"
if errorlevel 1 (
  echo Recovery patch was not installed. Read the error above.
  pause
  exit /b 1
)
echo Run npm run check and commit the changed files.
pause
