@echo off
setlocal
cd /d "%~dp0"
if not exist "maliks-operations\package.json" (
  echo ERROR: Extract this ZIP into the ROOT of your current maliksgroupza repository.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  pause
  exit /b 1
)
echo Applying Phase 54 missing Back Office integrations...
node "maliks-operations\scripts\apply-phase54.mjs"
if errorlevel 1 (
  echo Patch failed: check the error before committing.
  pause
  exit /b 1
)
echo.
echo Running 8 focused tests...
cd maliks-operations
node --test tests/phase54-backoffice-wiring.test.mjs tests/phase54-backoffice-masters.test.mjs
if errorlevel 1 (
  echo Tests failed. Do not deploy yet.
  pause
  exit /b 1
)
echo.
echo Success. Commit changed files and push to GitHub.
pause
