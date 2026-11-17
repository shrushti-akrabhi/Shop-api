export function getPagination(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const offset = (page - 1) * limit; // how many rows to skip
  return { page, limit, offset };
}

export function paginationInfo(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
