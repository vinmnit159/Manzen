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
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'name', header: 'Name' },
 *       { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
 *     ]}
 *     rows={assets}
 *     loading={loading}
 *     emptyMessage="No assets found."
 *     onRowClick={(row) => setSelected(row)}
 *     getRowKey={(row) => row.id}
 *   />
 */

import React from 'react';

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
}

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
}

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
}: DataTableProps<T>) {
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
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                role="columnheader"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.headerClass ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
          {loading ? (
            // Skeleton rows
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} role="row" aria-hidden="true">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4" role="cell">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            // Empty state
            <tr role="row">
              <td
                colSpan={columns.length}
                className="px-6 py-10 text-center text-sm text-gray-400"
                role="cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            // Data rows
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
                {columns.map((col) => (
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
    </div>
  );
}
