-- Flight Management - Consolidated Database Schema (Hanoi, Danang, Saigon)
-- Safe to import into each shard database:
--   flight_management_hanoi, flight_management_danang, flight_management_saigon
-- MySQL 8.0+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Users (web customers and admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers (profile + national ID)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  national_id VARCHAR(50),
  region ENUM('hanoi','danang','saigon') DEFAULT 'hanoi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_email (email),
  INDEX idx_customers_national_id (national_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','supervisor','agent','gate','checkin') NOT NULL DEFAULT 'agent',
  active TINYINT(1) NOT NULL DEFAULT 1,
  site ENUM('hanoi','danang','saigon') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staff_code (staff_code),
  INDEX idx_staff_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff permissions (flat list of codes, mapped in app)
CREATE TABLE IF NOT EXISTS staff_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staff_permissions_staff (staff_id),
  CONSTRAINT fk_staff_permissions_staff FOREIGN KEY (staff_id)
    REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Flights
CREATE TABLE IF NOT EXISTS flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_code VARCHAR(20) NOT NULL,
  airline VARCHAR(100) DEFAULT 'VN',
  departure_city VARCHAR(100) NOT NULL,
  arrival_city VARCHAR(100) NOT NULL,
  flight_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  gate VARCHAR(10),
  total_seats INT NOT NULL DEFAULT 180,
  available_seats INT NOT NULL DEFAULT 180,
  status ENUM('scheduled','check_in_open','check_in_closed','boarding','final_call','gate_closed','departed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_flights_date (flight_date),
  INDEX idx_flights_code (flight_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings (operational bookings used by staff/admin)
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(10) NOT NULL,
  flight_id INT NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  seat_number VARCHAR(5),
  status ENUM('booked','confirmed','checked_in','flown','cancelled') DEFAULT 'confirmed',
  payment_status ENUM('unpaid','paid','refunded') DEFAULT 'paid',
  total_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) DEFAULT 0,
  region ENUM('hanoi','danang','saigon') DEFAULT 'hanoi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_booking_code (booking_code),
  INDEX idx_bookings_flight (flight_id),
  CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights(id),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Guest bookings (source-of-truth for guest flow)
-- Note: No FK to flights to avoid cross-shard FK issues
CREATE TABLE IF NOT EXISTS guest_bookings (
  id CHAR(36) PRIMARY KEY,
  booking_code VARCHAR(10) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  passengers JSON NOT NULL,
  flight_id INT NOT NULL,
  departure_date DATE NOT NULL,
  status ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  completed_at DATETIME,
  INDEX idx_guest_booking_code (booking_code),
  INDEX idx_guest_customer_email (customer_email),
  INDEX idx_guest_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: default admin (password hash placeholder - set with your real hash)
INSERT INTO users (username, password, email, role, active)
VALUES ('admin', '$2b$10$T5cW3n9zG5m7mH8m2kzUOe8Qk4v9oJ6qQ2T6t1vHn0oXW8k4e0bQ2', 'admin@example.com', 'admin', 1)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Seed: staff supervisor NV001 (use your real bcrypt hash)
INSERT INTO staff (staff_code, name, email, password, role, active, site) VALUES
('NV001','Nguyen Van A','nv001@air.vn','$2b$10$8b0Hn5qv8o4F2t7v6fY2SOo4qFv7r2s5t6u7v8w9x0y1z2a3b4c5d','supervisor',1,'hanoi')
ON DUPLICATE KEY UPDATE email=VALUES(email);

INSERT INTO staff_permissions (staff_id, permission_code)
SELECT s.id, 'super_admin' FROM staff s WHERE s.staff_code='NV001'
ON DUPLICATE KEY UPDATE permission_code='super_admin';

-- Seed: sample flight (adjust per shard)
INSERT INTO flights (flight_code, airline, departure_city, arrival_city, flight_date, departure_time, arrival_time, gate, total_seats, available_seats, status)
VALUES ('VN224','VN','Đà Nẵng','TP.HCM','2025-09-25','09:30:00','10:50:00','A12',180,178,'scheduled')
ON DUPLICATE KEY UPDATE gate=VALUES(gate);


