/**
 * Partner API Management Page — /integrations/partner-api
 *
 * Admin-only. Lets org admins:
 *   • Issue API keys to external tool teams
 *   • See all issued keys, their status, and last-used timestamps
 *   • Revoke keys instantly
 *   • Browse the integration catalogue (38 tools + ISO tests)
 *   • View all inbound scan results pushed by partners
 *   • Drill into a result to see individual findings
 */

import { useEffect, useState, useMemo } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import {
  partnerService,
  PartnerApiKey,
  PartnerScanResult,
  PartnerScanResultDetail,
  CatalogueTool,
} from '@/services/api/partner';
import { useIsAdmin } from '@/hooks/useCurrentUser';

// ─── Icons (inline SVG to avoid extra deps) ───────────────────────────────────

function KeyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M21 2l-9.6 9.6M15.5 7.5l2 2M18 5l2 2" strokeLinecap="round" />
    </svg>
  );
}
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ShieldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
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
function categoryBadge(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-50 text-gray-700 border-gray-200';
}

const SEVERITY_META: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300' },
  high:     { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-300' },
  medium:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  low:      { label: 'Low',      className: 'bg-slate-100 text-slate-700 border-slate-300' },
};

const RESULT_META: Record<string, { label: string; className: string; dot: string }> = {
  pass:    { label: 'Pass',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  warn:    { label: 'Warning', className: 'bg-yellow-50 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-500' },
  warning: { label: 'Warning', className: 'bg-yellow-50 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-500' },
  fail:    { label: 'Fail',    className: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Stat card at the top */
function StatCard({ label, value, sub, color = 'text-slate-900' }: { label: string; value: string | number; sub?: string; color?: string }) {
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

/** Issue key dialog */
function IssueKeyDialog({
  open,
  catalogue,
  onClose,
  onIssued,
}: {
  open: boolean;
  catalogue: CatalogueTool[];
  onClose: () => void;
  onIssued: (rawKey: string, keyName: string, toolName: string) => void;
}) {
  const [form, setForm] = useState({ name: '', toolName: '', toolCategory: '', expiresAt: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill category when tool is selected
  function handleToolChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tool = catalogue.find(c => c.provider === e.target.value);
    setForm(f => ({ ...f, toolName: e.target.value, toolCategory: tool?.category ?? '' }));
  }

  async function submit() {
    if (!form.name.trim() || !form.toolName || !form.toolCategory) {
      setError('Key name and tool are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await partnerService.issueKey({
        name: form.name.trim(),
        toolName: form.toolName,
        toolCategory: form.toolCategory,
        expiresAt: form.expiresAt || undefined,
      });
      onIssued(res.data.rawKey, res.data.name, res.data.toolName);
      setForm({ name: '', toolName: '', toolCategory: '', expiresAt: '' });
    } catch (e: any) {
      setError(e.message ?? 'Failed to issue key.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-slate-600" /> Issue Partner API Key
          </DialogTitle>
          <DialogDescription>
            Generate a key for an external team to push scan results from their tool into ISMS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Key label *</label>
            <Input
              placeholder="e.g. Huntress Team — Production"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">A human-readable name to identify this key later.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tool *</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={form.toolName}
              onChange={handleToolChange}
            >
              <option value="">Select a tool…</option>
              {Object.entries(
                catalogue.reduce<Record<string, CatalogueTool[]>>((acc, t) => {
                  (acc[t.category] ??= []).push(t);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, tools]) => (
                  <optgroup key={cat} label={cat}>
                    {tools.map(t => (
                      <option key={t.provider} value={t.provider}>{t.provider}</option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </div>

          {form.toolCategory && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Category:</span>
              <Badge variant="outline" className={`text-xs ${categoryBadge(form.toolCategory)}`}>
                {form.toolCategory}
              </Badge>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Expiry <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">Leave blank for no expiry.</p>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Generating…' : 'Generate key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Raw key reveal dialog — shown once after issuing */
function RawKeyDialog({
  rawKey,
  keyName,
  toolName,
  onClose,
}: {
  rawKey: string;
  keyName: string;
  toolName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <ShieldIcon className="w-5 h-5" /> API Key Generated
          </DialogTitle>
          <DialogDescription>
            This key will <strong>not</strong> be shown again. Copy it now and share it securely with the{' '}
            <strong>{toolName}</strong> team.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-600">{keyName}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-sm border border-slate-200">
              {rawKey}
            </code>
            <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? '✓ Copied' : <><CopyIcon className="mr-1 w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800">
            <strong>Security reminder:</strong> Store this key in a password manager or secret vault before sharing. Never send it over email or unencrypted channels.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done — I've saved the key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Revoke confirmation dialog */
function RevokeDialog({
  keyRecord,
  onConfirm,
  onClose,
}: {
  keyRecord: PartnerApiKey;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await partnerService.revokeKey(keyRecord.id);
      onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700">Revoke API Key</DialogTitle>
          <DialogDescription>
            This will immediately invalidate <strong>"{keyRecord.name}"</strong>. Any external system using this key will stop being able to push scan results.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? 'Revoking…' : 'Yes, revoke key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Result detail slide-over */
function ResultDetailDialog({
  result,
  onClose,
}: {
  result: PartnerScanResultDetail;
  onClose: () => void;
}) {
  const pass = result.findings.filter(f => f.result === 'pass').length;
  const warn = result.findings.filter(f => ['warn', 'warning'].includes(f.result)).length;
  const fail = result.findings.filter(f => f.result === 'fail').length;

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{result.toolName} — Scan Report</DialogTitle>
          <DialogDescription>{fmtDateTime(result.scannedAt)}</DialogDescription>
        </DialogHeader>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{pass}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Pass</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-2xl font-bold text-yellow-600">{warn}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Warning</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{fail}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Fail</p>
          </div>
        </div>

        {/* Findings list */}
        <div className="space-y-2 mt-2">
          {result.findings.map((f, i) => {
            const rm = RESULT_META[f.result?.toLowerCase()] ?? RESULT_META.fail;
            const sm = SEVERITY_META[f.severity?.toLowerCase()] ?? SEVERITY_META.medium;
            return (
              <div key={i} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${rm.dot}`} />
                    <p className="text-sm font-medium text-slate-800 truncate">{f.testName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-xs ${rm.className}`}>{rm.label}</Badge>
                    <Badge variant="outline" className={`text-xs ${sm.className}`}>{sm.label}</Badge>
                    {f.isoControl && (
                      <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 font-mono">
                        {f.isoControl}
                      </Badge>
                    )}
                  </div>
                </div>
                {f.detail && (
                  <p className="mt-1.5 pl-4 text-xs text-slate-500">{f.detail}</p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Catalogue tool card with expand/collapse */
function CatalogueCard({ tool }: { tool: CatalogueTool }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-sm font-semibold text-slate-800">{tool.provider}</p>
            <p className="text-xs text-slate-400 truncate max-w-xs">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs ${categoryBadge(tool.category)}`}>
            {tool.category}
          </Badge>
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200">
            {tool.suggestedTests.length} tests
          </Badge>
          {expanded
            ? <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            : <ChevronRightIcon className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Suggested ISO Tests</p>
          <div className="space-y-1.5">
            {tool.suggestedTests.map((t, i) => {
              const sm = SEVERITY_META[t.severity?.toLowerCase()] ?? SEVERITY_META.medium;
              return (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-700 flex-1">{t.name}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-xs ${sm.className}`}>{sm.label}</Badge>
                    <Badge variant="outline" className="text-xs bg-white font-mono text-slate-500 border-slate-200">
                      {t.isoControl}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PartnerApiPage() {
  const isAdmin = useIsAdmin();

  // State
  const [tab, setTab] = useState<'keys' | 'results' | 'catalogue'>('keys');
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [results, setResults] = useState<PartnerScanResult[]>([]);
  const [catalogue, setCatalogue] = useState<CatalogueTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [resultDetail, setResultDetail] = useState<PartnerScanResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  // Dialog state
  const [showIssue, setShowIssue] = useState(false);
  const [pendingRawKey, setPendingRawKey] = useState<{ raw: string; name: string; tool: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PartnerApiKey | null>(null);

  // Load data
  async function refresh() {
    setLoading(true);
    try {
      const [keysRes, resultsRes, catalogueRes] = await Promise.all([
        partnerService.listKeys().catch(() => ({ data: [] as PartnerApiKey[] })),
        partnerService.listResults().catch(() => ({ data: [] as PartnerScanResult[], total: 0 })),
        partnerService.getCatalogue().catch(() => ({ data: [] as CatalogueTool[], count: 0 })),
      ]);
      setKeys(keysRes.data ?? []);
      setResults(resultsRes.data ?? []);
      setCatalogue(catalogueRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Stats
  const activeKeys = keys.filter(k => k.isActive);
  const revokedKeys = keys.filter(k => !k.isActive);
  const totalFindings = results.reduce((s, r) => s + r.passCount + r.warnCount + r.failCount, 0);
  const totalFail = results.reduce((s, r) => s + r.failCount, 0);

  // Filtered catalogue
  const filteredCatalogue = useMemo(() => {
    if (!catalogueSearch) return catalogue;
    const q = catalogueSearch.toLowerCase();
    return catalogue.filter(
      t => t.provider.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    );
  }, [catalogue, catalogueSearch]);

  // Group catalogue by category
  const catalogueByCategory = useMemo(() => {
    return filteredCatalogue.reduce<Record<string, CatalogueTool[]>>((acc, t) => {
      (acc[t.category] ??= []).push(t);
      return acc;
    }, {});
  }, [filteredCatalogue]);

  async function openResultDetail(id: string) {
    setLoadingDetail(id);
    try {
      const res = await partnerService.getResult(id);
      setResultDetail(res.data);
    } finally {
      setLoadingDetail(null);
    }
  }

  // Access guard
  if (!isAdmin) {
    return (
      <PageTemplate title="Partner API" subtitle="Manage external tool integrations">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldIcon className="mb-4 w-10 h-10 text-slate-300" />
          <p className="text-lg font-semibold text-slate-700">Admin access required</p>
          <p className="mt-1 text-sm text-slate-400">
            Only Org Admins, Super Admins, and Security Owners can manage Partner API keys.
          </p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Partner API"
      subtitle="Issue API keys to external tool teams so they can push scan results directly into your ISMS"
    >
      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Keys" value={activeKeys.length} />
        <StatCard label="Revoked Keys" value={revokedKeys.length} sub="soft-deleted" />
        <StatCard label="Total Findings" value={totalFindings} sub="across all results" />
        <StatCard
          label="Open Failures"
          value={totalFail}
          color={totalFail > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
      </div>

      {/* ── Header action ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="results">Inbound Results</TabsTrigger>
            <TabsTrigger value="catalogue">Tool Catalogue</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'keys' && (
          <Button onClick={() => setShowIssue(true)} className="gap-1.5">
            <PlusIcon className="w-4 h-4" /> Issue Key
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      ) : (
        <>
          {/* ── Keys tab ──────────────────────────────────────────────────── */}
          {tab === 'keys' && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">API Keys</CardTitle>
                <CardDescription>
                  Each key is scoped to this organisation. The raw key is never stored — only its SHA-256 hash. Share keys securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {keys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <KeyIcon className="mb-3 w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No keys yet</p>
                    <p className="mt-1 text-xs text-slate-400">Issue your first key to let an external team push scan results.</p>
                    <Button className="mt-4 gap-1.5" onClick={() => setShowIssue(true)}>
                      <PlusIcon className="w-4 h-4" /> Issue Key
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Key Name</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Tool</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Category</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Last Used</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Expires</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Created</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map(k => (
                          <tr key={k.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${!k.isActive ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-3">
                              <p className="font-medium text-slate-800">{k.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{k.id.slice(0, 8)}…</p>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">{k.toolName}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={`text-xs ${categoryBadge(k.toolCategory)}`}>
                                {k.toolCategory}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {k.isActive ? (
                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Revoked</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(k.lastUsedAt)}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{k.expiresAt ? fmtDate(k.expiresAt) : 'No expiry'}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(k.createdAt)}</td>
                            <td className="px-4 py-3">
                              {k.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                                  onClick={() => setRevokeTarget(k)}
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                  Revoke
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Results tab ───────────────────────────────────────────────── */}
          {tab === 'results' && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Inbound Scan Results</CardTitle>
                <CardDescription>
                  Scan results pushed by external tool teams using their Partner API keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <EyeIcon className="mb-3 w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No results yet</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Once an external team pushes scan results using their API key, they'll appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Tool</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Category</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">Pass</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">Warn</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">Fail</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Score</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Scanned At</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => {
                          const total = r.passCount + r.warnCount + r.failCount;
                          const pct = total > 0 ? Math.round((r.passCount / total) * 100) : 0;
                          const scoreColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
                          return (
                            <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-3 font-medium text-slate-800">{r.toolName}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className={`text-xs ${categoryBadge(r.toolCategory)}`}>
                                  {r.toolCategory}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium text-emerald-600">{r.passCount}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium text-yellow-600">{r.warnCount}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium text-red-600">{r.failCount}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-semibold ${scoreColor}`}>{pct}%</span>
                                <div className="mt-1 h-1.5 w-16 rounded-full bg-slate-100">
                                  <div
                                    className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(r.scannedAt)}</td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 text-slate-600"
                                  onClick={() => openResultDetail(r.id)}
                                  disabled={loadingDetail === r.id}
                                >
                                  {loadingDetail === r.id ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                                  ) : (
                                    <EyeIcon className="w-3.5 h-3.5" />
                                  )}
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Catalogue tab ─────────────────────────────────────────────── */}
          {tab === 'catalogue' && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                  <Input
                    placeholder="Search tools or categories…"
                    value={catalogueSearch}
                    onChange={e => setCatalogueSearch(e.target.value)}
                  />
                </div>
                <p className="text-sm text-slate-400">{filteredCatalogue.length} tools</p>
              </div>

              {Object.entries(catalogueByCategory)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, tools]) => (
                  <div key={cat} className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${categoryBadge(cat)}`}>{cat}</Badge>
                      <span className="text-xs text-slate-400">{tools.length} {tools.length === 1 ? 'tool' : 'tools'}</span>
                    </div>
                    <div className="space-y-2">
                      {tools.map(t => <CatalogueCard key={t.provider} tool={t} />)}
                    </div>
                  </div>
                ))}

              {filteredCatalogue.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm text-slate-500">No tools match "{catalogueSearch}"</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}

      {showIssue && (
        <IssueKeyDialog
          open={showIssue}
          catalogue={catalogue}
          onClose={() => setShowIssue(false)}
          onIssued={(raw, name, tool) => {
            setShowIssue(false);
            setPendingRawKey({ raw, name, tool });
            refresh();
          }}
        />
      )}

      {pendingRawKey && (
        <RawKeyDialog
          rawKey={pendingRawKey.raw}
          keyName={pendingRawKey.name}
          toolName={pendingRawKey.tool}
          onClose={() => setPendingRawKey(null)}
        />
      )}

      {revokeTarget && (
        <RevokeDialog
          keyRecord={revokeTarget}
          onConfirm={() => { setRevokeTarget(null); refresh(); }}
          onClose={() => setRevokeTarget(null)}
        />
      )}

      {resultDetail && (
        <ResultDetailDialog
          result={resultDetail}
          onClose={() => setResultDetail(null)}
        />
      )}
    </PageTemplate>
  );
}
