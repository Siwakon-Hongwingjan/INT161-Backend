-- Run with: mysql -u root -p < database/init-database.sql
CREATE DATABASE IF NOT EXISTS event_platform DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
USE event_platform;

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS venues;

CREATE TABLE venues (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  city VARCHAR(80) NOT NULL,
  capacity INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  venue_id BIGINT NOT NULL,
  category VARCHAR(30) NOT NULL, -- MUSIC, TECH, SPORT, FOOD
  start_date DATE NOT NULL,
  ticket_price DECIMAL(8,2) NOT NULL,
  max_attendees INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, CANCELLED
  deleted_at DATETIME NULL, -- soft delete
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registrations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  attendee_name VARCHAR(120) NOT NULL,
  attendee_email VARCHAR(150) NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_email (event_id, attendee_email),
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO venues (name, city, capacity) VALUES
  ('Bangkok Hall', 'Bangkok', 500),
  ('Chiang Mai Arena', 'Chiang Mai', 300),
  ('Phuket Dome', 'Phuket', 200),
  ('Khon Kaen Center', 'Khon Kaen', 100);

INSERT INTO events (title, venue_id, category, start_date, ticket_price, max_attendees, status, deleted_at) VALUES
  ('Event 01 Summit', 2, 'TECH', '2026-08-02', 90, 10, 'PUBLISHED', NULL),
  ('Event 02 Cup', 3, 'SPORT', '2026-09-03', 180, 20, 'DRAFT', NULL),
  ('Event 03 Fest', 4, 'FOOD', '2026-10-04', 270, 50, 'PUBLISHED', NULL),
  ('Event 04 Live', 1, 'MUSIC', '2026-11-05', 360, 5, 'CANCELLED', NULL),
  ('Event 05 Summit', 2, 'TECH', '2026-12-06', 450, 10, 'PUBLISHED', NULL),
  ('Event 06 Cup', 3, 'SPORT', '2026-07-07', 540, 20, 'PUBLISHED', NULL),
  ('Event 07 Fest', 4, 'FOOD', '2026-08-08', 630, 50, 'DRAFT', NULL),
  ('Event 08 Live', 1, 'MUSIC', '2026-09-09', 720, 5, 'PUBLISHED', NULL),
  ('Event 09 Summit', 2, 'TECH', '2026-10-10', 810, 10, 'CANCELLED', NULL),
  ('Event 10 Cup', 3, 'SPORT', '2026-11-11', 900, 20, 'PUBLISHED', NULL),
  ('Event 11 Fest', 4, 'FOOD', '2026-12-12', 990, 50, 'PUBLISHED', NULL),
  ('Event 12 Live', 1, 'MUSIC', '2026-07-13', 1080, 5, 'DRAFT', NULL),
  ('Event 13 Summit', 2, 'TECH', '2026-08-14', 1170, 10, 'PUBLISHED', NULL),
  ('Event 14 Cup', 3, 'SPORT', '2026-09-15', 1260, 20, 'CANCELLED', NULL),
  ('Event 15 Fest', 4, 'FOOD', '2026-10-16', 1350, 50, 'PUBLISHED', NULL),
  ('Event 16 Live', 1, 'MUSIC', '2026-11-17', 1440, 5, 'PUBLISHED', NULL),
  ('Event 17 Summit', 2, 'TECH', '2026-12-18', 30, 10, 'DRAFT', NULL),
  ('Event 18 Cup', 3, 'SPORT', '2026-07-19', 120, 20, 'PUBLISHED', NULL),
  ('Event 19 Fest', 4, 'FOOD', '2026-08-20', 210, 50, 'CANCELLED', NULL),
  ('Event 20 Live', 1, 'MUSIC', '2026-09-21', 300, 5, 'PUBLISHED', NULL),
  ('Event 21 Summit', 2, 'TECH', '2026-10-22', 390, 10, 'PUBLISHED', NULL),
  ('Event 22 Cup', 3, 'SPORT', '2026-11-23', 480, 20, 'DRAFT', NULL),
  ('Event 23 Fest', 4, 'FOOD', '2026-12-24', 570, 50, 'PUBLISHED', NULL),
  ('Event 24 Live', 1, 'MUSIC', '2026-07-25', 660, 5, 'CANCELLED', NULL),
  ('Event 25 Summit', 2, 'TECH', '2026-08-26', 750, 10, 'PUBLISHED', NULL),
  ('Event 26 Cup', 3, 'SPORT', '2026-09-27', 840, 20, 'PUBLISHED', NULL),
  ('Event 27 Fest', 4, 'FOOD', '2026-10-01', 930, 50, 'DRAFT', NULL),
  ('Event 28 Live', 1, 'MUSIC', '2026-11-02', 1020, 5, 'PUBLISHED', NULL),
  ('Event 29 Summit', 2, 'TECH', '2026-12-03', 1110, 10, 'CANCELLED', '2026-10-01 00:00:00'),
  ('Event 30 Cup', 3, 'SPORT', '2026-07-04', 1200, 20, 'PUBLISHED', NULL);

INSERT INTO registrations (event_id, attendee_name, attendee_email) VALUES
  (4, 'Attendee 4-1', 'a4_1@example.com'),
  (4, 'Attendee 4-2', 'a4_2@example.com'),
  (4, 'Attendee 4-3', 'a4_3@example.com'),
  (8, 'Attendee 8-1', 'a8_1@example.com'),
  (8, 'Attendee 8-2', 'a8_2@example.com'),
  (8, 'Attendee 8-3', 'a8_3@example.com'),
  (8, 'Attendee 8-4', 'a8_4@example.com'),
  (8, 'Attendee 8-5', 'a8_5@example.com'),
  (2, 'Attendee 2-1', 'a2_1@example.com'),
  (2, 'Attendee 2-2', 'a2_2@example.com'),
  (2, 'Attendee 2-3', 'a2_3@example.com'),
  (2, 'Attendee 2-4', 'a2_4@example.com'),
  (2, 'Attendee 2-5', 'a2_5@example.com'),
  (2, 'Attendee 2-6', 'a2_6@example.com'),
  (2, 'Attendee 2-7', 'a2_7@example.com'),
  (2, 'Attendee 2-8', 'a2_8@example.com'),
  (2, 'Attendee 2-9', 'a2_9@example.com'),
  (2, 'Attendee 2-10', 'a2_10@example.com'),
  (1, 'Attendee 1-1', 'a1_1@example.com'),
  (1, 'Attendee 1-2', 'a1_2@example.com'),
  (5, 'Attendee 5-1', 'a5_1@example.com'),
  (12, 'Attendee 12-1', 'a12_1@example.com'),
  (12, 'Attendee 12-2', 'a12_2@example.com'),
  (12, 'Attendee 12-3', 'a12_3@example.com');
