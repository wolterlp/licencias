@echo off
echo ==========================================
echo    Iniciando Sistema de Licencias
echo ==========================================

echo Iniciando Backend Server (Puerto 5001)...
start "Backend Server" cmd /k "npm run dev"

echo Esperando unos segundos para que arranque el backend...
timeout /t 5 /nobreak >nul

echo Iniciando Frontend Dashboard (Puerto 5171)...
cd admin-dashboard
start "Frontend Dashboard" cmd /k "npm run dev"

echo ==========================================
echo    Todo listo! Las servicios se han Iniciando.
echo ==========================================
