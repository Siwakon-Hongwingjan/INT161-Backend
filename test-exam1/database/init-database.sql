-- Run with: mysql -u root -p < database/init-database.sql
CREATE DATABASE IF NOT EXISTS cafe_menu DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
USE cafe_menu;

DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE menu_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category_id BIGINT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  calories INT NOT NULL,
  size CHAR(1) NOT NULL DEFAULT 'M',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (name, description, is_active) VALUES
  ('Coffee', 'Espresso based drinks', 1),
  ('Tea', 'Hot and iced tea', 1),
  ('Bakery', 'Fresh baked goods', 1),
  ('Smoothie', 'Blended fruit drinks', 1),
  ('Snack', 'Light bites', 1),
  ('Seasonal', 'Limited time items', 0);

INSERT INTO menu_items (sku, name, category_id, price, calories, size, is_available) VALUES
  ('CAF-001', 'Espresso', 1, 47, 63, 'M', 1),
  ('CAF-002', 'Americano', 1, 54, 76, 'L', 1),
  ('CAF-003', 'Latte', 1, 61, 89, 'S', 1),
  ('CAF-004', 'Cappuccino', 1, 68, 102, 'M', 1),
  ('CAF-005', 'Mocha', 1, 75, 115, 'L', 1),
  ('CAF-006', 'Flat White', 1, 82, 128, 'S', 1),
  ('CAF-007', 'Green Tea', 2, 89, 141, 'M', 0),
  ('CAF-008', 'Black Tea', 2, 96, 154, 'L', 1),
  ('CAF-009', 'Thai Milk Tea', 2, 43, 167, 'S', 1),
  ('CAF-010', 'Matcha Latte', 2, 50, 180, 'M', 1),
  ('CAF-011', 'Jasmine Tea', 2, 57, 193, 'L', 1),
  ('CAF-012', 'Earl Grey', 2, 64, 206, 'S', 1),
  ('CAF-013', 'Croissant', 3, 71, 219, 'M', 1),
  ('CAF-014', 'Blueberry Muffin', 3, 78, 232, 'L', 0),
  ('CAF-015', 'Cheesecake', 3, 85, 245, 'S', 1),
  ('CAF-016', 'Brownie', 3, 92, 258, 'M', 1),
  ('CAF-017', 'Banana Bread', 3, 99, 271, 'L', 1),
  ('CAF-018', 'Cinnamon Roll', 3, 46, 284, 'S', 1),
  ('CAF-019', 'Mango Smoothie', 4, 53, 297, 'M', 1),
  ('CAF-020', 'Strawberry Smoothie', 4, 60, 310, 'L', 1),
  ('CAF-021', 'Avocado Smoothie', 4, 67, 323, 'S', 0),
  ('CAF-022', 'Mixed Berry Smoothie', 4, 74, 336, 'M', 1),
  ('CAF-023', 'French Fries', 5, 81, 349, 'L', 1),
  ('CAF-024', 'Chicken Sandwich', 5, 88, 362, 'S', 1),
  ('CAF-025', 'Ham Toast', 5, 95, 375, 'M', 1),
  ('CAF-026', 'Fruit Cup', 5, 42, 388, 'L', 1),
  ('CAF-027', 'Pumpkin Latte', 6, 49, 401, 'S', 1),
  ('CAF-028', 'Peppermint Mocha', 6, 56, 414, 'M', 0),
  ('CAF-029', 'Gingerbread Cookie', 6, 63, 427, 'L', 1),
  ('CAF-030', 'Eggnog Latte', 6, 70, 440, 'S', 1);
