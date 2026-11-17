import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').toLowerCase(), // db stores emails in lowercase
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});
