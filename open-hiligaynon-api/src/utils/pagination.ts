export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (
  pageValue: unknown,
  limitValue: unknown,
  defaultLimit = 25,
  maxLimit = 100
): PaginationParams | null => {
  const page =
    typeof pageValue === "string" && pageValue.trim()
      ? Number.parseInt(pageValue, 10)
      : 1;
  const limit =
    typeof limitValue === "string" && limitValue.trim()
      ? Number.parseInt(limitValue, 10)
      : defaultLimit;

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > maxLimit
  ) {
    return null;
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
};
