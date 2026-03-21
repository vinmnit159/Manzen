/**
 * Generic DataTable
 *
 * A reusable, accessible table component that covers the repeated
 * table rendering pattern across Manzen pages.
 *
 * Features:
 *   - Typed columns with optional render function
 *   - Loading skeleton
 *   - Empty state slot
 *   - Sticky header
 *   - Row click handler
 *   - ARIA roles for accessibility
 *   - Sortable column headers (opt-in via `sortable` on column + `sort` props)
 *   - Pagination controls (opt-in via `pagination` prop)
 *   - Column visibility (opt-in via `hidden` on column)
 *
 * Usage (basic — unchanged from before):
 *   <DataTable columns={cols} rows={data} loading={loading} />
 *
 * Usage (with sort + pagination):
 *   <DataTable
 *     columns={[{ key: 'name', header: 'Name', sortable: true }, ...]}
 *     rows={data}
 *     sort={{ column: 'name', direction: 'asc' }}
 *     onSort={(col, dir) => toggleSort(col)}
 *     pagination={{ page: 1, pageSize: 25, hasNext: true }}
 *     onPageChange={setPage}
 *   />
 */

import React from 'react';

// ─── Sort icon (inline, no external dep) ─────────────────────────────────────

function SortIndicator({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  return (
    <span className={`inline-flex flex-col -space-y-1 ml-1 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <svg className={`w-3 h-3 ${active && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l6 6H4l6-6z" /></svg>
      <svg className={`w-3 h-3 ${active && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l6-6H4l6 6z" /></svg>
    </span>
  );
}

// ─── Column type ─────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  /** Key used to access `row[key]` as a fallback value */
  key: keyof T;
  /** Column header label */
  header: string;
  /** Optional custom cell renderer */
  render?: (row: T, index: number) => React.ReactNode;
  /** Optional header CSS classes */
  headerClass?: string;
  /** Optional cell CSS classes */
  cellClass?: string;
  /** Enable sorting on this column (default: false) */
  sortable?: boolean;
  /** Hide this column (default: false) */
  hidden?: boolean;
  /** Optional column width (CSS value, e.g. '200px', '20%') */
  width?: string;
}

// ─── Pagination type ─────────────────────────────────────────────────────────

export interface DataTablePagination {
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data */
  rows: T[];
  /** Whether data is loading (shows skeleton rows) */
  loading?: boolean;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** Message or node shown when rows is empty and not loading */
  emptyMessage?: React.ReactNode;
  /** Called when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Function to get a unique key for each row */
  getRowKey?: (row: T, index: number) => string | number;
  /** Additional CSS class on the table wrapper */
  className?: string;
  /** Accessible label for the table */
  'aria-label'?: string;

  /* ── Sort (opt-in) ── */
  /** Current sort state */
  sort?: { column: string; direction: 'asc' | 'desc' };
  /** Called when a sortable header is clicked */
  onSort?: (column: string, direction: 'asc' | 'desc') => void;

  /* ── Pagination (opt-in) ── */
  /** Pagination state */
  pagination?: DataTablePagination;
  /** Called when page changes */
  onPageChange?: (page: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  rows,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'No data available.',
  onRowClick,
  getRowKey = (_row, index) => index,
  className = '',
  'aria-label': ariaLabel,
  sort,
  onSort,
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  // Filter out hidden columns
  const visibleColumns = columns.filter(c => !c.hidden);

  function handleHeaderClick(col: DataTableColumn<T>) {
    if (!col.sortable || !onSort) return;
    const key = String(col.key);
    const nextDir = sort?.column === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSort(key, nextDir);
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table
        className="min-w-full divide-y divide-gray-200"
        role="table"
        aria-label={ariaLabel}
        aria-busy={loading}
      >
        {/* Header */}
        <thead className="bg-gray-50 border-b border-gray-200" role="rowgroup">
          <tr role="row">
            {visibleColumns.map((col) => {
              const isSortActive = sort?.column === String(col.key);
              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  role="columnheader"
                  aria-sort={isSortActive ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.headerClass ?? ''}`}
                  onClick={col.sortable ? () => handleHeaderClick(col) : undefined}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.header}
                    {col.sortable && (
                      <SortIndicator active={isSortActive} direction={isSortActive ? sort!.direction : undefined} />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} role="row" aria-hidden="true">
                {visibleColumns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4" role="cell">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr role="row">
              <td
                colSpan={visibleColumns.length}
                className="px-6 py-10 text-center text-sm text-gray-400"
                role="cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                role="row"
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row, rowIndex);
                        }
                      }
                    : undefined
                }
              >
                {visibleColumns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-6 py-4 text-sm text-gray-900 ${col.cellClass ?? ''}`}
                    role="cell"
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            Page {pagination.page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
