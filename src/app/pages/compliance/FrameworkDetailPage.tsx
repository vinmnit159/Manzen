import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  ArrowLeft, Loader2, ShieldCheck, FlaskConical, FileText, Target,
  AlertTriangle, CheckCircle2, Circle, XCircle, User, Calendar,
  LayoutDashboard, ListChecks, Link2, FileBox, Gauge,
} from "lucide-react";
import { frameworksService, type RequirementStatusDto, type CoverageSnapshotDto } from "@/services/api/frameworks";

// ── Helpers ───────────────────────────────────────────────────────────────────

function applicabilityBadge(status: string) {
  if (status === 'not_applicable') return <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">N/A</Badge>;
  return <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">Applicable</Badge>;
}

function reviewBadge(status: string) {
  if (status === 'accepted') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Accepted</Badge>;
  if (status === 'in_review') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">In Review</Badge>;
  return <Badge variant="outline" className="text-gray-400 text-xs">Not started</Badge>;
}

function CoverageRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-14">
        <p className="text-2xl font-bold text-gray-900">{pct}%</p>
      </div>
      <p className="text-xs text-gray-500 font-medium mt-6">{label}</p>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ slug }: { slug: string }) {
  const { data: covRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'coverage', slug],
    queryFn: () => frameworksService.getCoverage(slug),
  });
  const snap: CoverageSnapshotDto | null = covRes?.data ?? null;

  if (isLoading) return <TabPlaceholder icon={Gauge} text="Loading coverage data…" />;

  if (!snap) {
    return (
      <Card className="border-dashed border-gray-200">
        <CardContent className="py-16 text-center">
          <Gauge className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No coverage data yet</p>
          <p className="text-xs text-gray-400 mt-1">Coverage snapshots will appear here once the framework is active and requirements are mapped.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric rings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Coverage Summary</CardTitle>
          <p className="text-xs text-gray-400">Latest snapshot · {new Date(snap.calculatedAt).toLocaleString()}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start justify-around gap-8 py-4">
            <CoverageRing pct={snap.controlCoveragePct} label="Control coverage" color="#2563eb" />
            <CoverageRing pct={snap.testPassRatePct} label="Test pass rate" color="#16a34a" />
            <CoverageRing pct={snap.applicable > 0 ? Math.round((snap.notApplicable / snap.totalRequirements) * 100) : 0} label="N/A ratio" color="#9ca3af" />
          </div>
        </CardContent>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total requirements", value: snap.totalRequirements, color: "text-gray-700" },
          { label: "Applicable", value: snap.applicable, color: "text-blue-700" },
          { label: "Covered", value: snap.covered, color: "text-green-700" },
          { label: "Open gaps", value: snap.openGaps, color: "text-red-700" },
        ].map(s => (
          <Card key={s.label} className="border-gray-100">
            <CardContent className="py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage progress bars */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Implementation breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Covered", count: snap.covered, color: "bg-green-500" },
            { label: "Partially covered", count: snap.partiallyCovered, color: "bg-amber-400" },
            { label: "Not covered", count: snap.notCovered, color: "bg-red-400" },
            { label: "Not applicable", count: snap.notApplicable, color: "bg-gray-300" },
          ].map(row => {
            const pct = snap.totalRequirements > 0 ? Math.round((row.count / snap.totalRequirements) * 100) : 0;
            return (
              <div key={row.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{row.label}</span>
                  <span className="font-semibold">{row.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Requirements tab ──────────────────────────────────────────────────────────
function RequirementsTab({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const [ownerDialog, setOwnerDialog] = useState<RequirementStatusDto | null>(null);
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });

  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];

  const ownerMutation = useMutation({
    mutationFn: (r: RequirementStatusDto) =>
      frameworksService.updateRequirementOwner(r.id, {
        ownerId: ownerInput || null,
        dueDate: dueDateInput || null,
      }),
    onSuccess: () => {
      setOwnerDialog(null);
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
    },
  });

  const applicabilityMutation = useMutation({
    mutationFn: ({ r, status }: { r: RequirementStatusDto; status: 'applicable' | 'not_applicable' }) =>
      frameworksService.updateApplicability(r.id, { applicabilityStatus: status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
    },
  });

  if (isLoading) return <TabPlaceholder icon={ListChecks} text="Loading requirements…" />;

  if (reqs.length === 0) {
    return (
      <TabPlaceholder
        icon={ListChecks}
        text="No requirements loaded yet"
        sub="Activate this framework to load requirements for your organization."
      />
    );
  }

  // Group by domain
  const byDomain = reqs.reduce<Record<string, RequirementStatusDto[]>>((acc, r) => {
    const d = r.domain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{reqs.length} requirements · {reqs.filter(r => r.applicabilityStatus === 'not_applicable').length} marked N/A</span>
        <span className="text-gray-400">Click a row to assign owner or mark N/A</span>
      </div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(req => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setOwnerDialog(req);
                    setOwnerInput(req.ownerId ?? '');
                    setDueDateInput(req.dueDate ? req.dueDate.substring(0, 10) : '');
                  }}
                >
                  <span className="font-mono text-xs text-gray-400 w-16 shrink-0 mt-0.5">{req.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{req.title}</p>
                    {req.ownerId && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> {req.ownerId}
                        {req.dueDate && <><Calendar className="w-3 h-3 ml-1.5" /> {new Date(req.dueDate).toLocaleDateString()}</>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {reviewBadge(req.reviewStatus)}
                    {applicabilityBadge(req.applicabilityStatus)}
                    {req.applicabilityStatus === 'applicable' ? (
                      <button
                        className="text-xs text-gray-300 hover:text-gray-500 px-1"
                        onClick={e => {
                          e.stopPropagation();
                          applicabilityMutation.mutate({ r: req, status: 'not_applicable' });
                        }}
                        title="Mark N/A"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="text-xs text-gray-300 hover:text-blue-500 px-1"
                        onClick={e => {
                          e.stopPropagation();
                          applicabilityMutation.mutate({ r: req, status: 'applicable' });
                        }}
                        title="Mark applicable"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Owner assignment dialog */}
      <Dialog open={!!ownerDialog} onOpenChange={() => setOwnerDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign owner & due date</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">{ownerDialog?.code}</span>{' '}
              {ownerDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label htmlFor="owner" className="text-sm font-medium">Owner (user ID)</Label>
              <Input
                id="owner"
                placeholder="e.g. user-uuid"
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDateInput}
                onChange={e => setDueDateInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setOwnerDialog(null)}>Cancel</Button>
            <Button
              onClick={() => ownerDialog && ownerMutation.mutate(ownerDialog)}
              disabled={ownerMutation.isPending}
            >
              {ownerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Gaps tab ──────────────────────────────────────────────────────────────────
function GapsTab({ slug }: { slug: string }) {
  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });
  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];
  const gaps = reqs.filter(r => r.applicabilityStatus === 'applicable' && !r.ownerId);

  if (isLoading) return <TabPlaceholder icon={AlertTriangle} text="Loading gaps…" />;

  if (gaps.length === 0) {
    return (
      <TabPlaceholder
        icon={CheckCircle2}
        text="No open gaps"
        sub="All applicable requirements have an owner assigned, or there are no applicable requirements yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{gaps.length} applicable requirements without an owner</p>
      <Card className="border-gray-100">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {gaps.map(req => (
              <div key={req.id} className="flex items-start gap-3 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-mono text-xs text-gray-400 mr-2">{req.code}</span>
                    {req.title}
                  </p>
                  {req.domain && <p className="text-xs text-gray-400 mt-0.5">{req.domain}</p>}
                </div>
                {reviewBadge(req.reviewStatus)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Exclusions tab ────────────────────────────────────────────────────────────
function ExclusionsTab({ slug }: { slug: string }) {
  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });
  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];
  const excluded = reqs.filter(r => r.applicabilityStatus === 'not_applicable');

  if (isLoading) return <TabPlaceholder icon={XCircle} text="Loading exclusions…" />;
  if (excluded.length === 0) return <TabPlaceholder icon={XCircle} text="No exclusions recorded" sub="Requirements marked N/A with justification appear here as an audit trail." />;

  return (
    <Card className="border-gray-100">
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {excluded.map(req => (
            <div key={req.id} className="flex items-start gap-3 px-4 py-3">
              <XCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-mono text-xs text-gray-400 mr-2">{req.code}</span>
                  {req.title}
                </p>
                {req.justification && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{req.justification}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Placeholder for unmapped tabs ─────────────────────────────────────────────
function TabPlaceholder({ icon: Icon, text, sub }: {
  icon: React.ElementType;
  text: string;
  sub?: string;
}) {
  return (
    <Card className="border-dashed border-gray-200 bg-gray-50">
      <CardContent className="py-16 text-center">
        <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">{text}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FrameworkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: fwRes, isLoading: fwLoading } = useQuery({
    queryKey: ['frameworks', 'detail', slug],
    queryFn: () => frameworksService.getFramework(slug!),
    enabled: !!slug,
  });

  const fw = fwRes?.data;

  if (fwLoading) {
    return (
      <PageTemplate title="Framework">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
        </div>
      </PageTemplate>
    );
  }

  if (!fw) {
    return (
      <PageTemplate title="Framework not found">
        <Card className="border-gray-200">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Framework "{slug}" not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/compliance/frameworks')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Frameworks
            </Button>
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={fw.name}
      description={`v${fw.version} · ${fw.description ?? ''}`}
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-gray-500"
        onClick={() => navigate('/compliance/frameworks')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> All frameworks
      </Button>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="rounded-xl bg-slate-100 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <LayoutDashboard className="w-3.5 h-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-1.5 text-xs">
            <ListChecks className="w-3.5 h-3.5" /> Requirements
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Controls
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1.5 text-xs">
            <FlaskConical className="w-3.5 h-3.5" /> Tests
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Policies
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Gaps
          </TabsTrigger>
          <TabsTrigger value="exclusions" className="flex items-center gap-1.5 text-xs">
            <XCircle className="w-3.5 h-3.5" /> Exclusions
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-1.5 text-xs">
            <FileBox className="w-3.5 h-3.5" /> Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab slug={slug!} />
        </TabsContent>

        <TabsContent value="requirements" className="mt-0">
          <RequirementsTab slug={slug!} />
        </TabsContent>

        <TabsContent value="controls" className="mt-0">
          <TabPlaceholder
            icon={ShieldCheck}
            text="Control mappings coming in Phase 3"
            sub="Controls mapped to this framework's requirements will appear here once mapping data is connected."
          />
        </TabsContent>

        <TabsContent value="tests" className="mt-0">
          <TabPlaceholder
            icon={FlaskConical}
            text="Test mappings coming in Phase 3"
            sub="Tests linked to this framework's requirements and their latest pass/fail results will appear here."
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-0">
          <TabPlaceholder
            icon={FileText}
            text="Policy mappings coming in Phase 3"
            sub="Policies mapped to this framework's requirements will appear here once mapping data is connected."
          />
        </TabsContent>

        <TabsContent value="gaps" className="mt-0">
          <GapsTab slug={slug!} />
        </TabsContent>

        <TabsContent value="exclusions" className="mt-0">
          <ExclusionsTab slug={slug!} />
        </TabsContent>

        <TabsContent value="exports" className="mt-0">
          <TabPlaceholder
            icon={FileBox}
            text="Audit pack exports coming in Phase 4"
            sub="Download CSV and PDF audit packs with coverage metrics, N/A rationale, and open gaps."
          />
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
