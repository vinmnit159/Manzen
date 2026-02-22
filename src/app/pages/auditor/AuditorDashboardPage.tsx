/**
 * AuditorDashboardPage  —  /auditor/dashboard
 *
 * Entry point for AUDITOR role users.
 * Shows the auditor's single assigned audit (or an empty state),
 * 4 KPI panels, and the full controls review table.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Clock, CheckCircle2, AlertTriangle, AlertCircle,
  ChevronRight, X, FileText, Eye, PlusCircle, Trash2,
  Link as LinkIcon, FlaskConical, BookOpen,
} from 'lucide-react';
import { auditsService, AuditRecord, AuditControlRecord, AuditControlStatus, FindingSeverity, CreateFindingPayload } from '@/services/api/audits';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { PageTemplate } from '@/app/components/PageTemplate';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysRemaining(end: string | null | undefined): number | null {
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

const REVIEW_STATUS_META: Record<AuditControlStatus, { label: string; color: string }> = {
  PENDING:        { label: 'Pending',        color: 'bg-gray-100 text-gray-600' },
  COMPLIANT:      { label: 'Compliant',      color: 'bg-green-50 text-green-700' },
  NON_COMPLIANT:  { label: 'Non-Compliant',  color: 'bg-red-50 text-red-700' },
  NOT_APPLICABLE: { label: 'Not Applicable', color: 'bg-slate-100 text-slate-500' },
};

function ReviewBadge({ status }: { status: AuditControlStatus }) {
  const m = REVIEW_STATUS_META[status] ?? REVIEW_STATUS_META.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>
      {m.label}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color = 'text-gray-900' }: {
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

// ── Add Finding Modal ─────────────────────────────────────────────────────────

function AddFindingModal({
  auditId,
  auditControlId,
  controlId,
  controlRef,
  onClose,
  onSaved,
}: {
  auditId: string;
  auditControlId: string;
  controlId: string;
  controlRef: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [severity,    setSeverity]    = useState<FindingSeverity>('MINOR');
  const [description, setDescription] = useState('');
  const [remediation, setRemediation] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSave() {
    if (!description.trim()) return setError('Description is required.');
    setSaving(true);
    setError(null);
    try {
      await auditsService.createFinding(auditId, {
        controlId,
        severity,
        description: description.trim(),
        remediation: remediation.trim() || undefined,
        status: 'OPEN',
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create finding');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Finding</h2>
            <p className="text-xs text-gray-400 mt-0.5">Control: <span className="font-mono font-semibold text-blue-700">{controlRef}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Severity <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {(['MINOR', 'MAJOR', 'OBSERVATION'] as FindingSeverity[]).map(s => (
                <label key={s} className={`flex-1 flex items-center justify-center gap-1.5 border rounded-lg px-3 py-2 cursor-pointer text-xs font-medium transition-colors ${
                  severity === s
                    ? s === 'MAJOR'       ? 'border-red-500 bg-red-50 text-red-700'
                    : s === 'MINOR'       ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                  <input type="radio" className="sr-only" checked={severity === s} onChange={() => setSeverity(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Describe the finding..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Recommended Remediation</label>
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Optional: suggested fix..."
              value={remediation}
              onChange={e => setRemediation(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Finding'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Control Review Side Panel ─────────────────────────────────────────────────

function ControlReviewPanel({
  auditControl,
  auditId,
  onClose,
  onUpdated,
}: {
  auditControl: AuditControlRecord;
  auditId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const qc = useQueryClient();
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [savingStatus,     setSavingStatus]     = useState(false);
  const [notes,            setNotes]            = useState(auditControl.notes ?? '');
  const [notesDirty,       setNotesDirty]       = useState(false);

  const ctrl = auditControl.control;
  const evidence    = ctrl.evidence    ?? [];
  const risks       = ctrl.riskMappings?.map((r: any) => r.risk) ?? [];
  const tests       = ctrl.testMappings?.map((r: any) => r.test) ?? [];
  const findings    = ctrl.findings    ?? [];

  async function handleStatusChange(status: AuditControlStatus) {
    setSavingStatus(true);
    try {
      await auditsService.updateControl(auditId, auditControl.id, { reviewStatus: status, notes: notes || undefined });
      onUpdated();
    } catch { /* ignore */ }
    finally { setSavingStatus(false); }
  }

  async function handleSaveNotes() {
    setSavingStatus(true);
    try {
      await auditsService.updateControl(auditId, auditControl.id, { notes });
      setNotesDirty(false);
      onUpdated();
    } catch { /* ignore */ }
    finally { setSavingStatus(false); }
  }

  const statusOptions: { value: AuditControlStatus; label: string; color: string }[] = [
    { value: 'PENDING',        label: 'Pending',        color: 'text-gray-600' },
    { value: 'COMPLIANT',      label: 'Compliant',      color: 'text-green-700' },
    { value: 'NON_COMPLIANT',  label: 'Non-Compliant',  color: 'text-red-700' },
    { value: 'NOT_APPLICABLE', label: 'Not Applicable', color: 'text-slate-500' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/30" onClick={onClose} />
        <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {ctrl.isoReference}
                </span>
                <ReviewBadge status={auditControl.reviewStatus} />
              </div>
              <h2 className="text-base font-semibold text-gray-900">{ctrl.title}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 ml-3 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

            {/* Description */}
            {ctrl.description && (
              <div className="p-5">
                <SectionHead icon={<BookOpen className="w-3.5 h-3.5" />} title="Control Description" />
                <p className="text-sm text-gray-600 leading-relaxed">{ctrl.description}</p>
              </div>
            )}

            {/* Review Status selector */}
            <div className="p-5">
              <SectionHead icon={<CheckCircle2 className="w-3.5 h-3.5" />} title="Review Status" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    disabled={savingStatus}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`flex items-center justify-center gap-1.5 border rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                      auditControl.reviewStatus === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {auditControl.reviewStatus === opt.value && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="p-5">
              <SectionHead icon={<FileText className="w-3.5 h-3.5" />} title="Auditor Notes" />
              <textarea
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add notes about this control review..."
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
              />
              {notesDirty && (
                <div className="flex justify-end mt-1.5">
                  <Button size="sm" onClick={handleSaveNotes} disabled={savingStatus}>
                    {savingStatus ? 'Saving…' : 'Save Notes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Related Evidence */}
            <div className="p-5">
              <SectionHead icon={<LinkIcon className="w-3.5 h-3.5" />} title={`Evidence (${evidence.length})`} />
              {evidence.length === 0
                ? <p className="text-xs text-gray-400">No evidence linked to this control.</p>
                : (
                  <div className="space-y-1.5">
                    {evidence.map((ev: any) => (
                      <div key={ev.id} className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
                        <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700">{ev.type}</span>
                        {ev.fileName && <span className="text-gray-500 truncate">{ev.fileName}</span>}
                        {ev.automated && <Badge variant="outline" className="text-xs ml-auto">Automated</Badge>}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Related Tests */}
            <div className="p-5">
              <SectionHead icon={<FlaskConical className="w-3.5 h-3.5" />} title={`Tests (${tests.length})`} />
              {tests.length === 0
                ? <p className="text-xs text-gray-400">No tests linked to this control.</p>
                : (
                  <div className="space-y-1.5">
                    {tests.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-700 flex-1 truncate">{t.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          t.status === 'OK'      ? 'bg-green-50 text-green-700' :
                          t.status === 'Overdue' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{t.status}</span>
                        {t.completedAt && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Related Risks */}
            {risks.length > 0 && (
              <div className="p-5">
                <SectionHead icon={<AlertTriangle className="w-3.5 h-3.5" />} title={`Risks (${risks.length})`} />
                <div className="space-y-1.5">
                  {risks.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        r.impact === 'CRITICAL' ? 'bg-red-500' :
                        r.impact === 'HIGH'     ? 'bg-orange-500' :
                        r.impact === 'MEDIUM'   ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <span className="font-medium text-gray-700 flex-1 truncate">{r.title}</span>
                      <span className="text-gray-400">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit History / Findings */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionHead icon={<AlertCircle className="w-3.5 h-3.5" />} title={`Findings (${findings.length})`} noMargin />
                <button
                  onClick={() => setShowFindingModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Finding
                </button>
              </div>
              {findings.length === 0
                ? <p className="text-xs text-gray-400">No findings raised for this control yet.</p>
                : (
                  <div className="space-y-2">
                    {findings.map((f: any) => (
                      <FindingRow key={f.id} finding={f} auditId={auditId} onDeleted={onUpdated} />
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>

      {showFindingModal && (
        <AddFindingModal
          auditId={auditId}
          auditControlId={auditControl.id}
          controlId={ctrl.id}
          controlRef={ctrl.isoReference}
          onClose={() => setShowFindingModal(false)}
          onSaved={onUpdated}
        />
      )}
    </>
  );
}

function SectionHead({ icon, title, noMargin }: { icon: React.ReactNode; title: string; noMargin?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${noMargin ? '' : 'mb-3'}`}>
      <span className="text-gray-400">{icon}</span>
      {title}
    </div>
  );
}

