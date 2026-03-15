import { Card, CardContent } from '@/app/components/ui/card';

/** Stat card at the top */
export function StatCard({ label, value, sub, color = 'text-slate-900' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}
