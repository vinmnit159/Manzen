/**
 * usePaginatedList — reusable hook for server-paginated list pages.
 *
 * Combines URL filter state, TanStack Query, pagination, and sorting
 * into a single composable hook. Reduces ~60 lines of boilerplate
 * per list page to a single hook call.
 *
 * Usage:
 *   const list = usePaginatedList({
 *     queryKey: (params) => QK.tests(params),
 *     queryFn:  (params) => testsService.listTests(params),
 *     filterDefaults: { search: '', category: '', status: '' },
 *     staleTime: STALE.TESTS,
 *   });
 *   // list.rows, list.isLoading, list.filters, list.updateFilter, list.page, etc.
 */

import { useState, useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useUrlFilterState } from './useUrlFilterState';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterValue = string | string[];
type FilterShape = Record<string, FilterValue>;

export interface UsePaginatedListOptions<
  TRow,
  TFilter extends FilterShape,
> {
  /** Build the query key from the current params (filters + pagination) */
  queryKey: (params: TFilter & { page: number; limit: number }) => readonly unknown[];
  /** Fetch function — receives merged filter + pagination params */
  queryFn: (params: TFilter & { page: number; limit: number }) => Promise<TRow[]>;
  /** Default filter values (also defines the shape of URL params) */
  filterDefaults: TFilter;
  /** Keys that should be treated as comma-separated arrays in the URL */
  arrayKeys?: Array<keyof TFilter>;
  /** Stale time for TanStack Query (ms) */
  staleTime?: number;
  /** Page size (default: 25) */
  pageSize?: number;
  /** Default sort column */
  defaultSort?: string;
  /** Default sort direction */
  defaultSortDir?: 'asc' | 'desc';
}

export interface UsePaginatedListResult<TRow, TFilter extends FilterShape> {
  /** Current page rows (may be undefined while loading) */
  rows: TRow[] | undefined;
  /** Full TanStack Query result for advanced use */
  query: UseQueryResult<TRow[], Error>;
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether a background refetch is in progress */
  isFetching: boolean;
  /** Whether the query errored */
  isError: boolean;
  /** Manually refetch */
  refetch: () => void;

  /** Current filter values (synced with URL) */
  filters: TFilter;
  /** Update one or more filter values (resets page to 1) */
  updateFilter: (updates: Partial<TFilter>) => void;
  /** Reset all filters to defaults (resets page to 1) */
  resetFilters: () => void;

  /** Current page number (1-based) */
  page: number;
  /** Set page number */
  setPage: (p: number) => void;
  /** Page size */
  pageSize: number;
  /** Whether there's likely a next page (rows.length === pageSize) */
  hasNextPage: boolean;

  /** Current sort column */
  sortColumn: string;
  /** Current sort direction */
  sortDir: 'asc' | 'desc';
  /** Toggle sort on a column (cycles asc → desc → asc) */
  toggleSort: (column: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePaginatedList<TRow, TFilter extends FilterShape>(
  options: UsePaginatedListOptions<TRow, TFilter>,
): UsePaginatedListResult<TRow, TFilter> {
  const {
    queryKey,
    queryFn,
    filterDefaults,
    arrayKeys,
    staleTime,
    pageSize = 25,
    defaultSort = '',
    defaultSortDir = 'asc',
  } = options;

  // URL-synced filters
  const { filters, update: urlUpdate, reset: urlReset } = useUrlFilterState({
    defaults: filterDefaults,
    arrayKeys,
  });

  // Pagination
  const [page, setPage] = useState(1);

  // Sort
  const [sortColumn, setSortColumn] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);

  // Build merged params for query
  const params = useMemo(
    () => ({ ...filters, page, limit: pageSize }),
    [filters, page, pageSize],
  );

  // Main query
  const query = useQuery<TRow[], Error>({
    queryKey: queryKey(params),
    queryFn: () => queryFn(params),
    staleTime,
  });

  // Derived state
  const rows = query.data;
  const hasNextPage = (rows?.length ?? 0) >= pageSize;

  function updateFilter(updates: Partial<TFilter>) {
    urlUpdate(updates);
    setPage(1); // reset to first page on filter change
  }

  function resetFilters() {
    urlReset();
    setPage(1);
  }

  function toggleSort(column: string) {
    if (sortColumn === column) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDir('asc');
    }
  }

  return {
    rows,
    query,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => { query.refetch(); },
    filters,
    updateFilter,
    resetFilters,
    page,
    setPage,
    pageSize,
    hasNextPage,
    sortColumn,
    sortDir,
    toggleSort,
  };
}
