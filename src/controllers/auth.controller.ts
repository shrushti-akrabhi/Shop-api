import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { full_name, email, password } = req.body;
    const user = await authService.registerUser(full_name, email, password);
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    next(err); // sends the error to errorHandler
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json({ message: 'Login successful', ...result });
  } catch (err) {
    next(err);
  }
}
