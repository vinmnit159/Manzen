import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Users,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { controlsService } from "@/services/api/controls";
import { risksService } from "@/services/api/risks";
import { activityLogsService, ActivityLogEntry } from "@/services/api/activityLogs";
import { QK } from "@/lib/queryKeys";
import { STALE } from "@/lib/queryClient";

interface ComplianceStats {
  total: number;
  implemented: number;
  partiallyImplemented: number;
  notImplemented: number;
  compliancePercentage: number;
}

interface RiskOverview {
  total: number;
  open: number;
  mitigated: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: complianceRaw, isLoading: loadingCompliance, isFetching: fetchingCompliance } =
    useQuery({
      queryKey: QK.complianceStats(),
      queryFn: async () => {
        const res: any = await controlsService.getControlCompliance();
        return (res?.data ?? res) as ComplianceStats;
      },
      staleTime: STALE.DASHBOARD,
      retry: (count, err: any) => {
        if (err?.statusCode === 401) { window.location.href = '/login'; return false; }
        return count < 1;
      },
    });

  const { data: riskRaw, isLoading: loadingRisks } =
    useQuery({
      queryKey: QK.riskOverview(),
      queryFn: async () => {
        const res: any = await risksService.getRisksOverview();
        return (res?.data ?? res) as RiskOverview;
      },
      staleTime: STALE.DASHBOARD,
    });

  const { data: activityRaw, isLoading: loadingActivity } =
    useQuery({
      queryKey: QK.activityLog(8),
      queryFn: async () => {
        const res: any = await activityLogsService.getRecentActivity(8);
        return (res?.data ?? []) as ActivityLogEntry[];
      },
      staleTime: STALE.ACTIVITY,
    });

  const compliance    = complianceRaw ?? null;
  const riskOverview  = riskRaw ?? null;
  const recentActivity = activityRaw ?? [];

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: QK.complianceStats() });
    qc.invalidateQueries({ queryKey: QK.riskOverview() });
    qc.invalidateQueries({ queryKey: QK.activityLog(8) });
  };

  // Derived display values — fall back to skeleton dashes while loading
  const complianceScore = loadingCompliance
    ? null
    : compliance
    ? `${compliance.compliancePercentage.toFixed(1)}%`
    : "—";

  const activeControls = loadingCompliance
    ? null
    : compliance
    ? String(compliance.total)
    : "—";

  const openRisks = loadingRisks
    ? null
    : riskOverview
    ? String(riskOverview.open)
    : "—";

  const stats = [
    {
      label: "Active Controls",
      value: activeControls,
      change: null,
      icon: Shield,
      color: "text-blue-600",
      path: "/compliance/controls",
    },
    {
      label: "Open Risks",
      value: openRisks,
      change: null,
      icon: AlertTriangle,
      color: "text-red-600",
      path: "/risk/risks",
    },
    {
      label: "Compliance Score",
      value: complianceScore,
      change: null,
      icon: CheckCircle,
      color: "text-green-600",
      path: "/compliance/frameworks",
    },
    {
      label: "Pending Tasks",
      value: "23",
      change: "-5",
      icon: Clock,
      color: "text-orange-600",
      path: "/tests",
    },
  ];

  const pct = compliance?.compliancePercentage ?? 0;
  const partialPct = compliance
    ? Math.round((compliance.partiallyImplemented / compliance.total) * 100)
    : 0;
  const notPct = compliance
    ? Math.round((compliance.notImplemented / compliance.total) * 100)
    : 0;

  return (
    <PageTemplate
      title="Dashboard"
      description="Welcome back! Here's an overview of your security posture."
      actions={
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={fetchingCompliance}>
          <RefreshCw className={`w-4 h-4 mr-2 ${fetchingCompliance ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isLive = stat.value === null; // still loading
            return (
              <Card
                key={stat.label}
                className="p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => navigate(stat.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                  {stat.change !== null && (
                    <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                  )}
                </div>
                {isLive ? (
                  <div className="flex items-center gap-2 h-9 mb-1">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                )}
                <div className="text-sm text-gray-600">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid — all four panels share equal height via `items-start` removed;
            each card is flex-col so headers stay fixed and bodies fill remaining space */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:grid-rows-2">

          {/* ── Compliance Overview ── */}
          <Card className="p-6 flex flex-col h-72">
            {/* fixed header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Overview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/compliance/frameworks")}
              >
                View All
              </Button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingCompliance ? (
                <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading compliance data…
                </div>
              ) : !compliance ? (
                <p className="text-sm text-gray-400 py-6">Could not load compliance data.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">ISO 27001:2022 — Implemented</span>
                      <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">ISO 27001:2022 — Partial</span>
                      <span className="text-xs text-gray-500">{partialPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${partialPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">ISO 27001:2022 — Not implemented</span>
                      <span className="text-xs text-gray-500">{notPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${notPct}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
                    <span>{compliance.implemented} implemented</span>
                    <span>{compliance.partiallyImplemented} partial</span>
                    <span>{compliance.notImplemented} not implemented</span>
                    <span className="font-medium text-gray-700">{compliance.total} total</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ── Recent Activity ── */}
          <Card className="p-6 flex flex-col h-72">
            {/* fixed header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>

            {/* scrollable body — only this area scrolls */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {loadingActivity ? (
                <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading activity…
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  No activity yet. Actions like creating risks, policies, or uploading files will appear here.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'warning' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-snug">{activity.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {activity.user.name} · {activity.timeAgo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* ── Risk Distribution ── */}
          <Card className="p-6 flex flex-col h-72 cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={() => navigate("/risk/risks")}>
            {/* fixed header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Risk Distribution</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingRisks ? (
                <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading risk data…
                </div>
              ) : !riskOverview ? (
                <p className="text-sm text-gray-400 py-6">Could not load risk data.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { level: "Critical", count: riskOverview.critical, color: "bg-red-500" },
                    { level: "High",     count: riskOverview.high,     color: "bg-orange-500" },
                    { level: "Medium",   count: riskOverview.medium,   color: "bg-yellow-500" },
                    { level: "Low",      count: riskOverview.low,      color: "bg-green-500" },
                  ].map((risk) => (
                    <div key={risk.level} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                      <span className="text-sm text-gray-700 flex-1">{risk.level}</span>
                      <span className="text-sm font-semibold text-gray-900">{risk.count}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-xs text-gray-500 flex justify-between">
                    <span>{riskOverview.open} open</span>
                    <span>{riskOverview.mitigated} mitigated</span>
                    <span>{riskOverview.total} total</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ── Quick Actions ── */}
          <Card className="p-6 flex flex-col h-72">
            {/* fixed header */}
            <div className="shrink-0 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>

            {/* body — fills remaining height, grid centres itself naturally */}
            <div className="flex-1 grid grid-cols-2 gap-3 content-start">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/compliance/policies")}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm">New Policy</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/tests")}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm">Run Test</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/reports")}
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Report Risk</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/vendors")}
              >
                <Users className="w-5 h-5" />
                <span className="text-sm">Add Vendor</span>
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </PageTemplate>
  );
}
