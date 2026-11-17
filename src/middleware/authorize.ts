import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/HttpError';

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return next(new HttpError(403, 'Admin access only'));
  }
  next();
}
