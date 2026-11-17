import request from 'supertest';
import app from '../../src/app';
import { closeDb } from './db';

afterAll(closeDb);

describe('app', () => {
  it('GET /health answers 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('answers 404 for a route that does not exist', async () => {
    const res = await request(app).get('/nothing-here');

    expect(res.status).toBe(404);
  });

  it('answers 400 when the body is not valid JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ this is not json');

    expect(res.status).toBe(400);
  });

  it('answers 413 when the body is too big', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@mail.com', password: 'x'.repeat(200 * 1024) });

    expect(res.status).toBe(413);
  });
});
