import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Link as LinkIcon,
  FlaskConical,
  BookOpen,
  PlusCircle,
  Trash2,
  Sparkles,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import {
  auditsService,
  AuditControlRecord,
  AuditControlStatus,
} from '@/services/api/audits';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ReviewBadge } from './helpers';
import { AddFindingModal } from './AddFindingModal';
import { aiService, AuditorNoteResult } from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';

// ── Auditor Note AI Panel (AI-4) ─────────────────────────────────────────────

function AuditorNoteAiPanel({
  controlId,
  auditId,
  onNoteAccepted,
}: {
  controlId: string;
  auditId: string;
  onNoteAccepted: (noteText: string) => void;
}) {
  const [draft, setDraft] = useState<AuditorNoteResult | null>(null);
  const [editedText, setEditedText] = useState('');

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateAuditorNote(controlId, auditId),
    onSuccess: (resp) => {
      setDraft(resp.data);
      setEditedText(resp.data.noteText);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      aiService.applyAuditorNote(
        draft!.generationId,
        auditId,
        controlId,
        editedText,
      ),
    onSuccess: () => {
      onNoteAccepted(editedText);
      setDraft(null);
    },
  });

  if (!draft) {
    return (
      <button
        type="button"
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50"
      >
        {generateMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {generateMutation.isPending ? 'Generating…' : 'Generate AI note'}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
        <span className="text-xs font-semibold text-violet-800">
          AI-generated auditor note
        </span>
        <span className="ml-auto text-xs text-violet-500">
          Review before applying
        </span>
      </div>

      <textarea
        rows={4}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
      />

      {draft.citations.length > 0 && (
        <CitationViewer
          citations={draft.citations}
          label="Sources"
          className="text-xs"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => applyMutation.mutate()}
          disabled={!editedText.trim() || applyMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {applyMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" />
          )}
          Apply note
        </button>
        <button
          type="button"
          onClick={() => setDraft(null)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

// ── Section Head helper ───────────────────────────────────────────────────────

export function SectionHead({
  icon,
  title,
  noMargin,
}: {
  icon: React.ReactNode;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${noMargin ? '' : 'mb-3'}`}
    >
      <span className="text-gray-400">{icon}</span>
      {title}
    </div>
  );
}

// ── Finding Row ───────────────────────────────────────────────────────────────

export function FindingRow({
  finding,
  auditId,
  onDeleted,
}: {
  finding: any;
  auditId: string;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this finding?')) return;
    setDeleting(true);
    try {
      await auditsService.deleteFinding(auditId, finding.id);
      onDeleted();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            finding.severity === 'MAJOR'
              ? 'bg-red-50 text-red-700'
              : finding.severity === 'MINOR'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-blue-50 text-blue-700'
          }`}
        >
          {finding.severity}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            finding.status === 'OPEN'
              ? 'bg-orange-50 text-orange-600'
              : 'bg-green-50 text-green-600'
          }`}
        >
          {finding.status}
        </span>
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
        <p className="text-xs text-gray-500 mt-1 italic">
          Remediation: {finding.remediation}
        </p>
      )}
    </div>
  );
}

// ── Control Review Side Panel ─────────────────────────────────────────────────

export function ControlReviewPanel({
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
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notes, setNotes] = useState(auditControl.notes ?? '');
  const [notesDirty, setNotesDirty] = useState(false);

  const ctrl = auditControl.control;
  const evidence = ctrl.evidence ?? [];
  const risks = ctrl.riskMappings?.map((r: any) => r.risk) ?? [];
  const tests = ctrl.testMappings?.map((r: any) => r.test) ?? [];
  const findings = ctrl.findings ?? [];

  async function handleStatusChange(status: AuditControlStatus) {
    setSavingStatus(true);
    setSaveError(null);
    try {
      await auditsService.updateControl(auditId, auditControl.id, {
        reviewStatus: status,
        notes: notes || undefined,
      });
      onUpdated();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update status',
      );
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveNotes() {
    setSavingStatus(true);
    setSaveError(null);
    try {
      await auditsService.updateControl(auditId, auditControl.id, { notes });
      setNotesDirty(false);
      onUpdated();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingStatus(false);
    }
  }

  const statusOptions: {
    value: AuditControlStatus;
    label: string;
    color: string;
  }[] = [
    { value: 'PENDING', label: 'Pending', color: 'text-gray-600' },
    { value: 'COMPLIANT', label: 'Compliant', color: 'text-green-700' },
    { value: 'NON_COMPLIANT', label: 'Non-Compliant', color: 'text-red-700' },
    {
      value: 'NOT_APPLICABLE',
      label: 'Not Applicable',
      color: 'text-slate-500',
    },
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
              <h2 className="text-base font-semibold text-gray-900">
                {ctrl.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 ml-3 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {/* Description */}
            {ctrl.description && (
              <div className="p-5">
                <SectionHead
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  title="Control Description"
                />
                <p className="text-sm text-gray-600 leading-relaxed">
                  {ctrl.description}
                </p>
              </div>
            )}

            {/* Review Status selector */}
            <div className="p-5">
              <SectionHead
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                title="Review Status"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusOptions.map((opt) => (
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
                    {auditControl.reviewStatus === opt.value && (
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="p-5">
              <SectionHead
                icon={<FileText className="w-3.5 h-3.5" />}
                title="Auditor Notes"
              />
              <textarea
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add notes about this control review..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesDirty(true);
                }}
              />
              {saveError && (
                <p className="mt-1 text-xs text-red-600">{saveError}</p>
              )}
              {notesDirty && (
                <div className="flex justify-end mt-1.5">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingStatus}
                  >
                    {savingStatus ? 'Saving…' : 'Save Notes'}
                  </Button>
                </div>
              )}
              {/* AI-4: Auditor note generator — surfaces below the manual textarea */}
              <AuditorNoteAiPanel
                controlId={ctrl.id}
                auditId={auditId}
                onNoteAccepted={(text) => {
                  setNotes(text);
                  setNotesDirty(true);
                }}
              />
            </div>

            {/* Related Evidence */}
            <div className="p-5">
              <SectionHead
                icon={<LinkIcon className="w-3.5 h-3.5" />}
                title={`Evidence (${evidence.length})`}
              />
              {evidence.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No evidence linked to this control.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {evidence.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-700">
                        {ev.type}
                      </span>
                      {ev.fileName && (
                        <span className="text-gray-500 truncate">
                          {ev.fileName}
                        </span>
                      )}
                      {ev.automated && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          Automated
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Tests */}
            <div className="p-5">
              <SectionHead
                icon={<FlaskConical className="w-3.5 h-3.5" />}
                title={`Tests (${tests.length})`}
              />
              {tests.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No tests linked to this control.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {tests.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-gray-700 flex-1 truncate">
                        {t.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          t.status === 'OK'
                            ? 'bg-green-50 text-green-700'
                            : t.status === 'Overdue'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t.status}
                      </span>
                      {t.completedAt && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Risks */}
            {risks.length > 0 && (
              <div className="p-5">
                <SectionHead
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  title={`Risks (${risks.length})`}
                />
                <div className="space-y-1.5">
                  {risks.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          r.impact === 'CRITICAL'
                            ? 'bg-red-500'
                            : r.impact === 'HIGH'
                              ? 'bg-orange-500'
                              : r.impact === 'MEDIUM'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                        }`}
                      />
                      <span className="font-medium text-gray-700 flex-1 truncate">
                        {r.title}
                      </span>
                      <span className="text-gray-400">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit History / Findings */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionHead
                  icon={<AlertCircle className="w-3.5 h-3.5" />}
                  title={`Findings (${findings.length})`}
                  noMargin
                />
                <button
                  onClick={() => setShowFindingModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Finding
                </button>
              </div>
              {findings.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No findings raised for this control yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {findings.map((f: any) => (
                    <FindingRow
                      key={f.id}
                      finding={f}
                      auditId={auditId}
                      onDeleted={onUpdated}
                    />
                  ))}
                </div>
              )}
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
