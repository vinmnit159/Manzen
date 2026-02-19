import { useEffect, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api/client';

function impactColor(impact: string) {
  const m: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
  };
  return m[impact] ?? 'bg-gray-100 text-gray-700';
}

export function RiskLibraryPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    apiClient.get<any>('/api/risks')
      .then((res) => setRisks(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const impacts = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const filtered = filter === 'ALL' ? risks : risks.filter((r) => r.impact === filter);

  // Group by impact for summary cards
  const counts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => ({
    label: lvl,
    count: risks.filter((r) => r.impact === lvl).length,
    cls: impactColor(lvl),
  }));

  return (
    <PageTemplate title="Risk Library" description="All risks identified across your assets and controls.">
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {counts.map((c) => (
              <Card
                key={c.label}
                className={`p-5 cursor-pointer border-2 transition-all ${filter === c.label ? 'border-blue-500' : 'border-transparent'}`}
                onClick={() => setFilter(filter === c.label ? 'ALL' : c.label)}
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">{c.count}</div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
              </Card>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {impacts.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filter === lvl
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {lvl === 'ALL' ? `All (${risks.length})` : `${lvl} (${risks.filter((r) => r.impact === lvl).length})`}
              </button>
            ))}
          </div>

          {/* Risk list */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Risk Title', 'Asset', 'Impact', 'Likelihood', 'Score', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">No risks at this impact level</td></tr>
                  ) : filtered.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-sm">
                        <p className="truncate">{risk.title}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{risk.asset?.name ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${impactColor(risk.impact)}`}>{risk.impact}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{risk.likelihood}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{risk.riskScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={risk.status === 'OPEN' ? 'destructive' : risk.status === 'MITIGATED' ? 'default' : 'outline'}>
                          {risk.status}
                        </Badge>
                      </td>
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
