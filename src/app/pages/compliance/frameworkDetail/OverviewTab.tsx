import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { frameworksService, type CoverageSnapshotDto } from '@/services/api/frameworks';
import { Gauge } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CoverageRing, TabPlaceholder } from './shared';

export function OverviewTab({ slug }: { slug: string }) {
  const { data: covRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'coverage', slug],
    queryFn: () => frameworksService.getCoverage(slug),
  });
  const { data: historyRes } = useQuery({
    queryKey: ['frameworks', 'coverage-history', slug],
    queryFn: () => frameworksService.getCoverageHistory(slug, 24),
  });
  const snap: CoverageSnapshotDto | null = covRes?.data ?? null;
  const history: CoverageSnapshotDto[] = historyRes?.data ?? [];

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
          <div className="flex flex-wrap items-center justify-around gap-8 py-4">
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

      {history.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Readiness over time</CardTitle>
            <p className="text-xs text-gray-400">Latest {history.length} append-only snapshots</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history.map((item) => ({
                    time: new Date(item.calculatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    controlCoveragePct: item.controlCoveragePct,
                    testPassRatePct: item.testPassRatePct,
                    openGaps: item.openGaps,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="controlCoveragePct" stroke="#2563eb" fill="#bfdbfe" name="Control coverage" />
                  <Area type="monotone" dataKey="testPassRatePct" stroke="#16a34a" fill="#bbf7d0" name="Test pass rate" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-gray-500">Open gaps now: <span className="font-medium text-gray-800">{snap.openGaps}</span></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
