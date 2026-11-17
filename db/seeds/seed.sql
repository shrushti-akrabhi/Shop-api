CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User',    'admin@example.com',    crypt('Admin@12345',    gen_salt('bf', 12)), 'admin'),
  ('Test Customer', 'customer@example.com', crypt('Customer@12345', gen_salt('bf', 12)), 'customer')
ON CONFLICT (email) DO NOTHING;
 
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Gadgets and accessories'),
  ('Books',       'Printed and digital books'),
  ('Home',        'Home and kitchen essentials')
ON CONFLICT (name) DO NOTHING;
 
INSERT INTO products (category_id, product_name, description, price, stock_quantity)
SELECT c.category_id, v.product_name, v.description, v.price, v.stock_quantity
FROM (VALUES
  ('Electronics', 'Wireless Mouse',      '2.4GHz ergonomic mouse',         799.00, 120),
  ('Electronics', 'USB-C Cable (1m)',    'Fast-charging braided cable',     349.00, 300),
  ('Electronics', 'Mechanical Keyboard', 'Tenkeyless, hot-swappable',      3499.00,  45),
  ('Books',       'Clean Code',          'A handbook of agile craftsmanship', 899.00, 60),
  ('Books',       'Designing Data-Intensive Applications', 'Kleppmann', 1299.00, 35),
  ('Home',        'Steel Water Bottle',  '750ml insulated bottle',          599.00,  80)
) AS v(cat, product_name, description, price, stock_quantity)
JOIN categories c ON c.name = v.cat;