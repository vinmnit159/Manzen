import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, SlidersHorizontal, X, CheckCircle, AlertTriangle, Clock, Columns, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import type { TestRecord, TestStatus, TestCategory, TestType, ListTestsParams } from '@/services/api/tests';
import { authService } from '@/services/api/auth';
import { TestDetailPanel } from './tests/TestDetailPanel';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TestStatus, { label: string; bg: string; text: string; dot: string }> = {
  OK:                { label: 'OK',                bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Due_soon:          { label: 'Due Soon',          bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Overdue:           { label: 'Overdue',           bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Needs_remediation: { label: 'Needs Remediation', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const CATEGORY_OPTIONS: TestCategory[] = ['Custom', 'Engineering', 'HR', 'IT', 'Policy', 'Risks'];
const STATUS_OPTIONS: TestStatus[] = ['OK', 'Due_soon', 'Overdue', 'Needs_remediation'];
const TYPE_OPTIONS: TestType[] = ['Document', 'Automated'];

const CATEGORY_COLOR: Record<TestCategory, string> = {
  Custom:      'bg-gray-100 text-gray-700',
  Engineering: 'bg-blue-100 text-blue-700',
  HR:          'bg-pink-100 text-pink-700',
  IT:          'bg-cyan-100 text-cyan-700',
  Policy:      'bg-indigo-100 text-indigo-700',
  Risks:       'bg-orange-100 text-orange-700',
};

// ─── Column config ────────────────────────────────────────────────────────────
interface ColumnConfig { id: string; label: string; visible: boolean; sortable: boolean; minWidth?: number; }

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name',     label: 'Test Name', visible: true,  sortable: true,  minWidth: 220 },
  { id: 'category', label: 'Category',  visible: true,  sortable: true,  minWidth: 110 },
  { id: 'type',     label: 'Type',      visible: true,  sortable: true,  minWidth: 100 },
  { id: 'owner',    label: 'Owner',     visible: true,  sortable: false, minWidth: 140 },
  { id: 'status',   label: 'Status',    visible: true,  sortable: true,  minWidth: 140 },
  { id: 'dueDate',  label: 'Due Date',  visible: true,  sortable: true,  minWidth: 110 },
  { id: 'actions',  label: 'Actions',   visible: true,  sortable: false, minWidth: 120 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status: TestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  return (
    <span className={`flex flex-col -space-y-1 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <svg className={`w-3 h-3 ${active && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l6 6H4l6-6z" /></svg>
      <svg className={`w-3 h-3 ${active && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l6-6H4l6 6z" /></svg>
    </span>
  );
}

// ─── Column picker ────────────────────────────────────────────────────────────
function ColumnPicker({ columns, onToggle }: { columns: ColumnConfig[]; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
      >
        <Columns className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Toggle columns</p>
            <div className="space-y-2">
              {columns.filter(c => c.id !== 'actions').map(col => (
                <label key={col.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md">
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => { onToggle(col.id); }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Filter panel ─────────────────────────────────────────────────────────────
interface TestFilter {
  search: string;
  category: string;
  status: string;
  type: string;
  dueFrom: string;
  dueTo: string;
}

function FilterPanel({
  filter,
  onChange,
  onClear,
}: {
  filter: TestFilter;
  onChange: (f: TestFilter) => void;
  onClear: () => void;
}) {
  const set = (key: keyof TestFilter, val: string) => onChange({ ...filter, [key]: val });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4 lg:w-64 flex-shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">Filters</span>
        <button onClick={onClear} className="text-xs text-blue-600 hover:underline">Clear all</button>
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
        <input
          type="text"
          value={filter.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Test name…"
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
        <select
          value={filter.category}
          onChange={e => set('category', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <select
          value={filter.status}
          onChange={e => set('status', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
        <select
          value={filter.type}
          onChange={e => set('type', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Due date range */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Due From</label>
        <input
          type="date"
          value={filter.dueFrom}
          onChange={e => set('dueFrom', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Due To</label>
        <input
          type="date"
          value={filter.dueTo}
          onChange={e => set('dueTo', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

export function TestsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<TestFilter>({
    search: '', category: '', status: '', type: '', dueFrom: '', dueTo: '',
  });
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [statusFilterOverride, setStatusFilterOverride] = useState<string>('');

  // Persist column preferences
  useEffect(() => {
    const saved = localStorage.getItem('tests-columns');
    if (saved) { try { setColumns(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);
  useEffect(() => { localStorage.setItem('tests-columns', JSON.stringify(columns)); }, [columns]);

  // Merge status filter override (from summary panel click)
  const effectiveFilter: TestFilter = statusFilterOverride
    ? { ...filter, status: statusFilterOverride }
    : filter;

  const filterKey: ListTestsParams = {
    search:   effectiveFilter.search   || undefined,
    category: (effectiveFilter.category as TestCategory) || undefined,
    status:   (effectiveFilter.status  as TestStatus)   || undefined,
    type:     (effectiveFilter.type    as TestType)     || undefined,
    dueFrom:  effectiveFilter.dueFrom  || undefined,
    dueTo:    effectiveFilter.dueTo    || undefined,
    page,
    limit: PAGE_SIZE,
  };

  // Current user (for admin check)
  const cachedUser = authService.getCachedUser();
  const isAdmin = cachedUser?.role === 'ORG_ADMIN' || cachedUser?.role === 'SUPER_ADMIN';

  // ── Tests list query ──
  const { data: testsData, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: QK.tests(filterKey),
    queryFn: async () => {
      const res = await testsService.listTests(filterKey);
      if (res.success && res.data) return res.data as TestRecord[];
      throw new Error('Failed to load tests');
    },
    staleTime: STALE.TESTS,
    retry: (count, err: any) => {
      if (err?.statusCode === 401) { localStorage.removeItem('isms_token'); navigate('/login'); return false; }
      return count < 1;
    },
  } as any);

  // ── Summary query ──
  const { data: summary } = useQuery({
    queryKey: QK.testSummary(),
    queryFn: async () => {
      const res = await testsService.getTestSummary();
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: STALE.TESTS,
  });

  // ── Seed mutation (admin only) ──
  const seedMutation = useMutation({
    mutationFn: () => testsService.seedTests(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });

  const tests: TestRecord[] = (testsData ?? []) as TestRecord[];

  // Client-side sort
  const sorted = [...tests].sort((a, b) => {
    const aVal = (a as any)[sortColumn];
    const bVal = (b as any)[sortColumn];
    if (aVal == null || bVal == null) return 0;
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  };

  const hasActiveFilters = !!(filter.search || filter.category || filter.status || filter.type || filter.dueFrom || filter.dueTo || statusFilterOverride);

  const clearFilters = () => {
    setFilter({ search: '', category: '', status: '', type: '', dueFrom: '', dueTo: '' });
    setStatusFilterOverride('');
    setPage(1);
  };

  const renderCell = (test: TestRecord, col: ColumnConfig) => {
    switch (col.id) {
      case 'name':
        return <span className="font-medium text-gray-900 text-sm leading-snug">{test.name}</span>;
      case 'category':
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[test.category]}`}>
            {test.category}
          </span>
        );
      case 'type':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            {test.type}
          </span>
        );
      case 'owner':
        return (
          <span className="text-sm text-gray-600">
            {test.owner?.name ?? test.ownerId}
          </span>
        );
      case 'status':
        return <StatusBadge status={test.status} />;
      case 'dueDate':
        return <span className="text-sm text-gray-500 whitespace-nowrap">{fmtDate(test.dueDate)}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTestId(test.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              View
            </button>
            {test.status !== 'OK' && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await testsService.completeTest(test.id);
                  qc.invalidateQueries({ queryKey: ['tests'] });
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── App Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Tests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compliance and security test management</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Filters active
            </span>
          )}
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={[
              'lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              hasActiveFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{hasActiveFilters ? ' •' : ''}
          </button>
          {isAdmin && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-50"
              title="Seed 14 predefined Policy tests"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{seedMutation.isPending ? 'Seeding…' : 'Seed Tests'}</span>
            </button>
          )}
          <button
            onClick={() => { qc.invalidateQueries({ queryKey: ['tests'] }); refetch(); }}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <ColumnPicker columns={columns} onToggle={(id) => setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c))} />
        </div>
      </div>

      {/* ── Summary panels ── */}
      {summary && !isLoading && (
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Pass % */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pass Rate</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-4xl font-bold text-gray-900">{summary.passPercentage}%</p>
                  <p className="text-sm text-gray-500 mt-1">{summary.completed} of {summary.total} completed</p>
                </div>
                <div className="flex-1 mb-2">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${summary.passPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Needs attention */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Needs Attention</p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setStatusFilterOverride('Overdue'); setPage(1); }}
                  className={[
                    'flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-colors',
                    statusFilterOverride === 'Overdue'
                      ? 'border-red-400 bg-red-50'
                      : 'border-transparent bg-red-50 hover:border-red-300',
                  ].join(' ')}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
                  <span className="text-2xl font-bold text-red-700">{summary.overdue}</span>
                  <span className="text-xs text-red-500 mt-0.5">Overdue</span>
                </button>
                <button
                  onClick={() => { setStatusFilterOverride('Due_soon'); setPage(1); }}
                  className={[
                    'flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-colors',
                    statusFilterOverride === 'Due_soon'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-transparent bg-amber-50 hover:border-amber-300',
                  ].join(' ')}
                >
                  <Clock className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-2xl font-bold text-amber-700">{summary.dueSoon}</span>
                  <span className="text-xs text-amber-500 mt-0.5">Due Soon</span>
                </button>
                <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
                  <span className="text-2xl font-bold text-green-700">{summary.total - summary.overdue - summary.dueSoon}</span>
                  <span className="text-xs text-green-500 mt-0.5">On Track</span>
                </div>
              </div>
              {statusFilterOverride && (
                <button
                  onClick={() => setStatusFilterOverride('')}
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear status filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-3 sm:px-6 py-4 flex-1 min-h-0">

        {/* Mobile overlay */}
        {filterOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setFilterOpen(false)} />
        )}

        {/* Filter sidebar */}
        <div className={[
          'fixed bottom-0 left-0 right-0 z-30 lg:static lg:z-auto',
          'transition-transform duration-300 ease-in-out lg:transition-none lg:translate-y-0',
          filterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
        ].join(' ')}>
          <div className="lg:hidden flex items-center justify-between px-5 pt-4 pb-2 bg-white rounded-t-2xl border-t border-x border-gray-200 shadow-lg">
            <span className="text-sm font-semibold text-gray-900">Filters</span>
            <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <FilterPanel
            filter={filter}
            onChange={(f) => { setFilter(f); setPage(1); }}
            onClear={clearFilters}
          />
        </div>

        {/* Table */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={() => qc.invalidateQueries({ queryKey: ['tests'] })} />
          ) : sorted.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} onSeed={isAdmin ? () => seedMutation.mutate() : undefined} />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {visibleColumns.map(col => (
                          <th
                            key={col.id}
                            style={{ minWidth: col.minWidth }}
                            onClick={() => col.sortable && handleSort(col.id)}
                            className={[
                              'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
                              col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : '',
                            ].join(' ')}
                          >
                            <span className="flex items-center gap-1.5">
                              {col.label}
                              {col.sortable && <SortIcon active={sortColumn === col.id} direction={sortDir} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sorted.map(test => (
                        <tr
                          key={test.id}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedTestId(test.id)}
                        >
                          {visibleColumns.map(col => (
                            <td
                              key={col.id}
                              style={{ minWidth: col.minWidth }}
                              className="px-4 py-3 align-middle"
                              onClick={col.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                            >
                              {renderCell(test, col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-800">{page}</span>
                  {' · '}
                  Showing <span className="font-medium text-gray-800">{sorted.length}</span> test{sorted.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={sorted.length < PAGE_SIZE}
                    className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedTestId && (
        <TestDetailPanel
          testId={selectedTestId}
          onClose={() => setSelectedTestId(null)}
          onMutated={() => qc.invalidateQueries({ queryKey: ['tests'] })}
        />
      )}
    </div>
  );
}

// ─── State components ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading tests…</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">Failed to load tests</p>
      <button onClick={onRetry} className="mt-3 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
        Try again
      </button>
    </div>
  );
}

function EmptyState({ hasFilters, onClear, onSeed }: { hasFilters: boolean; onClear: () => void; onSeed?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">No tests found</p>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters ? 'No tests match your current filters.' : 'No tests have been created yet.'}
      </p>
      <div className="flex gap-2">
        {hasFilters && (
          <button onClick={onClear} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            Clear filters
          </button>
        )}
        {onSeed && !hasFilters && (
          <button
            onClick={onSeed}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Seed 14 Policy Tests
          </button>
        )}
      </div>
    </div>
  );
}
