import { useState } from 'react';

export function usePagination({ initialPage = 1, initialLimit = 20 } = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const paginationProps = {
    page,
    totalPages,
    onPageChange: setPage,
  };

  return { page, limit, totalPages, setPage, setLimit, setTotalPages, paginationProps };
}
