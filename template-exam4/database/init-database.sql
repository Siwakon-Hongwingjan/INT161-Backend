-- Template Exam 4 : Helpdesk (รันซ้ำได้เพื่อรีเซ็ตข้อมูล)
DROP DATABASE IF EXISTS helpdesk;
CREATE DATABASE helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE helpdesk;

CREATE TABLE technicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  level VARCHAR(5) NOT NULL,          -- L1, L2, L3
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_no VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  priority VARCHAR(10) NOT NULL,      -- LOW, MEDIUM, HIGH, URGENT
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED
  technician_id INT NULL,
  opened_on DATE NOT NULL,
  resolved_on DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_technician FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO technicians (name, email, level, is_active) VALUES
  ('Anan Support', 'anan@helpdesk.local', 'L1', 1),
  ('Benja Fixit', 'benja@helpdesk.local', 'L2', 1),
  ('Chai Network', 'chai@helpdesk.local', 'L3', 1),
  ('Dara Desk', 'dara@helpdesk.local', 'L1', 1),
  ('Ekk Hardware', 'ekk@helpdesk.local', 'L2', 1),
  ('Fon Retired', 'fon@helpdesk.local', 'L2', 0);

INSERT INTO tickets (ticket_no, title, priority, status, technician_id, opened_on, resolved_on) VALUES
  ('TCK-0001', 'VPN cannot connect on floor 2', 'URGENT', 'IN_PROGRESS', 4, '2026-01-12', NULL),
  ('TCK-0002', 'Email bounce on floor 3', 'HIGH', 'RESOLVED', 2, '2026-01-23', '2026-01-26'),
  ('TCK-0003', 'Laptop overheating on floor 4', 'MEDIUM', 'CLOSED', 6, '2026-02-03', '2026-02-07'),
  ('TCK-0004', 'Password reset on floor 5', 'LOW', 'OPEN', NULL, '2026-02-14', NULL),
  ('TCK-0005', 'Wi-Fi drops on floor 6', 'URGENT', 'CANCELLED', NULL, '2026-02-25', NULL),
  ('TCK-0006', 'Software install on floor 1', 'HIGH', 'IN_PROGRESS', 4, '2026-03-08', NULL),
  ('TCK-0007', 'Monitor flicker on floor 2', 'MEDIUM', 'OPEN', NULL, '2026-03-19', NULL),
  ('TCK-0008', 'Printer jam on floor 3', 'LOW', 'OPEN', NULL, '2026-01-09', NULL),
  ('TCK-0009', 'VPN cannot connect on floor 4', 'URGENT', 'IN_PROGRESS', 3, '2026-01-20', NULL),
  ('TCK-0010', 'Email bounce on floor 5', 'HIGH', 'RESOLVED', 1, '2026-01-31', '2026-02-01'),
  ('TCK-0011', 'Laptop overheating on floor 6', 'MEDIUM', 'CLOSED', 4, '2026-02-11', '2026-02-13'),
  ('TCK-0012', 'Password reset on floor 1', 'LOW', 'OPEN', 3, '2026-02-22', NULL),
  ('TCK-0013', 'Wi-Fi drops on floor 2', 'URGENT', 'CANCELLED', NULL, '2026-03-05', NULL),
  ('TCK-0014', 'Software install on floor 3', 'HIGH', 'IN_PROGRESS', 3, '2026-03-16', NULL),
  ('TCK-0015', 'Monitor flicker on floor 4', 'MEDIUM', 'OPEN', 1, '2026-01-06', NULL),
  ('TCK-0016', 'Printer jam on floor 5', 'LOW', 'OPEN', NULL, '2026-01-17', NULL),
  ('TCK-0017', 'VPN cannot connect on floor 6', 'URGENT', 'IN_PROGRESS', 2, '2026-01-28', NULL),
  ('TCK-0018', 'Email bounce on floor 1', 'HIGH', 'RESOLVED', 5, '2026-02-08', '2026-02-12'),
  ('TCK-0019', 'Laptop overheating on floor 2', 'MEDIUM', 'CLOSED', 6, '2026-02-19', '2026-02-24'),
  ('TCK-0020', 'Password reset on floor 3', 'LOW', 'OPEN', NULL, '2026-03-02', NULL),
  ('TCK-0021', 'Wi-Fi drops on floor 4', 'URGENT', 'CANCELLED', NULL, '2026-03-13', NULL),
  ('TCK-0022', 'Software install on floor 5', 'HIGH', 'IN_PROGRESS', 2, '2026-01-03', NULL),
  ('TCK-0023', 'Monitor flicker on floor 6', 'MEDIUM', 'OPEN', NULL, '2026-01-14', NULL),
  ('TCK-0024', 'Printer jam on floor 1', 'LOW', 'OPEN', 5, '2026-01-25', NULL),
  ('TCK-0025', 'VPN cannot connect on floor 2', 'URGENT', 'IN_PROGRESS', 1, '2026-02-05', NULL),
  ('TCK-0026', 'Email bounce on floor 3', 'HIGH', 'RESOLVED', 4, '2026-02-16', '2026-02-18'),
  ('TCK-0027', 'Laptop overheating on floor 4', 'MEDIUM', 'CLOSED', 2, '2026-02-27', '2026-03-02'),
  ('TCK-0028', 'Password reset on floor 5', 'LOW', 'OPEN', NULL, '2026-03-10', NULL),
  ('TCK-0029', 'Wi-Fi drops on floor 6', 'URGENT', 'CANCELLED', NULL, '2026-03-21', NULL),
  ('TCK-0030', 'Software install on floor 1', 'HIGH', 'IN_PROGRESS', 1, '2026-01-11', NULL),
  ('TCK-0031', 'Monitor flicker on floor 2', 'MEDIUM', 'OPEN', NULL, '2026-01-22', NULL),
  ('TCK-0032', 'Printer jam on floor 3', 'LOW', 'OPEN', NULL, '2026-02-02', NULL),
  ('TCK-0033', 'VPN cannot connect on floor 4', 'URGENT', 'IN_PROGRESS', 5, '2026-02-13', NULL),
  ('TCK-0034', 'Email bounce on floor 5', 'HIGH', 'RESOLVED', 3, '2026-02-24', '2026-03-01'),
  ('TCK-0035', 'Laptop overheating on floor 6', 'MEDIUM', 'CLOSED', 6, '2026-03-07', '2026-03-08'),
  ('TCK-0036', 'Password reset on floor 1', 'LOW', 'OPEN', 2, '2026-03-18', NULL),
  ('TCK-0037', 'Wi-Fi drops on floor 2', 'URGENT', 'CANCELLED', NULL, '2026-01-08', NULL),
  ('TCK-0038', 'Software install on floor 3', 'HIGH', 'IN_PROGRESS', 5, '2026-01-19', NULL),
  ('TCK-0039', 'Monitor flicker on floor 4', 'MEDIUM', 'OPEN', 5, '2026-01-30', NULL),
  ('TCK-0040', 'Printer jam on floor 5', 'LOW', 'OPEN', NULL, '2026-02-10', NULL),
  ('TCK-0041', 'VPN cannot connect on floor 6', 'URGENT', 'IN_PROGRESS', 4, '2026-02-21', NULL),
  ('TCK-0042', 'Email bounce on floor 1', 'HIGH', 'RESOLVED', 2, '2026-03-04', '2026-03-07'),
  ('TCK-0043', 'Laptop overheating on floor 2', 'MEDIUM', 'CLOSED', 5, '2026-03-15', '2026-03-19'),
  ('TCK-0044', 'Password reset on floor 3', 'LOW', 'OPEN', NULL, '2026-01-05', NULL),
  ('TCK-0045', 'Wi-Fi drops on floor 4', 'URGENT', 'CANCELLED', NULL, '2026-01-16', NULL),
  ('TCK-0046', 'Software install on floor 5', 'HIGH', 'IN_PROGRESS', 4, '2026-01-27', NULL),
  ('TCK-0047', 'Monitor flicker on floor 6', 'MEDIUM', 'OPEN', NULL, '2026-02-07', NULL),
  ('TCK-0048', 'Printer jam on floor 1', 'LOW', 'OPEN', 4, '2026-02-18', NULL);
