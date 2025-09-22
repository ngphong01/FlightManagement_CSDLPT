@echo off
echo ========================================
echo    HỆ THỐNG QUẢN LÝ VÉ MÁY BAY
echo    Backend API Gateway - CSDL Phân Tán
echo ========================================
echo.

echo [1/4] Kiểm tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chưa được cài đặt!
    echo    Vui lòng cài đặt Node.js từ: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js đã sẵn sàng

echo.
echo [2/4] Kiểm tra MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL chưa được cài đặt!
    echo    Vui lòng cài đặt MySQL từ: https://dev.mysql.com/downloads/
    pause
    exit /b 1
)
echo ✅ MySQL đã sẵn sàng

echo.
echo [3/4] Cài đặt dependencies...
cd backend
if not exist node_modules (
    echo 📦 Đang cài đặt packages...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Lỗi cài đặt dependencies!
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies đã sẵn sàng
)

echo.
echo [4/4] Khởi động Backend API Gateway...
echo.
echo 🚀 Đang khởi động server...
echo 📍 API Gateway: http://localhost:3001
echo 🔗 Health Check: http://localhost:3001/health
echo 📊 API Docs: http://localhost:3001/api
echo.
echo 🗄️  CSDL Phân Tán:
echo    📍 Site Hà Nội (Bắc): MySQL Port 3306
echo    📍 Site Đà Nẵng (Trung): MySQL Port 3307  
echo    📍 Site TP.HCM (Nam): MySQL Port 3308
echo.
echo 🔐 Thông tin đăng nhập:
echo    👤 Username: admin
echo    🔑 Password: admin123
echo.
echo ⚠️  Lưu ý: Đảm bảo MySQL đang chạy trên các port 3306, 3307, 3308
echo.

node server.js

pause