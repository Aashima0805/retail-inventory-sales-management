-- ==============================================================================
-- V2: Seed Data for Inventory & Sales Management System
-- Passwords are all BCrypt-hashed for: "password123"
-- Hash: $2a$10$stq9/DpJ6a1RPT.srhtshOqbUZTJc38Ii7HjSg12IPVjjuzNA0mGK
-- ==============================================================================

-- 1. Seed Roles
INSERT INTO roles (id, name) VALUES
(1, 'ROLE_ADMIN'),
(2, 'ROLE_CASHIER'),
(3, 'ROLE_INVENTORY_STAFF');

-- 2. Seed Users
INSERT INTO users (id, username, password_hash, full_name, role_id, is_active, token_version) VALUES
(1, 'admin', '$2a$10$stq9/DpJ6a1RPT.srhtshOqbUZTJc38Ii7HjSg12IPVjjuzNA0mGK', 'Store Manager', 1, TRUE, 1),
(2, 'cashier1', '$2a$10$stq9/DpJ6a1RPT.srhtshOqbUZTJc38Ii7HjSg12IPVjjuzNA0mGK', 'Alice Cashier', 2, TRUE, 1),
(3, 'inventory1', '$2a$10$stq9/DpJ6a1RPT.srhtshOqbUZTJc38Ii7HjSg12IPVjjuzNA0mGK', 'Bob Stock Keeper', 3, TRUE, 1);

-- Reset sequence for users and roles
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 3. Seed Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Beverages', 'Soft drinks, bottled water, juices, and hot beverages'),
(2, 'Dairy & Eggs', 'Fresh milk, butter, cheese, and farm eggs'),
(3, 'Bakery', 'Freshly baked breads, pastries, and buns'),
(4, 'Pantry Staples', 'Rice, flour, sugar, cooking oil, and pulses'),
(5, 'Snacks & Confectionery', 'Chips, biscuits, chocolate, and sweets');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 4. Seed Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, is_active) VALUES
(1, 'Apex Food Distributors', 'Rajesh Sharma', '+91 98765 43210', 'orders@apexfoods.com', '12 Industrial Area, Phase 1', TRUE),
(2, 'Daily Fresh Dairy Farm', 'Sunita Rao', '+91 98123 45678', 'supply@dailyfreshdairy.in', '45 Green Pastures Road', TRUE),
(3, 'Heritage Bakery Supplies', 'Michael Fernandes', '+91 97654 32109', 'sales@heritagebakery.com', '88 Old Market Lane', TRUE);

SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));

-- 5. Seed Sample Products
INSERT INTO products (id, sku, name, description, category_id, price, current_stock, reorder_level, is_active) VALUES
(1, 'BEV-001', 'Mineral Water 1L', 'Purified natural spring water bottle', 1, 20.00, 50, 15, TRUE),
(2, 'BEV-002', 'Orange Juice 1L', '100% pure squeezed orange juice', 1, 85.00, 25, 10, TRUE),
(3, 'BEV-003', 'Green Tea 25 Bags', 'Organic whole leaf green tea', 1, 140.00, 8, 10, TRUE),
(4, 'DAI-001', 'Pasteurized Whole Milk 1L', 'Farm fresh whole cow milk', 2, 65.00, 40, 15, TRUE),
(5, 'DAI-002', 'Salted Butter 200g', 'Creamery table butter', 2, 110.00, 4, 10, TRUE),
(6, 'DAI-003', 'Farm Fresh Brown Eggs (Pack of 6)', 'Free range brown hen eggs', 2, 55.00, 30, 10, TRUE),
(7, 'BAK-001', 'Whole Wheat Sliced Bread 400g', 'Fresh daily baked whole wheat bread', 3, 45.00, 20, 8, TRUE),
(8, 'BAK-002', 'Multigrain Buns (Pack of 4)', 'Soft multigrain burger buns', 3, 40.00, 15, 5, TRUE),
(9, 'PAN-001', 'Basmati Rice 5kg', 'Aged long grain premium basmati rice', 4, 450.00, 18, 5, TRUE),
(10, 'PAN-002', 'Sunflower Oil 1L', 'Refined healthy cooking sunflower oil', 4, 160.00, 3, 8, TRUE),
(11, 'SNK-001', 'Salted Potato Chips 50g', 'Crispy kettle-cooked salted chips', 5, 20.00, 60, 20, TRUE),
(12, 'SNK-002', 'Dark Chocolate Bar 80g', '70% cocoa rich dark chocolate', 5, 95.00, 2, 5, TRUE);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