function FindingRow({ finding, auditId, onDeleted }: { finding: any; auditId: string; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this finding?')) return;
    setDeleting(true);
    try { await auditsService.deleteFinding(auditId, finding.id); onDeleted(); }
    catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          finding.severity === 'MAJOR'       ? 'bg-red-50 text-red-700' :
          finding.severity === 'MINOR'       ? 'bg-amber-50 text-amber-700' :
          'bg-blue-50 text-blue-700'
        }`}>{finding.severity}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          finding.status === 'OPEN'   ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
        }`}>{finding.status}</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-gray-700">{finding.description}</p>
      {finding.remediation && (
        <p className="text-xs text-gray-500 mt-1 italic">Remediation: {finding.remediation}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AuditorDashboardPage() {
  const qc = useQueryClient();
  const [selectedControl, setSelectedControl] = useState<AuditControlRecord | null>(null);
  const [statusFilter,    setStatusFilter]    = useState<'' | AuditControlStatus>('');

  // Fetch audits (backend filters to only assigned audits for AUDITOR role)
  const { data: auditsData, isLoading: auditsLoading } = useQuery<{ success: boolean; data: AuditRecord[] }>({
    queryKey: ['auditor-audits'],
    queryFn:  () => auditsService.list(),
  });

  const audits = auditsData?.data ?? [];
  // Pick the most recent IN_PROGRESS audit, fall back to PLANNED, then first
  const audit = audits.find(a => a.status === 'IN_PROGRESS')
    ?? audits.find(a => a.status === 'PLANNED')
    ?? audits[0]
    ?? null;

  // Fetch controls for the active audit
  const { data: controlsData, isLoading: controlsLoading, refetch: refetchControls } = useQuery<{ success: boolean; data: AuditControlRecord[] }>({
    queryKey: ['auditor-controls', audit?.id],
    queryFn:  () => auditsService.listControls(audit!.id),
    enabled:  !!audit,
  });

  const auditControls = controlsData?.data ?? [];

  // ── KPI computations ──────────────────────────────────────────────────────
  const totalControls   = auditControls.length;
  const reviewed        = auditControls.filter(c => c.reviewStatus !== 'PENDING').length;
  const openFindings    = (audit?.findings ?? []).filter(f => f.status === 'OPEN').length;
  const days            = daysRemaining(audit?.endDate);

  const filtered = statusFilter
    ? auditControls.filter(c => c.reviewStatus === statusFilter)
    : auditControls;

  if (auditsLoading) {
    return (
      <PageTemplate title="Auditor Dashboard">
        <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
      </PageTemplate>
    );
  }

  if (!audit) {
    return (
      <PageTemplate title="Auditor Dashboard">
        <div className="py-20 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-base font-medium text-gray-600">No audits assigned</p>
          <p className="text-sm text-gray-400 mt-1">An admin will assign an audit to you. Check back soon.</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Auditor Dashboard"
      description={audit.name}
    >
      {/* Audit meta banner */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-600">
        <span className="font-medium text-gray-900">{audit.name}</span>
        {audit.frameworkName && <span className="text-gray-400">· {audit.frameworkName}</span>}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          audit.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' :
          audit.status === 'COMPLETED'   ? 'bg-green-50 text-green-700' :
          'bg-blue-50 text-blue-700'
        }`}>{audit.status.replace('_', ' ')}</span>
        <span className="ml-auto text-xs text-gray-400">
          {fmt(audit.startDate)} → {fmt(audit.endDate)}
        </span>
      </div>

      {/* 4 KPI panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Controls in Scope"
          value={totalControls}
          icon={<Shield className="w-5 h-5" />}
        />
        <KpiCard
          label="Controls Reviewed"
          value={`${reviewed} / ${totalControls}`}
          sub={totalControls > 0 ? `${Math.round((reviewed / totalControls) * 100)}% complete` : undefined}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-green-700"
        />
        <KpiCard
          label="Open Findings"
          value={openFindings}
          icon={<AlertCircle className="w-5 h-5" />}
          color={openFindings > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <KpiCard
          label="Days Remaining"
          value={days === null ? '—' : days < 0 ? 'Overdue' : `${days}d`}
          sub={audit.endDate ? `Due ${fmt(audit.endDate)}` : undefined}
          icon={<Clock className="w-5 h-5" />}
          color={days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 7 ? 'text-amber-600' : 'text-gray-900'}
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {([
          { value: '',               label: 'All' },
          { value: 'PENDING',        label: 'Pending' },
          { value: 'COMPLIANT',      label: 'Compliant' },
          { value: 'NON_COMPLIANT',  label: 'Non-Compliant' },
          { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
        ] as const).map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.value !== '' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({auditControls.filter(c => c.reviewStatus === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Controls review table */}
      <Card className="overflow-hidden">
        {controlsLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading controls…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No controls match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Control', 'Title', 'Evidence', 'Tests', 'Review Status', 'Findings', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(ac => {
                  const evidenceCount = ac.control.evidence?.length ?? 0;
                  const testCount     = ac.control.testMappings?.length ?? 0;
                  const findingCount  = ac.control.findings?.length ?? 0;

                  return (
                    <tr key={ac.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {ac.control.isoReference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[220px]">
                        <span className="line-clamp-2 text-xs leading-snug">{ac.control.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs ${evidenceCount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                          <LinkIcon className="w-3 h-3" />
                          {evidenceCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs ${testCount > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                          <FlaskConical className="w-3 h-3" />
                          {testCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ReviewBadge status={ac.reviewStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {findingCount > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {findingCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedControl(ac)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Control review side panel */}
      {selectedControl && (
        <ControlReviewPanel
          auditControl={selectedControl}
          auditId={audit.id}
          onClose={() => setSelectedControl(null)}
          onUpdated={() => {
            refetchControls();
            setSelectedControl(null);
          }}
        />
      )}
    </PageTemplate>
  );
}
