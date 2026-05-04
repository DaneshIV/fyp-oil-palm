# Start Cloudflared tunnel
Start-Process powershell -ArgumentList "-NoExit -Command `"cloudflared tunnel run fyp-oil-palm`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd C:\Users\danes\fyp-oil-palm; fyp_env\Scripts\activate; python iriv_scripts/daily_summary.py`""
Write-Host "Cloudflared tunnel started!" -ForegroundColor Cyan
Write-Host "Dashboard: https://app.project2030.me" -ForegroundColor Green
Write-Host "API:       https://api.project2030.me" -ForegroundColor Green
Write-Host "Daily summary scheduler started!" -ForegroundColor Green
