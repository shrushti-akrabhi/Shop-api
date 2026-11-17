import { getPagination, paginationInfo } from '../../src/utils/pagination';

describe('pagination', () => {
  it('uses page 1 and limit 10 when nothing is given', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  it('works out the offset and the total pages', () => {
    expect(getPagination({ page: '3', limit: '5' })).toEqual({ page: 3, limit: 5, offset: 10 });
    expect(paginationInfo(3, 5, 22)).toEqual({ page: 3, limit: 5, total: 22, totalPages: 5 });
  });
});
