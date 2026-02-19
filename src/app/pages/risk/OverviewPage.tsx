import { useEffect, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Shield, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api/client';

interface RiskOverview {
  total: number; open: number; mitigated: number; accepted: number; transferred: number;
  critical: number; high: number; medium: number; low: number; recentRisks: any[];
}

function severityColor(impact: string) {
  const m: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800', HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800', LOW: 'bg-green-100 text-green-800',
  };
  return m[impact] ?? 'bg-gray-100 text-gray-700';
}

function statusVariant(s: string): 'default' | 'outline' | 'secondary' | 'destructive' {
  if (s === 'OPEN') return 'destructive';
  if (s === 'MITIGATED') return 'default';
  if (s === 'ACCEPTED') return 'secondary';
  return 'outline';
}

export function RiskOverviewPage() {
  const [data, setData] = useState<RiskOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<any>('/api/risks/overview')
      .then((res) => setData(res?.data ?? res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Risks', value: data?.total ?? 0, icon: AlertTriangle, color: 'text-gray-600' },
    { label: 'Open Risks', value: data?.open ?? 0, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Mitigated', value: data?.mitigated ?? 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Accepted / Transferred', value: (data?.accepted ?? 0) + (data?.transferred ?? 0), icon: Clock, color: 'text-orange-600' },
  ];

  const impactBreakdown = [
    { label: 'Critical', count: data?.critical ?? 0, cls: 'bg-red-500' },
    { label: 'High', count: data?.high ?? 0, cls: 'bg-orange-400' },
    { label: 'Medium', count: data?.medium ?? 0, cls: 'bg-yellow-400' },
    { label: 'Low', count: data?.low ?? 0, cls: 'bg-green-400' },
  ];

  return (
    <PageTemplate title="Risk Overview" description="Monitor your organisation's risk posture.">
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-6">
                  <Icon className={`w-8 h-8 ${stat.color} mb-3`} />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              );
            })}
          </div>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Risk by Impact Level</h3>
            <div className="space-y-3">
              {impactBreakdown.map((item) => {
                const pct = data?.total ? Math.round((item.count / data.total) * 100) : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-gray-600">{item.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className={`${item.cls} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-sm text-gray-500 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {(data?.recentRisks?.length ?? 0) > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Recently Identified Risks</h3>
              <div className="space-y-1">
                {data!.recentRisks.map((risk: any) => (
                  <div key={risk.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{risk.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{risk.asset?.name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor(risk.impact)}`}>{risk.impact}</span>
                      <Badge variant={statusVariant(risk.status)} className="text-xs">{risk.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data?.total === 0 && (
            <Card className="p-10 text-center">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No risks detected yet</p>
              <p className="text-sm text-gray-400 mt-1">Connect GitHub and run a scan to automatically identify risks</p>
            </Card>
          )}
        </div>
      )}
    </PageTemplate>
  );
}
