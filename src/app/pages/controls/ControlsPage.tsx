import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { controlsService } from '@/services/api/controls';
import { Control, ControlFilter, ColumnConfig, DEFAULT_COLUMNS } from './types';
import { ControlsFilter } from './ControlsFilter';
import { ControlsTable } from './ControlsTable';
import { ColumnSelector } from './ColumnSelector';

export function ControlsPage() {
  const navigate = useNavigate();
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ControlFilter>({
    search: '',
    status: '',
    isoReference: '',
  });
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [sortColumn, setSortColumn] = useState<string>('isoReference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load column preferences from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem('controls-columns');
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save column preferences
  useEffect(() => {
    localStorage.setItem('controls-columns', JSON.stringify(columns));
  }, [columns]);

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await controlsService.getControls({
        search: filter.search || undefined,
        status: filter.status || undefined,
        isoReference: filter.isoReference || undefined,
      });

      if (response.success && response.data) {
        let data = [...(response.data || [])];

        // Client-side sort
        if (sortColumn) {
          data.sort((a, b) => {
            const aVal = a[sortColumn as keyof Control];
            const bVal = b[sortColumn as keyof Control];
            if (aVal === undefined || bVal === undefined) return 0;
            const cmp =
              typeof aVal === 'string' && typeof bVal === 'string'
                ? aVal.localeCompare(bVal)
                : typeof aVal === 'number' && typeof bVal === 'number'
                ? aVal - bVal
                : String(aVal).localeCompare(String(bVal));
            return sortDirection === 'desc' ? -cmp : cmp;
          });
        }

        setControls(data);
      } else {
        setError('Failed to load controls from the server.');
      }
    } catch (err: any) {
      // If 401, redirect to login
      if (err?.statusCode === 401) {
        localStorage.removeItem('isms_token');
        navigate('/login');
        return;
      }
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [filter, sortColumn, sortDirection, navigate]);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  const handleFilterChange = (newFilter: ControlFilter) => setFilter(newFilter);

  const handleClearFilters = () =>
    setFilter({ search: '', status: '', isoReference: '' });

  const handleColumnToggle = (columnId: string) =>
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col))
    );

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters = !!(filter.search || filter.status || filter.isoReference);

  // Compliance summary counts
  const implemented = controls.filter((c) => c.status === 'IMPLEMENTED').length;
  const partial = controls.filter((c) => c.status === 'PARTIALLY_IMPLEMENTED').length;
  const notImpl = controls.filter((c) => c.status === 'NOT_IMPLEMENTED').length;
  const compliancePct = controls.length
    ? Math.round((implemented / controls.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Top App Bar (Material-style) ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Controls</h1>
          <p className="text-sm text-gray-500 mt-0.5">ISO 27001 security control management</p>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Filters active
            </span>
          )}
          <ColumnSelector columns={columns} onColumnToggle={handleColumnToggle} />
        </div>
      </div>

      {/* ── Compliance Summary Cards (Material-style) ── */}
      {!loading && !error && controls.length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Controls"
              value={controls.length}
              color="text-gray-900"
              bg="bg-white"
            />
            <SummaryCard
              label="Implemented"
              value={implemented}
              color="text-green-700"
              bg="bg-green-50"
              accent="border-green-200"
            />
            <SummaryCard
              label="Partial"
              value={partial}
              color="text-amber-700"
              bg="bg-amber-50"
              accent="border-amber-200"
            />
            <SummaryCard
              label="Not Implemented"
              value={notImpl}
              color="text-red-700"
              bg="bg-red-50"
              accent="border-red-200"
            />
          </div>

          {/* Compliance progress bar */}
          <div className="mt-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Compliance score</span>
              <span className="text-sm font-semibold text-blue-700">{compliancePct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${compliancePct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content: Filters + Table ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-6 py-4 flex-1 min-h-0">
        {/* Sidebar filter panel */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <ControlsFilter
            filter={filter}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table area */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchControls} />
          ) : controls.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={handleClearFilters} />
          ) : (
            <>
              <ControlsTable
                controls={controls}
                columns={columns}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
              <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-800">{controls.length}</span>{' '}
                  control{controls.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  bg,
  accent = 'border-gray-200',
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} ${bg} px-4 py-3 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading controls...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">Failed to load controls</p>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">No controls found</p>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters ? 'No controls match your current filters.' : 'No controls have been created yet.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
