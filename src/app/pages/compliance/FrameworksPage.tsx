import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { controlsService } from "@/services/api/controls";
import { testsService } from "@/services/api/tests";
import { policiesService } from "@/services/api/policies";
import { FrameworkSuiteLibrary } from "@/app/components/compliance/FrameworkSuiteLibrary";
import {
  ShieldCheck, CheckCircle2, AlertCircle, XCircle, Loader2,
  FileText, FlaskConical, BookOpen, TrendingUp, Target, Activity,
  ClipboardList, LayoutGrid,
} from "lucide-react";

interface ComplianceStats {
  total: number;
  implemented: number;
  partiallyImplemented: number;
  notImplemented: number;
  compliancePercentage: number;
}

const FRAMEWORKS = [
  {
    id: "iso27001",
    name: "ISO 27001:2022",
    subtitle: "Information Security Management",
    icon: ShieldCheck,
    color: "bg-blue-600",
    status: "Active",
    clauses: [
      { ref: "A.5", title: "Organisational controls", count: 37 },
      { ref: "A.6", title: "People controls", count: 8 },
      { ref: "A.7", title: "Physical controls", count: 14 },
      { ref: "A.8", title: "Technological controls", count: 34 },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 Type II",
    subtitle: "Trust Services Criteria",
    icon: Target,
    color: "bg-violet-600",
    status: "In Progress",
    clauses: [
      { ref: "CC1", title: "Control Environment", count: 6 },
      { ref: "CC2", title: "Communication & Information", count: 5 },
      { ref: "CC3", title: "Risk Assessment", count: 4 },
      { ref: "CC6", title: "Logical Access Controls", count: 9 },
      { ref: "CC7", title: "System Operations", count: 5 },
    ],
  },
  {
    id: "nist",
    name: "NIST CSF 2.0",
    subtitle: "Cybersecurity Framework",
    icon: Activity,
    color: "bg-emerald-600",
    status: "In Progress",
    clauses: [
      { ref: "GV", title: "Govern", count: 6 },
      { ref: "ID", title: "Identify", count: 21 },
      { ref: "PR", title: "Protect", count: 25 },
      { ref: "DE", title: "Detect", count: 8 },
      { ref: "RS", title: "Respond", count: 17 },
      { ref: "RC", title: "Recover", count: 6 },
    ],
  },
  {
    id: "hipaa",
    name: "HIPAA",
    subtitle: "Health Information Privacy",
    icon: ClipboardList,
    color: "bg-rose-600",
    status: "In Progress",
    clauses: [
      { ref: "164.308", title: "Administrative Safeguards", count: 9 },
      { ref: "164.310", title: "Physical Safeguards", count: 4 },
      { ref: "164.312", title: "Technical Safeguards", count: 5 },
      { ref: "164.316", title: "Policies & Procedures", count: 2 },
    ],
  },
];

function MetricCard({
  label, value, sub, icon: Icon, tone = "default",
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; tone?: "default" | "success" | "warn" | "danger";
}) {
  const colors = {
    default: "bg-slate-50 border-slate-200 text-slate-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warn: "bg-amber-50 border-amber-200 text-amber-700",
    danger: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-2xl border p-5 flex items-start gap-4 ${colors[tone]}`}>
      <div className="rounded-xl bg-white/70 p-2.5 border border-white/40">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
        {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

function FrameworkCard({ fw, stats, loading }: {
  fw: typeof FRAMEWORKS[0];
  stats: ComplianceStats | null;
  loading: boolean;
}) {
  const Icon = fw.icon;
  const pct = stats?.compliancePercentage ?? 0;
  const statusVariant: "default" | "secondary" | "outline" =
    pct === 100 ? "default" : pct >= 70 ? "secondary" : "outline";

  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${fw.color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{fw.name}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{fw.subtitle}</p>
            </div>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0 mt-1" />
          ) : (
            <Badge variant={statusVariant}>{fw.id === "iso27001" ? (pct === 100 ? "Certified" : pct >= 70 ? "Active" : "In Progress") : fw.status}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fw.id === "iso27001" && stats && (
          <>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Overall compliance</span>
                <span className="font-semibold text-gray-900">{pct.toFixed(1)}%</span>
              </div>
              <Progress value={pct} className="h-2.5" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">{stats.implemented}</p>
                  <p className="text-green-700">Implemented</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">{stats.partiallyImplemented}</p>
                  <p className="text-amber-700">Partial</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">{stats.notImplemented}</p>
                  <p className="text-red-700">Not implemented</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <ShieldCheck className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">{stats.total}</p>
                  <p className="text-slate-600">Total controls</p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}
        {fw.id !== "iso27001" && (
          <>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Coverage progress</span>
                <span className="font-semibold text-gray-900">—</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gray-300 w-[30%]" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Connect integrations to measure control coverage</p>
            </div>
            <Separator />
          </>
        )}
        <div className="divide-y divide-gray-50">
          {fw.clauses.map(cl => (
            <div key={cl.ref} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400 w-10 flex-shrink-0">{cl.ref}</span>
                <span className="text-gray-700">{cl.title}</span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{cl.count} controls</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FrameworksPage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    controlsService.getControlCompliance().then(r => {
      const d = (r as any)?.data ?? r;
      setStats(d);
    }).catch(() => {}).finally(() => setStatsLoading(false));
  }, []);

  const { data: tests = [] } = useQuery({
    queryKey: ["tests", "list", {}],
    queryFn: async () => {
      const r = await testsService.listTests({ limit: 999 });
      return r.data ?? [];
    },
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies", "list", {}],
    queryFn: async () => {
      const r = await policiesService.getPolicies();
      return r.data ?? [];
    },
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["controls", "list", {}],
    queryFn: async () => {
      const r = await controlsService.getControls({ limit: 999 } as any);
      return r.data ?? [];
    },
  });

  const implemented = controls.filter((c: any) => c.status === "IMPLEMENTED").length;
  const partialPct = stats ? Math.round((stats.partiallyImplemented / stats.total) * 100) : 0;
  const testPassPct = tests.length ? Math.round((tests.filter((t: any) => t.status === "OK").length / tests.length) * 100) : 0;
  const publishedPolicies = policies.filter((p: any) => p.status === "PUBLISHED").length;

  return (
    <PageTemplate
      title="Compliance Frameworks"
      description="Enterprise GRC — track compliance posture, controls, tests, and policies across all active frameworks."
    >
      {/* ── Top KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Control Coverage" value={`${stats?.compliancePercentage?.toFixed(0) ?? "—"}%`} sub={`${implemented} of ${stats?.total ?? "—"} controls`} icon={ShieldCheck} tone={!stats ? "default" : stats.compliancePercentage >= 70 ? "success" : "warn"} />
        <MetricCard label="Tests Passing" value={`${testPassPct}%`} sub={`${tests.filter((t: any) => t.status === "OK").length} of ${tests.length} tests`} icon={FlaskConical} tone={testPassPct >= 70 ? "success" : testPassPct > 0 ? "warn" : "default"} />
        <MetricCard label="Policies Published" value={publishedPolicies} sub={`${policies.length} total policies`} icon={FileText} tone={publishedPolicies > 0 ? "success" : "default"} />
        <MetricCard label="Partial / Gap Controls" value={stats?.partiallyImplemented ?? "—"} sub={`${partialPct}% partially implemented`} icon={AlertCircle} tone={partialPct > 30 ? "warn" : "default"} />
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="rounded-xl bg-slate-100 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Frameworks
          </TabsTrigger>
          <TabsTrigger value="suites" className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Available Suites
          </TabsTrigger>
          <TabsTrigger value="posture" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Posture
          </TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ISO 27001 hero */}
            <FrameworkCard fw={FRAMEWORKS[0]} stats={stats} loading={statsLoading} />

            {/* Cross-framework summary */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">GRC Health Snapshot</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Live view across all compliance pillars</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Controls Implemented", pct: stats?.compliancePercentage ?? 0, color: "bg-blue-500" },
                  { label: "Tests Passing", pct: testPassPct, color: "bg-emerald-500" },
                  { label: "Policies Published", pct: policies.length ? Math.round((publishedPolicies / policies.length) * 100) : 0, color: "bg-violet-500" },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{row.label}</span>
                      <span className="font-semibold text-gray-900">{row.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color} transition-all duration-500`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Overdue tests</p>
                    <p className="font-semibold text-red-600 text-lg">{tests.filter((t: any) => t.status === "Overdue").length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Due soon</p>
                    <p className="font-semibold text-amber-600 text-lg">{tests.filter((t: any) => t.status === "Due_soon").length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Controls not implemented</p>
                    <p className="font-semibold text-red-600 text-lg">{stats?.notImplemented ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Draft policies</p>
                    <p className="font-semibold text-gray-700 text-lg">{policies.filter((p: any) => p.status === "DRAFT").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-framework mini cards */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Frameworks in Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-50">
                {FRAMEWORKS.map(fw => {
                  const Icon = fw.icon;
                  return (
                    <div key={fw.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${fw.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fw.name}</p>
                          <p className="text-xs text-gray-400">{fw.subtitle}</p>
                        </div>
                      </div>
                      <Badge variant={fw.id === "iso27001" && stats?.compliancePercentage >= 70 ? "secondary" : "outline"}>
                        {fw.id === "iso27001" ? (stats?.compliancePercentage >= 70 ? "Active" : "In Progress") : fw.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Frameworks tab ── */}
        <TabsContent value="frameworks" className="mt-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {FRAMEWORKS.map(fw => (
              <FrameworkCard key={fw.id} fw={fw} stats={fw.id === "iso27001" ? stats : null} loading={fw.id === "iso27001" ? statsLoading : false} />
            ))}
          </div>
        </TabsContent>

        {/* ── Available Suites tab ── */}
        <TabsContent value="suites" className="mt-0">
          <FrameworkSuiteLibrary
            title="Framework Test Suites"
            description="Instantly provision tests, controls, and evidence workflows for each framework. Activating a suite seeds tests, links them to ISO controls, and sets up recurring cadences."
          />
        </TabsContent>

        {/* ── Posture tab ── */}
        <TabsContent value="posture" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700 uppercase tracking-wide">Tests by Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Passing", key: "OK", color: "bg-green-500" },
                  { label: "Overdue", key: "Overdue", color: "bg-red-500" },
                  { label: "Due Soon", key: "Due_soon", color: "bg-amber-500" },
                  { label: "Needs Remediation", key: "Needs_remediation", color: "bg-orange-500" },
                ].map(row => {
                  const count = tests.filter((t: any) => t.status === row.key).length;
                  const pct = tests.length ? Math.round((count / tests.length) * 100) : 0;
                  return (
                    <div key={row.key}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{row.label}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700 uppercase tracking-wide">Tests by Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["Document", "Automated", "Pipeline"].map(type => {
                  const count = tests.filter((t: any) => t.type === type).length;
                  const pct = tests.length ? Math.round((count / tests.length) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{type}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700 uppercase tracking-wide">Policies by Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["PUBLISHED", "DRAFT", "REVIEW", "ARCHIVED"].map(status => {
                  const count = policies.filter((p: any) => p.status === status).length;
                  const pct = policies.length ? Math.round((count / policies.length) * 100) : 0;
                  const colors: Record<string, string> = {
                    PUBLISHED: "bg-green-500", DRAFT: "bg-gray-400",
                    REVIEW: "bg-amber-500", ARCHIVED: "bg-red-400",
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="capitalize">{status.toLowerCase()}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[status]} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
