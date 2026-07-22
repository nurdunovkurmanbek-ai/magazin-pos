$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$StartScript = Join-Path $PSScriptRoot "start-magazin.ps1"
$TaskName = "MagazinPOS-Autostart"
$DockerSettings = Join-Path $env:APPDATA "Docker\settings-store.json"
$CmdPath = Join-Path $PSScriptRoot "start-magazin-hidden.cmd"

if (-not (Test-Path $StartScript)) { throw "Missing start-magazin.ps1" }

if (Test-Path $DockerSettings) {
  try {
    $json = (Get-Content $DockerSettings -Raw -Encoding UTF8) | ConvertFrom-Json
    $json.AutoStart = $true
    $json | ConvertTo-Json -Depth 20 | Set-Content $DockerSettings -Encoding UTF8
    Write-Host "Docker AutoStart = true"
  } catch {
    Write-Host "Docker settings skip"
  }
}

$cmd = "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`"`r`n"
$utf8bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($CmdPath, $cmd, $utf8bom)

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false }

$arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg -WorkingDirectory $Root
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = "PT45S"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Magazin POS autostart" -Force | Out-Null

Write-Host ""
Write-Host "OK: Autostart installed ($TaskName, delay 45s)"
Write-Host "After Windows login: Docker + site start, opens http://localhost:5173"
Write-Host "Uninstall: npm run autostart:uninstall"
