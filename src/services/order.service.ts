import { pool } from '../db/pool';
import { HttpError } from '../utils/HttpError';
import { publishEvent } from '../kafka/producer';
import { TOPICS } from '../kafka/topics';

async function getOrderWithItems(orderId: string) {
  const order = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
  if (order.rows.length === 0) return null;

  const items = await pool.query(
    `SELECT oi.product_id, p.product_name, oi.quantity, oi.unit_price, oi.subtotal
     FROM order_items oi
     JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return { ...order.rows[0], items: items.rows };
}

export async function createOrder(userId: string, shippingAddress: string, items: any[]) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, shipping_address) VALUES ($1, $2) RETURNING order_id',
      [userId, shippingAddress]
    );
    const orderId = orderResult.rows[0].order_id;

    for (const item of items) {
      const productResult = await client.query(
        'SELECT product_name, price, stock_quantity FROM products WHERE product_id = $1 AND is_active = true FOR UPDATE',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new HttpError(400, 'Product not found: ' + item.product_id);
      }

      const product = productResult.rows[0];

      if (product.stock_quantity < item.quantity) {
        throw new HttpError(400, 'Not enough stock for ' + product.product_name);
      }

  
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, product.price]
      );

    
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query(
      `UPDATE orders
       SET total_amount = (SELECT SUM(subtotal) FROM order_items WHERE order_id = $1)
       WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    const order = await getOrderWithItems(orderId);

    void publishEvent(TOPICS.ORDER_CREATED, orderId, {
      orderId,
      userId,
      totalAmount: order?.total_amount,
      itemCount: order?.items.length,
    });

    return order;
  } catch (err) {
    await client.query('ROLLBACK'); 
    throw err; 
  } finally {
    client.release(); 
  }
}

export async function getMyOrders(userId: string, limit: number, offset: number) {
  const countResult = await pool.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
  const total = Number(countResult.rows[0].count);

  const result = await pool.query(
    `SELECT order_id, status, total_amount, shipping_address, created_at
     FROM orders WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { orders: result.rows, total };
}

export async function getAllOrders(limit: number, offset: number) {
  const countResult = await pool.query('SELECT COUNT(*) FROM orders');
  const total = Number(countResult.rows[0].count);

  const result = await pool.query(
    `SELECT o.order_id, o.status, o.total_amount, o.created_at, u.full_name, u.email
     FROM orders o JOIN users u ON u.user_id = o.user_id
     ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { orders: result.rows, total };
}

export async function getOrderById(orderId: string, userId: string, role: string) {
  const order = await getOrderWithItems(orderId);

  if (!order || (role !== 'admin' && order.user_id !== userId)) {
    throw new HttpError(404, 'Order not found');
  }
  return order;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const result = await pool.query(
    'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING order_id, user_id, status, updated_at',
    [status, orderId]
  );

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Order not found');
  }
  const row = result.rows[0];

  void publishEvent(TOPICS.ORDER_STATUS_UPDATED, orderId, {
    orderId,
    userId: row.user_id,
    status: row.status,
  });

  return row;
}
