# 🏗️ Kiến trúc Hệ thống Quản lý Vé Máy bay - CSDL Phân Tán

## 📋 Tổng quan

Hệ thống được thiết kế theo kiến trúc **3-tier** với **CSDL phân tán** theo khu vực địa lý:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Dashboard     │  │  Flight Mgmt    │  │  Booking Mgmt   │ │
│  │   (React)       │  │   (React)       │  │   (React)       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API GATEWAY                              │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │ │
│  │  │    Auth     │ │   Router    │ │      Load Balancer      │ │ │
│  │  │ Middleware  │ │  Service    │ │       Service           │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Site Hà Nội │  │ Site Đà Nẵng│  │    Site TP.HCM          │ │
│  │ (Miền Bắc)  │  │ (Miền Trung)│  │    (Miền Nam)           │ │
│  │ Port 3306   │  │ Port 3307   │  │    Port 3308            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Nguyên lý thiết kế

### 1. Phân tán theo khu vực địa lý

- **Site Hà Nội**: Xử lý chuyến bay từ/đến miền Bắc
- **Site Đà Nẵng**: Xử lý chuyến bay từ/đến miền Trung
- **Site TP.HCM**: Xử lý chuyến bay từ/đến miền Nam

### 2. Phân mảnh dữ liệu thông minh

- **Phân mảnh ngang**: Chuyến bay theo sân bay
- **Phân mảnh dẫn xuất**: Vé phụ thuộc chuyến bay
- **Phân mảnh dọc**: Thông tin khách hàng tách biệt

### 3. Routing tự động

- API Gateway tự động xác định site CSDL phù hợp
- Load balancing cho hiệu suất tối ưu
- Failover và recovery tự động

## 🔄 Luồng xử lý dữ liệu

### 1. Request Flow

```
User Request → Frontend → API Gateway → Data Router → Database Site
```

### 2. Response Flow

```
Database Site → Data Router → API Gateway → Frontend → User
```

### 3. Cross-Site Queries

```
API Gateway → Multiple Sites → Data Aggregation → Response
```

## 🗄️ Cấu trúc CSDL Phân Tán

### Bảng chính

#### 1. Flights (Chuyến bay)

```sql
CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_code VARCHAR(10) NOT NULL UNIQUE,
  airline VARCHAR(100) NOT NULL,
  departure_airport VARCHAR(3) NOT NULL,
  arrival_airport VARCHAR(3) NOT NULL,
  departure_city VARCHAR(100) NOT NULL,
  arrival_city VARCHAR(100) NOT NULL,
  flight_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_seats INT NOT NULL DEFAULT 50,
  available_seats INT NOT NULL DEFAULT 50,
  status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
  region VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. Bookings (Đặt vé)

```sql
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) NOT NULL UNIQUE,
  flight_id INT NOT NULL,
  customer_id INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  seat_number VARCHAR(10),
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  region VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

#### 3. Customers (Khách hàng)

```sql
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  region VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Phân mảnh dữ liệu

#### 1. Phân mảnh ngang (Horizontal Fragmentation)

```sql
-- Site Hà Nội (Miền Bắc)
WHERE departure_airport IN ('HAN', 'HPH', 'THD')
   OR arrival_airport IN ('HAN', 'HPH', 'THD')

-- Site Đà Nẵng (Miền Trung)
WHERE departure_airport IN ('DAD', 'HUI', 'VCL')
   OR arrival_airport IN ('DAD', 'HUI', 'VCL')

-- Site TP.HCM (Miền Nam)
WHERE departure_airport IN ('SGN', 'PQC', 'CXR', 'VCA', 'BMV')
   OR arrival_airport IN ('SGN', 'PQC', 'CXR', 'VCA', 'BMV')
```

#### 2. Phân mảnh dẫn xuất (Derived Fragmentation)

```sql
-- Vé được lưu cùng site với chuyến bay
bookings.region = flights.region
```

#### 3. Phân mảnh dọc (Vertical Fragmentation)

```sql
-- Thông tin khách hàng phân tán theo ID
customers: customer_id % 3 = 0 → hanoi
customers: customer_id % 3 = 1 → danang
customers: customer_id % 3 = 2 → saigon
```

## 🔧 API Gateway Architecture

### 1. Middleware Stack

```
Request → CORS → Helmet → Rate Limit → Auth → Router → Response
```

### 2. Database Router

```javascript
class DatabaseRouter {
  getDatabaseByAirport(airportCode) {
    const region = this.regionMapping[airportCode];
    return dbPools[region];
  }

  getDatabaseByRegion(region) {
    return dbPools[region];
  }

