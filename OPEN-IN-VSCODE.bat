@echo off
setlocal
cd /d "%~dp0"

where code >nul 2>nul
if errorlevel 1 (
  echo Visual Studio Code was not found on the command line.
  echo Open VS Code, select File then Open Workspace from File,
  echo and choose Maliks-Group-Hub.code-workspace from this folder.
  pause
  exit /b 1
)

code "Maliks-Group-Hub.code-workspace"
