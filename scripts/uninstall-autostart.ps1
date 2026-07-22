$ErrorActionPreference = "Continue"
$TaskName = "MagazinPOS-Autostart"
$StartupDir = [Environment]::GetFolderPath("Startup")
$LnkPath = Join-Path $StartupDir "MagazinPOS.lnk"

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "Removed task: $TaskName"
}

if (Test-Path $LnkPath) {
  Remove-Item $LnkPath -Force
  Write-Host "Removed Startup shortcut: $LnkPath"
} else {
  Write-Host "Startup shortcut not found"
}
Write-Host "Done"