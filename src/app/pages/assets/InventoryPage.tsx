import { useEffect, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, Database, Cloud, Monitor, Server, Package, Globe, HelpCircle } from 'lucide-react';
import { apiClient } from '@/services/api/client';

const TYPE_ICONS: Record<string, any> = {
  CLOUD: Cloud, APPLICATION: Monitor, DATABASE: Database,
  SAAS: Globe, ENDPOINT: Server, NETWORK: Package, OTHER: HelpCircle,
};

function criticalityVariant(c: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (c === 'CRITICAL') return 'destructive';
  if (c === 'HIGH') return 'destructive';
  if (c === 'MEDIUM') return 'secondary';
  return 'outline';
}

export function InventoryPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<any>('/api/assets')
      .then((res) => setAssets(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Summary by type
  const typeCounts = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PageTemplate title="Asset Inventory" description="All assets discovered across your organisation — including GitHub repositories.">
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {/* Type summary */}
          {assets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(typeCounts).map(([type, count]) => {
                const Icon = TYPE_ICONS[type] ?? HelpCircle;
                return (
                  <Card key={type} className="p-4 text-center">
                    <Icon className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{type}</div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Asset Name', 'Type', 'Criticality', 'Risks', 'Description', 'Added'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">No assets yet. Connect GitHub to auto-discover repositories.</td></tr>
                  ) : assets.map((asset) => {
                    const Icon = TYPE_ICONS[asset.type] ?? HelpCircle;
                    return (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={criticalityVariant(asset.criticality)}>{asset.criticality}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {asset.risks?.length ?? 0}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px]">
                          <span className="truncate block">{asset.description ?? '—'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                          {new Date(asset.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
