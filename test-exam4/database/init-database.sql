-- Run with: mysql -u root -p < database/init-database.sql
CREATE DATABASE IF NOT EXISTS shop_orders DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
USE shop_orders;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'BRONZE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, SHIPPED, CANCELLED
  placed_at DATE NOT NULL,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO customers (email, full_name, tier) VALUES
  ('arisa@example.com', 'Arisa Customer', 'BRONZE'),
  ('boon@example.com', 'Boon Customer', 'SILVER'),
  ('chai@example.com', 'Chai Customer', 'GOLD'),
  ('dao@example.com', 'Dao Customer', 'BRONZE'),
  ('ekkachai@example.com', 'Ekkachai Customer', 'SILVER'),
  ('fah@example.com', 'Fah Customer', 'GOLD'),
  ('gun@example.com', 'Gun Customer', 'BRONZE'),
  ('hathai@example.com', 'Hathai Customer', 'SILVER');

INSERT INTO orders (order_no, customer_id, total_amount, status, placed_at) VALUES
  ('ORD-0001', 2, 237, 'CANCELLED', '2026-02-06'),
  ('ORD-0002', 3, 374, 'SHIPPED', '2026-03-11'),
  ('ORD-0003', 4, 511, 'PAID', '2026-01-16'),
  ('ORD-0004', 5, 648, 'PENDING', '2026-02-21'),
  ('ORD-0005', 6, 785, 'CANCELLED', '2026-03-26'),
  ('ORD-0006', 7, 922, 'SHIPPED', '2026-01-03'),
  ('ORD-0007', 8, 1059, 'PAID', '2026-02-08'),
  ('ORD-0008', 1, 1196, 'PENDING', '2026-03-13'),
  ('ORD-0009', 2, 1333, 'CANCELLED', '2026-01-18'),
  ('ORD-0010', 3, 1470, 'SHIPPED', '2026-02-23'),
  ('ORD-0011', 4, 1607, 'PAID', '2026-03-28'),
  ('ORD-0012', 5, 1744, 'PENDING', '2026-01-05'),
  ('ORD-0013', 6, 1881, 'CANCELLED', '2026-02-10'),
  ('ORD-0014', 7, 2018, 'SHIPPED', '2026-03-15'),
  ('ORD-0015', 8, 2155, 'PAID', '2026-01-20'),
  ('ORD-0016', 1, 2292, 'PENDING', '2026-02-25'),
  ('ORD-0017', 2, 2429, 'CANCELLED', '2026-03-02'),
  ('ORD-0018', 3, 2566, 'SHIPPED', '2026-01-07'),
  ('ORD-0019', 4, 2703, 'PAID', '2026-02-12'),
  ('ORD-0020', 5, 2840, 'PENDING', '2026-03-17'),
  ('ORD-0021', 6, 2977, 'CANCELLED', '2026-01-22'),
  ('ORD-0022', 7, 3114, 'SHIPPED', '2026-02-27'),
  ('ORD-0023', 8, 3251, 'PAID', '2026-03-04'),
  ('ORD-0024', 1, 3388, 'PENDING', '2026-01-09'),
  ('ORD-0025', 2, 3525, 'CANCELLED', '2026-02-14'),
  ('ORD-0026', 3, 3662, 'SHIPPED', '2026-03-19'),
  ('ORD-0027', 4, 3799, 'PAID', '2026-01-24'),
  ('ORD-0028', 5, 3936, 'PENDING', '2026-02-01'),
  ('ORD-0029', 6, 4073, 'CANCELLED', '2026-03-06'),
  ('ORD-0030', 7, 4210, 'SHIPPED', '2026-01-11'),
  ('ORD-0031', 8, 4347, 'PAID', '2026-02-16'),
  ('ORD-0032', 1, 4484, 'PENDING', '2026-03-21'),
  ('ORD-0033', 2, 4621, 'CANCELLED', '2026-01-26'),
  ('ORD-0034', 3, 4758, 'SHIPPED', '2026-02-03'),
  ('ORD-0035', 4, 4895, 'PAID', '2026-03-08'),
  ('ORD-0036', 5, 132, 'PENDING', '2026-01-13'),
  ('ORD-0037', 6, 269, 'CANCELLED', '2026-02-18'),
  ('ORD-0038', 7, 406, 'SHIPPED', '2026-03-23'),
  ('ORD-0039', 8, 543, 'PAID', '2026-01-28'),
  ('ORD-0040', 1, 680, 'PENDING', '2026-02-05'),
  ('ORD-0041', 2, 817, 'CANCELLED', '2026-03-10'),
  ('ORD-0042', 3, 954, 'SHIPPED', '2026-01-15'),
  ('ORD-0043', 4, 1091, 'PAID', '2026-02-20'),
  ('ORD-0044', 5, 1228, 'PENDING', '2026-03-25'),
  ('ORD-0045', 6, 1365, 'CANCELLED', '2026-01-02'),
  ('ORD-0046', 7, 1502, 'SHIPPED', '2026-02-07'),
  ('ORD-0047', 8, 1639, 'PAID', '2026-03-12'),
  ('ORD-0048', 1, 1776, 'PENDING', '2026-01-17'),
  ('ORD-0049', 2, 1913, 'CANCELLED', '2026-02-22'),
  ('ORD-0050', 3, 2050, 'SHIPPED', '2026-03-27'),
  ('ORD-0051', 4, 2187, 'PAID', '2026-01-04'),
  ('ORD-0052', 5, 2324, 'PENDING', '2026-02-09'),
  ('ORD-0053', 6, 2461, 'CANCELLED', '2026-03-14'),
  ('ORD-0054', 7, 2598, 'SHIPPED', '2026-01-19'),
  ('ORD-0055', 8, 2735, 'PAID', '2026-02-24'),
  ('ORD-0056', 1, 2872, 'PENDING', '2026-03-01'),
  ('ORD-0057', 2, 3009, 'CANCELLED', '2026-01-06'),
  ('ORD-0058', 3, 3146, 'SHIPPED', '2026-02-11'),
  ('ORD-0059', 4, 3283, 'PAID', '2026-03-16'),
  ('ORD-0060', 5, 3420, 'PENDING', '2026-01-21');
