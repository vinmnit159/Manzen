import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, Clock, AlertTriangle, Tag, Link2, Shield, FileText, History, ChevronDown, ChevronUp } from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import type { TestRecord, TestStatus, TestCategory, TestType } from '@/services/api/tests';

// ─── Status / category config ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<TestStatus, { label: string; bg: string; text: string; dot: string }> = {
  OK:                { label: 'OK',                bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Due_soon:          { label: 'Due Soon',          bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Overdue:           { label: 'Overdue',           bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Needs_remediation: { label: 'Needs Remediation', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const CATEGORY_COLOR: Record<TestCategory, string> = {
  Custom:      'bg-gray-100 text-gray-700',
  Engineering: 'bg-blue-100 text-blue-700',
  HR:          'bg-pink-100 text-pink-700',
  IT:          'bg-cyan-100 text-cyan-700',
  Policy:      'bg-indigo-100 text-indigo-700',
  Risks:       'bg-orange-100 text-orange-700',
};

function StatusBadge({ status }: { status: TestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ─── History section ──────────────────────────────────────────────────────────
function HistorySection({ testId }: { testId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: QK.testHistory(testId),
    queryFn: async () => {
      const res = await testsService.getHistory(testId);
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading history…</p>;
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No history recorded yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-4">
      {data.map(entry => (
        <li key={entry.id} className="ml-4">
          <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
          <p className="text-xs text-gray-400">{fmtDate(entry.createdAt)}</p>
          <p className="text-sm font-medium text-gray-800">{entry.changeType}</p>
          {(entry.oldValue || entry.newValue) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {entry.oldValue && <span className="line-through mr-2">{entry.oldValue}</span>}
              {entry.newValue && <span className="text-green-700">{entry.newValue}</span>}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
interface TestDetailPanelProps {
  testId: string;
  onClose: () => void;
  onMutated?: () => void;
}

export function TestDetailPanel({ testId, onClose, onMutated }: TestDetailPanelProps) {
  const qc = useQueryClient();

  const { data: test, isLoading, isError } = useQuery({
    queryKey: QK.testDetail(testId),
    queryFn: async () => {
      const res = await testsService.getTest(testId);
      if (res.success && res.data) return res.data as TestRecord;
      throw new Error('Failed to load test');
    },
    staleTime: STALE.TESTS,
  });

  const completeMutation = useMutation({
    mutationFn: () => testsService.completeTest(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      onMutated?.();
    },
  });

  const detachEvidence = useMutation({
    mutationFn: (evidenceId: string) => testsService.detachEvidence(testId, evidenceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const detachControl = useMutation({
    mutationFn: (controlId: string) => testsService.detachControl(testId, controlId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const detachFramework = useMutation({
    mutationFn: (fwId: string) => testsService.detachFramework(testId, fwId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  return (
    // Overlay
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0">
          {isLoading ? (
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          ) : test ? (
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{test.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={test.status} />
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[test.category]}`}>
                  {test.category}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {test.type}
                </span>
              </div>
            </div>
          ) : null}
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              Failed to load test details.
            </div>
          )}

          {test && (
            <>
              {/* ── Overview ── */}
              <Section title="Overview" icon={<FileText className="w-4 h-4 text-gray-500" />}>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Due Date',     value: fmtDate(test.dueDate) },
                    { label: 'Completed',    value: fmtDate(test.completedAt) },
                    { label: 'Owner',        value: test.owner?.name ?? test.ownerId },
                    { label: 'Type',         value: test.type },
                    { label: 'Category',     value: test.category },
                    { label: 'Created',      value: fmtDate(test.createdAt) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Mark complete */}
                {test.status !== 'OK' && (
                  <button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {completeMutation.isPending ? 'Marking…' : 'Mark Complete'}
                  </button>
                )}
                {test.status === 'OK' && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                    <CheckCircle className="w-4 h-4" />
                    Completed {fmtDate(test.completedAt)}
                  </div>
                )}
              </Section>

              {/* ── Evidence ── */}
              <Section title={`Evidence (${test.evidences.length})`} icon={<Shield className="w-4 h-4 text-gray-500" />}>
                {test.evidences.length === 0 ? (
                  <p className="text-sm text-gray-400">No evidence attached.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.evidences.map(({ id, evidenceId, evidence }) => (
                      <li key={id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{evidence.fileName ?? evidence.type}</p>
                          {evidence.fileUrl && (
                            <a href={evidence.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              View file
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(evidence.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => detachEvidence.mutate(evidenceId)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Detach evidence"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* ── Linked Controls ── */}
              <Section title={`Controls (${test.controls.length})`} icon={<Shield className="w-4 h-4 text-gray-500" />}>
                {test.controls.length === 0 ? (
                  <p className="text-sm text-gray-400">No controls linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.controls.map(({ id, controlId, control }) => (
                      <li key={id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                            {control.isoReference}
                          </span>
                          <span className="text-sm text-gray-700">{control.title}</span>
                        </div>
                        <button
                          onClick={() => detachControl.mutate(controlId)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Detach control"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* ── Linked Frameworks ── */}
              <Section title={`Frameworks (${test.frameworks.length})`} icon={<Tag className="w-4 h-4 text-gray-500" />}>
                {test.frameworks.length === 0 ? (
                  <p className="text-sm text-gray-400">No frameworks linked.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {test.frameworks.map(({ id, frameworkName }) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {frameworkName}
                        <button
                          onClick={() => detachFramework.mutate(id)}
                          className="hover:text-red-500 transition-colors"
                          title="Remove framework"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              {/* ── Linked Audits ── */}
              <Section title={`Audits (${test.audits.length})`} icon={<Link2 className="w-4 h-4 text-gray-500" />}>
                {test.audits.length === 0 ? (
                  <p className="text-sm text-gray-400">No audits linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.audits.map(({ id, audit }) => (
                      <li key={id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm">
                        <p className="font-medium text-gray-800">{audit.type}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Auditor: {audit.auditor}</p>
                        {audit.scope && <p className="text-xs text-gray-400 mt-0.5">{audit.scope}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* ── History ── */}
              <Section title="History" icon={<History className="w-4 h-4 text-gray-500" />}>
                <HistorySection testId={testId} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
