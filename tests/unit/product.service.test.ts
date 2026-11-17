import { pool } from '../../src/db/pool';
import { getProducts, getProductById, createProduct } from '../../src/services/product.service';

jest.mock('../../src/db/pool', () => ({ pool: { query: jest.fn() } }));

const query = pool.query as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('getProducts', () => {
  it('returns the products and the total', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
    query.mockResolvedValueOnce({ rows: [{ product_name: 'Pen' }, { product_name: 'Book' }] });

    const result = await getProducts(10, 0);

    expect(result.total).toBe(2);
    expect(result.products).toHaveLength(2);
  });

  it('adds the search word to the query', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
    query.mockResolvedValueOnce({ rows: [{ product_name: 'Pen' }] });

    await getProducts(10, 0, 'pen');

    expect(query.mock.calls[0][1]).toEqual(['%pen%']);
  });
});

describe('getProductById', () => {
  it('returns the product when it is found', async () => {
    query.mockResolvedValueOnce({ rows: [{ product_name: 'Pen' }] });

    const product = await getProductById('p1');

    expect(product.product_name).toBe('Pen');
  });

  it('throws 404 when the product is not found', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(getProductById('p1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('createProduct', () => {
  it('saves null for the category and description when they are missing', async () => {
    query.mockResolvedValueOnce({ rows: [{ product_id: 'p1' }] });

    await createProduct({ product_name: 'Pen', price: 5, stock_quantity: 3 });

    expect(query.mock.calls[0][1]).toEqual([null, 'Pen', null, 5, 3]);
  });
});
