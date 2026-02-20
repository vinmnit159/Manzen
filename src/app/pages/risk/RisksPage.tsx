import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Loader2, ShieldOff, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

function impactVariant(impact: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (impact === 'CRITICAL' || impact === 'HIGH') return 'destructive';
  if (impact === 'MEDIUM') return 'secondary';
  return 'outline';
}

function statusVariant(s: string): 'default' | 'outline' | 'secondary' | 'destructive' {
  if (s === 'OPEN') return 'destructive';
  if (s === 'MITIGATED') return 'default';
  if (s === 'ACCEPTED') return 'secondary';
  return 'outline';
}

export function RisksPage() {
  const qc = useQueryClient();

  const { data: risks = [], isLoading: loading, isFetching } = useQuery({
    queryKey: QK.risks(),
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/risks');
      return res?.data ?? [];
    },
    staleTime: STALE.RISKS,
  });

  return (
    <PageTemplate
      title="Risks"
      description="All identified security risks across your organisation."
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => qc.invalidateQueries({ queryKey: QK.risks() })}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : risks.length === 0 ? (
        <Card className="p-10 text-center">
          <ShieldOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No risks recorded yet. Connect GitHub to auto-detect risks.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Title', 'Asset', 'Impact', 'Likelihood', 'Score', 'Status', 'Created'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {risks.map((risk: any) => (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                      <p className="truncate">{risk.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{risk.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{risk.asset?.name ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={impactVariant(risk.impact)}>{risk.impact}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{risk.likelihood}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{risk.riskScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusVariant(risk.status)}>{risk.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {new Date(risk.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageTemplate>
  );
}
