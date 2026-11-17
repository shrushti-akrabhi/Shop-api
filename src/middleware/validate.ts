import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { HttpError } from '../utils/HttpError';


function formatErrors(error: any) {
  return error.issues.map((issue: any) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}


export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(400, 'Validation failed', formatErrors(result.error)));
    }
    req.body = result.data; // cleaned data (lowercase email, default values...)
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new HttpError(400, 'Invalid query', formatErrors(result.error)));
    }
    req.query = result.data as any; // page and limit are numbers now
    next();
  };
}


export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new HttpError(400, 'Invalid id', formatErrors(result.error)));
    }
    next();
  };
}
