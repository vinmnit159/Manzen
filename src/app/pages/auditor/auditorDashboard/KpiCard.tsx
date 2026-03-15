import React from 'react';
import { Card } from '@/app/components/ui/card';

// ── KPI Card ──────────────────────────────────────────────────────────────────

export function KpiCard({ label, value, sub, icon, color = 'text-gray-900' }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string;
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
