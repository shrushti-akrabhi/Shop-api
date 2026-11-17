import bcrypt from 'bcrypt';
import { pool } from '../../src/db/pool';

export async function resetDb() {
  await pool.query('TRUNCATE users, categories, products, orders, order_items CASCADE');
}

export async function closeDb() {
  await pool.end();
}

let counter = 0;

export async function createUser(role: 'customer' | 'admin' = 'customer', password = 'password123') {
  counter++;
  const hash = await bcrypt.hash(password, 4);
  const result = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email',
    ['Test User', `user${counter}@mail.com`, hash, role]
  );
  return result.rows[0] as { user_id: string; email: string };
}

export async function createProduct(name = 'Pen', price = 5, stock = 10) {
  const result = await pool.query(
    'INSERT INTO products (product_name, price, stock_quantity) VALUES ($1, $2, $3) RETURNING product_id',
    [name, price, stock]
  );
  return result.rows[0].product_id as string;
}
