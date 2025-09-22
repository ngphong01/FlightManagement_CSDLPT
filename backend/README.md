# Flight Management System - Backend API

Hệ thống quản lý vé máy bay với Node.js, Express và MySQL.

## 🚀 Tính năng

- **Quản lý chuyến bay**: CRUD operations cho flights
- **Quản lý đặt vé**: CRUD operations cho bookings  
- **Xác thực người dùng**: JWT authentication
- **Phân quyền**: Admin và Staff roles
- **API RESTful**: RESTful API design
- **Validation**: Input validation với Joi
- **Rate Limiting**: Bảo vệ API khỏi spam
- **Security**: Helmet, CORS protection

## 📋 Yêu cầu hệ thống

- Node.js >= 14.0.0
- MySQL >= 5.7
- npm hoặc yarn

## 🛠️ Cài đặt

1. **Clone repository**
```bash
cd public/backend
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình database**
```bash
# Tạo database MySQL
mysql -u root -p
CREATE DATABASE flight_management;
```

4. **Cấu hình environment**
```bash
# Tạo file .env (đã có sẵn)
# Chỉnh sửa thông tin database trong .env
```

5. **Chạy server**
```bash
# Development mode
npm run dev

# Production mode  
npm start
```

## 🔧 Cấu hình

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=flight_management
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Sử dụng Bearer token trong header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 🔐 Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (Admin only)
- `GET /api/auth/profile` - Lấy thông tin profile
- `PATCH /api/auth/change-password` - Đổi mật khẩu

#### ✈️ Flights
- `GET /api/flights` - Lấy danh sách chuyến bay
- `GET /api/flights/:id` - Lấy chi tiết chuyến bay
- `POST /api/flights` - Tạo chuyến bay mới (Admin)
- `PUT /api/flights/:id` - Cập nhật chuyến bay (Admin)
- `DELETE /api/flights/:id` - Xóa chuyến bay (Admin)
- `GET /api/flights/stats/overview` - Thống kê chuyến bay

#### 🎫 Bookings
- `GET /api/bookings` - Lấy danh sách đặt vé
- `GET /api/bookings/:id` - Lấy chi tiết đặt vé
- `POST /api/bookings` - Tạo đặt vé mới
- `PUT /api/bookings/:id` - Cập nhật đặt vé
- `PATCH /api/bookings/:id/cancel` - Hủy đặt vé
- `GET /api/bookings/stats/overview` - Thống kê đặt vé

### Query Parameters

#### Pagination
```
?page=1&limit=10
```

#### Filters
```
?search=VN001
?status=available
?date_from=2024-01-01
?date_to=2024-12-31
?departure_airport=HAN
?arrival_airport=SGN
```

#### Sorting
```
?sort=flight_date&order=ASC
```

## 📊 Database Schema

### Flights Table
```sql
CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_code VARCHAR(10) UNIQUE NOT NULL,
  airline VARCHAR(100) NOT NULL,
  departure_airport VARCHAR(10) NOT NULL,
  arrival_airport VARCHAR(10) NOT NULL,
  departure_city VARCHAR(100) NOT NULL,
  arrival_city VARCHAR(100) NOT NULL,
  flight_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_seats INT NOT NULL,
  available_seats INT NOT NULL,
  status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  flight_id INT NOT NULL,
  passenger_name VARCHAR(100) NOT NULL,
  passenger_email VARCHAR(100) NOT NULL,
  passenger_phone VARCHAR(20) NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);
```

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔑 Default Credentials

```
Username: admin
Password: admin123
Role: admin
```

## 🧪 Testing

### Test với cURL

1. **Login**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

2. **Get Flights**
```bash
curl -X GET http://localhost:3001/api/flights
```

3. **Create Booking**
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "flight_id": 1,
    "passenger_name": "Nguyễn Văn A",
    "passenger_email": "test@email.com",
    "passenger_phone": "0123456789",
    "seat_number": "A01",
    "total_amount": 150.00
  }'
```

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
```bash
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-very-secure-jwt-secret
```

2. **PM2 Process Manager**
```bash
npm install -g pm2
pm2 start server.js --name "flight-api"
pm2 startup
pm2 save
```

3. **Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
```bash
# View logs
pm2 logs flight-api

# Monitor
pm2 monit
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ:
- Email: support@vinpearl.com
- Documentation: http://localhost:3001/api
