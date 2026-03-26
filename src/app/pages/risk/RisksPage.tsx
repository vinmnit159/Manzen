import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import {
  Loader2,
  Search,
  ShieldAlert,
  ClipboardCheck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { riskLibraryService, RiskRegisterEntryDto } from '@/services/api/risk-library';

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  IDENTIFIED: { label: 'Identified', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ASSESSING: { label: 'Assessing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  TREATING: { label: 'Treating', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  MONITORING: { label: 'Monitoring', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  CLOSED: { label: 'Closed', color: 'bg-green-100 text-green-800 border-green-200' },
};

const TREATMENT_LABELS: Record<string, string> = {
  MITIGATE: 'Mitigate',
  ACCEPT: 'Accept',
  TRANSFER: 'Transfer',
  AVOID: 'Avoid',
};

const CATEGORY_COLORS: Record<string, string> = {
  Governance: 'bg-blue-100 text-blue-800',
  'Access Control': 'bg-indigo-100 text-indigo-800',
  'Asset Management': 'bg-teal-100 text-teal-800',
  Operations: 'bg-purple-100 text-purple-800',
  'Business Continuity': 'bg-amber-100 text-amber-800',
  Fraud: 'bg-red-100 text-red-800',
  Communications: 'bg-cyan-100 text-cyan-800',
  'Third Party': 'bg-orange-100 text-orange-800',
  Cryptography: 'bg-violet-100 text-violet-800',
  'Software Development': 'bg-emerald-100 text-emerald-800',
  Privacy: 'bg-pink-100 text-pink-800',
  Compliance: 'bg-slate-100 text-slate-800',
  'Incident Response': 'bg-rose-100 text-rose-800',
  'Physical Security': 'bg-lime-100 text-lime-800',
  People: 'bg-sky-100 text-sky-800',
};

export function RisksPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: regData, isLoading } = useQuery({
    queryKey: ['risk-register'],
    queryFn: () => riskLibraryService.listRegister(),
  });

  const entries = regData?.data ?? [];
  const stats = regData?.stats ?? { total: 0, identified: 0, assessing: 0, treating: 0, monitoring: 0, closed: 0 };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const haystack = `${e.title} ${e.category} ${e.ownerName ?? ''}`.toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [entries, statusFilter, search]);

  return (
    <PageTemplate
      title="Risk Register"
      description="Organization risks selected from the risk library. Assess, treat, and monitor risks."
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/risk/library')}>
          Browse Risk Library
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : stats.total === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No risks in your register</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Browse the Risk Library to find applicable risks and add them to your register.
          </p>
          <Button onClick={() => navigate('/risk/library')}>
            Browse Risk Library
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Identified</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.identified}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-500">Assessing</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.assessing}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardCheck className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500">Treating</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.treating}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Monitoring</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.monitoring}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Closed</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
            </Card>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search risks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">All statuses ({stats.total})</option>
              <option value="IDENTIFIED">Identified ({stats.identified})</option>
              <option value="ASSESSING">Assessing ({stats.assessing})</option>
              <option value="TREATING">Treating ({stats.treating})</option>
              <option value="MONITORING">Monitoring ({stats.monitoring})</option>
              <option value="CLOSED">Closed ({stats.closed})</option>
            </select>
          </div>

          {/* Register Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Risk', 'Category', 'Inherent Risk', 'Residual Risk', 'Status', 'Treatment', 'Owner'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                        No risks match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry) => (
                      <RegisterRow key={entry.id} entry={entry} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}

function ScoreBadge({ impact, likelihood, score }: { impact: string; likelihood: string; score: number | null }) {
  if (!score) return <span className="text-xs text-gray-400">—</span>;
  return (
    <div className="text-center">
      <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${IMPACT_COLORS[impact] ?? ''}`}>
        {score}
      </span>
      <p className="text-[10px] text-gray-400 mt-0.5">{impact}/{likelihood}</p>
    </div>
  );
}

function RegisterRow({ entry }: { entry: RiskRegisterEntryDto }) {
  const statusConf = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.IDENTIFIED!;

  return (
    <tr className="hover:bg-blue-50/40 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900 max-w-md">{entry.title}</p>
        {entry.description && (
          <p className="text-xs text-gray-400 mt-1 max-w-md truncate">{entry.description}</p>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[entry.category] ?? 'bg-gray-100 text-gray-800'}`}>
          {entry.category}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ScoreBadge impact={entry.inherentImpact} likelihood={entry.inherentLikelihood} score={entry.inherentScore} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {entry.residualScore != null ? (
          <ScoreBadge impact={entry.residualImpact!} likelihood={entry.residualLikelihood!} score={entry.residualScore} />
        ) : (
          <span className="text-xs text-gray-400">Not assessed</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${statusConf!.color}`}>
          {statusConf!.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {entry.treatment ? TREATMENT_LABELS[entry.treatment] ?? entry.treatment : <span className="text-gray-400">—</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {entry.ownerName ?? <span className="text-gray-400">Unassigned</span>}
      </td>
    </tr>
  );
}
