import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { policiesService } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Edit3,
  AlertCircle,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface PolicyFilter {
  search: string;
  status: string;
}

type SortKey = 'name' | 'version' | 'status' | 'createdAt';

// DB stores statuses in uppercase: DRAFT, PUBLISHED, REVIEW, ARCHIVED
const POLICY_STATUSES = ['PUBLISHED', 'DRAFT', 'REVIEW', 'ARCHIVED'] as const;

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  PUBLISHED: {
    label: 'Published',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    icon: CheckCircle2,
  },
  DRAFT: {
    label: 'Draft',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    icon: Edit3,
  },
  REVIEW: {
    label: 'In Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-400',
    icon: AlertCircle,
  },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    icon: FileText,
  };
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function PoliciesPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PolicyFilter>({ search: '', status: '' });
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await policiesService.getPolicies({
        search: filter.search || undefined,
        status: filter.status || undefined,
      });
      if (response.success && response.data) {
        let data = [...response.data];
        data.sort((a, b) => {
          const aVal = String(a[sortKey as keyof Policy] ?? '');
          const bVal = String(b[sortKey as keyof Policy] ?? '');
          const cmp = aVal.localeCompare(bVal);
          return sortDir === 'desc' ? -cmp : cmp;
        });
        setPolicies(data);
      } else {
        setError('Failed to load policies from the server.');
      }
    } catch (err: any) {
      if (err?.statusCode === 401) {
        localStorage.removeItem('isms_token');
        navigate('/login');
        return;
      }
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [filter, sortKey, sortDir, navigate]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleFilterChange = (field: keyof PolicyFilter, value: string) =>
    setFilter(prev => ({ ...prev, [field]: value }));

  const clearFilters = () => setFilter({ search: '', status: '' });

  const hasActiveFilters = !!(filter.search || filter.status);

  // Summary counts — DB stores uppercase values
  const published  = policies.filter(p => p.status === 'PUBLISHED').length;
  const draft      = policies.filter(p => p.status === 'DRAFT').length;
  const inReview   = policies.filter(p => p.status === 'REVIEW').length;
  const archived   = policies.filter(p => p.status === 'ARCHIVED').length;

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Top App Bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Policies</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Security policy management and lifecycle tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Filters active
            </span>
          )}
          {/* Mobile filter toggle */}
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={[
              'lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              hasActiveFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{hasActiveFilters ? ' •' : ''}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {!loading && !error && policies.length > 0 && (
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total Policies"  value={policies.length} color="text-gray-900"  bg="bg-white"          accent="border-gray-200"  />
            <SummaryCard label="Published"        value={published}       color="text-green-700" bg="bg-green-50"        accent="border-green-200" />
            <SummaryCard label="In Review"        value={inReview}        color="text-amber-700" bg="bg-amber-50"        accent="border-amber-200" />
            <SummaryCard label="Draft / Archived" value={draft + archived} color="text-gray-600"  bg="bg-gray-50"         accent="border-gray-200"  />
          </div>

          {/* Publication rate bar */}
          {policies.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Publication rate</span>
                <span className="text-sm font-semibold text-blue-700">
                  {Math.round((published / policies.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.round((published / policies.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main Content: Filter Panel + Table ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-3 sm:px-6 py-4 flex-1 min-h-0">

        {/* Mobile filter overlay */}
        {filterOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setFilterOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Filter Panel — bottom drawer on mobile, sidebar on desktop */}
        <div
          className={[
            'fixed bottom-0 left-0 right-0 z-30 lg:static lg:z-auto',
            'lg:w-72 lg:flex-shrink-0',
            'transition-transform duration-300 ease-in-out lg:transition-none lg:translate-y-0',
            filterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
          ].join(' ')}
        >
          {/* Close handle — mobile only */}
          <div className="lg:hidden flex items-center justify-between px-5 pt-4 pb-2 bg-white rounded-t-2xl border-t border-x border-gray-200 shadow-lg">
            <span className="text-sm font-semibold text-gray-900">Filters</span>
            <button
              onClick={() => setFilterOpen(false)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <FilterPanel
            filter={filter}
            onChange={handleFilterChange}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            mobileDrawer
          />
        </div>

        {/* Table area */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchPolicies} />
          ) : policies.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
          ) : (
            <>
              <PoliciesTable
                policies={policies}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-800">{policies.length}</span>{' '}
                  polic{policies.length !== 1 ? 'ies' : 'y'}
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

// ── Filter Panel ────────────────────────────────────────────────────────────

function FilterPanel({
  filter,
  onChange,
  onClear,
  hasActiveFilters,
  mobileDrawer,
}: {
  filter: PolicyFilter;
  onChange: (field: keyof PolicyFilter, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  mobileDrawer?: boolean;
}) {
  return (
    <div className={`bg-white border border-gray-200 shadow-sm overflow-hidden ${mobileDrawer ? 'rounded-b-xl lg:rounded-xl' : 'rounded-xl'}`}>
      {/* Header — hidden on mobile drawer (handle above provides it) */}
      <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between ${mobileDrawer ? 'hidden lg:flex' : ''}`}>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filter.search}
              onChange={e => onChange('search', e.target.value)}
              placeholder="Search by policy name…"
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
            />
            {filter.search && (
              <button
                onClick={() => onChange('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
            Status
          </label>
          <select
            value={filter.status}
            onChange={e => onChange('status', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
          >
            <option value="">All statuses</option>
            {POLICY_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active chips */}
      {hasActiveFilters && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {filter.search && (
            <FilterChip label={`"${filter.search}"`} onRemove={() => onChange('search', '')} />
          )}
          {filter.status && (
            <FilterChip label={filter.status} onRemove={() => onChange('status', '')} />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-blue-500 hover:text-blue-700 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Policies Table ──────────────────────────────────────────────────────────

function PoliciesTable({
  policies,
  sortKey,
  sortDir,
  onSort,
}: {
  policies: Policy[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const columns: { key: SortKey; label: string; sortable?: boolean; minWidth?: number }[] = [
    { key: 'name',      label: 'Policy Name', sortable: true, minWidth: 240 },
    { key: 'version',   label: 'Version',     sortable: true, minWidth: 90  },
    { key: 'status',    label: 'Status',      sortable: true, minWidth: 120 },
    { key: 'createdAt', label: 'Created',     sortable: true, minWidth: 130 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
                    col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : '',
                  ].join(' ')}
                  style={{ minWidth: col.minWidth }}
                  onClick={() => col.sortable && onSort(col.key)}
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDir} />}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Approved By
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {policies.map(policy => {
              const cfg = getStatusCfg(policy.status);
              const StatusIcon = cfg.icon;
              return (
                <tr key={policy.id} className="hover:bg-blue-50/40 transition-colors group">
                  {/* Name */}
                  <td className="px-4 py-3.5 align-top" style={{ minWidth: 240 }}>
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 leading-snug">{policy.name}</p>
                        {policy.documentUrl && (
                          <a
                            href={policy.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-0.5 inline-block"
                          >
                            View document
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-4 py-3.5 align-top" style={{ minWidth: 90 }}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      v{policy.version}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 align-top" style={{ minWidth: 120 }}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3.5 align-top text-sm text-gray-500 whitespace-nowrap" style={{ minWidth: 130 }}>
                    {new Date(policy.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Approved By */}
                  <td className="px-4 py-3.5 align-top text-sm text-gray-500">
                    {policy.approvedBy ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        </span>
                        {policy.approvedBy}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sort Icon ───────────────────────────────────────────────────────────────

function SortIcon({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />;
}

// ── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, color, bg, accent = 'border-gray-200',
}: {
  label: string; value: number; color: string; bg: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} ${bg} px-4 py-3 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

// ── States ───────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading policies…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">Failed to load policies</p>
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
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">No policies found</p>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters ? 'No policies match your current filters.' : 'No policies have been created yet.'}
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
