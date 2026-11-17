import { z } from 'zod';
import { paginationSchema } from './common.schema';


export const productListQuerySchema = paginationSchema.extend({
  search: z.string().min(1).optional(),
});


export const createProductSchema = z.object({
  category_id: z.string().uuid().optional(),
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  stock_quantity: z.number().int().min(0).default(0),
});
