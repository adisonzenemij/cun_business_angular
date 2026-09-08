$ErrorActionPreference = "Stop"

Write-Host "PowerShell: $($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"
Write-Host ""

$scriptPath = "D:\Engineering\Software\spacing\github\adisonzenemij\d88676c1fd0a\.scripts\script.bat"
$env:SCRIPT_PROJECT_ROOT = (Get-Location).ProviderPath
$result = 1
$locationChanged = $false

try {
    if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
        throw "No se encontró el archivo: $scriptPath"
    }

    $scriptDirectory = Split-Path -Parent $scriptPath

    Push-Location -LiteralPath $scriptDirectory
    $locationChanged = $true

    & $scriptPath

    if ($null -eq $LASTEXITCODE) {
        $result = 0
    }
    else {
        $result = $LASTEXITCODE
    }

    Write-Host ""

    if ($result -ne 0) {
        Write-Host "El proceso finalizó con el código de error: $result"
    }
    else {
        Write-Host "El proceso finalizó correctamente."
    }
}
catch {
    $result = 1

    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)"
}
finally {
    if ($locationChanged) {
        Pop-Location
    }

    Write-Host ""
    Read-Host "Presione Enter para finalizar"
}

exit $result
