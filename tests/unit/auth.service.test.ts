import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../src/db/pool';
import { publishEvent } from '../../src/kafka/producer';
import { registerUser, loginUser } from '../../src/services/auth.service';

jest.mock('../../src/db/pool', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../src/kafka/producer', () => ({ publishEvent: jest.fn() }));

const query = pool.query as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('registerUser', () => {
  it('throws 409 when the email is already registered', async () => {
    query.mockResolvedValueOnce({ rows: [{ user_id: '1' }] });

    await expect(registerUser('Asha', 'asha@mail.com', 'password123')).rejects.toMatchObject({ status: 409 });
  });

  it('saves a hashed password and publishes an event', async () => {
    query.mockResolvedValueOnce({ rows: [] }); // email not used yet
    query.mockResolvedValueOnce({ rows: [{ user_id: 'u1', full_name: 'Asha', email: 'asha@mail.com' }] });

    const user = await registerUser('Asha', 'asha@mail.com', 'password123');

    expect(user.user_id).toBe('u1');
    const savedHash = query.mock.calls[1][1][2];
    expect(savedHash).not.toBe('password123'); // never save the plain password
    expect(publishEvent).toHaveBeenCalled();
  });
});

describe('loginUser', () => {
  it('throws 401 when the user does not exist or is not active', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await expect(loginUser('no@mail.com', 'password123')).rejects.toMatchObject({ status: 401 });

    query.mockResolvedValueOnce({ rows: [{ is_active: false }] });
    await expect(loginUser('off@mail.com', 'password123')).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 when the password is wrong', async () => {
    const hash = await bcrypt.hash('right-password', 4);
    query.mockResolvedValueOnce({ rows: [{ password_hash: hash, is_active: true }] });

    await expect(loginUser('asha@mail.com', 'wrong-password')).rejects.toMatchObject({ status: 401 });
  });

  it('returns a token and the user when the password is right', async () => {
    const hash = await bcrypt.hash('right-password', 4);
    query.mockResolvedValueOnce({
      rows: [{ user_id: 'u1', full_name: 'Asha', email: 'asha@mail.com', password_hash: hash, role: 'customer', is_active: true }],
    });

    const result = await loginUser('asha@mail.com', 'right-password');

    const decoded = jwt.verify(result.token, process.env.JWT_SECRET as string) as any;
    expect(decoded.userId).toBe('u1');
    expect(result.user).not.toHaveProperty('password_hash');
  });
});
