import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Button } from '@/app/components/ui/button';
import { Loader2, RefreshCw, Radar, ShieldCheck, Siren, Files, Clock3 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { riskCenterService } from '@/services/api/riskCenter';
import { riskLevelVariant, riskStatusVariant, trendLabel } from '@/services/api/riskFormatting';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-emerald-500',
};

export function RiskOverviewPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: QK.riskCenterOverview(),
    queryFn: () => riskCenterService.getOverview(),
    staleTime: STALE.RISKS,
  });

  const stats = [
    { label: 'Open risks', value: data?.open ?? 0, icon: Siren, tone: 'text-red-600', detail: `${data?.overdue ?? 0} overdue` },
    { label: 'High-risk assets', value: data?.highRiskAssets ?? 0, icon: Radar, tone: 'text-orange-600', detail: 'Critical or high exposure' },
    { label: 'Evidence coverage', value: `${data?.evidenceCoverage ?? 0}%`, icon: Files, tone: 'text-blue-600', detail: 'Risks with evidence snapshots' },
    { label: 'Framework coverage', value: `${data?.frameworkCoverage ?? 0}%`, icon: ShieldCheck, tone: 'text-emerald-600', detail: `MTTR ${data?.mttrDays ?? 0} days` },
  ];

  return (
    <PageTemplate
      title="Risk Overview"
      description="Enterprise risk posture across automated monitoring, evidence, and remediation workflows."
      actions={
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => qc.invalidateQueries({ queryKey: QK.riskCenterOverview() })}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {isLoading || !data ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                      <Icon className={`h-5 w-5 ${stat.tone}`} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Severity posture</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Current exposure split across the risk engine.</p>
                </div>
                <Badge variant="outline">{data.total} tracked</Badge>
              </div>
              <div className="mt-6 space-y-4">
                {data.severityBreakdown.map((item) => {
                  const pct = data.total > 0 ? Math.round((item.count / data.total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${severityColors[item.label]}`} />
                          <span className="text-foreground">{item.label}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2.5" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid gap-4 border-t pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Automated controls</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{data.automatedCoverage}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Accepted risks</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{data.accepted}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Transferred risks</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{data.transferred}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Risk concentration</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Where the platform is detecting the most risk pressure.</p>
                </div>
                <Clock3 className="h-5 w-5 text-muted-foreground/70" />
              </div>
              <div className="mt-5 space-y-4">
                {data.categoryBreakdown.slice(0, 6).map((item) => {
                  const pct = data.total > 0 ? Math.round((item.count / data.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Most impacted frameworks</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.frameworkBreakdown.slice(0, 5).map((item) => (
                    <Badge key={item.framework} variant="outline">{item.framework} ({item.count})</Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Recently created or updated risks</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Latest detections from the automated monitoring pipeline.</p>
                </div>
                <Badge variant="secondary">Continuous monitoring</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {data.recentRisks.map((risk) => (
                  <button
                    key={risk.id}
                    type="button"
                    onClick={() => navigate(`/risk/risks/${risk.id}`)}
                    className="w-full rounded-xl border border-border p-4 text-left transition hover:border-border hover:bg-muted"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{risk.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{risk.assetName} · {risk.owner.team} · {risk.category}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={riskLevelVariant(risk.impact)}>{risk.impact}</Badge>
                        <Badge variant={riskStatusVariant(risk.status)}>{risk.status}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Score {risk.riskScore}</span>
                      <span>•</span>
                      <span>{risk.evidenceCount} evidence items</span>
                      <span>•</span>
                      <span>{trendLabel(risk.trend)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Owner workload</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Who is carrying current remediation demand.</p>
                </div>
                <Badge variant="outline">Auto-assigned owners</Badge>
              </div>
              <div className="mt-5 space-y-4">
                {data.ownerBreakdown.map((item) => {
                  const pct = data.total > 0 ? Math.round((item.count / data.total) * 100) : 0;
                  return (
                    <div key={item.team} className="rounded-xl bg-muted p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{item.team}</span>
                        <span className="text-muted-foreground">{item.count} risks</span>
                      </div>
                      <Progress value={pct} className="mt-3 h-2" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
