import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../utils/HttpError';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Token missing'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
