import type { PageResponse } from '@/types/common';

export interface PageShape<T> {
  content: T[];
  page?: number;
  number?: number;
  size?: number;
  total?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

export function normalizePage<T>(page: PageShape<T>): PageResponse<T> {
  const currentPage = page.page ?? page.number ?? 0;
  const size = page.size ?? page.content.length;
  const total = page.total ?? page.totalElements ?? page.content.length;
  const totalPages = page.totalPages ?? (size > 0 ? Math.ceil(total / size) : 0);

  return {
    content: page.content,
    page: currentPage,
    size,
    total,
    totalPages,
    last: page.last ?? currentPage + 1 >= totalPages,
  };
}
