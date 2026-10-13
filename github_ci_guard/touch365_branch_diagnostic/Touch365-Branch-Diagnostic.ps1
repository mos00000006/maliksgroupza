$ErrorActionPreference = 'SilentlyContinue'

$desktop = [Environment]::GetFolderPath('Desktop')
$outFile = Join-Path $desktop 'Touch365-Branch-Diagnostic.txt'

function Add-Line([string]$Text = '') {
    Add-Content -Path $outFile -Value $Text -Encoding UTF8
}

function Add-Section([string]$Title) {
    Add-Line ''
    Add-Line ('=' * 72)
    Add-Line $Title
    Add-Line ('=' * 72)
}

Remove-Item $outFile -Force -ErrorAction SilentlyContinue

Add-Line 'POWERBUILD / MALIKS GROUP - TOUCH365 BRANCH DIAGNOSTIC'
Add-Line ('Generated: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
Add-Line 'This report intentionally excludes passwords and secret values.'

Add-Section '1. COMPUTER / WINDOWS'
Add-Line ('Computer name: ' + $env:COMPUTERNAME)
Add-Line ('Windows user: ' + $env:USERNAME)
$os = Get-CimInstance Win32_OperatingSystem
if ($os) {
    Add-Line ('Windows: ' + $os.Caption + ' ' + $os.Version + ' (' + $os.OSArchitecture + ')')
}

Add-Section '2. ODBC SYSTEM DSNs - 64 BIT'
$dsn64 = 'HKLM:\SOFTWARE\ODBC\ODBC.INI\ODBC Data Sources'
if (Test-Path $dsn64) {
    $props = (Get-ItemProperty $dsn64).PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' }
    if ($props) {
        foreach ($p in $props) {
            Add-Line (('{0}  |  Driver: {1}' -f $p.Name, $p.Value))
            $detailPath = 'HKLM:\SOFTWARE\ODBC\ODBC.INI\' + $p.Name
            if (Test-Path $detailPath) {
                $detail = Get-ItemProperty $detailPath
                foreach ($field in @('Driver','Server','Database','DBQ','Host','Port','Description')) {
                    $val = $detail.$field
                    if ($null -ne $val -and "$val" -ne '') { Add-Line (('   {0}: {1}' -f $field, $val)) }
                }
            }
        }
    } else { Add-Line 'No 64-bit System DSNs found.' }
} else { Add-Line 'No 64-bit System DSNs found.' }

Add-Section '3. ODBC SYSTEM DSNs - 32 BIT'
$dsn32 = 'HKLM:\SOFTWARE\WOW6432Node\ODBC\ODBC.INI\ODBC Data Sources'
if (Test-Path $dsn32) {
    $props = (Get-ItemProperty $dsn32).PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' }
    if ($props) {
        foreach ($p in $props) {
            Add-Line (('{0}  |  Driver: {1}' -f $p.Name, $p.Value))
            $detailPath = 'HKLM:\SOFTWARE\WOW6432Node\ODBC\ODBC.INI\' + $p.Name
            if (Test-Path $detailPath) {
                $detail = Get-ItemProperty $detailPath
                foreach ($field in @('Driver','Server','Database','DBQ','Host','Port','Description')) {
                    $val = $detail.$field
                    if ($null -ne $val -and "$val" -ne '') { Add-Line (('   {0}: {1}' -f $field, $val)) }
                }
            }
        }
    } else { Add-Line 'No 32-bit System DSNs found.' }
} else { Add-Line 'No 32-bit System DSNs found.' }

Add-Section '4. INSTALLED ODBC DRIVERS'
$driverPaths = @(
    'HKLM:\SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers',
    'HKLM:\SOFTWARE\WOW6432Node\ODBC\ODBCINST.INI\ODBC Drivers'
)
$seen = @{}
foreach ($path in $driverPaths) {
    if (Test-Path $path) {
        $props = (Get-ItemProperty $path).PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' }
        foreach ($p in $props) {
            if (-not $seen.ContainsKey($p.Name)) {
                $seen[$p.Name] = $true
                Add-Line $p.Name
            }
        }
    }
}
if ($seen.Count -eq 0) { Add-Line 'No ODBC drivers enumerated.' }

Add-Section '5. DATABASE / TOUCH RELATED WINDOWS SERVICES'
$pattern = 'touch|365|sql|mssql|firebird|postgres|mysql|maria|pervasive|actian|zen|sage|kerridge'
$services = Get-Service | Where-Object { $_.Name -match $pattern -or $_.DisplayName -match $pattern } | Sort-Object DisplayName
if ($services) {
    foreach ($s in $services) {
        Add-Line (('{0} | {1} | Status: {2}' -f $s.Name, $s.DisplayName, $s.Status))
    }
} else { Add-Line 'No matching services found.' }

Add-Section '6. DATABASE / TOUCH RELATED RUNNING PROCESSES'
$processes = Get-Process | Where-Object { $_.ProcessName -match $pattern } | Sort-Object ProcessName
if ($processes) {
    foreach ($p in $processes) {
        Add-Line (('{0} | PID {1}' -f $p.ProcessName, $p.Id))
    }
} else { Add-Line 'No matching running processes found.' }

Add-Section '7. INSTALLED PROGRAMS MATCHING TOUCH / DATABASE ENGINES'
$uninstallPaths = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$apps = foreach ($path in $uninstallPaths) {
    Get-ItemProperty $path | Where-Object {
        $_.DisplayName -and $_.DisplayName -match $pattern
    } | Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation
}
$apps = $apps | Sort-Object DisplayName -Unique
if ($apps) {
    foreach ($a in $apps) {
        Add-Line (('{0} | Version: {1} | Publisher: {2}' -f $a.DisplayName, $a.DisplayVersion, $a.Publisher))
        if ($a.InstallLocation) { Add-Line ('   Install location: ' + $a.InstallLocation) }
    }
} else { Add-Line 'No matching installed programs found.' }

Add-Section '8. LOCAL LISTENING DATABASE PORTS (COMMON PORTS ONLY)'
$commonPorts = @(1433,1434,3050,3306,5432,1583,1584)
$connections = Get-NetTCPConnection -State Listen | Where-Object { $commonPorts -contains $_.LocalPort } | Sort-Object LocalPort
if ($connections) {
    foreach ($c in $connections) {
        Add-Line (('Port {0} | Address {1} | PID {2}' -f $c.LocalPort, $c.LocalAddress, $c.OwningProcess))
    }
} else { Add-Line 'No common database ports detected as listening locally.' }

Add-Section '9. NEXT STEP'
Add-Line 'Send this report back to the developer/ChatGPT together with a screenshot of Touch365 Stock On Hand.'
Add-Line 'Do NOT send passwords, API keys, or database passwords.'
Add-Line 'The next build will use the detected connection method to read product code + on-hand quantity for this branch.'

Write-Host ''
Write-Host 'Diagnostic completed successfully.' -ForegroundColor Green
Write-Host ('Report saved to: ' + $outFile) -ForegroundColor Cyan
