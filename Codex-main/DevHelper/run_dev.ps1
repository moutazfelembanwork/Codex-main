
# Opens two PowerShell windows: backend and frontend
$script:RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path $script:RepoRoot
$Backend = Join-Path $ProjectRoot "backend"
$Client = Join-Path $ProjectRoot "client"

Write-Host "➡️ Installing backend deps..." -ForegroundColor Cyan
pushd $Backend
if (Test-Path "package-lock.json") { npm ci } else { npm install }
popd

Write-Host "➡️ Installing client deps..." -ForegroundColor Cyan
pushd $Client
if (Test-Path "package-lock.json") { npm ci } else { npm install }
popd

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$Backend`"; npm run start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$Client`"; npm run start"

Write-Host "✅ Launched backend (http://localhost:5000) and frontend (http://localhost:3000)." -ForegroundColor Green