  getAllDatabases() {
    return Object.values(dbPools);
  }
}
```

### 3. Connection Pooling

```javascript
const dbPools = {
  hanoi: mysql.createPool({
    ...dbConfig.hanoi,
    connectionLimit: 10,
    queueLimit: 0,
  }),
  danang: mysql.createPool({
    ...dbConfig.danang,
    connectionLimit: 10,
    queueLimit: 0,
  }),
  saigon: mysql.createPool({
    ...dbConfig.saigon,
    connectionLimit: 10,
    queueLimit: 0,
  }),
};
```

## 🎨 Frontend Architecture

### 1. Component Structure

```
App
├── Sidebar
├── Header
├── Dashboard
├── FlightManagement
│   ├── FlightList
│   ├── FlightModal
│   └── FlightFilters
├── BookingManagement
│   ├── BookingList
│   └── BookingDetails
└── ToastContainer
```

### 2. State Management

```javascript
// Context API cho global state
const AppContext = React.createContext();

// Custom hooks
const useAPI = () => {
  /* API service */
};
const useToast = () => {
  /* Toast notifications */
};
```

### 3. API Integration

```javascript
class APIService {
  async request(endpoint, options = {}) {
    // Unified API request handler
  }

  async getFlights(params = {}) {
    // Get flights from all sites
  }

  async createFlight(flightData) {
    // Create flight with auto-routing
  }
}
```

## 🔒 Bảo mật

### 1. Authentication

- **JWT Tokens** cho session management
- **bcrypt** cho password hashing
- **Rate limiting** chống brute force

### 2. Authorization

- **Role-based access control** (Admin, Staff, Check-in)
- **Region-based permissions**
- **API endpoint protection**

### 3. Data Security

- **Input validation** với Joi
- **SQL injection prevention**
- **XSS protection** với Helmet
- **CORS configuration**

## 📊 Performance Optimization

### 1. Database Level

- **Indexes** trên các cột thường query
- **Connection pooling** cho hiệu suất
- **Query optimization** với EXPLAIN
- **Caching** cho dữ liệu thường dùng

### 2. Application Level

- **Lazy loading** cho components
- **Memoization** cho expensive operations
- **Debouncing** cho search inputs
- **Pagination** cho large datasets

### 3. Network Level

- **Compression** với gzip
- **CDN** cho static assets
- **HTTP/2** support
- **Keep-alive** connections

## 🔄 Scalability

### 1. Horizontal Scaling

- **Load balancer** cho multiple API instances
- **Database sharding** theo region
- **Microservices** architecture ready

### 2. Vertical Scaling

- **Resource monitoring** và alerting
- **Auto-scaling** based on load
- **Performance metrics** collection

### 3. Disaster Recovery

- **Database replication** giữa các sites
- **Backup strategies** cho từng region
- **Failover mechanisms** tự động

## 📈 Monitoring & Logging

### 1. Application Metrics

- **Request/Response times**
- **Error rates** và types
- **Database query performance**
- **Memory và CPU usage**

### 2. Business Metrics

- **Flight booking rates**
- **Revenue tracking**
- **Customer satisfaction**
- **System availability**

### 3. Alerting

- **Threshold-based alerts**
- **Anomaly detection**
- **Performance degradation**
- **Security incidents**

## 🚀 Deployment Strategy

### 1. Development

- **Local development** với Docker
- **Hot reloading** cho frontend
- **Database seeding** với sample data

### 2. Staging

- **Production-like environment**
- **Integration testing**
- **Performance testing**

### 3. Production

- **Blue-green deployment**
- **Database migration** strategies
- **Rollback procedures**
- **Health checks**

## 🔮 Future Enhancements

### 1. Microservices

- **Flight Service** riêng biệt
- **Booking Service** riêng biệt
- **Customer Service** riêng biệt
- **Payment Service** riêng biệt

### 2. Real-time Features

- **WebSocket** cho live updates
- **Push notifications**
- **Real-time chat** support
- **Live flight tracking**

### 3. Advanced Analytics

- **Machine learning** cho demand prediction
- **Business intelligence** dashboards
- **Predictive analytics**
- **Customer behavior analysis**

## 📚 Best Practices

### 1. Code Quality

- **ESLint** cho code linting
- **Prettier** cho code formatting
- **Jest** cho unit testing
- **Code reviews** bắt buộc

### 2. Documentation

- **API documentation** với Swagger
- **Code comments** chi tiết
- **Architecture diagrams**
- **Deployment guides**

### 3. Security

- **Regular security audits**
- **Dependency updates**
- **Vulnerability scanning**
- **Penetration testing**

---

## 🎯 Kết luận

Hệ thống quản lý vé máy bay với CSDL phân tán được thiết kế để:

- ✅ **Scalable**: Dễ dàng mở rộng theo nhu cầu
- ✅ **Reliable**: Đảm bảo tính sẵn sàng cao
- ✅ **Secure**: Bảo mật đa tầng
- ✅ **Maintainable**: Dễ bảo trì và phát triển
- ✅ **Performant**: Hiệu suất tối ưu
- ✅ **User-friendly**: Trải nghiệm người dùng tốt

Đây là một **minh họa hoàn chỉnh** cho bài **CSDL Phân Tán** với:

- Kiến trúc thực tế và có thể triển khai
- Phân mảnh dữ liệu đúng nguyên lý
- Code sạch và dễ hiểu
- Documentation đầy đủ
