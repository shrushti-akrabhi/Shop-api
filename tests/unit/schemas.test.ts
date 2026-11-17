import { registerSchema } from '../../src/schemas/auth.schema';
import { createProductSchema } from '../../src/schemas/product.schema';
import { paginationSchema, idParamSchema } from '../../src/schemas/common.schema';

describe('schemas', () => {
  it('register: makes the email lowercase and rejects a short password', () => {
    const good = registerSchema.parse({ full_name: 'Asha', email: 'ASHA@Mail.com', password: 'password123' });
    expect(good.email).toBe('asha@mail.com');

    const bad = registerSchema.safeParse({ full_name: 'Asha', email: 'asha@mail.com', password: '123' });
    expect(bad.success).toBe(false);
  });

  it('product: stock quantity is 0 when not given, and price cannot be negative', () => {
    const good = createProductSchema.parse({ product_name: 'Pen', price: 5 });
    expect(good.stock_quantity).toBe(0);

    const bad = createProductSchema.safeParse({ product_name: 'Pen', price: -1 });
    expect(bad.success).toBe(false);
  });

  it('common: pagination has defaults and the id must be a uuid', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 10 });
    expect(idParamSchema.safeParse({ id: 'abc' }).success).toBe(false);
  });
});
