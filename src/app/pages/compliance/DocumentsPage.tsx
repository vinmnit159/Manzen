import { useEffect, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Loader2, ShieldCheck, Cpu } from 'lucide-react';
import { apiClient } from '@/services/api/client';

interface Evidence {
  id: string;
  type: string;
  fileName: string | null;
  fileUrl: string | null;
  hash: string;
  automated: boolean;
  collectedBy: string | null;
  createdAt: string;
  control: {
    id: string;
    isoReference: string;
    title: string;
    status: string;
  } | null;
}

function typeVariant(type: string): 'default' | 'secondary' | 'outline' {
  if (type === 'AUTOMATED') return 'default';
  if (type === 'FILE') return 'secondary';
  return 'outline';
}

function controlStatusColor(status: string) {
  if (status === 'IMPLEMENTED') return 'text-green-600 bg-green-50';
  if (status === 'PARTIALLY_IMPLEMENTED') return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export function DocumentsPage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [stats, setStats] = useState<{ total: number; automated: number; manual: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'AUTOMATED' | 'FILE'>('ALL');

  useEffect(() => {
    Promise.all([
      apiClient.get<any>('/api/evidence'),
      apiClient.get<any>('/api/evidence/stats'),
    ])
      .then(([evidRes, statsRes]) => {
        setEvidence(evidRes?.data ?? []);
        setStats(statsRes?.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? evidence : evidence.filter((e) => e.type === filter);

  return (
    <PageTemplate
      title="Evidence & Documents"
      description="Compliance evidence collected automatically from GitHub and uploaded manually."
    >
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Total Evidence</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-1">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-600">Automated</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">{stats.automated}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-1">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Manual</span>
                </div>
                <div className="text-3xl font-bold text-green-600">{stats.manual}</div>
              </Card>
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-2">
            {(['ALL', 'AUTOMATED', 'FILE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filter === f
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f === 'ALL' ? `All (${evidence.length})` : `${f} (${evidence.filter((e) => e.type === f).length})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Evidence / File', 'Type', 'ISO Control', 'Control Status', 'Collected By', 'Date'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                        No evidence records found. Connect GitHub and run a scan to auto-collect evidence.
                      </td>
                    </tr>
                  ) : filtered.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {ev.automated ? <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <span className="truncate max-w-[200px]">{ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={typeVariant(ev.type)}>{ev.type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ev.control ? (
                          <div>
                            <span className="font-mono text-blue-600 font-medium">{ev.control.isoReference}</span>
                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{ev.control.title}</p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ev.control ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${controlStatusColor(ev.control.status)}`}>
                            {ev.control.status.replace('_', ' ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ev.collectedBy ?? 'system'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(ev.createdAt).toLocaleDateString()}
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
