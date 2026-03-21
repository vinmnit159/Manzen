// ─── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Cloud Provider':          'bg-sky-50 text-sky-700 border-sky-200',
  'Version Control':         'bg-violet-50 text-violet-700 border-violet-200',
  'Identity Provider':       'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Communication':           'bg-blue-50 text-blue-700 border-blue-200',
  'CRM':                     'bg-orange-50 text-orange-700 border-orange-200',
  'HRIS':                    'bg-pink-50 text-pink-700 border-pink-200',
  'MDM':                     'bg-teal-50 text-teal-700 border-teal-200',
  'Observability':           'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Endpoint Security':       'bg-red-50 text-red-700 border-red-200',
  'Vulnerability Scanner':   'bg-amber-50 text-amber-700 border-amber-200',
  'Security Training':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Password Manager':        'bg-lime-50 text-lime-700 border-lime-200',
  'Finance':                 'bg-green-50 text-green-700 border-green-200',
  'CI/CD':                   'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'Document Management':     'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Data Warehouse':          'bg-slate-50 text-slate-700 border-slate-200',
  'Datastore':               'bg-stone-50 text-stone-700 border-stone-200',
  'Task Management':         'bg-purple-50 text-purple-700 border-purple-200',
};
export function categoryBadge(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-50 text-gray-700 border-gray-200';
}

export const SEVERITY_META: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300' },
  high:     { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-300' },
  medium:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  low:      { label: 'Low',      className: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export const RESULT_META: Record<string, { label: string; className: string; dot: string }> = {
  pass:    { label: 'Pass',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  warn:    { label: 'Warning', className: 'bg-yellow-50 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-500' },
  warning: { label: 'Warning', className: 'bg-yellow-50 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-500' },
  fail:    { label: 'Fail',    className: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
};
