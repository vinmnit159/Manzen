import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Download, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { riskCenterService } from '@/services/api/riskCenter';

export function SnapshotPage() {
  const { data, isLoading } = useQuery({
    queryKey: QK.riskSnapshot(),
    queryFn: () => riskCenterService.getSnapshot(),
    staleTime: STALE.RISKS,
  });

  return (
    <PageTemplate
      title="Risk Snapshot"
      description="Point-in-time enterprise GRC snapshot for auditors, operators, and leadership."
      actions={<Button><Download className="mr-2 h-4 w-4" />Export Snapshot</Button>}
    >
      {isLoading || !data ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Open risks', value: data.openRisks },
              { label: 'Residual risk score', value: data.residualRiskScore },
              { label: 'Evidence freshness', value: `${data.evidenceFreshness}%` },
              { label: 'Exceptions', value: data.exceptionCount },
            ].map((item) => (
              <Card key={item.label} className="p-5">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{item.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900">Audit readiness</h3>
              <p className="mt-1 text-sm text-gray-500">Generated {new Date(data.generatedAt).toLocaleString()}</p>
              <div className="mt-5 space-y-4">
                {data.auditReadiness.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-500">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2.5" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900">Aging profile</h3>
              <p className="mt-1 text-sm text-gray-500">How long active findings remain open before closure or acceptance.</p>
              <div className="mt-5 space-y-3">
                {data.riskAging.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900">Top exposed assets</h3>
              <div className="mt-5 space-y-3">
                {data.topAssets.map((asset) => (
                  <div key={asset.assetName} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{asset.assetName}</p>
                      <p className="mt-1 text-xs text-gray-500">Criticality {asset.criticality}</p>
                    </div>
                    <Badge variant="outline">{asset.count} linked risks</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold text-gray-900">Severity snapshot</h3>
              <div className="mt-5 space-y-3">
                {data.riskBySeverity.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Category spread</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.riskByCategory.map((item) => <Badge key={item.label} variant="outline">{item.label} ({item.count})</Badge>)}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
