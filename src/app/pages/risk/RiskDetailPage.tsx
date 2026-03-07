import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Loader2, ArrowLeft, FileText, ShieldCheck, Workflow, Users, Clock3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { riskCenterService } from '@/services/api/riskCenter';
import { riskLevelVariant, riskStatusVariant, trendLabel } from '@/services/api/riskFormatting';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function RiskDetailPage() {
  const navigate = useNavigate();
  const { riskId = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: QK.riskDetail(riskId),
    queryFn: () => riskCenterService.getRiskDetail(riskId),
    staleTime: STALE.RISKS,
    enabled: Boolean(riskId),
  });

  return (
    <PageTemplate
      title="Risk Detail"
      description="Evidence, control mappings, ownership, and remediation context for a single risk record."
      actions={<Button variant="outline" size="sm" onClick={() => navigate('/risk/risks')}><ArrowLeft className="mr-2 h-4 w-4" />Back to register</Button>}
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : !data ? (
        <Card className="p-10 text-center text-sm text-gray-500">Risk not found.</Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={riskLevelVariant(data.risk.impact)}>{data.risk.impact}</Badge>
                  <Badge variant={riskStatusVariant(data.risk.status)}>{data.risk.status}</Badge>
                  <Badge variant="outline">{data.risk.category}</Badge>
                  <Badge variant="outline">{trendLabel(data.risk.trend)}</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">{data.risk.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{data.risk.description}</p>
                <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
                  <span>Asset: {data.risk.assetName}</span>
                  <span>Owner: {data.risk.owner.name}</span>
                  <span>Due: {new Date(data.risk.dueDate).toLocaleDateString()}</span>
                  <span>Score: {data.risk.riskScore}</span>
                </div>
              </div>
              <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
                <Card className="gap-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Inherent risk</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.summary.inherentRisk}</p>
                </Card>
                <Card className="gap-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Residual risk</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.summary.residualRisk}</p>
                </Card>
                <Card className="gap-2 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Blast radius</p>
                  <p className="text-sm text-gray-700">{data.summary.blastRadius}</p>
                  <p className="text-xs text-gray-500">{data.summary.exceptionStatus}</p>
                </Card>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-gray-900">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="text-base font-semibold">Control and framework mapping</h3>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Linked controls</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.risk.controls.map((control) => <Badge key={control} variant="secondary">{control}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Impacted frameworks</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.risk.frameworks.map((framework) => <Badge key={framework} variant="outline">{framework}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Treatment posture</p>
                  <p className="mt-2 text-sm text-gray-700">{data.risk.treatment}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 text-gray-900">
                <Users className="h-4 w-4" />
                <h3 className="text-base font-semibold">Stakeholders</h3>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {data.stakeholders.map((person) => (
                  <div key={person.role} className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{person.role}</p>
                    <p className="mt-2 font-medium text-gray-900">{person.name}</p>
                    <p className="mt-1 text-sm text-gray-500">{person.team}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Tabs defaultValue="evidence" className="gap-4">
            <TabsList>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="remediation">Remediation</TabsTrigger>
            </TabsList>

            <TabsContent value="evidence">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-gray-900">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Evidence timeline</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {data.evidence.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-500">{item.summary}</p>
                        </div>
                        <Badge variant="outline">{item.provider}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-5 text-xs text-gray-500">
                        <span>Captured {new Date(item.capturedAt).toLocaleString()}</span>
                        <span>{item.hash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock3 className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Activity history</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {data.activities.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gray-900" />
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.actor} · {new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="remediation">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-gray-900">
                  <Workflow className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Remediation workflow</h3>
                </div>
                <div className="mt-5 space-y-3">
                  {data.remediationSteps.map((step, index) => (
                    <div key={step} className="flex gap-4 rounded-xl bg-gray-50 p-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">{index + 1}</div>
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageTemplate>
  );
}
