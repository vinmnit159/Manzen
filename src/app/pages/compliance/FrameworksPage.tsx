import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { ActivationSummaryDto } from "@/services/api/frameworks";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { Separator } from "@/app/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  ShieldCheck, Target, Activity, ClipboardList, Plus, ArrowRight,
  Loader2, Lock, AlertTriangle, CheckCircle2, Archive, BookOpen,
} from "lucide-react";
import { frameworksService, type OrgFrameworkDto, type FrameworkDto } from "@/services/api/frameworks";

// ── Framework icon / color catalog (static metadata) ─────────────────────────
const FRAMEWORK_META: Record<string, { icon: React.ElementType; color: string; description: string; requirementCount: number }> = {
  'iso-27001': {
    icon: ShieldCheck,
    color: "bg-blue-600",
    description: "International standard for information security management systems (ISMS). 93 Annex A controls across 4 themes.",
    requirementCount: 93,
  },
  'soc-2': {
    icon: Target,
    color: "bg-violet-600",
    description: "AICPA Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.",
    requirementCount: 32,
  },
  'nist-csf': {
    icon: Activity,
    color: "bg-emerald-600",
    description: "NIST Cybersecurity Framework 2.0 — 6 functions, 22 categories, 106 subcategories.",
    requirementCount: 106,
  },
  'hipaa': {
    icon: ClipboardList,
    color: "bg-rose-600",
    description: "HIPAA Security Rule safeguards for electronic protected health information (ePHI).",
    requirementCount: 20,
  },
};

function getFrameworkMeta(slug: string) {
  return FRAMEWORK_META[slug] ?? {
    icon: BookOpen,
    color: "bg-gray-600",
    description: "Compliance framework",
    requirementCount: 0,
  };
}

