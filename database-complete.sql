-- ===== FLIGHT MANAGEMENT SYSTEM - FIXED DATABASE SETUP =====
-- Author: Flight Management Team
-- Version: 1.2 (Backend Compatible)
-- Description: Distributed database system for airline ticket management
-- ===== CLEAN SETUP =====
DROP DATABASE IF EXISTS flight_management_hanoi;

DROP DATABASE IF EXISTS flight_management_danang;

DROP DATABASE IF EXISTS flight_management_saigon;

DROP USER IF EXISTS 'flight_app' @'localhost';

DROP USER IF EXISTS 'flight_app' @'%';

-- ===== CREATE DATABASES =====
CREATE DATABASE flight_management_hanoi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE flight_management_danang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE flight_management_saigon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ===== HANOI SITE (MIỀN BẮC) =====
USE flight_management_hanoi;

-- Bảng chuyến bay
CREATE TABLE
    flights (
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
        price DECIMAL(12, 2) NOT NULL,
        total_seats INT NOT NULL DEFAULT 50,
        available_seats INT NOT NULL DEFAULT 50,
        status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
        region VARCHAR(20) NOT NULL DEFAULT 'hanoi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_flight_code (flight_code),
        INDEX idx_departure_airport (departure_airport),
        INDEX idx_arrival_airport (arrival_airport),
        INDEX idx_flight_date (flight_date),
        INDEX idx_status (status),
        INDEX idx_region (region),
        INDEX idx_departure_date (departure_airport, flight_date),
        INDEX idx_arrival_date (arrival_airport, flight_date),
        INDEX idx_available_seats (available_seats),
        INDEX idx_price (price)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng khách hàng
CREATE TABLE
    customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        nationality VARCHAR(50) DEFAULT 'Vietnam',
        passport_number VARCHAR(20),
        region VARCHAR(20) NOT NULL DEFAULT 'hanoi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_region (region),
        INDEX idx_name (name),
        INDEX idx_passport (passport_number)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng đặt vé
CREATE TABLE
    bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(20) NOT NULL UNIQUE,
        flight_id INT NOT NULL,
        customer_id INT NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        seat_number VARCHAR(10),
        seat_class ENUM('economy', 'business', 'first') DEFAULT 'economy',
        total_amount DECIMAL(12, 2) NOT NULL,
        discount_amount DECIMAL(12, 2) DEFAULT 0.00,
        tax_amount DECIMAL(12, 2) DEFAULT 0.00,
        final_amount DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        payment_status ENUM(
            'pending',
            'paid',
            'failed',
            'refunded',
            'partial'
        ) DEFAULT 'pending',
        payment_method ENUM('cash', 'card', 'transfer', 'ewallet') DEFAULT 'card',
        booking_source ENUM('website', 'mobile', 'agent', 'counter') DEFAULT 'website',
        special_requests TEXT,
        check_in_status ENUM('not_checked', 'checked_in', 'boarding') DEFAULT 'not_checked',
        region VARCHAR(20) NOT NULL DEFAULT 'hanoi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_booking_code (booking_code),
        INDEX idx_flight_id (flight_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_customer_email (customer_email),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_region (region),
        INDEX idx_created_at (created_at),
        INDEX idx_booking_date (flight_id, created_at),
        INDEX idx_customer_bookings (customer_id, status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng người dùng hệ thống - FIXED COLUMN NAME
CREATE TABLE
    users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'checkin', 'manager', 'user') DEFAULT 'staff',
        department VARCHAR(50),
        region VARCHAR(20) NOT NULL DEFAULT 'hanoi',
        active TINYINT(1) DEFAULT 1, -- CHANGED FROM is_active to active
        last_login TIMESTAMP NULL,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_region (region),
        INDEX idx_active (active) -- UPDATED INDEX NAME
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng lịch sử thay đổi
CREATE TABLE
    audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(50) NOT NULL,
        record_id INT NOT NULL,
        action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
        old_values JSON,
        new_values JSON,
        user_id INT,
        user_name VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_table_record (table_name, record_id),
        INDEX idx_action (action),
        INDEX idx_user (user_id),
        INDEX idx_created_at (created_at)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng cấu hình hệ thống
CREATE TABLE
    system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        description TEXT,
        data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        is_public BOOLEAN DEFAULT FALSE,
        region VARCHAR(20) NOT NULL DEFAULT 'hanoi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key),
        INDEX idx_region (region),
        INDEX idx_public (is_public)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===== DANANG SITE (MIỀN TRUNG) =====
USE flight_management_danang;

CREATE TABLE
    flights (
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
        price DECIMAL(12, 2) NOT NULL,
        total_seats INT NOT NULL DEFAULT 50,
        available_seats INT NOT NULL DEFAULT 50,
        status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
        region VARCHAR(20) NOT NULL DEFAULT 'danang',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_flight_code (flight_code),
        INDEX idx_departure_airport (departure_airport),
        INDEX idx_arrival_airport (arrival_airport),
        INDEX idx_flight_date (flight_date),
        INDEX idx_status (status),
        INDEX idx_region (region),
        INDEX idx_departure_date (departure_airport, flight_date),
        INDEX idx_arrival_date (arrival_airport, flight_date),
        INDEX idx_available_seats (available_seats),
        INDEX idx_price (price)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        nationality VARCHAR(50) DEFAULT 'Vietnam',
        passport_number VARCHAR(20),
        region VARCHAR(20) NOT NULL DEFAULT 'danang',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_region (region),
        INDEX idx_name (name),
        INDEX idx_passport (passport_number)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(20) NOT NULL UNIQUE,
        flight_id INT NOT NULL,
        customer_id INT NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        seat_number VARCHAR(10),
        seat_class ENUM('economy', 'business', 'first') DEFAULT 'economy',
        total_amount DECIMAL(12, 2) NOT NULL,
        discount_amount DECIMAL(12, 2) DEFAULT 0.00,
        tax_amount DECIMAL(12, 2) DEFAULT 0.00,
        final_amount DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        payment_status ENUM(
            'pending',
            'paid',
            'failed',
            'refunded',
            'partial'
        ) DEFAULT 'pending',
        payment_method ENUM('cash', 'card', 'transfer', 'ewallet') DEFAULT 'card',
        booking_source ENUM('website', 'mobile', 'agent', 'counter') DEFAULT 'website',
        special_requests TEXT,
        check_in_status ENUM('not_checked', 'checked_in', 'boarding') DEFAULT 'not_checked',
        region VARCHAR(20) NOT NULL DEFAULT 'danang',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_booking_code (booking_code),
        INDEX idx_flight_id (flight_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_customer_email (customer_email),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_region (region),
        INDEX idx_created_at (created_at),
        INDEX idx_booking_date (flight_id, created_at),
        INDEX idx_customer_bookings (customer_id, status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- FIXED users table for danang
CREATE TABLE
    users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'checkin', 'manager', 'user') DEFAULT 'staff',
        department VARCHAR(50),
        region VARCHAR(20) NOT NULL DEFAULT 'danang',
        active TINYINT(1) DEFAULT 1, -- CHANGED FROM is_active to active
        last_login TIMESTAMP NULL,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_region (region),
        INDEX idx_active (active) -- UPDATED INDEX NAME
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(50) NOT NULL,
        record_id INT NOT NULL,
        action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
        old_values JSON,
        new_values JSON,
        user_id INT,
        user_name VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_table_record (table_name, record_id),
        INDEX idx_action (action),
        INDEX idx_user (user_id),
        INDEX idx_created_at (created_at)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        description TEXT,
        data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        is_public BOOLEAN DEFAULT FALSE,
        region VARCHAR(20) NOT NULL DEFAULT 'danang',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key),
        INDEX idx_region (region),
        INDEX idx_public (is_public)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===== SAIGON SITE (MIỀN NAM) =====
USE flight_management_saigon;

CREATE TABLE
    flights (
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
        price DECIMAL(12, 2) NOT NULL,
        total_seats INT NOT NULL DEFAULT 50,
        available_seats INT NOT NULL DEFAULT 50,
        status ENUM('available', 'booked', 'cancelled') DEFAULT 'available',
        region VARCHAR(20) NOT NULL DEFAULT 'saigon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_flight_code (flight_code),
        INDEX idx_departure_airport (departure_airport),
        INDEX idx_arrival_airport (arrival_airport),
        INDEX idx_flight_date (flight_date),
        INDEX idx_status (status),
        INDEX idx_region (region),
        INDEX idx_departure_date (departure_airport, flight_date),
        INDEX idx_arrival_date (arrival_airport, flight_date),
        INDEX idx_available_seats (available_seats),
        INDEX idx_price (price)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        nationality VARCHAR(50) DEFAULT 'Vietnam',
        passport_number VARCHAR(20),
        region VARCHAR(20) NOT NULL DEFAULT 'saigon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_region (region),
        INDEX idx_name (name),
        INDEX idx_passport (passport_number)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(20) NOT NULL UNIQUE,
        flight_id INT NOT NULL,
        customer_id INT NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        seat_number VARCHAR(10),
        seat_class ENUM('economy', 'business', 'first') DEFAULT 'economy',
        total_amount DECIMAL(12, 2) NOT NULL,
        discount_amount DECIMAL(12, 2) DEFAULT 0.00,
        tax_amount DECIMAL(12, 2) DEFAULT 0.00,
        final_amount DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        payment_status ENUM(
            'pending',
            'paid',
            'failed',
            'refunded',
            'partial'
        ) DEFAULT 'pending',
        payment_method ENUM('cash', 'card', 'transfer', 'ewallet') DEFAULT 'card',
        booking_source ENUM('website', 'mobile', 'agent', 'counter') DEFAULT 'website',
        special_requests TEXT,
        check_in_status ENUM('not_checked', 'checked_in', 'boarding') DEFAULT 'not_checked',
        region VARCHAR(20) NOT NULL DEFAULT 'saigon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_booking_code (booking_code),
        INDEX idx_flight_id (flight_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_customer_email (customer_email),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_region (region),
        INDEX idx_created_at (created_at),
        INDEX idx_booking_date (flight_id, created_at),
        INDEX idx_customer_bookings (customer_id, status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- FIXED users table for saigon
CREATE TABLE
    users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'checkin', 'manager', 'user') DEFAULT 'staff',
        department VARCHAR(50),
        region VARCHAR(20) NOT NULL DEFAULT 'saigon',
        active TINYINT(1) DEFAULT 1, -- CHANGED FROM is_active to active
        last_login TIMESTAMP NULL,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_region (region),
        INDEX idx_active (active) -- UPDATED INDEX NAME
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(50) NOT NULL,
        record_id INT NOT NULL,
        action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
        old_values JSON,
        new_values JSON,
        user_id INT,
        user_name VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_table_record (table_name, record_id),
        INDEX idx_action (action),
        INDEX idx_user (user_id),
        INDEX idx_created_at (created_at)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        description TEXT,
        data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        is_public BOOLEAN DEFAULT FALSE,
        region VARCHAR(20) NOT NULL DEFAULT 'saigon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key),
        INDEX idx_region (region),
        INDEX idx_public (is_public)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===== INSERT SAMPLE DATA =====
-- Dữ liệu mẫu Hà Nội
USE flight_management_hanoi;

INSERT INTO
    flights (
        flight_code,
        airline,
        departure_airport,
        arrival_airport,
        departure_city,
        arrival_city,
        flight_date,
        departure_time,
        arrival_time,
        price,
        available_seats,
        region
    )
VALUES
    (
        'VN001',
        'Vietnam Airlines',
        'HAN',
        'SGN',
        'Hà Nội',
        'TP.HCM',
        '2025-01-26',
        '08:00:00',
        '10:30:00',
        1500000.00,
        45,
        'hanoi'
    ),
    (
        'VN003',
        'VietJet Air',
        'HAN',
        'DAD',
        'Hà Nội',
        'Đà Nẵng',
        '2025-01-26',
        '14:00:00',
        '15:30:00',
        1200000.00,
        38,
        'hanoi'
    ),
    (
        'VN005',
        'Bamboo Airways',
        'HAN',
        'HPH',
        'Hà Nội',
        'Hải Phòng',
        '2025-01-27',
        '10:00:00',
        '11:00:00',
        800000.00,
        50,
        'hanoi'
    ),
    (
        'VN007',
        'Vietnam Airlines',
        'HAN',
        'CXR',
        'Hà Nội',
        'Nha Trang',
        '2025-01-27',
        '15:30:00',
        '17:45:00',
        1800000.00,
        42,
        'hanoi'
    ),
    (
        'VN009',
        'VietJet Air',
        'HAN',
        'PQC',
        'Hà Nội',
        'Phú Quốc',
        '2025-01-28',
        '09:15:00',
        '11:30:00',
        2200000.00,
        35,
        'hanoi'
    );

INSERT INTO
    customers (
        name,
        email,
        phone,
        address,
        date_of_birth,
        gender,
        nationality,
        region
    )
VALUES
    (
        'Nguyễn Văn An',
        'an.nguyen@email.com',
        '0123456789',
        '123 Phố Huế, Hai Bà Trưng, Hà Nội',
        '1985-03-15',
        'male',
        'Vietnam',
        'hanoi'
    ),
    (
        'Trần Thị Bình',
        'binh.tran@email.com',
        '0987654321',
        '456 Láng Hạ, Đống Đa, Hà Nội',
        '1990-07-22',
        'female',
        'Vietnam',
        'hanoi'
    ),
    (
        'Lê Văn Cường',
        'cuong.le@email.com',
        '0369258147',
        '789 Giải Phóng, Hoàng Mai, Hà Nội',
        '1988-11-08',
        'male',
        'Vietnam',
        'hanoi'
    ),
    (
        'Phạm Thị Dung',
        'dung.pham@email.com',
        '0741852963',
        '321 Cầu Giấy, Cầu Giấy, Hà Nội',
        '1992-05-14',
        'female',
        'Vietnam',
        'hanoi'
    ),
    (
        'Hoàng Văn Em',
        'em.hoang@email.com',
        '0852741963',
        '654 Tây Hồ, Tây Hồ, Hà Nội',
        '1987-09-30',
        'male',
        'Vietnam',
        'hanoi'
    );

-- FIXED: Insert users with correct password hash for 'admin123'
INSERT INTO
    users (
        username,
        password,
        full_name,
        email,
        role,
        region,
        active
    )
VALUES
    (
        'admin',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Administrator',
        'admin@flightmgmt.com',
        'admin',
        'hanoi',
        1
    ),
    (
        'staff_hanoi',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Nhân Viên Hà Nội',
        'staff.hanoi@flightmgmt.com',
        'staff',
        'hanoi',
        1
    ),
    (
        'manager_hanoi',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Quản Lý Hà Nội',
        'manager.hanoi@flightmgmt.com',
        'manager',
        'hanoi',
        1
    );

INSERT INTO
    system_settings (
        setting_key,
        setting_value,
        description,
        data_type,
        region
    )
VALUES
    (
        'site_name',
        'Flight Management - Hà Nội',
        'Tên site Hà Nội',
        'string',
        'hanoi'
    ),
    (
        'max_booking_per_day',
        '100',
        'Số lượng booking tối đa mỗi ngày',
        'number',
        'hanoi'
    ),
    (
        'enable_online_checkin',
        'true',
        'Cho phép check-in online',
        'boolean',
        'hanoi'
    ),
    (
        'booking_expiry_minutes',
        '30',
        'Thời gian hết hạn booking (phút)',
        'number',
        'hanoi'
    );

-- Dữ liệu mẫu Đà Nẵng
USE flight_management_danang;

INSERT INTO
    flights (
        flight_code,
        airline,
        departure_airport,
        arrival_airport,
        departure_city,
        arrival_city,
        flight_date,
        departure_time,
        arrival_time,
        price,
        available_seats,
        region
    )
VALUES
    (
        'VN011',
        'Bamboo Airways',
        'DAD',
        'SGN',
        'Đà Nẵng',
        'TP.HCM',
        '2025-01-26',
        '16:00:00',
        '17:30:00',
        1000000.00,
        30,
        'danang'
    ),
    (
        'VN013',
        'VietJet Air',
        'DAD',
        'HAN',
        'Đà Nẵng',
        'Hà Nội',
        '2025-01-27',
        '09:00:00',
        '10:30:00',
        1300000.00,
        25,
        'danang'
    ),
    (
        'VN015',
        'Vietnam Airlines',
        'HUI',
        'DAD',
        'Huế',
        'Đà Nẵng',
        '2025-01-27',
        '14:00:00',
        '14:30:00',
        600000.00,
        50,
        'danang'
    ),
    (
        'VN017',
        'Bamboo Airways',
        'DAD',
        'PQC',
        'Đà Nẵng',
        'Phú Quốc',
        '2025-01-28',
        '11:00:00',
        '12:15:00',
        1600000.00,
        40,
        'danang'
    ),
    (
        'VN019',
        'VietJet Air',
        'DAD',
        'CXR',
        'Đà Nẵng',
        'Nha Trang',
        '2025-01-28',
        '17:30:00',
        '18:45:00',
        900000.00,
        45,
        'danang'
    );

INSERT INTO
    customers (
        name,
        email,
        phone,
        address,
        date_of_birth,
        gender,
        nationality,
        region
    )
VALUES
    (
        'Phạm Văn Đức',
        'duc.pham@email.com',
        '0147258369',
        '123 Trần Phú, Hải Châu, Đà Nẵng',
        '1986-04-12',
        'male',
        'Vietnam',
        'danang'
    ),
    (
        'Hoàng Thị Em',
        'em.hoang@email.com',
        '0258147369',
        '456 Lê Duẩn, Thanh Khê, Đà Nẵng',
        '1991-08-25',
        'female',
        'Vietnam',
        'danang'
    ),
    (
        'Võ Văn Phúc',
        'phuc.vo@email.com',
        '0369147258',
        '789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
        '1989-12-03',
        'male',
        'Vietnam',
        'danang'
    ),
    (
        'Lê Thị Gia',
        'gia.le@email.com',
        '0456789123',
        '321 Bach Đằng, Hải Châu, Đà Nẵng',
        '1993-02-18',
        'female',
        'Vietnam',
        'danang'
    );

INSERT INTO
    users (
        username,
        password,
        full_name,
        email,
        role,
        region,
        active
    )
VALUES
    (
        'admin',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Administrator',
        'admin@flightmgmt.com',
        'admin',
        'danang',
        1
    ),
    (
        'staff_danang',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Nhân Viên Đà Nẵng',
        'staff.danang@flightmgmt.com',
        'staff',
        'danang',
        1
    ),
    (
        'manager_danang',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Quản Lý Đà Nẵng',
        'manager.danang@flightmgmt.com',
        'manager',
        'danang',
        1
    );

INSERT INTO
    system_settings (
        setting_key,
        setting_value,
        description,
        data_type,
        region
    )
VALUES
    (
        'site_name',
        'Flight Management - Đà Nẵng',
        'Tên site Đà Nẵng',
        'string',
        'danang'
    ),
    (
        'max_booking_per_day',
        '80',
        'Số lượng booking tối đa mỗi ngày',
        'number',
        'danang'
    ),
    (
        'enable_online_checkin',
        'true',
        'Cho phép check-in online',
        'boolean',
        'danang'
    ),
    (
        'booking_expiry_minutes',
        '45',
        'Thời gian hết hạn booking (phút)',
        'number',
        'danang'
    );

-- Dữ liệu mẫu Sài Gòn
USE flight_management_saigon;

INSERT INTO
    flights (
        flight_code,
        airline,
        departure_airport,
        arrival_airport,
        departure_city,
        arrival_city,
        flight_date,
        departure_time,
        arrival_time,
        price,
        available_seats,
        region
    )
VALUES
    (
        'VN021',
        'VietJet Air',
        'SGN',
        'DAD',
        'TP.HCM',
        'Đà Nẵng',
        '2025-01-26',
        '14:00:00',
        '15:30:00',
        1200000.00,
        12,
        'saigon'
    ),
    (
        'VN023',
        'Vietnam Airlines',
        'SGN',
        'HAN',
        'TP.HCM',
        'Hà Nội',
        '2025-01-26',
        '20:00:00',
        '22:30:00',
        1500000.00,
        8,
        'saigon'
    ),
    (
        'VN025',
        'Bamboo Airways',
        'SGN',
        'PQC',
        'TP.HCM',
        'Phú Quốc',
        '2025-01-27',
        '07:00:00',
        '08:00:00',
        900000.00,
        40,
        'saigon'
    ),
    (
        'VN027',
        'VietJet Air',
        'CXR',
        'SGN',
        'Nha Trang',
        'TP.HCM',
        '2025-01-27',
        '18:00:00',
        '19:00:00',
        700000.00,
        50,
        'saigon'
    ),
    (
        'VN029',
        'Vietnam Airlines',
        'SGN',
        'UIH',
        'TP.HCM',
        'Quy Nhon',
        '2025-01-28',
        '12:30:00',
        '13:45:00',
        1100000.00,
        35,
        'saigon'
    ),
    (
        'VN031',
        'Bamboo Airways',
        'SGN',
        'VCA',
        'TP.HCM',
        'Cần Thơ',
        '2025-01-28',
        '16:15:00',
        '17:00:00',
        650000.00,
        48,
        'saigon'
    ),
    (
        'VN033',
        'VietJet Air',
        'SGN',
        'DLI',
        'TP.HCM',
        'Đà Lạt',
        '2025-01-29',
        '08:45:00',
        '09:30:00',
        800000.00,
        42,
        'saigon'
    );

INSERT INTO
    customers (
        name,
        email,
        phone,
        address,
        date_of_birth,
        gender,
        nationality,
        region
    )
VALUES
    (
        'Võ Văn Phúc',
        'phuc.vo@email.com',
        '0369258147',
        '123 Nguyễn Huệ, Quận 1, TP.HCM',
        '1984-06-20',
        'male',
        'Vietnam',
        'saigon'
    ),
    (
        'Đặng Thị Gia',
        'gia.dang@email.com',
        '0741852963',
        '456 Lê Lợi, Quận 1, TP.HCM',
        '1990-10-15',
        'female',
        'Vietnam',
        'saigon'
    ),
    (
        'Bùi Văn Hùng',
        'hung.bui@email.com',
        '0852741963',
        '789 Võ Văn Tần, Quận 3, TP.HCM',
        '1987-01-28',
        'male',
        'Vietnam',
        'saigon'
    ),
    (
        'Trần Thị Lan',
        'lan.tran@email.com',
        '0963852741',
        '321 Cách Mạng Tháng 8, Quận 10, TP.HCM',
        '1992-09-12',
        'female',
        'Vietnam',
        'saigon'
    ),
    (
        'Nguyễn Văn Minh',
        'minh.nguyen@email.com',
        '0147963852',
        '654 Phan Xích Long, Phú Nhuận, TP.HCM',
        '1989-04-07',
        'male',
        'Vietnam',
        'saigon'
    );

INSERT INTO
    users (
        username,
        password,
        full_name,
        email,
        role,
        region,
        active
    )
VALUES
    (
        'admin',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Administrator',
        'admin@flightmgmt.com',
        'admin',
        'saigon',
        1
    ),
    (
        'staff_saigon',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Nhân Viên Sài Gòn',
        'staff.saigon@flightmgmt.com',
        'staff',
        'saigon',
        1
    ),
    (
        'manager_saigon',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Quản Lý Sài Gòn',
        'manager.saigon@flightmgmt.com',
        'manager',
        'saigon',
        1
    );

INSERT INTO
    system_settings (
        setting_key,
        setting_value,
        description,
        data_type,
        region
    )
VALUES
    (
        'site_name',
        'Flight Management - Sài Gòn',
        'Tên site Sài Gòn',
        'string',
        'saigon'
    ),
    (
        'max_booking_per_day',
        '150',
        'Số lượng booking tối đa mỗi ngày',
        'number',
        'saigon'
    ),
    (
        'enable_online_checkin',
        'true',
        'Cho phép check-in online',
        'boolean',
        'saigon'
    ),
    (
        'booking_expiry_minutes',
        '30',
        'Thời gian hết hạn booking (phút)',
        'number',
        'saigon'
    );

-- ===== CREATE APPLICATION USER =====
CREATE USER IF NOT EXISTS 'flight_app' @'localhost' IDENTIFIED BY 'flight_password';

CREATE USER IF NOT EXISTS 'flight_app' @'%' IDENTIFIED BY 'flight_password';

-- Grant permissions
GRANT
SELECT
,
INSERT
,
UPDATE,
DELETE ON flight_management_hanoi.* TO 'flight_app' @'localhost';

GRANT
SELECT
,
INSERT
,
UPDATE,
DELETE ON flight_management_danang.* TO 'flight_app' @'localhost';

GRANT
SELECT
,
INSERT
,
UPDATE,
DELETE ON flight_management_saigon.* TO 'flight_app' @'localhost';

GRANT
SELECT
,
INSERT
,
UPDATE,
DELETE ON flight_management_hanoi.* TO 'flight_app' @'%';

GRANT
SELECT
,
INSERT
,
UPDATE,
DELETE ON flight_management_danang.* TO 'flight_app' @'%';

GRANT
SELECT
,
INSERT
,
UPDATE,
DELETE ON flight_management_saigon.* TO 'flight_app' @'%';

FLUSH PRIVILEGES;

-- ===== CREATE SAMPLE BOOKINGS =====
-- Booking mẫu Hà Nội
USE flight_management_hanoi;

INSERT INTO
    bookings (
        booking_code,
        flight_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        seat_number,
        total_amount,
        final_amount,
        status,
        payment_status,
        region
    )
VALUES
    (
        'HN2025001',
        1,
        1,
        'Nguyễn Văn An',
        'an.nguyen@email.com',
        '0123456789',
        'A1',
        1500000.00,
        1500000.00,
        'confirmed',
        'paid',
        'hanoi'
    ),
    (
        'HN2025002',
        2,
        2,
        'Trần Thị Bình',
        'binh.tran@email.com',
        '0987654321',
        'B2',
        1200000.00,
        1200000.00,
        'confirmed',
        'paid',
        'hanoi'
    );

-- Booking mẫu Đà Nẵng
USE flight_management_danang;

INSERT INTO
    bookings (
        booking_code,
        flight_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        seat_number,
        total_amount,
        final_amount,
        status,
        payment_status,
        region
    )
VALUES
    (
        'DN2025001',
        1,
        1,
        'Phạm Văn Đức',
        'duc.pham@email.com',
        '0147258369',
        'C3',
        1000000.00,
        1000000.00,
        'confirmed',
        'paid',
        'danang'
    );

-- Booking mẫu Sài Gòn
USE flight_management_saigon;

INSERT INTO
    bookings (
        booking_code,
        flight_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        seat_number,
        total_amount,
        final_amount,
        status,
        payment_status,
        region
    )
VALUES
    (
        'SG2025001',
        1,
        1,
        'Võ Văn Phúc',
        'phuc.vo@email.com',
        '0369258147',
        'D4',
        1200000.00,
        1200000.00,
        'confirmed',
        'paid',
        'saigon'
    ),
    (
        'SG2025002',
        2,
        2,
        'Đặng Thị Gia',
        'gia.dang@email.com',
        '0741852963',
        'E5',
        1500000.00,
        1500000.00,
        'pending',
        'pending',
        'saigon'
    );

-- ===== VERIFICATION =====
-- Check databases
SHOW DATABASES LIKE 'flight_management_%';

-- Check admin accounts (FIXED QUERY)
SELECT
    'HANOI' as site,
    id,
    username,
    role,
    region,
    active
FROM
    flight_management_hanoi.users
WHERE
    username = 'admin'
UNION ALL
SELECT
    'DANANG' as site,
    id,
    username,
    role,
    region,
    active
FROM
    flight_management_danang.users
WHERE
    username = 'admin'
UNION ALL
SELECT
    'SAIGON' as site,
    id,
    username,
    role,
    region,
    active
FROM
    flight_management_saigon.users
WHERE
    username = 'admin';

-- Check data counts
SELECT
    'HANOI' as site,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_hanoi.flights
    ) as flights,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_hanoi.customers
    ) as customers,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_hanoi.bookings
    ) as bookings,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_hanoi.users
    ) as users
UNION ALL
SELECT
    'DANANG' as site,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_danang.flights
    ) as flights,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_danang.customers
    ) as customers,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_danang.bookings
    ) as bookings,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_danang.users
    ) as users
UNION ALL
SELECT
    'SAIGON' as site,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_saigon.flights
    ) as flights,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_saigon.customers
    ) as customers,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_saigon.bookings
    ) as bookings,
    (
        SELECT
            COUNT(*)
        FROM
            flight_management_saigon.users
    ) as users;

-- Final success message
SELECT
    'SUCCESS: Flight Management Database Setup Complete!' as status,
    '3 distributed sites: Hanoi, Danang, Saigon' as info,
    'Login: admin / admin123' as credentials,
    'Column fixed: active (not is_active)' as fix_applied,
    NOW() as completed_at;