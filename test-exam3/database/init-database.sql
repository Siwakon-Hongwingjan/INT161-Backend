-- Run with: mysql -u root -p < database/init-database.sql
CREATE DATABASE IF NOT EXISTS clinic_appointments DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
USE clinic_appointments;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE doctors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  license_no VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  department_id BIGINT NOT NULL,
  years_experience INT NOT NULL,
  consultation_fee DECIMAL(8,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  doctor_id BIGINT NOT NULL,
  patient_name VARCHAR(120) NOT NULL,
  appointment_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
  CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO departments (name) VALUES
  ('Cardiology'),
  ('Dermatology'),
  ('Pediatrics'),
  ('Orthopedics'),
  ('Neurology');

INSERT INTO doctors (license_no, first_name, last_name, department_id, years_experience, consultation_fee, is_active) VALUES
  ('LIC-0001', 'Somsri', 'Rakthai', 2, 3, 350, 1),
  ('LIC-0002', 'Anan', 'Srisuk', 3, 6, 400, 1),
  ('LIC-0003', 'Malee', 'Wongsawat', 4, 9, 450, 1),
  ('LIC-0004', 'Prasert', 'Chaiyo', 5, 12, 500, 1),
  ('LIC-0005', 'Nattaya', 'Jaidee', 1, 15, 550, 1),
  ('LIC-0006', 'Kittipong', 'Rakthai', 2, 18, 600, 1),
  ('LIC-0007', 'Supaporn', 'Srisuk', 3, 21, 650, 1),
  ('LIC-0008', 'Wichai', 'Wongsawat', 4, 24, 700, 0),
  ('LIC-0009', 'Somchai', 'Chaiyo', 5, 2, 750, 1),
  ('LIC-0010', 'Somsri', 'Jaidee', 1, 5, 800, 1),
  ('LIC-0011', 'Anan', 'Rakthai', 2, 8, 850, 1),
  ('LIC-0012', 'Malee', 'Srisuk', 3, 11, 900, 1),
  ('LIC-0013', 'Prasert', 'Wongsawat', 4, 14, 950, 1),
  ('LIC-0014', 'Nattaya', 'Chaiyo', 5, 17, 1000, 1),
  ('LIC-0015', 'Kittipong', 'Jaidee', 1, 20, 1050, 1),
  ('LIC-0016', 'Supaporn', 'Rakthai', 2, 23, 1100, 0),
  ('LIC-0017', 'Wichai', 'Srisuk', 3, 1, 1150, 1),
  ('LIC-0018', 'Somchai', 'Wongsawat', 4, 4, 1200, 1),
  ('LIC-0019', 'Somsri', 'Chaiyo', 5, 7, 1250, 1),
  ('LIC-0020', 'Anan', 'Jaidee', 1, 10, 1300, 1),
  ('LIC-0021', 'Malee', 'Rakthai', 2, 13, 1350, 1),
  ('LIC-0022', 'Prasert', 'Srisuk', 3, 16, 1400, 1),
  ('LIC-0023', 'Nattaya', 'Wongsawat', 4, 19, 1450, 1),
  ('LIC-0024', 'Kittipong', 'Chaiyo', 5, 22, 300, 0),
  ('LIC-0025', 'Supaporn', 'Jaidee', 1, 0, 350, 1),
  ('LIC-0026', 'Wichai', 'Rakthai', 2, 3, 400, 1),
  ('LIC-0027', 'Somchai', 'Srisuk', 3, 6, 450, 1),
  ('LIC-0028', 'Somsri', 'Wongsawat', 4, 9, 500, 1),
  ('LIC-0029', 'Anan', 'Chaiyo', 5, 12, 550, 1),
  ('LIC-0030', 'Malee', 'Jaidee', 1, 15, 600, 1),
  ('LIC-0031', 'Prasert', 'Rakthai', 2, 18, 650, 1),
  ('LIC-0032', 'Nattaya', 'Srisuk', 3, 21, 700, 0),
  ('LIC-0033', 'Kittipong', 'Wongsawat', 4, 24, 750, 1),
  ('LIC-0034', 'Supaporn', 'Chaiyo', 5, 2, 800, 1),
  ('LIC-0035', 'Wichai', 'Jaidee', 1, 5, 850, 1),
  ('LIC-0036', 'Somchai', 'Rakthai', 2, 8, 900, 1),
  ('LIC-0037', 'Somsri', 'Srisuk', 3, 11, 950, 1),
  ('LIC-0038', 'Anan', 'Wongsawat', 4, 14, 1000, 1),
  ('LIC-0039', 'Malee', 'Chaiyo', 5, 17, 1050, 1),
  ('LIC-0040', 'Prasert', 'Jaidee', 1, 20, 1100, 0),
  ('LIC-0041', 'Nattaya', 'Rakthai', 2, 23, 1150, 1),
  ('LIC-0042', 'Kittipong', 'Srisuk', 3, 1, 1200, 1),
  ('LIC-0043', 'Supaporn', 'Wongsawat', 4, 4, 1250, 1),
  ('LIC-0044', 'Wichai', 'Chaiyo', 5, 7, 1300, 1),
  ('LIC-0045', 'Somchai', 'Jaidee', 1, 10, 1350, 1);

INSERT INTO appointments (doctor_id, patient_name, appointment_date, status) VALUES
  (1, 'Patient 1-1', '2026-11-03', 'BOOKED'),
  (1, 'Patient 1-2', '2026-11-04', 'BOOKED'),
  (1, 'Patient 1-3', '2026-11-05', 'CANCELLED'),
  (2, 'Patient 2-1', '2026-11-04', 'BOOKED'),
  (2, 'Patient 2-2', '2026-11-05', 'BOOKED'),
  (2, 'Patient 2-3', '2026-11-06', 'CANCELLED'),
  (3, 'Patient 3-1', '2026-11-05', 'BOOKED'),
  (3, 'Patient 3-2', '2026-11-06', 'BOOKED'),
  (3, 'Patient 3-3', '2026-11-07', 'CANCELLED'),
  (5, 'Patient 5-1', '2026-11-07', 'BOOKED'),
  (5, 'Patient 5-2', '2026-11-08', 'BOOKED'),
  (5, 'Patient 5-3', '2026-11-09', 'CANCELLED'),
  (8, 'Patient 8-1', '2026-11-10', 'BOOKED'),
  (8, 'Patient 8-2', '2026-11-11', 'BOOKED'),
  (8, 'Patient 8-3', '2026-11-12', 'CANCELLED'),
  (13, 'Patient 13-1', '2026-11-15', 'BOOKED'),
  (13, 'Patient 13-2', '2026-11-16', 'BOOKED'),
  (13, 'Patient 13-3', '2026-11-17', 'CANCELLED');
