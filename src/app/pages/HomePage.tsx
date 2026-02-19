import { useEffect, useState } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useNavigate } from "react-router";
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
} from "lucide-react";
import { controlsService } from "@/services/api/controls";
import { risksService } from "@/services/api/risks";

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
  byImpact: { impact: string; count: number }[];
}

export function HomePage() {
  const navigate = useNavigate();
  const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [riskOverview, setRiskOverview] = useState<RiskOverview | null>(null);
  const [loadingRisks, setLoadingRisks] = useState(true);

  useEffect(() => {
    controlsService.getControlCompliance().then((res: any) => {
      const data = res?.data ?? res;
      setCompliance(data);
    }).catch((err: any) => {
      if (err?.statusCode === 401) window.location.href = "/login";
    }).finally(() => setLoadingCompliance(false));

    risksService.getRisksOverview().then((res: any) => {
      setRiskOverview(res?.data ?? res);
    }).catch(() => {}).finally(() => setLoadingRisks(false));
  }, []);

  const recentActivity = [
    { action: "SOC 2 Type II audit completed", time: "2 hours ago", status: "success" },
    { action: "New vulnerability detected in API service", time: "5 hours ago", status: "warning" },
    { action: "Policy updated: Data Retention Policy", time: "1 day ago", status: "info" },
    { action: "Risk assessment approved by CFO", time: "2 days ago", status: "success" },
  ];

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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Overview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/compliance/frameworks")}
              >
                View All
              </Button>
            </div>

            {loadingCompliance ? (
              <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading compliance data…
              </div>
            ) : !compliance ? (
              <p className="text-sm text-gray-400 py-6">Could not load compliance data.</p>
            ) : (
              <div className="space-y-4">
                {/* ISO 27001 — fully implemented */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">ISO 27001:2022 — Implemented</span>
                    <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Partially implemented */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">ISO 27001:2022 — Partial</span>
                    <span className="text-xs text-gray-500">{partialPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${partialPct}%` }}
                    />
                  </div>
                </div>

                {/* Not implemented */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">ISO 27001:2022 — Not implemented</span>
                    <span className="text-xs text-gray-500">{notPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-400 h-2 rounded-full transition-all"
                      style={{ width: `${notPct}%` }}
                    />
                  </div>
                </div>

                {/* Summary counts */}
                <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
                  <span>{compliance.implemented} implemented</span>
                  <span>{compliance.partiallyImplemented} partial</span>
                  <span>{compliance.notImplemented} not implemented</span>
                  <span className="font-medium text-gray-700">{compliance.total} total</span>
                </div>
              </div>
            )}
          </Card>

          {/* Recent Activity — static, unchanged */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Risk Distribution — live from /api/risks/overview */}
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={() => navigate("/risk/risks")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Risk Distribution</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            {loadingRisks ? (
              <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading risk data…
              </div>
            ) : !riskOverview ? (
              <p className="text-sm text-gray-400 py-6">Could not load risk data.</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const colorMap: Record<string, string> = {
                    CRITICAL: "bg-red-500",
                    HIGH: "bg-orange-500",
                    MEDIUM: "bg-yellow-500",
                    LOW: "bg-green-500",
                  };
                  const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
                  const byImpact = riskOverview.byImpact ?? [];
                  // Ensure all four levels appear even if count is 0
                  const rows = order.map((level) => {
                    const found = byImpact.find((r) => r.impact === level);
                    return { level, count: found?.count ?? 0, color: colorMap[level] ?? "bg-gray-400" };
                  });
                  return rows.map((risk) => (
                    <div key={risk.level} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                      <span className="text-sm text-gray-700 flex-1 capitalize">{risk.level.charAt(0) + risk.level.slice(1).toLowerCase()}</span>
                      <span className="text-sm font-semibold text-gray-900">{risk.count}</span>
                    </div>
                  ));
                })()}
                <div className="pt-2 border-t text-xs text-gray-500 flex justify-between">
                  <span>{riskOverview.open} open</span>
                  <span>{riskOverview.mitigated} mitigated</span>
                  <span>{riskOverview.total} total</span>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions — static, unchanged */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
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
