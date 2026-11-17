import request from 'supertest';
import app from '../../src/app';
import { closeDb } from './db';

afterAll(closeDb);

describe('rate limit', () => {
  it('allows 10 login attempts, then answers 429', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/auth/login').send({}); // 400 means it reached the route
      expect(res.status).toBe(400);
    }

    const blocked = await request(app).post('/api/auth/login').send({});

    expect(blocked.status).toBe(429);
  });
});
