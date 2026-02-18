import { useEffect, useState } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Separator } from "@/app/components/ui/separator";
import { controlsService } from "@/services/api/controls";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface ComplianceStats {
  total: number;
  implemented: number;
  partiallyImplemented: number;
  notImplemented: number;
  compliancePercentage: number;
}

function StatChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function FrameworksPage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await controlsService.getControlCompliance() as any;
        const data = response?.data ?? response;
        setStats(data);
      } catch (err: any) {
        if (err?.statusCode === 401) {
          window.location.href = "/login";
          return;
        }
        setError(err?.message || "Failed to load compliance data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const pct = stats?.compliancePercentage ?? 0;
  const partialPct = stats ? Math.round((stats.partiallyImplemented / stats.total) * 100) : 0;

  // Derive a status label from the compliance percentage
  const statusLabel =
    pct === 100 ? "Certified" : pct >= 70 ? "Active" : "In Progress";
  const statusVariant: "default" | "secondary" | "outline" =
    pct === 100 ? "default" : pct >= 70 ? "secondary" : "outline";

  return (
    <PageTemplate
      title="Compliance Frameworks"
      description="Track compliance against active security and regulatory frameworks."
    >
      {/* ── ISO 27001:2022 hero card ── */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">ISO 27001:2022</CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">
                  Information security management system standard
                </p>
              </div>
            </div>
            <Badge variant={statusVariant} className="mt-1">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <Separator />

          {/* Progress bar */}
          {loading ? (
            <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading compliance data…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-4 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ) : (
            <>
              {/* Main progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    Overall compliance (fully implemented)
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <Progress value={pct} className="h-3" />
              </div>

              {/* Partial progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-500">
                    Partially implemented
                  </span>
                  <span className="text-sm text-gray-600">
                    {partialPct}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: `${partialPct}%` }}
                  />
                </div>
              </div>

              <Separator />

              {/* Stat chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatChip
                  icon={ShieldCheck}
                  label="Total controls"
                  value={stats!.total}
                  color="text-blue-600"
                />
                <StatChip
                  icon={CheckCircle2}
                  label="Implemented"
                  value={stats!.implemented}
                  color="text-green-600"
                />
                <StatChip
                  icon={AlertCircle}
                  label="Partial"
                  value={stats!.partiallyImplemented}
                  color="text-amber-500"
                />
                <StatChip
                  icon={XCircle}
                  label="Not implemented"
                  value={stats!.notImplemented}
                  color="text-red-500"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Annex A clause breakdown ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Annex A — Control clauses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {[
              { clause: "A.5", title: "Organisational controls", count: 37 },
              { clause: "A.6", title: "People controls", count: 8 },
              { clause: "A.7", title: "Physical controls", count: 14 },
              { clause: "A.8", title: "Technological controls", count: 34 },
            ].map((row) => (
              <div
                key={row.clause}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-400 w-8">
                    {row.clause}
                  </span>
                  <span className="text-gray-800">{row.title}</span>
                </div>
                <span className="text-gray-500">{row.count} controls</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
