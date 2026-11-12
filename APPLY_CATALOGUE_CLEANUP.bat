@echo off
setlocal
set "ROOT=%~dp0"
set "PATCH=%ROOT%PATCH_FILES"

if not exist "%ROOT%package.json" (
  echo ERROR: This patch is not in the Hub project root.
  echo Open GitHub Desktop, choose Show in Explorer, then extract this ZIP into that folder.
  pause
  exit /b 1
)

if not exist "%PATCH%\app\catalogue.tsx" goto missing
if not exist "%PATCH%\app\globals.css" goto missing
if not exist "%PATCH%\app\api\catalogue\cleanup\route.ts" goto missing
if not exist "%ROOT%app\api\catalogue\cleanup" mkdir "%ROOT%app\api\catalogue\cleanup"

copy /Y "%PATCH%\app\catalogue.tsx" "%ROOT%app\catalogue.tsx" >nul
if errorlevel 1 goto failed
copy /Y "%PATCH%\app\globals.css" "%ROOT%app\globals.css" >nul
if errorlevel 1 goto failed
copy /Y "%PATCH%\app\api\catalogue\cleanup\route.ts" "%ROOT%app\api\catalogue\cleanup\route.ts" >nul
if errorlevel 1 goto failed

echo.
echo Catalogue cleanup patch applied to this Hub repository.
echo GitHub Desktop should now show 2 modified files and 1 new file.
echo Commit and push those changes to main, then check the GitHub Actions deployment.
pause
exit /b 0

:missing
echo ERROR: Patch files are incomplete. Re-download the ZIP and extract it again.
pause
exit /b 1

:failed
echo ERROR: A file could not be copied. Make sure VS Code is closed or the files are not read-only, then run this again.
pause
exit /b 1
