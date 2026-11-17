import jwt from 'jsonwebtoken';

export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
export const OTHER_ID = '33333333-3333-4333-8333-333333333333';
export const ORDER_ID = '44444444-4444-4444-8444-444444444444';
export const PRODUCT_ID = '55555555-5555-4555-8555-555555555555';

// makes a real, signed token, the same way the login service does
export function tokenFor(role: 'customer' | 'admin', userId = role === 'admin' ? ADMIN_ID : USER_ID) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

export function authHeader(role: 'customer' | 'admin', userId?: string) {
  return { Authorization: `Bearer ${tokenFor(role, userId)}` };
}
