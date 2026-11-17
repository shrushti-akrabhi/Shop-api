import { pool } from '../db/pool';
import { HttpError } from '../utils/HttpError';

export async function getProducts(limit: number, offset: number, search?: string) {
  let where = 'WHERE p.is_active = true';
  const params: any[] = [];
  if (search) {
    params.push('%' + search + '%');
    where += ' AND p.product_name ILIKE $1'; // ILIKE = ignore upper/lower case
  }

 
  const countResult = await pool.query('SELECT COUNT(*) FROM products p ' + where, params);
  const total = Number(countResult.rows[0].count);

  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.description, p.price, p.stock_quantity, c.name AS category
     FROM products p LEFT JOIN categories c ON c.category_id = p.category_id
     ${where}
     ORDER BY p.product_name
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { products: result.rows, total };
}

export async function getProductById(productId: string) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, p.description, p.price, p.stock_quantity, c.name AS category
     FROM products p LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE p.product_id = $1 AND p.is_active = true`,
    [productId]
  );

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Product not found');
  }
  return result.rows[0];
}

export async function createProduct(data: any) {
  const { category_id, product_name, description, price, stock_quantity } = data;

  const result = await pool.query(
    `INSERT INTO products (category_id, product_name, description, price, stock_quantity)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [category_id || null, product_name, description || null, price, stock_quantity]
  );
  return result.rows[0];
}