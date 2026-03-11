import { useMemo } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { riskCenterService } from '@/services/api/riskCenter';
import { riskLevelVariant, riskStatusVariant, trendLabel } from '@/services/api/riskFormatting';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function RisksPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { filters, update, reset } = useUrlFilterState({
    defaults: { severity: 'ALL', status: 'ALL', query: '', frameworks: [] as string[] },
    arrayKeys: ['frameworks'],
  });
  const severity = filters.severity;
  const status = filters.status;
  const query = filters.query;
  const frameworkFilter = filters.frameworks;

  const { data: risks = [], isLoading, isFetching } = useQuery({
    queryKey: QK.risks(),
    queryFn: () => riskCenterService.getRiskRegister(),
    staleTime: STALE.RISKS,
  });

  /**
   * Normalises a free-text framework name (from the risk engine) to its canonical slug.
   * Matches the slugs produced by frameworkSeeds.ts so the FrameworkFilter can compare them.
   */
  function toFrameworkSlug(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('iso') && (lower.includes('27001') || lower.includes('27k'))) return 'iso-27001';
    if (lower.includes('soc') && (lower.includes('2') || lower.includes('ii'))) return 'soc-2';
    if (lower.includes('nist') || lower.includes('csf')) return 'nist-csf';
    if (lower.includes('hipaa')) return 'hipaa';
    return lower.replace(/\s+/g, '-');
  }

  const filtered = useMemo(() => {
    return risks.filter((risk) => {
      const matchesSeverity = severity === 'ALL' || risk.impact === severity;
      const matchesStatus = status === 'ALL' || risk.status === status;
      const haystack = `${risk.title} ${risk.assetName} ${risk.category} ${risk.owner.team}`.toLowerCase();
      const matchesQuery = query.trim() === '' || haystack.includes(query.toLowerCase());
      const matchesFramework =
        frameworkFilter.length === 0 ||
        risk.frameworks.some((fw) => frameworkFilter.includes(toFrameworkSlug(fw)));
      return matchesSeverity && matchesStatus && matchesQuery && matchesFramework;
    });
  }, [frameworkFilter, query, risks, severity, status]);

  const activeFilters = [
    ...(query.trim() ? [{ key: 'query', label: `Search: ${query.trim()}`, onRemove: () => update({ query: '' }) }] : []),
    ...(severity !== 'ALL' ? [{ key: 'severity', label: `Severity: ${severity}`, onRemove: () => update({ severity: 'ALL' }) }] : []),
    ...(status !== 'ALL' ? [{ key: 'status', label: `Status: ${status.replace(/_/g, ' ')}`, onRemove: () => update({ status: 'ALL' }) }] : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `Framework: ${slug.replace(/-/g, ' ')}`,
      onRemove: () => update({ frameworks: frameworkFilter.filter((item) => item !== slug) }),
    })),
  ];

  return (
    <PageTemplate
      title="Risks"
      description="Deduplicated enterprise risk register with owners, evidence, frameworks, and remediation context."
      actions={
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => qc.invalidateQueries({ queryKey: QK.risks() })}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          <PageFilterBar
            searchValue={query}
            onSearchChange={(value) => update({ query: value })}
            searchPlaceholder="Search risks, assets, teams, or categories"
            selects={[
              {
                key: 'severity',
                value: severity,
                placeholder: 'Severity',
                onChange: (value) => update({ severity: value }),
                options: ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((item) => ({ value: item, label: item })),
              },
              {
                key: 'status',
                value: status,
                placeholder: 'Status',
                onChange: (value) => update({ status: value }),
                options: ['ALL', 'OPEN', 'IN_PROGRESS', 'VERIFIED', 'ACCEPTED', 'TRANSFERRED'].map((item) => ({ value: item, label: item.replace(/_/g, ' ') })),
              },
            ]}
            auxiliary={<FrameworkFilter selected={frameworkFilter} onChange={(value) => update({ frameworks: value })} />}
            resultCount={filtered.length}
            resultLabel="results"
            activeFilters={activeFilters}
            onClearAll={reset}
          />

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b bg-gray-50">
                  <tr>
                    {['Risk', 'Category', 'Asset', 'Owner', 'Score', 'Status', 'Evidence', 'Frameworks', 'Due'].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-14 text-center text-sm text-gray-400">No risks matched the current filters.</td>
                    </tr>
                  ) : filtered.map((risk) => (
                    <tr key={risk.id} className="align-top hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <button type="button" onClick={() => navigate(`/risk/risks/${risk.id}`)} className="text-left font-medium text-gray-900 hover:text-blue-700">
                          {risk.title}
                        </button>
                        <p className="mt-1 max-w-md text-xs leading-5 text-gray-500">{risk.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant={riskLevelVariant(risk.impact)}>{risk.impact}</Badge>
                          <Badge variant="outline">{trendLabel(risk.trend)}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{risk.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p>{risk.assetName}</p>
                        <p className="mt-1 text-xs text-gray-400">{risk.assetType} · {risk.assetCriticality}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p>{risk.owner.name}</p>
                        <p className="mt-1 text-xs text-gray-400">{risk.owner.team}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{risk.riskScore}</td>
                      <td className="px-6 py-4"><Badge variant={riskStatusVariant(risk.status)}>{risk.status}</Badge></td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p>{risk.evidenceCount} snapshots</p>
                        <p className="mt-1 text-xs text-gray-400">Seen {risk.exposureDays}d</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {risk.frameworks.slice(0, 2).map((framework) => <Badge key={framework} variant="outline">{framework}</Badge>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(risk.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
