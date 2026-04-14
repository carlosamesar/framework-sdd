$ErrorActionPreference = 'Stop'

$taskName = 'FrameworkSDD-MemoryDaemons-Autostart'
$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot 'scripts\start-memory-daemons-windows.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "No existe el script de arranque: $scriptPath"
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $scriptPath + '"')
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Tarea creada/actualizada: $taskName"
Write-Host "Script asociado: $scriptPath"
Write-Host "Estado actual:"
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State,TaskPath | Format-List
