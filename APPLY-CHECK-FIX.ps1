\
    $ErrorActionPreference = "Stop"
    if (Test-Path ".\app\app") {
      Remove-Item ".\app\app" -Recurse -Force
    }
    Copy-Item ".\app\catalogue.tsx" ".\app\catalogue.tsx" -Force
    Write-Host "Nested app/app folder removed if present."
    Write-Host "Now run: npm run check"
