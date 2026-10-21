-- Run with: mysql -u root -p < database/init-database.sql
CREATE DATABASE IF NOT EXISTS hotel_booking DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
USE hotel_booking;

DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;

CREATE TABLE room_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  bed_type VARCHAR(50) NOT NULL,
  max_guests INT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rooms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  floor INT NOT NULL,
  room_type_id BIGINT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, MAINTENANCE
  has_view BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rooms_type FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO room_types (name, bed_type, max_guests, base_price) VALUES
  ('Standard', 'Queen', 2, 1200),
  ('Deluxe', 'King', 2, 2000),
  ('Family', '2 Queen', 4, 2800),
  ('Suite', 'King', 3, 4500);

INSERT INTO rooms (room_number, floor, room_type_id, price_per_night, status, has_view) VALUES
  ('101', 1, 1, 1300, 'AVAILABLE', 0),
  ('102', 1, 1, 1300, 'AVAILABLE', 0),
  ('103', 1, 1, 1300, 'OCCUPIED', 0),
  ('104', 1, 2, 2100, 'MAINTENANCE', 0),
  ('105', 1, 2, 2100, 'AVAILABLE', 1),
  ('106', 1, 3, 2900, 'OCCUPIED', 1),
  ('107', 1, 3, 2900, 'AVAILABLE', 1),
  ('108', 1, 4, 4600, 'AVAILABLE', 1),
  ('201', 2, 1, 1400, 'AVAILABLE', 0),
  ('202', 2, 1, 1400, 'AVAILABLE', 0),
  ('203', 2, 1, 1400, 'MAINTENANCE', 0),
  ('204', 2, 2, 2200, 'AVAILABLE', 0),
  ('205', 2, 2, 2200, 'AVAILABLE', 1),
  ('206', 2, 3, 3000, 'OCCUPIED', 1),
  ('207', 2, 3, 3000, 'AVAILABLE', 1),
  ('208', 2, 4, 4700, 'MAINTENANCE', 1),
  ('301', 3, 1, 1500, 'OCCUPIED', 0),
  ('302', 3, 1, 1500, 'MAINTENANCE', 0),
  ('303', 3, 1, 1500, 'OCCUPIED', 0),
  ('304', 3, 2, 2300, 'OCCUPIED', 0),
  ('305', 3, 2, 2300, 'OCCUPIED', 1),
  ('306', 3, 3, 3100, 'OCCUPIED', 1),
  ('307', 3, 3, 3100, 'MAINTENANCE', 1),
  ('308', 3, 4, 4800, 'OCCUPIED', 1),
  ('401', 4, 1, 1600, 'MAINTENANCE', 0),
  ('402', 4, 1, 1600, 'AVAILABLE', 0),
  ('403', 4, 1, 1600, 'OCCUPIED', 0),
  ('404', 4, 2, 2400, 'AVAILABLE', 0),
  ('405', 4, 2, 2400, 'AVAILABLE', 1),
  ('406', 4, 3, 3200, 'MAINTENANCE', 1),
  ('407', 4, 3, 3200, 'AVAILABLE', 1),
  ('408', 4, 4, 4900, 'AVAILABLE', 1),
  ('501', 5, 1, 1700, 'AVAILABLE', 0),
  ('502', 5, 1, 1700, 'AVAILABLE', 0),
  ('503', 5, 1, 1700, 'OCCUPIED', 0),
  ('504', 5, 2, 2500, 'AVAILABLE', 0),
  ('505', 5, 2, 2500, 'MAINTENANCE', 1),
  ('506', 5, 3, 3300, 'OCCUPIED', 1),
  ('507', 5, 3, 3300, 'AVAILABLE', 1),
  ('508', 5, 4, 5000, 'AVAILABLE', 1);
