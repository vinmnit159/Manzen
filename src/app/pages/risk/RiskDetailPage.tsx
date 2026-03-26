import { useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Loader2,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Workflow,
  Users,
  Clock3,
  Pencil,
  ExternalLink,
  AlertTriangle,
  Activity,
  Link2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import {
  riskCenterService,
  type RiskStakeholder,
} from '@/services/api/riskCenter';
import { scanFindingsService } from '@/services/api/scan-findings';
import { usersService } from '@/services/api/users';
import {
  riskLevelVariant,
  riskStatusVariant,
  trendLabel,
} from '@/services/api/riskFormatting';
import { useIsAdmin, useCurrentUser } from '@/hooks/useCurrentUser';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { TestDetailPanel } from '@/app/pages/tests/TestDetailPanel';

// ─── Stakeholder Edit Dialog ──────────────────────────────────────────────────

interface StakeholderDialogProps {
  open: boolean;
  onClose: () => void;
  stakeholders: RiskStakeholder[];
  riskId: string;
}

function EditStakeholdersDialog({
  open,
  onClose,
  stakeholders,
  riskId,
}: StakeholderDialogProps) {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const [draft, setDraft] = useState<RiskStakeholder[]>(() => [
    ...stakeholders,
  ]);
  const [error, setError] = useState('');

  // Fetch org users for the picker dropdowns (only while dialog is open)
  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      riskCenterService.updateStakeholders(
        riskId,
        { stakeholders: draft },
        currentUser?.name ?? currentUser?.email ?? 'Admin',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskDetail(riskId) });
      qc.invalidateQueries({ queryKey: QK.activityLog() });
      onClose();
    },
    onError: () =>
      setError('Failed to save stakeholder changes. Please try again.'),
  });

  function updateRole(
    index: number,
    field: keyof RiskStakeholder,
    value: string,
  ) {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value } as RiskStakeholder;
      return next;
    });
  }

  function selectUser(index: number, userId: string) {
    const user = usersData?.find((u) => u.id === userId);
    if (!user) return;
    setDraft((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index]!,
        name: user.name ?? user.email,
        userId: user.id,
      } as RiskStakeholder;
      return next;
    });
  }

  function addBackupOwner() {
    if (draft.some((s) => s.role === 'Backup owner')) return;
    setDraft((prev) => [...prev, { role: 'Backup owner', name: '', team: '' }]);
  }

  // Sync draft when dialog opens with new stakeholder data
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
    } else {
      setDraft([...stakeholders]);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Edit stakeholders
          </DialogTitle>
          <DialogDescription>
            Reassign technical, business, control, or backup ownership for this
            risk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {draft.map((person, index) => (
            <div
              key={person.role}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {person.role}
              </p>

              {/* User picker */}
              {usersData && usersData.length > 0 ? (
                <select
                  value={person.userId ?? ''}
                  onChange={(e) => selectUser(index, e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select user...</option>
                  {usersData.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updateRole(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              <input
                type="text"
                value={person.team}
                onChange={(e) => updateRole(index, 'team', e.target.value)}
                placeholder="Team"
                className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {!draft.some((s) => s.role === 'Backup owner') && (
            <button
              type="button"
              onClick={addBackupOwner}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add backup owner
            </button>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending || draft.some((s) => !s.name || !s.team)
            }
          >
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activity dot colour ──────────────────────────────────────────────────────

function activityDotColor(type: string): string {
  switch (type) {
    case 'DETECTED':
      return 'bg-red-500';
    case 'STAKEHOLDER_CHANGED':
      return 'bg-amber-500';
    case 'EVIDENCE':
      return 'bg-blue-500';
    case 'REMEDIATION':
      return 'bg-purple-500';
    case 'ACCEPTED':
      return 'bg-yellow-500';
    case 'ASSIGNED':
      return 'bg-green-500';
    default:
      return 'bg-foreground';
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RiskDetailPage() {
  const navigate = useNavigate();
  const { riskId = '' } = useParams();
  const isAdmin = useIsAdmin();
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QK.riskDetail(riskId),
    queryFn: () => riskCenterService.getRiskDetail(riskId),
    staleTime: STALE.RISKS,
    enabled: Boolean(riskId),
  });

  const { data: findingsData } = useQuery({
    queryKey: ['risk-findings', riskId],
    queryFn: () => scanFindingsService.listByRisk(riskId),
    staleTime: STALE.RISKS,
    enabled: Boolean(riskId),
  });

  return (
    <PageTemplate
      title="Risk Detail"
      description="Evidence, control mappings, ownership, and remediation context for a single risk record."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/risk/risks')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to register
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
        </div>
      ) : !data ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Risk not found.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── Header card ──────────────────────────────────────────────── */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={riskLevelVariant(data.risk.impact)}>
                    {data.risk.impact}
                  </Badge>
                  <Badge variant={riskStatusVariant(data.risk.status)}>
                    {data.risk.status}
                  </Badge>
                  <Badge variant="outline">{data.risk.category}</Badge>
                  <Badge variant="outline">{trendLabel(data.risk.trend)}</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">
                  {data.risk.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {data.risk.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-5 text-sm text-muted-foreground">
                  <span>Asset: {data.risk.assetName}</span>
                  <span>Owner: {data.risk.owner.name}</span>
                  <span>
                    Due: {new Date(data.risk.dueDate).toLocaleDateString()}
                  </span>
                  <span>Score: {data.risk.riskScore}</span>
                </div>
              </div>
              <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
                <Card className="gap-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Inherent risk
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {data.summary.inherentRisk}
                  </p>
                </Card>
                <Card className="gap-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Residual risk
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {data.summary.residualRisk}
                  </p>
                </Card>
                <Card className="gap-2 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Blast radius
                  </p>
                  <p className="text-sm text-foreground">
                    {data.summary.blastRadius}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.summary.exceptionStatus}
                  </p>
                </Card>
              </div>
            </div>
          </Card>

          {/* ── Two-column: controls + stakeholders ──────────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            {/* Controls & framework mapping */}
            <Card className="p-6">
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="text-base font-semibold">
                  Control and framework mapping
                </h3>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Linked controls
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.risk.controls.map((control) => (
                      <Badge key={control} variant="secondary">
                        {control}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Impacted frameworks
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.risk.frameworks.map((framework) => (
                      <Badge key={framework} variant="outline">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Treatment posture
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {data.risk.treatment}
                  </p>
                </div>
              </div>
            </Card>

            {/* Stakeholders — editable for admins */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Stakeholders</h3>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStakeholderDialogOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit stakeholders
                  </Button>
                )}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.stakeholders.map((person) => (
                  <div key={person.role} className="rounded-xl bg-muted p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {person.role}
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {person.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{person.team}</p>
                    {person.userId && (
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        ID: {person.userId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <Tabs defaultValue="findings" className="gap-4">
            <TabsList>
              <TabsTrigger value="findings">
                Findings{findingsData?.meta ? ` (${findingsData.meta.open})` : ''}
              </TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="remediation">Remediation</TabsTrigger>
            </TabsList>

            {/* ── Findings tab ─────────────────────────────────────────── */}
            <TabsContent value="findings">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="text-base font-semibold">
                    Scan findings
                  </h3>
                  {findingsData?.meta && (
                    <Badge variant="outline">
                      {findingsData.meta.open} open / {findingsData.meta.total} total
                    </Badge>
                  )}
                </div>
                <div className="mt-5 space-y-3">
                  {(!findingsData?.data || findingsData.data.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No scan findings linked to this risk.
                    </p>
                  )}
                  {findingsData?.data?.map((finding) => (
                    <div
                      key={finding.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {finding.resourceName ?? finding.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {finding.title}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={
                              finding.status === 'OPEN'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {finding.status}
                          </Badge>
                          <Badge variant="outline">{finding.severity}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          First seen:{' '}
                          {new Date(finding.firstSeenAt).toLocaleDateString()}
                        </span>
                        <span>
                          Last seen:{' '}
                          {new Date(finding.lastSeenAt).toLocaleDateString()}
                        </span>
                        <span>
                          Source: {finding.sourceType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ── Evidence tab ───────────────────────────────────────────── */}
            <TabsContent value="evidence">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Evidence timeline</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {data.evidence.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.summary}
                          </p>
                        </div>
                        <Badge variant="outline">{item.provider}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-5 text-xs text-muted-foreground">
                        <span>
                          Captured {new Date(item.capturedAt).toLocaleString()}
                        </span>
                        <span>{item.hash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ── Activity tab (enhanced with stakeholder change rendering) ── */}
            <TabsContent value="activity">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock3 className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Activity history</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {data.activities.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-xl border border-border p-4"
                    >
                      <div
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${activityDotColor(item.type)}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          {item.type === 'STAKEHOLDER_CHANGED' && (
                            <Badge variant="outline" className="text-xs">
                              Ownership
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.actor} &middot;{' '}
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                        {/* Audit detail for stakeholder changes */}
                        {item.meta && (
                          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                            <span className="font-medium">
                              {item.meta.field}:
                            </span>{' '}
                            <span className="line-through text-red-600">
                              {item.meta.oldValue}
                            </span>{' '}
                            <ArrowRight className="inline h-3 w-3 text-muted-foreground/70" />{' '}
                            <span className="text-green-700">
                              {item.meta.newValue}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ── Remediation tab (enriched with traceability + UX) ─────── */}
            <TabsContent value="remediation">
              <div className="space-y-6">
                {/* Generated-from origin panel */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <Link2 className="h-4 w-4" />
                    <h3 className="text-base font-semibold">Generated from</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This risk was created by the risk engine from a failing
                    control test.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Test name
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {data.origin.testName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        ID: {data.origin.testId}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Control
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {data.origin.controlName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        ID: {data.origin.controlId}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Provider / Integration
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {data.origin.provider}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        Signal: {data.origin.signalId}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4 sm:col-span-2 lg:col-span-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Last failing execution
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {new Date(data.origin.lastFailedAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-red-600">
                        {data.origin.failureReason}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTestId(data.origin.testId)}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      View test detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/risk/engine')}
                    >
                      <Activity className="mr-1.5 h-3.5 w-3.5" />
                      View in risk engine
                    </Button>
                  </div>
                </Card>

                {/* Enriched remediation workflow */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <Workflow className="h-4 w-4" />
                    <h3 className="text-base font-semibold">
                      Remediation workflow
                    </h3>
                  </div>
                  <div className="mt-5 space-y-4">
                    {data.enrichedRemediationSteps.map((step, index) => (
                      <div
                        key={step.label}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              {step.label}
                            </p>

                            {/* Linked test/control */}
                            {(step.linkedTestId || step.linkedControlName) && (
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {step.linkedTestId && (
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Test: {step.linkedTestId}
                                  </span>
                                )}
                                {step.linkedControlName && (
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Control: {step.linkedControlName}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Failure reason */}
                            {step.failureReason && (
                              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{step.failureReason}</span>
                              </div>
                            )}

                            {/* Affected resource */}
                            {step.affectedResource && (
                              <p className="text-xs text-muted-foreground">
                                Affected resource:{' '}
                                <span className="font-medium text-foreground">
                                  {step.affectedResource}
                                </span>
                              </p>
                            )}

                            {/* Recommended fix */}
                            {step.recommendedFix && (
                              <p className="text-xs text-muted-foreground">
                                Recommended: {step.recommendedFix}
                              </p>
                            )}

                            {/* Evidence snapshot */}
                            {step.evidenceSummary && (
                              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                <span className="font-medium">Evidence:</span>{' '}
                                {step.evidenceSummary}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {step.linkedTestId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    setSelectedTestId(step.linkedTestId ?? null)
                                  }
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View test result
                                </Button>
                              )}
                              {step.evidenceSnapshotId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => navigate('/risk/engine')}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  View evidence
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Stakeholder edit dialog ─────────────────────────────────── */}
          {isAdmin && (
            <EditStakeholdersDialog
              open={stakeholderDialogOpen}
              onClose={() => setStakeholderDialogOpen(false)}
              stakeholders={data.stakeholders}
              riskId={riskId}
            />
          )}
          {selectedTestId && (
            <TestDetailPanel
              testId={selectedTestId}
              onClose={() => setSelectedTestId(null)}
            />
          )}
        </div>
      )}
    </PageTemplate>
  );
}
