import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
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
  LayoutDashboard, ListChecks, Link2, FileBox, Gauge, ThumbsUp, ThumbsDown,
  ExternalLink,
} from "lucide-react";
import {
  frameworksService,
  type RequirementStatusDto,
  type CoverageSnapshotDto,
  type ControlMappingDto,
  type TestMappingDto,
  type PolicyMappingDto,
} from "@/services/api/frameworks";

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

function mappingTypeBadge(type: string) {
  if (type === 'direct')    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Confirmed</Badge>;
  if (type === 'inherited') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Inherited</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Suggested</Badge>;
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

// ── Controls tab ──────────────────────────────────────────────────────────────
function ControlsTab({ slug }: { slug: string }) {
  const qc = useQueryClient();

  const { data: mappingsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });

  const controlMappings: ControlMappingDto[] = mappingsRes?.data?.controls ?? [];

  const confirmMutation = useMutation({
    mutationFn: (mapping: ControlMappingDto) =>
      frameworksService.confirmMapping(slug, { mappingType: 'control', mappingId: mapping.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['frameworks', 'mappings', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
    },
  });

  if (isLoading) return <TabPlaceholder icon={ShieldCheck} text="Loading control mappings…" />;

  if (controlMappings.length === 0) {
    return (
      <TabPlaceholder
        icon={ShieldCheck}
        text="No control mappings yet"
        sub="Control mappings are created during framework activation. Activate this framework or add controls in the Controls section."
      />
    );
  }

  const suggested = controlMappings.filter(m => m.mappingType === 'suggested');
  const confirmed = controlMappings.filter(m => m.mappingType !== 'suggested');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{controlMappings.length} total mappings · {suggested.length} pending review · {confirmed.length} confirmed</span>
      </div>

      {/* Suggested (pending review) */}
      {suggested.length > 0 && (
        <Card className="border-amber-100">
          <CardHeader className="py-3 px-4 bg-amber-50 border-b border-amber-100">
            <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Suggested Mappings — Needs Review ({suggested.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-50">
              {suggested.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-500 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-400">Control ID: <span className="font-mono">{mapping.controlId}</span></p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {mappingTypeBadge(mapping.mappingType)}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => confirmMutation.mutate(mapping)}
                      disabled={confirmMutation.isPending}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" /> Confirm
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <Card className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Confirmed Mappings ({confirmed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {confirmed.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-500 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-400">Control ID: <span className="font-mono">{mapping.controlId}</span></p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {mappingTypeBadge(mapping.mappingType)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tests tab ─────────────────────────────────────────────────────────────────
function TestsTab({ slug }: { slug: string }) {
  const { data: mappingsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });

  const testMappings: TestMappingDto[] = mappingsRes?.data?.tests ?? [];

  if (isLoading) return <TabPlaceholder icon={FlaskConical} text="Loading test mappings…" />;

  if (testMappings.length === 0) {
    return (
      <TabPlaceholder
        icon={FlaskConical}
        text="No test mappings yet"
        sub="Tests are linked to framework requirements at activation based on existing test-framework associations."
      />
    );
  }

  // Group by requirement domain
  const byDomain = testMappings.reduce<Record<string, TestMappingDto[]>>((acc, m) => {
    const d = m.requirementDomain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">{testMappings.length} test mappings across {Object.keys(byDomain).length} domain(s)</div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <FlaskConical className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-700 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-400">Test ID: <span className="font-mono">{mapping.testId}</span></p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{new Date(mapping.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Policies tab ──────────────────────────────────────────────────────────────
function PoliciesTab({ slug }: { slug: string }) {
  const { data: mappingsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });

  const policyMappings: PolicyMappingDto[] = mappingsRes?.data?.policies ?? [];

  if (isLoading) return <TabPlaceholder icon={FileText} text="Loading policy mappings…" />;

  if (policyMappings.length === 0) {
    return (
      <TabPlaceholder
        icon={FileText}
        text="No policy mappings yet"
        sub="Policy mappings are suggested at activation based on policy names matching framework requirement domains."
      />
    );
  }

  const byDomain = policyMappings.reduce<Record<string, PolicyMappingDto[]>>((acc, m) => {
    const d = m.requirementDomain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">{policyMappings.length} policy mappings</div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(mapping => (
                <div key={mapping.id} className="flex items-start gap-3 px-4 py-3">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">{mapping.requirementCode}</span>
                      <span className="text-xs text-gray-700 truncate">{mapping.requirementTitle}</span>
                    </div>
                    <p className="text-xs text-gray-400">Policy ID: <span className="font-mono">{mapping.policyId}</span></p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{new Date(mapping.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Gaps tab ──────────────────────────────────────────────────────────────────
function GapsTab({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const [ownerDialog, setOwnerDialog] = useState<RequirementStatusDto | null>(null);
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });
  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];
  const gaps = reqs.filter(r => r.applicabilityStatus === 'applicable' && !r.ownerId);

  const ownerMutation = useMutation({
    mutationFn: (r: RequirementStatusDto) =>
      frameworksService.updateRequirementOwner(r.id, {
        ownerId: ownerInput || null,
        dueDate: dueDateInput || null,
      }),
    onSuccess: () => {
      setOwnerDialog(null);
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
    },
  });

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
      <p className="text-xs text-gray-500">{gaps.length} applicable requirements without an owner — click a row to assign</p>
      <Card className="border-gray-100">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {gaps.map(req => (
              <div
                key={req.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50/40 cursor-pointer transition-colors"
                onClick={() => {
                  setOwnerDialog(req);
                  setOwnerInput(req.ownerId ?? '');
                  setDueDateInput(req.dueDate ? req.dueDate.substring(0, 10) : '');
                }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-mono text-xs text-gray-400 mr-2">{req.code}</span>
                    {req.title}
                  </p>
                  {req.domain && <p className="text-xs text-gray-400 mt-0.5">{req.domain}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {reviewBadge(req.reviewStatus)}
                  <Button size="sm" variant="outline" className="h-6 text-xs">
                    <User className="w-3 h-3 mr-1" /> Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <Label htmlFor="gap-owner" className="text-sm font-medium">Owner (user ID)</Label>
              <Input
                id="gap-owner"
                placeholder="e.g. user-uuid"
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gap-due" className="text-sm font-medium">Due date</Label>
              <Input
                id="gap-due"
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
              Assign Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const location = useLocation();

  // Support navigating to a specific tab via state (e.g. from Activation Summary)
  const defaultTab = (location.state as any)?.tab ?? 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Reset to the tab from state when navigating here from the summary
  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
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
          <ControlsTab slug={slug!} />
        </TabsContent>

        <TabsContent value="tests" className="mt-0">
          <TestsTab slug={slug!} />
        </TabsContent>

        <TabsContent value="policies" className="mt-0">
          <PoliciesTab slug={slug!} />
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
