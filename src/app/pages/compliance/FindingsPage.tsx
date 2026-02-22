import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  AlertTriangle, CheckCircle2, Clock, X, ChevronRight,
  AlertCircle, ArrowRight, Link, User, Calendar, Shield,
  Filter, RefreshCw,
} from 'lucide-react';
import {
  findingsService,
  FindingRecord,
  FindingSeverity,
  FindingStatus,
  UpdateFindingRequest,
} from '@/services/api/findings';
import { apiClient } from '@/services/api/client';
import { useCurrentUser, useCanAudit } from '@/hooks/useCurrentUser';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRecord    { id: string; name: string | null; email: string; }
interface ControlRecord { id: string; isoReference: string; title: string; }

// ── Helpers / constants ───────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(finding: FindingRecord) {
  if (!finding.dueDate || finding.status === 'CLOSED') return false;
  return new Date(finding.dueDate) < new Date();
}

const SEVERITY_META: Record<FindingSeverity, { label: string; color: string }> = {
  MAJOR:       { label: 'Major',       color: 'bg-red-100 text-red-700' },
  MINOR:       { label: 'Minor',       color: 'bg-amber-100 text-amber-700' },
  OBSERVATION: { label: 'Observation', color: 'bg-blue-100 text-blue-700' },
  OFI:         { label: 'OFI',         color: 'bg-purple-100 text-purple-700' },
};

const STATUS_META: Record<FindingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN:              { label: 'Open',              color: 'bg-red-50 text-red-700',    icon: <AlertCircle className="w-3 h-3" /> },
  IN_REMEDIATION:    { label: 'In Remediation',    color: 'bg-amber-50 text-amber-700', icon: <Clock className="w-3 h-3" /> },
  READY_FOR_REVIEW:  { label: 'Ready for Review',  color: 'bg-blue-50 text-blue-700',  icon: <ArrowRight className="w-3 h-3" /> },
  CLOSED:            { label: 'Closed',             color: 'bg-green-50 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
};

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const m = SEVERITY_META[severity] ?? SEVERITY_META.MINOR;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: FindingStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.OPEN;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

// ── Finding Detail Panel ──────────────────────────────────────────────────────

