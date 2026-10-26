import { useState } from 'react';
export function usePagination(initialPage = 1, initialSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  return { page, size, setPage, setSize, next: () => setPage((p) => p + 1), prev: () => setPage((p) => Math.max(1, p - 1)) };
}
