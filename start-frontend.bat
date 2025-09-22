@echo off
rem Ensure we run from the script's directory (public/)
cd /d "%~dp0"

echo ========================================
echo    HỆ THỐNG QUẢN LÝ VÉ MÁY BAY
echo    Frontend - CSDL Phân Tán
echo ========================================
echo.

echo [1/3] Kiểm tra file Frontend...
if not exist index.html (
    echo ❌ File index.html không tồn tại trong: %cd%
    pause
    exit /b 1
)
echo ✅ File Frontend đã sẵn sàng

echo.
echo [2/3] Kiểm tra Backend API...
echo 🔍 Đang kiểm tra kết nối Backend...
where curl >nul 2>&1 && (curl -s http://localhost:3001/health >nul 2>&1) || (powershell -Command "try{Invoke-WebRequest -UseBasicParsing http://localhost:3001/health ^| Out-Null;$host.SetShouldExit(0)}catch{$host.SetShouldExit(1)}")
if %errorlevel% neq 0 (
    echo ⚠️  Backend chưa chạy! Vui lòng chạy start-backend.bat trước
) else (
    echo ✅ Backend đã sẵn sàng
)

echo.
echo [3/3] Khởi động Frontend...
echo 🌐 Đang mở: file:///%~dp0index.html
start "" "%~dp0index.html"

echo ✅ Frontend đã được mở trong trình duyệt!
echo.
echo 💡 Mẹo:
echo    - Đảm bảo Backend đang chạy trên port 3001
echo    - Sử dụng Chrome/Firefox để có trải nghiệm tốt nhất
echo    - Nhấn Ctrl+F5 để refresh cứng
echo.

pause