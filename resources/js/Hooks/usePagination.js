import { useState, useCallback } from 'react';

export default function usePagination(initialPage = 1, pageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handlePageChange = useCallback((newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const handleNextPage = useCallback(() => {
    setPage(prev => {
      if (prev < totalPages) {
        return prev + 1;
      }
      return prev;
    });
  }, [totalPages]);

  const handlePrevPage = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSetData = (data, meta) => {
    setTotalPages(meta?.last_page || 1);
    setHasMore(page < (meta?.last_page || 1));
  };

  const resetPage = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  return {
    page,
    totalPages,
    hasMore,
    pageSize,
    setPage: handlePageChange,
    nextPage: handleNextPage,
    prevPage: handlePrevPage,
    updateMeta: handleSetData,
    resetPage,
  };
}
