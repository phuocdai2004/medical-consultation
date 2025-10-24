# Medical Consultation - Auto Start Script
Write-Host "Medical Consultation - Auto Start" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Function to stop process on port
function Stop-PortProcess {
    param([int]$Port)
    
    Write-Host "Checking port $Port..." -ForegroundColor Yellow
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "  Stopping: $($process.Name) (PID: $processId)" -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
            }
        }
        Write-Host "  Port $Port is now free" -ForegroundColor Green
    } else {
        Write-Host "  Port $Port is free" -ForegroundColor Green
    }
    Write-Host ""
}

# Stop processes on ports
Stop-PortProcess -Port 8000
Stop-PortProcess -Port 8081

# Start backend
Write-Host "Starting Backend (Port 8000)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start"

Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Frontend (Port 8081)..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start"

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Servers starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:8081" -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 5
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:8081"

Write-Host "Done!" -ForegroundColor Green
