import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/db/pool';
import { authHeader } from '../helpers';
import { resetDb, closeDb, createUser, createProduct } from './db';
import { startKafka, stopKafka, waitForEvent } from './kafka';

// no mocks here: the app talks to the real Postgres and Kafka containers

beforeAll(startKafka);
afterAll(async () => {
  await stopKafka();
  await closeDb();
});
beforeEach(resetDb);

describe('POST /api/auth/register', () => {
  it('answers 201, saves the user in Postgres and sends an event to Kafka', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Asha', email: 'ASHA@mail.com', password: 'password123' });

    expect(res.status).toBe(201);

    const saved = await pool.query('SELECT email, password_hash FROM users');
    expect(saved.rows).toHaveLength(1);
    expect(saved.rows[0].email).toBe('asha@mail.com'); 
    expect(saved.rows[0].password_hash).not.toBe('password123'); 

    const event = await waitForEvent('user.registered', 'userId', res.body.user.user_id);
    expect(event.fullName).toBe('Asha');
  });

  it('answers 400 when the data is not valid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'A', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
  });

  it('answers 409 when the email is already used', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Asha', email: user.email, password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('answers 200 with a token that works on a protected route', async () => {
    const user = await createUser('customer', 'password123');

    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    expect(login.status).toBe(200);

    const orders = await request(app).get('/api/orders').set('Authorization', 'Bearer ' + login.body.token);
    expect(orders.status).toBe(200);
  });
});
