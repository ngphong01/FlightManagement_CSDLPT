-- Guest Bookings schema for MySQL (compatible with existing shards)
-- Run this on all three databases: hanoi, danang, saigon

CREATE TABLE IF NOT EXISTS guest_bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_code VARCHAR(10) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NULL,

  -- Passenger list stored as JSON array
  passengers JSON NOT NULL,

  -- Link to flights table
  flight_id INT UNSIGNED NOT NULL,
  departure_date DATE NOT NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  completed_at DATETIME NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_guest_booking_code (booking_code),
  KEY idx_guest_email (customer_email),
  KEY idx_guest_expires (expires_at),
  KEY idx_guest_status (status)
);


