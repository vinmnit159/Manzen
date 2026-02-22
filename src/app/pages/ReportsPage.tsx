import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart2, TrendingUp, Shield, ClipboardList,
  FileCheck, Users, BookOpen, Calendar, ChevronRight,
} from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';

// ─── Report catalog definition ────────────────────────────────────────────────

interface ReportDef {
  id: string;
  name: string;
  description: string;
  period?: string;
  icon: React.ReactNode;
  iconBg: string;
  category: string;
  viewPath: string;
}

const REPORTS: ReportDef[] = [
  {
    id: 'monthly-overview',
    name: 'Monthly Overview Report',
    description: 'High-level compliance posture for a selected month — framework progress, risk distribution, test completion and audit summary.',
    period: 'Select month',
    icon: <Calendar className="w-5 h-5" />,
    iconBg: 'bg-blue-100 text-blue-600',
    category: 'Overview',
    viewPath: '/reports/viewer/monthly-overview',
  },
  {
    id: 'quarterly-overview',
    name: 'Quarterly Overview Report',
    description: 'Executive summary for a selected quarter — ideal for board reporting and quarterly business reviews.',
    period: 'Select quarter',
    icon: <TrendingUp className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 text-indigo-600',
    category: 'Overview',
    viewPath: '/reports/viewer/quarterly-overview',
  },
  {
    id: 'framework-progress',
    name: 'Framework Progress Report',
    description: 'Detailed breakdown of controls by status — implemented, partially implemented, and not yet implemented.',
    icon: <BarChart2 className="w-5 h-5" />,
    iconBg: 'bg-violet-100 text-violet-600',
    category: 'Compliance',
    viewPath: '/reports/viewer/framework-progress',
  },
  {
    id: 'risk-register',
    name: 'Risk Register Report',
    description: 'All active risks grouped by severity (Critical / High / Medium / Low) with trend over selected period.',
    period: 'Last 90 days',
    icon: <Shield className="w-5 h-5" />,
    iconBg: 'bg-red-100 text-red-600',
    category: 'Risk',
    viewPath: '/reports/viewer/risk-register',
  },
  {
    id: 'test-effectiveness',
    name: 'Test Effectiveness Report',
    description: 'Test performance and remediation efficiency — on-time vs late completions, pass rate, and overdue breakdown.',
    icon: <ClipboardList className="w-5 h-5" />,
    iconBg: 'bg-amber-100 text-amber-600',
    category: 'Tests',
    viewPath: '/reports/viewer/test-effectiveness',
  },
  {
    id: 'audit-status',
    name: 'Audit Status Report',
    description: 'All audits with completion status, major/minor findings counts and open vs closed findings summary.',
    icon: <BookOpen className="w-5 h-5" />,
    iconBg: 'bg-cyan-100 text-cyan-600',
    category: 'Audit',
    viewPath: '/reports/viewer/audit-status',
  },
  {
    id: 'evidence-coverage',
    name: 'Evidence Coverage Report',
    description: 'Controls vs attached evidence — shows which controls have sufficient evidence and which are gaps.',
    icon: <FileCheck className="w-5 h-5" />,
    iconBg: 'bg-green-100 text-green-600',
    category: 'Compliance',
    viewPath: '/reports/viewer/evidence-coverage',
  },
  {
    id: 'personnel-compliance',
    name: 'Personnel Compliance Report',
    description: 'Security onboarding completion by personnel — policy acceptance, MDM enrollment and security training.',
    icon: <Users className="w-5 h-5" />,
    iconBg: 'bg-pink-100 text-pink-600',
    category: 'Personnel',
    viewPath: '/reports/viewer/personnel-compliance',
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(REPORTS.map(r => r.category)))];

const CATEGORY_BADGE: Record<string, string> = {
  Overview:   'bg-blue-50 text-blue-700',
  Compliance: 'bg-violet-50 text-violet-700',
  Risk:       'bg-red-50 text-red-700',
  Tests:      'bg-amber-50 text-amber-700',
  Audit:      'bg-cyan-50 text-cyan-700',
  Personnel:  'bg-pink-50 text-pink-700',
};

// ─── Report card ──────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: ReportDef }) {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${report.iconBg}`}>
          {report.icon}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[report.category] ?? 'bg-gray-50 text-gray-600'}`}>
          {report.category}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{report.name}</h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{report.description}</p>
      {report.period && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {report.period}
        </div>
      )}
      <div className="mt-4">
        <button
          onClick={() => navigate(report.viewPath)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium transition-colors"
        >
          View Report <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? REPORTS
    : REPORTS.filter(r => r.category === activeCategory);

  return (
    <PageTemplate
      title="Reports"
      description="Generate and view compliance, risk, and security posture reports."
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Available Reports', value: REPORTS.length,                                                               color: 'text-gray-800' },
          { label: 'Overview',          value: REPORTS.filter(r => r.category === 'Overview').length,                        color: 'text-blue-700' },
          { label: 'Compliance',        value: REPORTS.filter(r => r.category === 'Compliance').length,                      color: 'text-violet-700' },
          { label: 'Risk & Audit',      value: REPORTS.filter(r => ['Risk','Audit'].includes(r.category)).length,            color: 'text-red-700' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Report grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </PageTemplate>
  );
}
