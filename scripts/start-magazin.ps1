$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $Root "scripts\logs"
$LogFile = Join-Path $LogDir "autostart.log"
$ComposeFile = Join-Path $Root "docker-compose.yml"
$DockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
$NodeDir = "C:\Program Files\nodejs"

function Write-Log([string]$Message) {
  if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
  }
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Host $line
}

function Test-PortListening([int]$Port) {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $conn
}

function Wait-DockerReady([int]$TimeoutSec = 180) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -eq 0) { return $true }
    Start-Sleep -Seconds 3
  }
  return $false
}

Write-Log "=== Magazin POS autostart began ==="
Write-Log "Root: $Root"
$env:Path = "$NodeDir;C:\Program Files\Docker\Docker\resources\bin;$env:Path"

& docker info 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Log "Starting Docker Desktop..."
  if (Test-Path $DockerDesktop) {
    Start-Process -FilePath $DockerDesktop | Out-Null
  } else {
    Write-Log "Docker Desktop not found"
  }
  if (-not (Wait-DockerReady 240)) {
    Write-Log "ERROR: Docker not ready"
    exit 1
  }
  Write-Log "Docker ready"
}

if (-not (Wait-DockerReady 60)) {
  Write-Log "ERROR: Docker failed"
  exit 1
}

Write-Log "Starting PostgreSQL..."
Push-Location $Root
try {
  & docker compose -f $ComposeFile up -d 2>&1 | ForEach-Object { Write-Log "$_" }
} finally {
  Pop-Location
}

$pgReady = $false
for ($i = 1; $i -le 40; $i++) {
  $status = & docker inspect -f "{{.State.Health.Status}}" magazin_pos_db 2>$null
  if ($status -eq "healthy") { $pgReady = $true; break }
  Start-Sleep -Seconds 3
}
if ($pgReady) { Write-Log "PostgreSQL healthy" } else { Write-Log "WARN: PostgreSQL health timeout" }

$frontendUp = Test-PortListening 5173
$backendUp = Test-PortListening 3001

if ($frontendUp -and $backendUp) {
  Write-Log "Servers already running"
} else {
  Write-Log "Starting npm run dev..."
  $npmCmd = Join-Path $NodeDir "npm.cmd"
  Start-Process -FilePath "cmd.exe" -ArgumentList @(
    "/k",
    "title Magazin POS && cd /d `"$Root`" && `"$npmCmd`" run dev"
  ) -WorkingDirectory $Root | Out-Null

  for ($i = 1; $i -le 60; $i++) {
    if ((Test-PortListening 5173) -and (Test-PortListening 3001)) { break }
    Start-Sleep -Seconds 2
  }

  if ((Test-PortListening 5173) -and (Test-PortListening 3001)) {
    Write-Log "OK http://localhost:5173"
  } else {
    Write-Log "WARN: ports not open yet"
  }
}

Start-Sleep -Seconds 2
try {
  Start-Process "http://localhost:5173/login"
  Write-Log "Browser opened"
} catch {
  Write-Log "Browser open failed"
}

Write-Log "=== Magazin POS autostart done ==="