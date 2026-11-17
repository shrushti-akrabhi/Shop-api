import { z } from 'zod';

export const createOrderSchema = z.object({
  shipping_address: z.string().min(10, 'Address is too short'),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('product_id must be a uuid'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'Add at least one item'),
});


export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
});
