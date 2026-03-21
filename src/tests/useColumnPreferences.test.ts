/**
 * Tests for useColumnPreferences hook.
 *
 * Strategy: mock React's useState and useEffect to test the hook's
 * localStorage integration logic without rendering a component.
 * The setup.ts file already provides an in-memory localStorage polyfill.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Track useEffect callbacks ────────────────────────────────────────────────

const effectCallbacks: Array<() => void> = [];

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: vi.fn((init: unknown) => {
      const value = typeof init === 'function' ? (init as () => unknown)() : init;
      return [value, vi.fn()];
    }),
    useEffect: vi.fn((cb: () => void) => {
      effectCallbacks.push(cb);
    }),
  };
});

import {
  useColumnPreferences,
  type ColumnDef,
} from '@/app/hooks/useColumnPreferences';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'test-columns';

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'created', label: 'Created', visible: false },
];

const SAVED_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name', visible: false },
  { key: 'status', label: 'Status', visible: true },
  { key: 'created', label: 'Created', visible: true },
];

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  effectCallbacks.length = 0;
  localStorage.clear();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useColumnPreferences — defaults', () => {
  it('returns default columns when localStorage is empty', () => {
    const { columns } = useColumnPreferences(STORAGE_KEY, DEFAULT_COLUMNS);
    expect(columns).toEqual(DEFAULT_COLUMNS);
  });

  it('returns a setColumns function', () => {
    const { setColumns } = useColumnPreferences(STORAGE_KEY, DEFAULT_COLUMNS);
    expect(typeof setColumns).toBe('function');
  });
});

describe('useColumnPreferences — loads from localStorage', () => {
  it('returns saved columns when localStorage has a value', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAVED_COLUMNS));

    const { columns } = useColumnPreferences(STORAGE_KEY, DEFAULT_COLUMNS);
    expect(columns).toEqual(SAVED_COLUMNS);
  });

  it('falls back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'NOT_VALID_JSON');

    const { columns } = useColumnPreferences(STORAGE_KEY, DEFAULT_COLUMNS);
    expect(columns).toEqual(DEFAULT_COLUMNS);
  });
});

describe('useColumnPreferences — persists to localStorage', () => {
  it('useEffect callback writes columns to localStorage', () => {
    useColumnPreferences(STORAGE_KEY, DEFAULT_COLUMNS);

    // Run the captured useEffect callback
    expect(effectCallbacks.length).toBeGreaterThan(0);
    effectCallbacks[0]!();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toEqual(DEFAULT_COLUMNS);
  });

  it('persists under the correct storage key', () => {
    const customKey = 'custom-table-cols';
    useColumnPreferences(customKey, DEFAULT_COLUMNS);

    effectCallbacks[0]!();

    expect(localStorage.getItem(customKey)).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
