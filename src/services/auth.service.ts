import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { HttpError } from '../utils/HttpError';
import { publishEvent } from '../kafka/producer';
import { TOPICS } from '../kafka/topics';

export async function registerUser(full_name: string, email: string, password: string) {
  const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new HttpError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, full_name, email, role, created_at`,
    [full_name, email, passwordHash]
  );

  const user = result.rows[0];
  void publishEvent(TOPICS.USER_REGISTERED, user.user_id, {
    userId: user.user_id,
    fullName: user.full_name,
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const result = await pool.query(
    'SELECT user_id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];

  if (!user || !user.is_active) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = jwt.sign({ userId: user.user_id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);

  return {
    token,
    user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role },
  };
}
