import React, { useState } from 'react';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { useNavigate } from 'react-router';
import { clearAuthSession } from '@/services/authStorage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { policiesService } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { PolicyDetailPanel } from '@/app/components/compliance/PolicyDetailPanel';
import { SlidersHorizontal, RefreshCw, LayoutTemplate, Plus, X } from 'lucide-react';

import { PolicyFilter, SortKey } from './policies/types';
import { UploadModal } from './policies/UploadModal';
import { TemplatesModal } from './policies/TemplatesModal';
import { CreatePolicyModal } from './policies/CreatePolicyModal';
import { PoliciesTable } from './policies/PoliciesTable';
import { FilterPanel } from './policies/FilterPanel';
import { SummaryCard, LoadingState, ErrorState, EmptyState } from './policies/StateComponents';

export function PoliciesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<PolicyFilter>({ search: '', status: '' });
  const [frameworkFilter, setFrameworkFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadPolicy, setUploadPolicy] = useState<Policy | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const filterKey = { search: filter.search, status: filter.status, frameworkSlugs: frameworkFilter };

  const { data: rawPolicies, isLoading: loading, isError, error: queryError, isFetching } =
    useQuery({
      queryKey: QK.policies(filterKey),
      queryFn: async () => {
        const response = await policiesService.getPolicies({
          search: filter.search || undefined,
          status: filter.status || undefined,
          frameworkSlugs: frameworkFilter.length > 0 ? frameworkFilter : undefined,
        });
        if (response.success && response.data) return response.data as Policy[];
        throw new Error('Failed to load policies from the server.');
      },
      staleTime: STALE.POLICIES,
      retry: (count, err: any) => {
        if (err?.statusCode === 401) { clearAuthSession(); navigate('/login'); return false; }
        return count < 1;
      },
    });

  const policies: Policy[] = rawPolicies
    ? [...rawPolicies].sort((a, b) => {
        const aVal = String(a[sortKey as keyof Policy] ?? '');
        const bVal = String(b[sortKey as keyof Policy] ?? '');
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'desc' ? -cmp : cmp;
      })
    : [];

  const error: string | null = isError ? ((queryError as any)?.message ?? 'An unexpected error occurred.') : null;
  const fetchPolicies = () => qc.invalidateQueries({ queryKey: ['policies'] });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleFilterChange = (field: keyof PolicyFilter, value: string) =>
    setFilter(prev => ({ ...prev, [field]: value }));

  const clearFilters = () => { setFilter({ search: '', status: '' }); setFrameworkFilter([]); };
  const hasActiveFilters = !!(filter.search || filter.status || frameworkFilter.length > 0);

  const published = policies.filter(p => p.status === 'PUBLISHED').length;
  const draft     = policies.filter(p => p.status === 'DRAFT').length;
  const inReview  = policies.filter(p => p.status === 'REVIEW').length;
  const archived  = policies.filter(p => p.status === 'ARCHIVED').length;

  return (
    <div className="flex flex-col bg-gray-50">

      {/* Modals */}
      {uploadPolicy && (
        <UploadModal
          policy={uploadPolicy}
          onClose={() => setUploadPolicy(null)}
          onUploaded={() => { qc.invalidateQueries({ queryKey: ['policies'] }); setUploadPolicy(null); }}
        />
      )}
      {showTemplates && (
        <TemplatesModal
          onClose={() => setShowTemplates(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['policies'] })}
        />
      )}
      {showCreate && (
        <CreatePolicyModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['policies'] }); setShowCreate(false); }}
        />
      )}

      {/* Policy detail slide-over */}
      {selectedPolicy && (
        <PolicyDetailPanel
          policy={selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          onMutated={() => { qc.invalidateQueries({ queryKey: ['policies'] }); setSelectedPolicy(null); }}
        />
      )}

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
          <button
            onClick={fetchPolicies}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh policies"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">Use Template</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Policy</span>
          </button>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={[
              'lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              hasActiveFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{hasActiveFilters ? ' •' : ''}
          </button>
        </div>
      </div>

      {/* ── Framework filter bar ── */}
      <div className="px-6 pt-3 pb-1">
        <FrameworkFilter selected={frameworkFilter} onChange={setFrameworkFilter} />
      </div>

      {/* ── Summary Cards ── */}
      {!loading && !error && policies.length > 0 && (
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total Policies"   value={policies.length}   color="text-gray-900"  bg="bg-white"    accent="border-gray-200" />
            <SummaryCard label="Published"         value={published}         color="text-green-700" bg="bg-green-50"  accent="border-green-200" />
            <SummaryCard label="In Review"         value={inReview}          color="text-amber-700" bg="bg-amber-50"  accent="border-amber-200" />
            <SummaryCard label="Draft / Archived"  value={draft + archived}  color="text-gray-600"  bg="bg-gray-50"   accent="border-gray-200" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Publication rate</span>
              <span className="text-sm font-semibold text-blue-700">
                {Math.round((published / policies.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.round((published / policies.length) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-3 sm:px-6 py-4">

        {filterOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setFilterOpen(false)} />
        )}

        <div className={[
          'fixed bottom-0 left-0 right-0 z-30 lg:static lg:z-auto',
          'lg:w-72 lg:flex-shrink-0',
          'transition-transform duration-300 ease-in-out lg:transition-none lg:translate-y-0',
          filterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
        ].join(' ')}>
          <div className="lg:hidden flex items-center justify-between px-5 pt-4 pb-2 bg-white rounded-t-2xl border-t border-x border-gray-200 shadow-lg">
            <span className="text-sm font-semibold text-gray-900">Filters</span>
            <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <FilterPanel filter={filter} onChange={handleFilterChange} onClear={clearFilters} hasActiveFilters={hasActiveFilters} mobileDrawer />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchPolicies} />
          ) : policies.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} onCreate={() => setShowCreate(true)} />
          ) : (
            <>
              <PoliciesTable
                policies={policies}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onUpload={setUploadPolicy}
                onSelect={setSelectedPolicy}
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