// ── Status badge helper ───────────────────────────────────────────────────────
function statusBadge(status: OrgFrameworkDto['status']) {
  if (status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
  if (status === 'setup_in_progress') return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Setting up</Badge>;
  return <Badge variant="outline" className="text-gray-500">Archived</Badge>;
}

// ── Active framework card ─────────────────────────────────────────────────────
function ActiveFrameworkCard({ orgFw, onRemove }: {
  orgFw: OrgFrameworkDto;
  onRemove: (orgFw: OrgFrameworkDto) => void;
}) {
  const navigate = useNavigate();
  const meta = getFrameworkMeta(orgFw.frameworkSlug);
  const Icon = meta.icon;

  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{orgFw.frameworkName}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">v{orgFw.frameworkVersion}</p>
            </div>
          </div>
          {statusBadge(orgFw.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Coverage</span>
            <span className="font-semibold text-gray-900">—%</span>
          </div>
          <Progress value={0} className="h-2" />
          <p className="text-[11px] text-gray-400 mt-1">Coverage data populates after Phase 4</p>
        </div>
        {orgFw.activatedAt && (
          <p className="text-xs text-gray-400">
            Activated {new Date(orgFw.activatedAt).toLocaleDateString()}
          </p>
        )}
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/compliance/frameworks/${orgFw.frameworkSlug}`)}
          >
            View readiness <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-red-600"
            onClick={() => onRemove(orgFw)}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Available framework card ──────────────────────────────────────────────────
function AvailableFrameworkCard({ fw, entitled, onActivate, activating }: {
  fw: FrameworkDto;
  entitled: boolean;
  onActivate: (fw: FrameworkDto) => void;
  activating: boolean;
}) {
  const meta = getFrameworkMeta(fw.slug);
  const Icon = meta.icon;

  return (
    <Card className="border-gray-200 shadow-sm opacity-90">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm leading-tight">{fw.name}</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">v{fw.version} · {meta.requirementCount} requirements</p>
          </div>
          {!entitled && <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-gray-500 leading-relaxed">{fw.description ?? meta.description}</p>
        <Button
          size="sm"
          variant={entitled ? "default" : "outline"}
          className="w-full"
          disabled={!entitled || activating}
          onClick={() => entitled && onActivate(fw)}
        >
          {activating ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Activating…</>
          ) : entitled ? (
            <><Plus className="w-3.5 h-3.5 mr-1.5" /> Add to scope</>
          ) : (
            <><Lock className="w-3.5 h-3.5 mr-1.5" /> Upgrade to add</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Remove-from-scope dialog ──────────────────────────────────────────────────
function RemoveDialog({ orgFw, onClose, onConfirm, loading }: {
  orgFw: OrgFrameworkDto | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  if (!orgFw) return null;
  return (
    <Dialog open={!!orgFw} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Remove from active scope?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 pt-1">
            <strong>{orgFw.frameworkName}</strong> will be moved to Archived.
            All controls, tests, policies, evidence, and historical reports will be preserved.
            This framework can be re-added at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          <Label htmlFor="reason" className="text-sm font-medium">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="e.g. Pausing audit cycle for this quarter…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Remove from active scope
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FrameworksPage() {
  const qc = useQueryClient();
  const [removingFw, setRemovingFw] = useState<OrgFrameworkDto | null>(null);
  const [activatingSlug, setActivatingSlug] = useState<string | null>(null);

  const { data: catalogRes, isLoading: catalogLoading } = useQuery({
    queryKey: ['frameworks', 'catalog'],
    queryFn: () => frameworksService.listCatalog(),
  });

  const { data: orgFwRes, isLoading: orgFwLoading } = useQuery({
    queryKey: ['frameworks', 'org'],
    queryFn: () => frameworksService.listOrgFrameworks(),
  });

  const catalog: FrameworkDto[] = catalogRes?.data ?? [];
  const orgFrameworks: OrgFrameworkDto[] = orgFwRes?.data ?? [];

  // Slugs already active for this org
  const activeSlugSet = new Set(orgFrameworks.map(f => f.frameworkSlug));

  // Available = in catalog but not yet active for this org
  const available = catalog.filter(fw => !activeSlugSet.has(fw.slug));

  const activateMutation = useMutation({
    mutationFn: (fw: FrameworkDto) => frameworksService.activateFramework({ frameworkSlug: fw.slug }),
    onMutate: (fw) => setActivatingSlug(fw.slug),
    onSuccess: (res, fw) => {
      qc.invalidateQueries({ queryKey: ['frameworks', 'org'] });
      // Redirect to activation summary screen
      navigate(`/compliance/frameworks/${fw.slug}/activated`, {
        state: {
          summary: (res as any).summary as ActivationSummaryDto,
          orgFramework: res.data,
        },
      });
    },
    onError: () => {
      setActivatingSlug(null);
    },
    onSettled: () => {
      setActivatingSlug(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      frameworksService.removeFramework(slug, { reason }),
    onSettled: () => {
      setRemovingFw(null);
      qc.invalidateQueries({ queryKey: ['frameworks', 'org'] });
    },
  });

  const loading = catalogLoading || orgFwLoading;

  return (
    <PageTemplate
      title="Compliance Frameworks"
      description="Manage which compliance frameworks are in scope for your organization."
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && (
        <div className="space-y-10">
          {/* ── Active frameworks ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Active Frameworks
                  {orgFrameworks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{orgFrameworks.length}</Badge>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Frameworks currently in scope. Dashboards, filters, and reports are built around these.
                </p>
              </div>
            </div>

            {orgFrameworks.length === 0 ? (
              <Card className="border-dashed border-gray-300 bg-gray-50">
                <CardContent className="py-12 text-center">
                  <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">No frameworks in scope yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add a framework from the Available section below to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {orgFrameworks.map(fw => (
                  <ActiveFrameworkCard
                    key={fw.id}
                    orgFw={fw}
                    onRemove={setRemovingFw}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Available frameworks ── */}
          {available.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  Available Frameworks
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add a framework to start tracking requirements, mappings, and coverage.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {available.map(fw => (
                  <AvailableFrameworkCard
                    key={fw.id}
                    fw={fw}
                    entitled={true} /* Phase 5 will gate this via entitlement check */
                    onActivate={(f) => activateMutation.mutate(f)}
                    activating={activatingSlug === fw.slug}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Remove dialog */}
      <RemoveDialog
        orgFw={removingFw}
        onClose={() => setRemovingFw(null)}
        onConfirm={(reason) => removingFw && removeMutation.mutate({ slug: removingFw.frameworkSlug, reason })}
        loading={removeMutation.isPending}
      />
    </PageTemplate>
  );
}
