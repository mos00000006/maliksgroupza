@echo off
cd /d "%~dp0"
if not exist "app\page.tsx" (
  echo ERROR: Move INSTALL_PAIA_BUTTON.bat and the scripts folder into the main maliksgroupza project folder.
  echo The main project folder must contain app\page.tsx.
  pause
  exit /b 1
)
node scripts\add-paia-sidebar-button.mjs
if errorlevel 1 (
  echo Could not install the menu button. See the error above.
) else (
  echo.
  echo Now commit the changed app\page.tsx to GitHub and deploy.
)
pause
