$ErrorActionPreference = 'Stop'
try {
    $git = $null
    $command = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($command) { $git = $command.Source }
    if (-not $git) {
        $desktopRoot = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
        $apps = @(Get-ChildItem -LiteralPath $desktopRoot -Directory -Filter 'app-*' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
        foreach ($app in $apps) {
            foreach ($relative in @('resources\app\git\cmd\git.exe','resources\app\git\bin\git.exe')) {
                $candidate = Join-Path $app.FullName $relative
                if (Test-Path -LiteralPath $candidate -PathType Leaf) { $git = $candidate; break }
            }
            if ($git) { break }
        }
    }
    if (-not $git) {
        foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
            if (-not $base) { continue }
            $candidate = Join-Path $base 'Git\cmd\git.exe'
            if (Test-Path -LiteralPath $candidate -PathType Leaf) { $git = $candidate; break }
        }
    }
    if (-not $git) { throw 'GitHub Desktop bundled Git was not found. Open GitHub Desktop and ensure it is installed for this Windows user.' }
    Write-Host 'Git executable found.' -ForegroundColor Green
    function Test-HubFolder([string]$folder) {
        if (-not $folder) { return $false }
        return ((Test-Path -LiteralPath (Join-Path $folder '.git')) -and
                (Test-Path -LiteralPath (Join-Path $folder 'app\catalogue.tsx')) -and
                (Test-Path -LiteralPath (Join-Path $folder 'infrastructure\wrangler.jsonc')) -and
                (Test-Path -LiteralPath (Join-Path $folder '.github\workflows\deploy.yml')))
    }
    $root = $null
    $folder = Get-Item -LiteralPath $PSScriptRoot
    while ($folder) {
        if (Test-HubFolder $folder.FullName) { $root = $folder.FullName; break }
        $folder = $folder.Parent
    }
    if (-not $root) {
        $known = Join-Path $env:USERPROFILE 'Documents\websites\Busterbuild Hardware\maliksgroupza'
        if (Test-HubFolder $known) { $root = $known }
    }
    if (-not $root) {
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = 'Select the maliksgroupza repository folder (Show in Explorer in GitHub Desktop).'
        if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { throw 'No repository selected.' }
        $root = $dialog.SelectedPath
    }
    if (-not (Test-HubFolder $root)) { throw 'Selected folder is not the expected Hub Git repository.' }
    $remote = & $git -C $root remote get-url origin
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '[:/]mos00000006/maliksgroupza(?:\.git)?/?$') { throw 'Origin is not mos00000006/maliksgroupza. No files changed.' }
    $branch = & $git -C $root branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') { throw 'Switch to main in GitHub Desktop first. No files changed.' }
    Write-Host "Repository: $root" -ForegroundColor Cyan
    $patches = @('catalogue-recovery.patch','r2-deployment-recovery.patch')
    $pending = @()
    foreach ($name in $patches) {
        $file = Join-Path $PSScriptRoot $name
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing $name. Extract the full ZIP first." }
        $ErrorActionPreference = 'Continue'
        & $git -C $root apply --reverse --check --quiet $file 2>$null
        $reverseStatus = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($reverseStatus -eq 0) { Write-Host "$name already installed."; continue }
        & $git -C $root apply --check $file
        if ($LASTEXITCODE -ne 0) { throw "$name conflicts with existing files. No patches applied by this run." }
        $pending += $file
    }
    if ($pending.Count -gt 0) {
        & $git -C $root apply --check @pending
        if ($LASTEXITCODE -ne 0) { throw 'Combined patch check failed. No files changed.' }
        & $git -C $root apply @pending
        if ($LASTEXITCODE -ne 0) { throw 'Patch apply failed. Review changes in GitHub Desktop.' }
    }
    Write-Host 'Recovery patch installed or already present.' -ForegroundColor Green
    & $git -C $root status --short -- app/catalogue.tsx tests/catalogue-photo-print.test.mjs .github/workflows/deploy.yml scripts/deploy-hub-r2-recovery.sh
    Write-Host 'No commit, push, database or Cloudflare operation was performed.'
    exit 0
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
