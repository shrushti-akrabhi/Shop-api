import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/HttpError';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body is not valid JSON' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ message: 'Already exists (duplicate value)' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Related record does not exist' });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
}
