@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Change to repo root
cd /d %~dp0

echo Starting Backend (port 3001)...
start "Backend" cmd /c "cd backend && npm install --no-audit --fund=false --loglevel=error && node server.js"

REM Small delay to let backend boot
timeout /t 2 /nobreak >nul

echo Starting Frontend (Vite on 5173)...
start "Frontend" cmd /c "cd frontend && npm install --no-audit --fund=false --loglevel=error && npm run dev"

echo Both processes started in separate windows.
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:5173

endlocal
exit /b 0