function FindingDetailPanel({
  finding,
  onClose,
  onUpdated,
}: {
  finding:   FindingRecord;
  onClose:   () => void;
  onUpdated: (f: FindingRecord) => void;
}) {
  const qc        = useQueryClient();
  const user      = useCurrentUser();
  const canAudit  = useCanAudit();

  const [evidenceUrl, setEvidenceUrl] = useState(finding.evidenceUrl ?? '');
  const [editPlan,    setEditPlan]    = useState(finding.remediationPlan ?? '');
  const [editDue,     setEditDue]     = useState(
    finding.dueDate ? finding.dueDate.slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  const isAssignee = user?.id === finding.assignedTo;
  const canAct     = isAssignee || canAudit;

  async function transition(action: 'start-remediation' | 'submit-review' | 'accept' | 'reject') {
    setSaving(true); setErr(null);
    try {
      let updated: FindingRecord;
      if (action === 'start-remediation') updated = await findingsService.startRemediation(finding.id);
      else if (action === 'submit-review') updated = await findingsService.submitForReview(finding.id);
      else if (action === 'accept')        updated = await findingsService.accept(finding.id);
      else                                  updated = await findingsService.reject(finding.id);
      qc.invalidateQueries({ queryKey: ['findings'] });
      onUpdated(updated);
    } catch (e: any) {
      setErr(e?.message ?? 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveEvidence() {
    if (!evidenceUrl.trim()) return;
    setSaving(true); setErr(null);
    try {
      const updated = await findingsService.attachEvidence(finding.id, evidenceUrl.trim());
      qc.invalidateQueries({ queryKey: ['findings'] });
      onUpdated(updated);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save evidence');
    } finally {
      setSaving(false);
    }
  }

  async function savePlan() {
    setSaving(true); setErr(null);
    try {
      const payload: UpdateFindingRequest = {
        remediationPlan: editPlan || null,
        dueDate:         editDue ? new Date(editDue).toISOString() : null,
      };
      const updated = await findingsService.update(finding.id, payload);
      qc.invalidateQueries({ queryKey: ['findings'] });
      onUpdated(updated);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <StatusBadge   status={finding.status} />
              {isOverdue(finding) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {finding.control?.isoReference} — {finding.control?.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700">{finding.description}</p>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Audit</p>
              <p className="font-medium">{finding.audit?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Assigned to</p>
              <p className="font-medium">{finding.assignee?.name ?? finding.assignee?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Created</p>
              <p className="font-medium">{fmt(finding.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Due date</p>
              <p className={`font-medium ${isOverdue(finding) ? 'text-red-600' : ''}`}>{fmt(finding.dueDate)}</p>
            </div>
            {finding.closedAt && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Closed</p>
                <p className="font-medium text-green-700">{fmt(finding.closedAt)}</p>
              </div>
            )}
          </div>

          {/* Remediation Plan (editable if not closed) */}
          {finding.status !== 'CLOSED' && canAct && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Remediation Plan</p>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={editPlan}
                onChange={e => setEditPlan(e.target.value)}
                placeholder="Describe the remediation plan…"
              />
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-gray-500">Due date</label>
                <input
                  type="date"
                  className="border border-gray-200 rounded px-2 py-1 text-sm"
                  value={editDue}
                  onChange={e => setEditDue(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={savePlan} disabled={saving}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* Show read-only plan if closed */}
          {(finding.status === 'CLOSED' || !canAct) && finding.remediationPlan && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Remediation Plan</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{finding.remediationPlan}</p>
            </div>
          )}

          {/* Evidence (editable when IN_REMEDIATION or READY_FOR_REVIEW) */}
          {(finding.status === 'IN_REMEDIATION' || finding.status === 'READY_FOR_REVIEW') && (isAssignee || canAudit) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Evidence URL</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                  placeholder="https://…"
                />
                <Button size="sm" variant="outline" onClick={saveEvidence} disabled={saving}>
                  <Link className="w-4 h-4" />
                </Button>
              </div>
              {finding.evidenceUrl && (
                <a href={finding.evidenceUrl} target="_blank" rel="noreferrer"
                  className="mt-1 text-xs text-indigo-600 underline flex items-center gap-1">
                  <Link className="w-3 h-3" /> View attached evidence
                </a>
              )}
            </div>
          )}

          {/* Show evidence link when closed */}
          {finding.status === 'CLOSED' && finding.evidenceUrl && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Evidence</p>
              <a href={finding.evidenceUrl} target="_blank" rel="noreferrer"
                className="text-xs text-indigo-600 underline flex items-center gap-1">
                <Link className="w-3 h-3" /> {finding.evidenceUrl}
              </a>
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>
          )}

          {/* Workflow Actions */}
          {finding.status !== 'CLOSED' && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>

              {finding.status === 'OPEN' && (isAssignee || canAudit) && (
                <Button
                  className="w-full"
                  onClick={() => transition('start-remediation')}
                  disabled={saving}
                >
                  <ArrowRight className="w-4 h-4 mr-2" /> Start Remediation
                </Button>
              )}

              {finding.status === 'IN_REMEDIATION' && (isAssignee || canAudit) && (
                <Button
                  className="w-full"
                  onClick={() => transition('submit-review')}
                  disabled={saving}
                >
                  <ArrowRight className="w-4 h-4 mr-2" /> Submit for Review
                </Button>
              )}

              {finding.status === 'READY_FOR_REVIEW' && canAudit && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => transition('accept')}
                    disabled={saving}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Accept & Close
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => transition('reject')}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject & Reopen
                  </Button>
                </div>
              )}
            </div>
          )}

          {finding.status === 'CLOSED' && (
            <div className="pt-2 border-t flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Finding closed on {fmt(finding.closedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function FindingsPage() {
  const qc = useQueryClient();

  // Filter state
  const [filterSeverity, setFilterSeverity] = useState<FindingSeverity | ''>('');
  const [filterStatus,   setFilterStatus]   = useState<FindingStatus | ''>('');
  const [filterOverdue,  setFilterOverdue]  = useState(false);
  const [search,         setSearch]         = useState('');
  const [selected,       setSelected]       = useState<FindingRecord | null>(null);

  const { data: findings = [], isLoading, error } = useQuery<FindingRecord[]>({
    queryKey: ['findings', { filterSeverity, filterStatus, filterOverdue }],
    queryFn:  () => findingsService.list({
      severity:  filterSeverity  || undefined,
      status:    filterStatus    || undefined,
      overdue:   filterOverdue   || undefined,
    }),
  });

  // Apply client-side search on top
  const visible = findings.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.description.toLowerCase().includes(q) ||
      (f.control?.isoReference ?? '').toLowerCase().includes(q) ||
      (f.control?.title        ?? '').toLowerCase().includes(q)
    );
  });

  // Stat counts
  const total    = findings.length;
  const open     = findings.filter(f => f.status === 'OPEN').length;
  const inRem    = findings.filter(f => f.status === 'IN_REMEDIATION').length;
  const closed   = findings.filter(f => f.status === 'CLOSED').length;
  const overdue  = findings.filter(isOverdue).length;

  return (
    <PageTemplate title="Findings" subtitle="Track and remediate audit findings">
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',          value: total,   color: 'text-gray-700' },
          { label: 'Open',           value: open,    color: 'text-red-600' },
          { label: 'In Remediation', value: inRem,   color: 'text-amber-600' },
          { label: 'Closed',         value: closed,  color: 'text-green-600' },
          { label: 'Overdue',        value: overdue, color: 'text-red-700' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search findings…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {/* Severity filter pills */}
        <div className="flex gap-1">
          {(['', 'MAJOR', 'MINOR', 'OBSERVATION', 'OFI'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s as FindingSeverity | '')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterSeverity === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s || 'All Severities'}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1">
          {(['', 'OPEN', 'IN_REMEDIATION', 'READY_FOR_REVIEW', 'CLOSED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as FindingStatus | '')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s ? STATUS_META[s as FindingStatus].label : 'All Status'}
            </button>
          ))}
        </div>

        {/* Overdue toggle */}
        <button
          onClick={() => setFilterOverdue(v => !v)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
            filterOverdue
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
          }`}
        >
          <AlertTriangle className="w-3 h-3" /> Overdue only
        </button>

        {/* Refresh */}
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['findings'] })}
          className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading…</div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-red-500">Failed to load findings.</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Shield className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No findings match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Control</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Audit</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {visible.map(f => (
                  <tr
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className="border-b last:border-0 hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600">{f.control?.isoReference}</span>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{f.control?.title}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="truncate text-gray-700">{f.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{f.audit?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        {f.assignee?.name ?? f.assignee?.email ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.dueDate ? (
                        <span className={`flex items-center gap-1 text-xs ${isOverdue(f) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {isOverdue(f) && <AlertTriangle className="w-3 h-3" />}
                          <Calendar className="w-3 h-3" />
                          {fmt(f.dueDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail panel */}
      {selected && (
        <FindingDetailPanel
          finding={selected}
          onClose={() => setSelected(null)}
          onUpdated={updated => setSelected(updated)}
        />
      )}
    </PageTemplate>
  );
}
