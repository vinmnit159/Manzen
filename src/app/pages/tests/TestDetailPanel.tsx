import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, Tag, Link2, Shield, FileText, History, ChevronDown, ChevronUp, Zap, RefreshCw } from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { integrationsService } from '@/services/api/integrations';
import { newRelicService } from '@/services/api/newrelic';
import { notionService, NotionAvailableDatabase } from '@/services/api/notion';
import { usersService } from '@/services/api/users';
import { authService } from '@/services/api/auth';
import type { TestRecord, TestStatus, TestCategory, TestType, TestRunRecord } from '@/services/api/tests';

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

const LAST_RESULT_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pass:    { label: 'Pass',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Fail:    { label: 'Fail',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Warning: { label: 'Warning', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Not_Run: { label: 'Not Run', bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-300'   },
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

function LastResultBadge({ result }: { result: string }) {
  const cfg = LAST_RESULT_CONFIG[result] ?? { label: result, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
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

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

// ─── Automated test runs section ──────────────────────────────────────────────
function RunsSection({ testId }: { testId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: QK.testRuns(testId),
    queryFn: async () => {
      const res = await testsService.getTestRuns(testId);
      if (res.success && res.data) return res.data as TestRunRecord[];
      return [];
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading scan history…</p>;
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No scan runs recorded yet. Run a scan from the Integrations page.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <th className="text-left pb-2 pr-3">Run At</th>
            <th className="text-left pb-2 pr-3">Result</th>
            <th className="text-left pb-2 pr-3">Summary</th>
            <th className="text-left pb-2">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map(run => (
            <tr key={run.id} className="py-2">
              <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(run.executedAt)}</td>
              <td className="py-2 pr-3"><LastResultBadge result={run.status} /></td>
              <td className="py-2 pr-3 text-xs text-gray-700 max-w-[200px] truncate" title={run.summary}>{run.summary || '—'}</td>
              <td className="py-2 text-xs text-gray-400">{run.durationMs != null ? `${run.durationMs}ms` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Notion icon (panel-local) ────────────────────────────────────────────────
function NotionPanelIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="15" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
      <path d="M12 12l53 3.5c6.3.4 7.8 1 10.2 3.8l8.3 11.3c1.4 1.9 1.9 3.2 1.9 8.5v43.7c0 5.9-2.2 9.4-9.7 9.9L17.4 95.5c-5.5.3-8.1-1.1-10.8-4.4L1.9 83.5C.3 81.3 0 79.8 0 77.6V21.8C0 16.3 2.8 12.4 12 12z" fill="white"/>
      <path d="M65 19.5L18 16.2c-5.2-.3-7.6 2.5-7.6 6.9v52.8c0 4.6 1.4 7 5.7 7.4l56.4 3.3c4.5.3 6.9-1.8 6.9-6.7V27.2c0-4.5-2-7-14.4-7.7zM56 29.7L28 28v-.1c-1.2-.1-2.2-1.1-2.2-2.2 0-1.3 1.1-2.2 2.5-2.2l29.1 1.9c1.2.1 2 1 2 2.2 0 1.2-1.5 2.3-3.4 2.1zM22 72V38.3c0-1.8 1.6-2.8 3-1.9L59 56c1.2.7 1.2 2.3 0 3L25 72.7c-1.4.9-3-.1-3-1.7z" fill="#1a1a1a"/>
    </svg>
  );
}

// ─── Create Notion Task Modal ─────────────────────────────────────────────────
function CreateNotionTaskModal({
  testId,
  testName,
  controlId,
  onClose,
  onCreated,
}: {
  testId: string;
  testName: string;
  controlId?: string;
  onClose: () => void;
  onCreated: (url: string) => void;
}) {
  const [dbs, setDbs] = useState<NotionAvailableDatabase[]>([]);
  const [loadingDbs, setLoadingDbs] = useState(true);
  const [selectedDb, setSelectedDb] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const taskTitle = `Remediate: ${testName}`;

  React.useEffect(() => {
    notionService.getDatabases()
      .then(res => {
        const linked = (res.data ?? []).filter(d => d.linked);
        setDbs(linked);
        if (linked.length === 1) setSelectedDb(linked[0].id);
      })
      .catch(() => setError('Failed to load Notion databases'))
      .finally(() => setLoadingDbs(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDb) { setError('Select a Notion database'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await notionService.createTask({
        testId,
        databaseId: selectedDb,
        title: taskTitle,
        dueDate: dueDate || undefined,
        controlId,
      });
      onCreated(res.data.notionPageUrl);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create Notion task');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Create Notion Task</h2>
        <p className="text-sm text-gray-500 mb-4">Push a remediation task to your linked Notion database.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input type="text" value={taskTitle} readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notion Database</label>
            {loadingDbs ? (
              <p className="text-sm text-gray-400 animate-pulse">Loading databases…</p>
            ) : dbs.length === 0 ? (
              <p className="text-sm text-red-600">No linked databases. Link a Notion database from the Integrations page first.</p>
            ) : (
              <select value={selectedDb} onChange={e => setSelectedDb(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">Select a database…</option>
                {dbs.map(db => <option key={db.id} value={db.id}>{db.title}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {controlId && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              Control: <span className="font-mono font-semibold">{controlId}</span> will be linked to the task.
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting || dbs.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Task in Notion'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
interface TestDetailPanelProps {
  testId: string;
  onClose: () => void;
  onMutated?: () => void;
}

const ADMIN_ROLES = ['ORG_ADMIN', 'SUPER_ADMIN', 'SECURITY_OWNER'];

export function TestDetailPanel({ testId, onClose, onMutated }: TestDetailPanelProps) {
  const qc = useQueryClient();
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionTaskUrl, setNotionTaskUrl] = useState<string | null>(null);

  const isAdmin = ADMIN_ROLES.includes(authService.getCachedUser()?.role ?? '');

  // Load org users for owner picker (only for admins)
  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      const res = await usersService.listUsers();
      return res.users ?? [];
    },
    staleTime: STALE.USERS,
    enabled: isAdmin,
  });

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

  const runMutation = useMutation({
    mutationFn: () => {
      const provider = test?.integration?.provider ?? '';
      if (provider === 'NEWRELIC') return newRelicService.runScan();
      return integrationsService.runAutomatedTests();
    },
    onSuccess: () => {
      setRunMsg('Scan triggered. Results will update shortly.');
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['tests'] });
        qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
        setRunMsg(null);
      }, 4000);
    },
    onError: () => {
      setRunMsg('Failed to trigger scan.');
      setTimeout(() => setRunMsg(null), 3000);
    },
  });

  const reassignOwner = useMutation({
    mutationFn: (ownerId: string) => testsService.updateTest(testId, { ownerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
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

  const isAutomated = test?.type === 'Automated';

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
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isAutomated ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
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
                    { label: 'Due Date',  value: fmtDate(test.dueDate) },
                    { label: 'Completed', value: fmtDate(test.completedAt) },
                    { label: 'Type',      value: test.type },
                    { label: 'Category',  value: test.category },
                    { label: 'Created',   value: fmtDate(test.createdAt) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{value}</dd>
                    </div>
                  ))}
                  {/* Owner field — editable for admins */}
                  <div className="col-span-2">
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Owner</dt>
                    {isAdmin && usersData && usersData.length > 0 ? (
                      <select
                        value={test.ownerId}
                        onChange={e => reassignOwner.mutate(e.target.value)}
                        disabled={reassignOwner.isPending}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {usersData.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <dd className="font-medium text-gray-800">
                        {test.owner?.name ?? test.owner?.email ?? test.ownerId}
                      </dd>
                    )}
                  </div>
                </dl>

                {/* Automated-test metadata */}
                {isAutomated && (
                  <div className="mt-4 p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wide">
                      <Zap className="w-3.5 h-3.5" />
                      Automated via {test.integration?.provider ?? 'Integration'}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Scan</dt>
                        <dd className="mt-0.5 font-medium text-gray-800">{fmtDateTime(test.lastRunAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Result</dt>
                        <dd className="mt-0.5"><LastResultBadge result={test.lastResult ?? 'Not_Run'} /></dd>
                      </div>
                    </div>
                    {test.lastResultDetails?.summary && (
                      <p className="text-xs text-gray-600 mt-1">{test.lastResultDetails.summary}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {isAutomated ? (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => runMutation.mutate()}
                      disabled={runMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${runMutation.isPending ? 'animate-spin' : ''}`} />
                      {runMutation.isPending ? 'Running…' : 'Run Scan Now'}
                    </button>
                    {runMsg && (
                      <p className="text-xs text-gray-500">{runMsg}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      This test is system-driven via {test.integration?.provider === 'NEWRELIC' ? 'New Relic' : test.integration?.provider === 'NOTION' ? 'Notion' : 'GitHub'}. Results update automatically on every scan.
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

                {/* Create Notion Task — shown for any failing/needs-remediation test */}
                {(test.status === 'Needs_remediation' || test.status === 'Overdue' || test.lastResult === 'Fail') && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowNotionModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium shadow-sm transition-colors"
                    >
                      <NotionPanelIcon />
                      Create Notion Task
                    </button>
                    {notionTaskUrl && (
                      <p className="mt-1.5 text-xs text-green-700">
                        Task created:{' '}
                        <a href={notionTaskUrl} target="_blank" rel="noreferrer" className="underline hover:text-green-900">
                          Open in Notion
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </Section>

              {/* ── Scan Run History (Automated only) ── */}
              {isAutomated && (
                <Section title="Scan Run History" icon={<Zap className="w-4 h-4 text-gray-500" />}>
                  <RunsSection testId={testId} />
                </Section>
              )}

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

      {/* Notion task creation modal */}
      {showNotionModal && test && (
        <CreateNotionTaskModal
          testId={testId}
          testName={test.name}
          controlId={test.controls[0]?.control?.isoReference}
          onClose={() => setShowNotionModal(false)}
          onCreated={(url) => setNotionTaskUrl(url)}
        />
      )}
    </div>
  );
}
