import { errorHandler } from '../../src/middleware/errorHandler';

function fakeResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('answers 409 for a duplicate value (Postgres code 23505)', () => {
    const res = fakeResponse();

    errorHandler({ code: '23505' }, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('answers 500 for an unknown error', () => {
    const res = fakeResponse();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('boom'), {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
