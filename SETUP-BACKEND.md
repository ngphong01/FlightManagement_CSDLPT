# Hướng dẫn thiết lập Backend

## Vấn đề hiện tại

Ứng dụng hiện đang chạy ở chế độ demo với dữ liệu mẫu vì backend server chưa được khởi động.

## Các bước để chạy Backend

### 1. Cài đặt MySQL

- Tải và cài đặt MySQL Server từ: https://dev.mysql.com/downloads/mysql/
- Hoặc sử dụng XAMPP: https://www.apachefriends.org/download.html
- Khởi động MySQL service

### 2. Tạo Database

```sql
CREATE DATABASE flight_management;
```

### 3. Cài đặt Dependencies

```bash
cd backend
npm install
```

### 4. Tạo file .env

Tạo file `.env` trong thư mục `backend` với nội dung:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=flight_management
JWT_SECRET=your_jwt_secret_key
```

### 5. Khởi động Backend

```bash
npm start
```

Server sẽ chạy trên: http://localhost:3001

## Chế độ Demo hiện tại

- Ứng dụng đang sử dụng dữ liệu mẫu
- Tất cả chức năng đều hoạt động bình thường
- Dữ liệu sẽ được reset mỗi khi reload trang

## Kiểm tra Backend

- Mở http://localhost:3001/api trong trình duyệt
- Nếu thấy JSON response thì backend đã chạy thành công
