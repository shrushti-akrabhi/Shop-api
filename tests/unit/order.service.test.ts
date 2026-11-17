import { pool } from '../../src/db/pool';
import { publishEvent } from '../../src/kafka/producer';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from '../../src/services/order.service';

jest.mock('../../src/db/pool', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));
jest.mock('../../src/kafka/producer', () => ({ publishEvent: jest.fn() }));

const query = pool.query as jest.Mock;
const connect = pool.connect as jest.Mock;

// a fake database connection used inside the order transaction
const client = { query: jest.fn(), release: jest.fn() };

const items = [{ product_id: 'p1', quantity: 2 }];

beforeEach(() => {
  jest.resetAllMocks();
  connect.mockResolvedValue(client);
});

describe('createOrder', () => {
  it('creates the order, commits and publishes an event', async () => {
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ order_id: 'o1' }] }) // insert order
      .mockResolvedValueOnce({ rows: [{ product_name: 'Pen', price: 5, stock_quantity: 10 }] }) // find product
      .mockResolvedValueOnce({}) // insert item
      .mockResolvedValueOnce({}) // reduce stock
      .mockResolvedValueOnce({}) // update total
      .mockResolvedValueOnce({}); // COMMIT
    query.mockResolvedValueOnce({ rows: [{ order_id: 'o1', total_amount: 10 }] }); // read the order
    query.mockResolvedValueOnce({ rows: [{ product_name: 'Pen' }] }); // read the items

    const order = await createOrder('u1', '12 MG Road, Pune', items);

    expect(order?.order_id).toBe('o1');
    expect(order?.items).toHaveLength(1);
    expect(client.release).toHaveBeenCalled();
    expect(publishEvent).toHaveBeenCalled();
  });

  it('throws 400 and rolls back when the product does not exist', async () => {
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ order_id: 'o1' }] }) // insert order
      .mockResolvedValueOnce({ rows: [] }); // product not found

    await expect(createOrder('u1', '12 MG Road, Pune', items)).rejects.toMatchObject({ status: 400 });

    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('throws 400 when there is not enough stock', async () => {
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ order_id: 'o1' }] }) // insert order
      .mockResolvedValueOnce({ rows: [{ product_name: 'Pen', price: 5, stock_quantity: 1 }] }); // only 1 left

    await expect(createOrder('u1', '12 MG Road, Pune', items)).rejects.toMatchObject({ status: 400 });
  });
});

describe('order lists', () => {
  it('getMyOrders returns the orders and the total', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
    query.mockResolvedValueOnce({ rows: [{ order_id: 'o1' }] });

    const result = await getMyOrders('u1', 10, 0);

    expect(result).toEqual({ orders: [{ order_id: 'o1' }], total: 1 });
  });
});

describe('getOrderById', () => {
  it('throws 404 when the order belongs to another user, but an admin can see it', async () => {
    query.mockResolvedValue({ rows: [{ order_id: 'o1', user_id: 'someone-else' }] });

    await expect(getOrderById('o1', 'u1', 'customer')).rejects.toMatchObject({ status: 404 });

    const order = await getOrderById('o1', 'admin1', 'admin');
    expect(order.order_id).toBe('o1');
  });
});

describe('updateOrderStatus', () => {
  it('throws 404 when the order does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(updateOrderStatus('o1', 'paid')).rejects.toMatchObject({ status: 404 });
  });

  it('returns the updated order and publishes an event', async () => {
    query.mockResolvedValueOnce({ rows: [{ order_id: 'o1', user_id: 'u1', status: 'paid' }] });

    const order = await updateOrderStatus('o1', 'paid');

    expect(order.status).toBe('paid');
    expect(publishEvent).toHaveBeenCalled();
  });
});
