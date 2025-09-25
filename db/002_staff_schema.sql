-- Staff schema for company employees (staff and admins)

CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  position VARCHAR(50) NOT NULL,
  role ENUM('staff','admin','manager') NOT NULL DEFAULT 'staff',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS staff_permissions (
  staff_id INT NOT NULL,
  permission_code VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT NULL,
  PRIMARY KEY (staff_id, permission_code),
  CONSTRAINT fk_staff_permissions_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS staff_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_resource VARCHAR(100) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent TEXT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staff_logs_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migration helper notes (manual):
-- Insert admins/staff from existing users table if present
-- INSERT INTO staff (employee_code,email,password_hash,full_name,department,position,role,is_active)
-- SELECT CONCAT(UPPER(LEFT(role,2)), LPAD(id,3,'0')) as employee_code, email, password as password_hash,
--        full_name, COALESCE(region,'ops') as department, role as position,
--        CASE WHEN role IN ('admin','manager') THEN role ELSE 'staff' END as role,
--        CASE WHEN active IS NULL THEN 1 ELSE active END as is_active
-- FROM users WHERE role IN ('admin','manager','staff');
