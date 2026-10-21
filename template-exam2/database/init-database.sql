-- Template Exam 2 : Car Rental (รันซ้ำได้เพื่อรีเซ็ตข้อมูล)
DROP DATABASE IF EXISTS car_rental;
CREATE DATABASE car_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE car_rental;

CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  city VARCHAR(80) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_no VARCHAR(20) NOT NULL UNIQUE,
  brand VARCHAR(40) NOT NULL,
  model VARCHAR(40) NOT NULL,
  branch_id INT NOT NULL,
  daily_rate DECIMAL(8,2) NOT NULL,
  seats INT NOT NULL,
  transmission VARCHAR(10) NOT NULL, -- AUTO, MANUAL
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cars_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO branches (name, city) VALUES
  ('Bangkok Central', 'Bangkok'),
  ('Chiang Mai Airport', 'Chiang Mai'),
  ('Phuket Town', 'Phuket'),
  ('Pattaya Beach', 'Chonburi'),
  ('Hua Hin Station', 'Prachuap Khiri Khan');

INSERT INTO cars (plate_no, brand, model, branch_id, daily_rate, seats, transmission, is_available) VALUES
  ('BKK-1000', 'Toyota', 'Yaris', 1, 900.00, 5, 'AUTO', 1),
  ('BKK-1007', 'Toyota', 'Fortuner', 1, 2200.00, 7, 'AUTO', 1),
  ('BKK-1014', 'Honda', 'City', 1, 950.00, 5, 'AUTO', 1),
  ('BKK-1021', 'Honda', 'Civic', 1, 1400.00, 5, 'AUTO', 0),
  ('BKK-1028', 'Mazda', '2', 1, 850.00, 5, 'MANUAL', 1),
  ('BKK-1035', 'Mazda', 'CX-5', 1, 1800.00, 5, 'AUTO', 1),
  ('BKK-1042', 'Nissan', 'Almera', 1, 800.00, 5, 'MANUAL', 1),
  ('BKK-1049', 'Ford', 'Ranger', 1, 1500.00, 5, 'MANUAL', 0),
  ('BKK-1056', 'BMW', '320d', 1, 3500.00, 5, 'AUTO', 1),
  ('CNX-1003', 'Toyota', 'Yaris', 2, 1000.00, 5, 'AUTO', 1),
  ('CNX-1010', 'Toyota', 'Fortuner', 2, 2350.00, 7, 'AUTO', 1),
  ('CNX-1017', 'Honda', 'City', 2, 1050.00, 5, 'AUTO', 0),
  ('CNX-1024', 'Honda', 'Civic', 2, 1500.00, 5, 'AUTO', 1),
  ('CNX-1031', 'Mazda', '2', 2, 1000.00, 5, 'MANUAL', 1),
  ('CNX-1038', 'Mazda', 'CX-5', 2, 1900.00, 5, 'AUTO', 1),
  ('CNX-1045', 'Nissan', 'Almera', 2, 900.00, 5, 'MANUAL', 0),
  ('CNX-1052', 'Ford', 'Ranger', 2, 1650.00, 5, 'MANUAL', 1),
  ('CNX-1059', 'BMW', '320d', 2, 3600.00, 5, 'AUTO', 1),
  ('HKT-1006', 'Toyota', 'Yaris', 3, 1100.00, 5, 'AUTO', 0),
  ('HKT-1013', 'Toyota', 'Fortuner', 3, 2400.00, 7, 'AUTO', 0),
  ('HKT-1020', 'Honda', 'City', 3, 1150.00, 5, 'AUTO', 1),
  ('HKT-1027', 'Honda', 'Civic', 3, 1600.00, 5, 'AUTO', 1),
  ('HKT-1034', 'Mazda', '2', 3, 1050.00, 5, 'MANUAL', 1),
  ('HKT-1041', 'Mazda', 'CX-5', 3, 2000.00, 5, 'AUTO', 0),
  ('HKT-1048', 'Nissan', 'Almera', 3, 1000.00, 5, 'MANUAL', 1),
  ('HKT-1055', 'Ford', 'Ranger', 3, 1700.00, 5, 'MANUAL', 1),
  ('HKT-1062', 'BMW', '320d', 3, 3700.00, 5, 'AUTO', 1),
  ('PTY-1009', 'Toyota', 'Yaris', 4, 1050.00, 5, 'AUTO', 0),
  ('PTY-1016', 'Toyota', 'Fortuner', 4, 2400.00, 7, 'AUTO', 1),
  ('PTY-1023', 'Honda', 'City', 4, 1100.00, 5, 'AUTO', 1),
  ('PTY-1030', 'Honda', 'Civic', 4, 1550.00, 5, 'AUTO', 1),
  ('PTY-1037', 'Mazda', '2', 4, 1050.00, 5, 'MANUAL', 0),
  ('PTY-1044', 'Mazda', 'CX-5', 4, 1950.00, 5, 'AUTO', 1),
  ('PTY-1051', 'Nissan', 'Almera', 4, 950.00, 5, 'MANUAL', 1),
  ('PTY-1058', 'Ford', 'Ranger', 4, 1700.00, 5, 'MANUAL', 1),
  ('PTY-1065', 'BMW', '320d', 4, 3650.00, 5, 'AUTO', 0);
