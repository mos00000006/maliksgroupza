@echo off
setlocal
for /f "delims=" %%I in ('git -C "%~dp0." rev-parse --show-toplevel 2^>nul') do set "REPO=%%I"
if not defined REPO (
  echo ERROR: Extract this ZIP inside your maliksgroupza Git repository first.
  pause
  exit /b 1
)
cd /d "%REPO%"
if not exist "app\catalogue.tsx" (
  echo ERROR: This is not the Maliks Group Hub source repository.
  pause
  exit /b 1
)
git apply --check "%~dp0catalogue-recovery.patch"
if errorlevel 1 (
  echo ERROR: Patch does not match your current files, or is already installed. No changes made.
  pause
  exit /b 1
)
git apply "%~dp0catalogue-recovery.patch"
if errorlevel 1 (
  echo ERROR: Patch could not be applied.
  pause
  exit /b 1
)
echo.
echo Catalogue recovery patch applied. Review the two modified files.
echo Run npm run check before committing and pushing.
git status --short -- app/catalogue.tsx tests/catalogue-photo-print.test.mjs
pause
