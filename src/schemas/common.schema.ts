import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('id must be a valid uuid'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
