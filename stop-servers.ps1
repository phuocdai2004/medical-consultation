# Script để dừng tất cả servers
Write-Host "🛑 Stopping All Servers..." -ForegroundColor Red
Write-Host "============================" -ForegroundColor Red
Write-Host ""

# Function to kill process on port
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "🔍 Checking port $Port..." -ForegroundColor Yellow
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "   ❌ Stopping: $($process.Name) (PID: $processId)" -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "   ✅ Port $Port is now free" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Port $Port is already free" -ForegroundColor Gray
    }
    Write-Host ""
}

# Kill backend (port 8000)
Kill-ProcessOnPort -Port 8000

# Kill frontend (port 8081)
Kill-ProcessOnPort -Port 8081

# Kill any node processes
Write-Host "🔍 Stopping all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "   ❌ Stopping Node.js (PID: $($proc.Id))" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ All Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No Node.js processes running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================" -ForegroundColor Red
Write-Host "✅ All servers stopped!" -ForegroundColor Green
Write-Host ""
