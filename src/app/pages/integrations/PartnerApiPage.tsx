/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  partnerService,
  PartnerApiKey,
  PartnerScanResult,
  PartnerScanResultDetail,
  ToolRequest,
  CatalogueTool,
} from '@/services/api/partner';
import { useHasRole } from '@/hooks/useCurrentUser';

import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ShieldIcon,
} from './partnerApi/icons';
import {
  fmtDate,
  fmtDateTime,
  timeAgo,
  categoryBadge,
} from './partnerApi/helpers';
import { StatCard } from './partnerApi/StatCard';
import { IssueKeyDialog } from './partnerApi/IssueKeyDialog';
import { RawKeyDialog } from './partnerApi/RawKeyDialog';
import { RevokeDialog } from './partnerApi/RevokeDialog';
import { ResultDetailDialog } from './partnerApi/ResultDetailDialog';
import { CatalogueCard } from './partnerApi/CatalogueCard';

// ─── Main page ────────────────────────────────────────────────────────────────

export function PartnerApiPage() {
  const isSuperAdmin = useHasRole('SUPER_ADMIN');

  // State
  const [tab, setTab] = useState<'keys' | 'results' | 'catalogue' | 'requests'>(
    'keys',
  );
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [results, setResults] = useState<PartnerScanResult[]>([]);
  const [catalogue, setCatalogue] = useState<CatalogueTool[]>([]);
  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [resultDetail, setResultDetail] =
    useState<PartnerScanResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Dialog state
  const [showIssue, setShowIssue] = useState(false);
  const [pendingRawKey, setPendingRawKey] = useState<{
    raw: string;
    name: string;
    tool: string;
  } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PartnerApiKey | null>(null);

  // Load data
  async function refresh() {
    setLoading(true);
    try {
      const [keysRes, resultsRes, catalogueRes, requestsRes] =
        await Promise.all([
          partnerService
            .listKeys()
            .catch(() => ({ data: [] as PartnerApiKey[] })),
          partnerService
            .listResults()
            .catch(() => ({ data: [] as PartnerScanResult[], total: 0 })),
          partnerService
            .getCatalogue()
            .catch(() => ({ data: [] as CatalogueTool[], count: 0 })),
          partnerService
            .listToolRequests()
            .catch(() => ({ data: [] as ToolRequest[], total: 0 })),
        ]);
      setKeys(keysRes.data ?? []);
      setResults(resultsRes.data ?? []);
      setCatalogue(catalogueRes.data ?? []);
      setToolRequests(requestsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function reviewRequest(id: string, status: 'approved' | 'dismissed') {
    setReviewingId(id);
    try {
      await partnerService.reviewToolRequest(id, { status });
      setToolRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    } finally {
      setReviewingId(null);
    }
  }

  useEffect(() => {
    refresh();
  }, []); // refresh is stable — no deps that change after mount

  // Stats
  const activeKeys = keys.filter((k) => k.isActive);
  const revokedKeys = keys.filter((k) => !k.isActive);
  const totalFindings = results.reduce(
    (s, r) => s + r.passCount + r.warnCount + r.failCount,
    0,
  );
  const totalFail = results.reduce((s, r) => s + r.failCount, 0);

  // Filtered catalogue
  const filteredCatalogue = useMemo(() => {
    if (!catalogueSearch) return catalogue;
    const q = catalogueSearch.toLowerCase();
    return catalogue.filter(
      (t) =>
        t.provider.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [catalogue, catalogueSearch]);

  // Group catalogue by category
  const catalogueByCategory = useMemo(() => {
    return filteredCatalogue.reduce<Record<string, CatalogueTool[]>>(
      (acc, t) => {
        (acc[t.category] ??= []).push(t);
        return acc;
      },
      {},
    );
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

  // Access guard — Super Admin only
  if (!isSuperAdmin) {
    return (
      <PageTemplate
        title="Partner API"
        description="Manage external tool integrations"
      >
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldIcon className="mb-4 w-10 h-10 text-slate-300" />
          <p className="text-lg font-semibold text-slate-700">
            Super Admin access required
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Only Super Admins can manage Partner API keys and tool requests.
          </p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Partner API"
      description="Issue API keys to external tool teams so they can push scan results directly into your ISMS"
    >
      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Keys" value={activeKeys.length} />
        <StatCard
          label="Revoked Keys"
          value={revokedKeys.length}
          sub="soft-deleted"
        />
        <StatCard
          label="Total Findings"
          value={totalFindings}
          sub="across all results"
        />
        <StatCard
          label="Open Failures"
          value={totalFail}
          color={totalFail > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
      </div>

      {/* ── Header action ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="results">Inbound Results</TabsTrigger>
            <TabsTrigger value="catalogue">Tool Catalogue</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Tool Requests
              {toolRequests.filter((r) => r.status === 'pending').length >
                0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                  {toolRequests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
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
                  Each key is scoped to this organisation. The raw key is never
                  stored — only its SHA-256 hash. Share keys securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {keys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <KeyIcon className="mb-3 w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">
                      No keys yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Issue your first key to let an external team push scan
                      results.
                    </p>
                    <Button
                      className="mt-4 gap-1.5"
                      onClick={() => setShowIssue(true)}
                    >
                      <PlusIcon className="w-4 h-4" /> Issue Key
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Key Name
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Tool
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Category
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Last Used
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Expires
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Created
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((k) => (
                          <tr
                            key={k.id}
                            className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors ${!k.isActive ? 'opacity-50' : ''}`}
                          >
                            <td className="px-6 py-3">
                              <p className="font-medium text-slate-800">
                                {k.name}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">
                                {k.id.slice(0, 8)}…
                              </p>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {k.toolName}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs ${categoryBadge(k.toolCategory)}`}
                              >
                                {k.toolCategory}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {k.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-red-50 text-red-700 border-red-200"
                                >
                                  Revoked
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {timeAgo(k.lastUsedAt)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {k.expiresAt ? fmtDate(k.expiresAt) : 'No expiry'}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {fmtDate(k.createdAt)}
                            </td>
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
                <CardTitle className="text-base">
                  Inbound Scan Results
                </CardTitle>
                <CardDescription>
                  Scan results pushed by external tool teams using their Partner
                  API keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <EyeIcon className="mb-3 w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">
                      No results yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Once an external team pushes scan results using their API
                      key, they'll appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Tool
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Category
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">
                            Pass
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">
                            Warn
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 text-center">
                            Fail
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Score
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Scanned At
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => {
                          const total = r.passCount + r.warnCount + r.failCount;
                          const pct =
                            total > 0
                              ? Math.round((r.passCount / total) * 100)
                              : 0;
                          const scoreColor =
                            pct >= 80
                              ? 'text-emerald-600'
                              : pct >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600';
                          return (
                            <tr
                              key={r.id}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-6 py-3 font-medium text-slate-800">
                                {r.toolName}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${categoryBadge(r.toolCategory)}`}
                                >
                                  {r.toolCategory}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium text-emerald-600">
                                  {r.passCount}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium text-yellow-600">
                                  {r.warnCount}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium text-red-600">
                                  {r.failCount}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-semibold ${scoreColor}`}>
                                  {pct}%
                                </span>
                                <div className="mt-1 h-1.5 w-16 rounded-full bg-slate-100">
                                  <div
                                    className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {fmtDateTime(r.scannedAt)}
                              </td>
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
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                  />
                </div>
                <p className="text-sm text-slate-400">
                  {filteredCatalogue.length} tools
                </p>
              </div>

              {Object.entries(catalogueByCategory)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, tools]) => (
                  <div key={cat} className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${categoryBadge(cat)}`}
                      >
                        {cat}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tools.map((t) => (
                        <CatalogueCard key={t.provider} tool={t} />
                      ))}
                    </div>
                  </div>
                ))}

              {filteredCatalogue.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm text-slate-500">
                    No tools match "{catalogueSearch}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Tool Requests tab ─────────────────────────────────────────── */}
          {tab === 'requests' && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Tool Integration Requests
                </CardTitle>
                <CardDescription>
                  Requests submitted by users for new tool integrations. Approve
                  to prioritise or dismiss to decline.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {toolRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <ShieldIcon className="mb-3 w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">
                      No tool requests yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Users can request new integrations from the Integrations
                      page.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Tool
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Category
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Use Case
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Submitted By
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Date
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {toolRequests.map((req) => (
                          <tr
                            key={req.id}
                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="px-6 py-3 font-medium text-slate-800">
                              {req.toolName}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs ${categoryBadge(req.category)}`}
                              >
                                {req.category || '—'}
                              </Badge>
                            </td>
                            <td
                              className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate"
                              title={req.useCase}
                            >
                              {req.useCase}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {req.submittedBy}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {fmtDate(req.submittedAt)}
                            </td>
                            <td className="px-4 py-3">
                              {req.status === 'pending' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  Pending
                                </Badge>
                              )}
                              {req.status === 'approved' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  Approved
                                </Badge>
                              )}
                              {req.status === 'dismissed' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-slate-50 text-slate-500 border-slate-200"
                                >
                                  Dismissed
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {req.status === 'pending' && (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1 text-xs h-7 px-2"
                                    disabled={reviewingId === req.id}
                                    onClick={() =>
                                      reviewRequest(req.id, 'approved')
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-700 text-xs h-7 px-2"
                                    disabled={reviewingId === req.id}
                                    onClick={() =>
                                      reviewRequest(req.id, 'dismissed')
                                    }
                                  >
                                    Dismiss
                                  </Button>
                                </div>
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
          onConfirm={() => {
            setRevokeTarget(null);
            refresh();
          }}
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
