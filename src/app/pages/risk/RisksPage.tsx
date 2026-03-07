import { useMemo, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { riskCenterService } from '@/services/api/riskCenter';
import { riskLevelVariant, riskStatusVariant, trendLabel } from '@/services/api/riskFormatting';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function RisksPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');

  const { data: risks = [], isLoading, isFetching } = useQuery({
    queryKey: QK.risks(),
    queryFn: () => riskCenterService.getRiskRegister(),
    staleTime: STALE.RISKS,
  });

  const filtered = useMemo(() => {
    return risks.filter((risk) => {
      const matchesSeverity = severity === 'ALL' || risk.impact === severity;
      const matchesStatus = status === 'ALL' || risk.status === status;
      const haystack = `${risk.title} ${risk.assetName} ${risk.category} ${risk.owner.team}`.toLowerCase();
      const matchesQuery = query.trim() === '' || haystack.includes(query.toLowerCase());
      return matchesSeverity && matchesStatus && matchesQuery;
    });
  }, [query, risks, severity, status]);

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
          <Card className="p-4">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_0.6fr_0.6fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search risks, assets, teams, or categories" />
              </div>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {['ALL', 'OPEN', 'IN_PROGRESS', 'VERIFIED', 'ACCEPTED', 'TRANSFERRED'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-end text-sm text-gray-500">{filtered.length} results</div>
            </div>
          </Card>

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
