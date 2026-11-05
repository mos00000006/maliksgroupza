param(
  [Parameter(Mandatory=$true)]
  [string]$HubRoot
)
$ErrorActionPreference = 'Stop'
$target = (Resolve-Path -LiteralPath $HubRoot).Path
$source = $PSScriptRoot
$patch = Join-Path $source 'hub-tills-assignment.patch'
$files = @(
  'app/lib/tills-route-policy.ts',
  'app/api/tills/shared.ts',
  'app/api/tills/session/route.ts',
  'app/api/tills/catalogue/route.ts',
  'app/tills/page.tsx',
  'app/tills/till-checkout.tsx',
  'app/tills/tills.module.css',
  'tests/tills-access.test.mjs'
)

if (-not (Test-Path -LiteralPath (Join-Path $target 'package.json'))) {
  throw 'Select the Hub project folder containing package.json.'
}
foreach ($relative in $files) {
  if (Test-Path -LiteralPath (Join-Path $target $relative)) {
    throw "The new path already exists: $relative. Stop and review it before proceeding."
  }
}
Push-Location $target
try {
  & git apply --check -- $patch
  if ($LASTEXITCODE -ne 0) { throw 'The patch does not match this Hub version. Do not overwrite existing files. Request a merge.' }
  & git apply -- $patch
  if ($LASTEXITCODE -ne 0) { throw 'Patch apply failed. No further files were copied.' }
  foreach ($relative in $files) {
    $dest = Join-Path $target $relative
    $folder = Split-Path -Parent $dest
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $source ('new-files/' + $relative)) -Destination $dest
  }
  Write-Host 'Maliks Hub Sales / Tills files applied to your working copy.' -ForegroundColor Green
  Write-Host 'Review git diff, run: node --test tests/tills-access.test.mjs and npm run build before deploying.'
} finally {
  Pop-Location
}
