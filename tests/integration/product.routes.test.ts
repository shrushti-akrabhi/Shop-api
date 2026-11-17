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

describe('GET /api/products', () => {
  it('answers 200 with the products that match the search', async () => {
    await createProduct('Blue Pen', 5);
    await createProduct('Notebook', 20);

    const res = await request(app).get('/api/products?search=pen');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].product_name).toBe('Blue Pen');
    expect(res.body.total).toBe(1);
  });

  it('answers 400 when the limit is too big', async () => {
    const res = await request(app).get('/api/products?limit=500');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  it('answers 200 when the product exists', async () => {
    const id = await createProduct('Pen');

    const res = await request(app).get('/api/products/' + id);

    expect(res.status).toBe(200);
    expect(res.body.product_name).toBe('Pen');
  });

  it('answers 404 when the product does not exist and 400 when the id is not a uuid', async () => {
    const missing = await request(app).get('/api/products/55555555-5555-4555-8555-555555555555');
    expect(missing.status).toBe(404);

    const badId = await request(app).get('/api/products/abc');
    expect(badId.status).toBe(400);
  });
});

describe('POST /api/products', () => {
  const newProduct = { product_name: 'Pen', price: 5 };

  it('answers 403 for a customer', async () => {
    const customer = await createUser('customer');

    const res = await request(app).post('/api/products').set(authHeader('customer', customer.user_id)).send(newProduct);

    expect(res.status).toBe(403);
  });

  it('answers 201 for an admin and saves the product in Postgres', async () => {
    const admin = await createUser('admin');

    const res = await request(app).post('/api/products').set(authHeader('admin', admin.user_id)).send(newProduct);

    expect(res.status).toBe(201);
    const saved = await pool.query('SELECT product_name, stock_quantity FROM products');
    expect(saved.rows).toEqual([{ product_name: 'Pen', stock_quantity: 0 }]);
  });

  it('answers 400 when the category does not exist (Postgres foreign key)', async () => {
    const admin = await createUser('admin');

    const res = await request(app)
      .post('/api/products')
      .set(authHeader('admin', admin.user_id))
      .send({ ...newProduct, category_id: '66666666-6666-4666-8666-666666666666' });

    expect(res.status).toBe(400);
  });
});
