import { useQuery } from '@tanstack/react-query';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';

export function RiskContextSection({ testId }: { testId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tests', 'risk-context', testId],
    queryFn: async () => {
      const res = await testsService.getRiskContext(testId);
      return res.data ?? null;
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading linked risk context...</p>;
  if (!data || (data.results.length === 0 && data.risks.length === 0)) return <p className="text-sm text-gray-400">No linked risk engine evaluation found.</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Linked risk engine test</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{data.linkedTest.riskEngineTestId ?? 'Not linked'}</p>
      </div>
      {data.results.slice(0, 3).map((result) => (
        <div key={result.id} className="rounded-lg border border-gray-100 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">{result.resourceName}</p>
            <span className="text-xs text-gray-500">{result.signalType}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{result.reason}</p>
        </div>
      ))}
      {data.risks.slice(0, 2).map((risk) => (
        <div key={risk.id} className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-sm font-medium text-red-900">{risk.title}</p>
          <p className="mt-1 text-xs text-red-700">{risk.severity} risk · Score {risk.score} · {risk.status}</p>
        </div>
      ))}
    </div>
  );
}
