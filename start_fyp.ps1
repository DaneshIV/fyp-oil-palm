# 1. Check MySQL
$mysql = Get-Service -Name "MySQL80"
if ($mysql.Status -ne "Running") {
    Start-Service -Name "MySQL80"
    Write-Host "MySQL started" -ForegroundColor Green
} else {
    Write-Host "MySQL already running" -ForegroundColor Green
}

# 2. Start FastAPI (new terminal)
Start-Process powershell -ArgumentList "-NoExit -Command `"cd C:\Users\danes\fyp-oil-palm; fyp_env\Scripts\activate; uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`""

# 3. Start Dashboard (new terminal)
Start-Process powershell -ArgumentList "-NoExit -Command `"cd C:\Users\danes\fyp-oil-palm\dashboard; npm run dev`""

Write-Host "All services starting!" -ForegroundColor Cyan