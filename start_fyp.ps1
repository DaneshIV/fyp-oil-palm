# Start Cloudflared tunnel
Start-Process powershell -ArgumentList "-NoExit -Command `"cloudflared tunnel run fyp-oil-palm`""
Write-Host "Cloudflared tunnel started!" -ForegroundColor Cyan
Write-Host "Dashboard: https://app.project2030.me" -ForegroundColor Green
Write-Host "API:       https://api.project2030.me" -ForegroundColor Green