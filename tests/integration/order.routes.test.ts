import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/db/pool';
import { authHeader } from '../helpers';
import { resetDb, closeDb, createUser, createProduct } from './db';
import { startKafka, stopKafka, waitForEvent } from './kafka';


beforeAll(startKafka);
afterAll(async () => {
  await stopKafka();
  await closeDb();
});
beforeEach(resetDb);

const address = '12 MG Road, Pune';

describe('order routes', () => {
  it('answers 401 without a token', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.status).toBe(401);
  });

  it('POST /api/orders answers 201, reduces the stock and sends an event to Kafka', async () => {
    const user = await createUser();
    const productId = await createProduct('Pen', 5, 10);

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader('customer', user.user_id))
      .send({ shipping_address: address, items: [{ product_id: productId, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(Number(res.body.total_amount)).toBe(10);
    expect(res.body.items).toHaveLength(1);

    const product = await pool.query('SELECT stock_quantity FROM products');
    expect(product.rows[0].stock_quantity).toBe(8); // 10 - 2

    const event = await waitForEvent('order.created', 'orderId', res.body.order_id);
    expect(event.userId).toBe(user.user_id);
  });

  it('POST /api/orders answers 400 when there is not enough stock and saves nothing', async () => {
    const user = await createUser();
    const productId = await createProduct('Pen', 5, 1);

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader('customer', user.user_id))
      .send({ shipping_address: address, items: [{ product_id: productId, quantity: 5 }] });

    expect(res.status).toBe(400);
    const orders = await pool.query('SELECT * FROM orders');
    expect(orders.rows).toHaveLength(0); // the transaction was rolled back
  });

  it('GET /api/orders shows only my own orders', async () => {
    const me = await createUser();
    const other = await createUser();
    await pool.query('INSERT INTO orders (user_id, shipping_address) VALUES ($1, $2), ($3, $2)', [me.user_id, address, other.user_id]);

    const res = await request(app).get('/api/orders').set(authHeader('customer', me.user_id));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /api/orders/admin/all answers 403 for a customer and 200 for an admin', async () => {
    const customer = await createUser('customer');
    const admin = await createUser('admin');
    await pool.query('INSERT INTO orders (user_id, shipping_address) VALUES ($1, $2)', [customer.user_id, address]);

    const forbidden = await request(app).get('/api/orders/admin/all').set(authHeader('customer', customer.user_id));
    expect(forbidden.status).toBe(403);

    const allowed = await request(app).get('/api/orders/admin/all').set(authHeader('admin', admin.user_id));
    expect(allowed.status).toBe(200);
    expect(allowed.body.total).toBe(1);
  });

  it('GET /api/orders/:id answers 200 for my order and 404 for the order of someone else', async () => {
    const me = await createUser();
    const other = await createUser();
    const order = await pool.query('INSERT INTO orders (user_id, shipping_address) VALUES ($1, $2) RETURNING order_id', [me.user_id, address]);
    const id = order.rows[0].order_id;

    const mine = await request(app).get('/api/orders/' + id).set(authHeader('customer', me.user_id));
    expect(mine.status).toBe(200);

    const notMine = await request(app).get('/api/orders/' + id).set(authHeader('customer', other.user_id));
    expect(notMine.status).toBe(404);
  });

  it('PATCH /api/orders/:id/status answers 200 for an admin and 400 for a wrong status', async () => {
    const customer = await createUser('customer');
    const admin = await createUser('admin');
    const order = await pool.query('INSERT INTO orders (user_id, shipping_address) VALUES ($1, $2) RETURNING order_id', [customer.user_id, address]);
    const id = order.rows[0].order_id;

    const good = await request(app)
      .patch('/api/orders/' + id + '/status')
      .set(authHeader('admin', admin.user_id))
      .send({ status: 'shipped' });
    expect(good.status).toBe(200);

    const saved = await pool.query('SELECT status FROM orders');
    expect(saved.rows[0].status).toBe('shipped');
    await waitForEvent('order.status_updated', 'orderId', id);

    const bad = await request(app)
      .patch('/api/orders/' + id + '/status')
      .set(authHeader('admin', admin.user_id))
      .send({ status: 'flying' });
    expect(bad.status).toBe(400);
  });
});
