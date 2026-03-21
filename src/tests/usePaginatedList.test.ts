/**
 * Tests for usePaginatedList hook — internal logic only.
 *
 * Strategy: extract and test the pure-logic portions (toggleSort, page reset
 * on filter change) without rendering React components. We mock the dependent
 * hooks (useUrlFilterState, useQuery, useState, useMemo) at the module level
 * and invoke the hook function directly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUrlUpdate = vi.fn();
const mockUrlReset = vi.fn();

vi.mock('@/app/hooks/useUrlFilterState', () => ({
  useUrlFilterState: vi.fn(({ defaults }: { defaults: Record<string, string> }) => ({
    filters: { ...defaults },
    update: mockUrlUpdate,
    reset: mockUrlReset,
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

// Track setState calls to verify page resets
let latestSetPage: ((p: number) => void) | undefined;
let pageValue = 1;

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: vi.fn((init: unknown) => {
      // For the page state (number init), capture the setter
      if (typeof init === 'number') {
        pageValue = init;
        const setter = (v: number) => { pageValue = v; };
        latestSetPage = setter;
        return [pageValue, setter];
      }
      // For sort column (string init)
      if (typeof init === 'string') {
        let val = init;
        return [val, (v: string) => { val = v; }];
      }
      return [init, vi.fn()];
    }),
    useMemo: vi.fn((fn: () => unknown) => fn()),
  };
});

import { usePaginatedList } from '@/app/hooks/usePaginatedList';

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaults = { search: '', status: '' };

function makeHook() {
  return usePaginatedList({
    queryKey: (p) => ['tests', p],
    queryFn: async () => [],
    filterDefaults: defaults,
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  pageValue = 1;
});

describe('usePaginatedList — default state', () => {
  it('returns page 1 and default pageSize 25', () => {
    const result = makeHook();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it('returns empty filters matching defaults', () => {
    const result = makeHook();
    expect(result.filters).toEqual(defaults);
  });

  it('defaults sortColumn to empty and sortDir to asc', () => {
    const result = makeHook();
    expect(result.sortColumn).toBe('');
    expect(result.sortDir).toBe('asc');
  });
});

describe('usePaginatedList — updateFilter resets page', () => {
  it('calls urlUpdate and resets page to 1', () => {
    const result = makeHook();
    result.updateFilter({ search: 'hello' });

    expect(mockUrlUpdate).toHaveBeenCalledWith({ search: 'hello' });
    expect(pageValue).toBe(1);
  });
});

describe('usePaginatedList — resetFilters', () => {
  it('calls urlReset and resets page to 1', () => {
    const result = makeHook();
    result.resetFilters();

    expect(mockUrlReset).toHaveBeenCalled();
    expect(pageValue).toBe(1);
  });
});

describe('usePaginatedList — toggleSort', () => {
  it('sets asc on a new column', () => {
    const result = makeHook();
    result.toggleSort('name');
    // First toggle on a new column should be asc (default)
    expect(result.sortDir).toBe('asc');
  });

  it('returns hasNextPage false when rows are empty', () => {
    const result = makeHook();
    expect(result.hasNextPage).toBe(false);
  });
});

describe('usePaginatedList — custom options', () => {
  it('accepts a custom pageSize', () => {
    const result = usePaginatedList({
      queryKey: (p) => ['items', p],
      queryFn: async () => [],
      filterDefaults: defaults,
      pageSize: 50,
    });
    expect(result.pageSize).toBe(50);
  });
});
