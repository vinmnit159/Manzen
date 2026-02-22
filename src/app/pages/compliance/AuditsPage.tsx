import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Plus, Search, ChevronRight, Calendar, User, Shield,
  Clock, CheckCircle2, AlertCircle, FileText, X, ChevronDown,
} from 'lucide-react';
import { auditsService, AuditRecord, AuditType, AuditStatus, CreateAuditPayload } from '@/services/api/audits';
import { apiClient } from '@/services/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRecord { id: string; name: string | null; email: string; role: string; }
interface ControlRecord { id: string; isoReference: string; title: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  INTERNAL:        'Internal',
  EXTERNAL:        'External',
  SURVEILLANCE:    'Surveillance',
  RECERTIFICATION: 'Recertification',
};

const STATUS_META: Record<AuditStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:       { label: 'Draft',       color: 'bg-gray-100 text-gray-600',   icon: <FileText className="w-3 h-3" /> },
  PLANNED:     { label: 'Planned',     color: 'bg-blue-50 text-blue-700',    icon: <Clock className="w-3 h-3" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-50 text-amber-700',  icon: <AlertCircle className="w-3 h-3" /> },
  COMPLETED:   { label: 'Completed',   color: 'bg-green-50 text-green-700',  icon: <CheckCircle2 className="w-3 h-3" /> },
};

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: AuditStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

// ── Schedule Audit Modal ──────────────────────────────────────────────────────

function ScheduleAuditModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep]       = useState<1 | 2>(1);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Form state
  const [name, setName]               = useState('');
  const [type, setType]               = useState<AuditType>('INTERNAL');
  const [frameworkName, setFw]        = useState('ISO 27001:2022');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd]     = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [auditorType, setAuditorType] = useState<'internal' | 'external'>('internal');
  const [assignedAuditorId, setAssignedAuditorId]     = useState('');
  const [externalAuditorEmail, setExternalEmail]       = useState('');
  const [scopeAll, setScopeAll]       = useState(true);
  const [selectedControlIds, setSelectedControlIds]   = useState<string[]>([]);
  const [controlSearch, setControlSearch] = useState('');

  // Fetch users and controls for dropdowns
  const { data: usersData }    = useQuery<{ data: UserRecord[] }>({
    queryKey: ['users'],
    queryFn:  () => apiClient.get('/api/users'),
    staleTime: 30_000,
  });
  const { data: controlsData } = useQuery<{ data: ControlRecord[] }>({
    queryKey: ['controls'],
    queryFn:  () => apiClient.get('/api/controls'),
    staleTime: 30_000,
  });

  const users    = usersData?.data   ?? [];
  const controls = controlsData?.data ?? [];

  const filteredControls = controls.filter(c =>
    !controlSearch ||
    c.isoReference.toLowerCase().includes(controlSearch.toLowerCase()) ||
    c.title.toLowerCase().includes(controlSearch.toLowerCase())
  );

  function toggleControl(id: string) {
    setSelectedControlIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!name.trim())    return setError('Audit name is required.');
    if (!startDate)      return setError('Start date is required.');
    if (!scopeAll && selectedControlIds.length === 0)
      return setError('Select at least one control, or choose "Entire Framework".');

    setSaving(true);
    setError(null);
    try {
      const payload: CreateAuditPayload = {
        name:      name.trim(),
        type,
        frameworkName: frameworkName || undefined,
        periodStart:   periodStart   || undefined,
        periodEnd:     periodEnd     || undefined,
        startDate,
        endDate:       endDate       || undefined,
        allControls:   scopeAll,
        controlIds:    scopeAll ? undefined : selectedControlIds,
        assignedAuditorId:    auditorType === 'internal'  && assignedAuditorId  ? assignedAuditorId  : undefined,
        externalAuditorEmail: auditorType === 'external'  && externalAuditorEmail ? externalAuditorEmail : undefined,
      };
      await auditsService.create(payload);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create audit');
    } finally {
      setSaving(false);
    }
  }

  // Field group helper
  const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const selectCls = inputCls;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Schedule New Audit</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2 — {step === 1 ? 'Audit Details' : 'Scope & Auditor'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          {step === 1 && (
            <>
              <Field label="Audit Name" required>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ISO 27001 Annual Surveillance Audit" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Audit Type" required>
                  <select className={selectCls} value={type} onChange={e => setType(e.target.value as AuditType)}>
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External</option>
                    <option value="SURVEILLANCE">Surveillance</option>
                    <option value="RECERTIFICATION">Recertification</option>
                  </select>
                </Field>
                <Field label="Framework">
                  <input className={inputCls} value={frameworkName} onChange={e => setFw(e.target.value)} placeholder="ISO 27001:2022" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Audit Period Start">
                  <input type="date" className={inputCls} value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </Field>
                <Field label="Audit Period End">
                  <input type="date" className={inputCls} value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Scheduled Start Date" required>
                  <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
                </Field>
                <Field label="Scheduled End Date">
                  <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Scope */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Audit Scope</label>
                <div className="flex gap-3 mb-3">
                  <label className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${scopeAll ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" className="accent-blue-600" checked={scopeAll} onChange={() => setScopeAll(true)} />
                    <span className="text-sm font-medium text-gray-800">Entire Framework</span>
                    <span className="text-xs text-gray-400 ml-auto">All {controls.length} controls</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${!scopeAll ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" className="accent-blue-600" checked={!scopeAll} onChange={() => setScopeAll(false)} />
                    <span className="text-sm font-medium text-gray-800">Specific Controls</span>
                    {!scopeAll && selectedControlIds.length > 0 && (
                      <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 ml-auto">{selectedControlIds.length}</span>
                    )}
                  </label>
                </div>

                {!scopeAll && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input
                        className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                        placeholder="Search controls..."
                        value={controlSearch}
                        onChange={e => setControlSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {filteredControls.length === 0
                        ? <p className="text-xs text-gray-400 text-center py-4">No controls found</p>
                        : filteredControls.map(c => (
                          <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-blue-600"
                              checked={selectedControlIds.includes(c.id)}
                              onChange={() => toggleControl(c.id)}
                            />
                            <span className="text-xs font-mono font-semibold text-blue-700 w-14 flex-shrink-0">{c.isoReference}</span>
                            <span className="text-xs text-gray-700 truncate">{c.title}</span>
                          </label>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Auditor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Assign Auditor</label>
                <div className="flex gap-3 mb-3">
                  {(['internal', 'external'] as const).map(t => (
                    <label key={t} className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${auditorType === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" className="accent-blue-600" checked={auditorType === t} onChange={() => setAuditorType(t)} />
                      <span className="text-sm font-medium text-gray-800 capitalize">{t}</span>
                    </label>
                  ))}
                </div>

                {auditorType === 'internal' ? (
                  <Field label="Select Internal Auditor">
                    <select className={selectCls} value={assignedAuditorId} onChange={e => setAssignedAuditorId(e.target.value)}>
                      <option value="">— None assigned —</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name ?? u.email} ({u.role})</option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="External Auditor Email">
                    <input
                      type="email"
                      className={inputCls}
                      value={externalAuditorEmail}
                      onChange={e => setExternalEmail(e.target.value)}
                      placeholder="auditor@firm.com"
                    />
                  </Field>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <div className="flex gap-2">
            {step === 1 ? (
              <Button onClick={() => {
                if (!name.trim()) return setError('Audit name is required.');
                if (!startDate)   return setError('Start date is required.');
                setError(null);
                setStep(2);
              }}>
                Next: Scope & Auditor →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Creating...' : 'Create Audit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Audit Detail Panel ────────────────────────────────────────────────────────

function AuditDetailPanel({
  audit,
  onClose,
  onRefresh,
}: {
  audit: AuditRecord;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [acting, setActing] = useState(false);

  async function handleStart() {
    setActing(true);
    try { await auditsService.start(audit.id); onRefresh(); }
    catch { /* ignore */ }
    finally { setActing(false); }
  }

  async function handleClose() {
    if (!window.confirm('Mark this audit as Completed?')) return;
    setActing(true);
    try { await auditsService.close(audit.id); onRefresh(); }
    catch { /* ignore */ }
    finally { setActing(false); }
  }

  const totalControls = audit._count?.auditControls ?? audit.auditControls?.length ?? 0;
  const findings      = audit.findings ?? [];
  const major      = findings.filter(f => f.severity === 'MAJOR').length;
  const minor      = findings.filter(f => f.severity === 'MINOR').length;
  const obs        = findings.filter(f => f.severity === 'OBSERVATION').length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{audit.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={audit.status} />
              <span className="text-xs text-gray-400">{AUDIT_TYPE_LABELS[audit.type]}</span>
              {audit.frameworkName && <span className="text-xs text-gray-400">· {audit.frameworkName}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 p-5 border-b border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalControls}</div>
            <div className="text-xs text-gray-400 mt-0.5">Controls in Scope</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{major}</div>
            <div className="text-xs text-gray-400 mt-0.5">Major Findings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{minor + obs}</div>
            <div className="text-xs text-gray-400 mt-0.5">Minor / Observations</div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3 border-b border-gray-100">
          <Row icon={<Calendar className="w-4 h-4" />} label="Scheduled" value={`${fmt(audit.startDate)} → ${fmt(audit.endDate)}`} />
          {(audit.periodStart || audit.periodEnd) && (
            <Row icon={<Shield className="w-4 h-4" />} label="Audit Period" value={`${fmt(audit.periodStart)} → ${fmt(audit.periodEnd)}`} />
          )}
          <Row icon={<User className="w-4 h-4" />} label="Auditor"
            value={audit.externalAuditorEmail ?? (audit.assignedAuditorId ? `Internal (${audit.assignedAuditorId.slice(0,8)}…)` : 'Not assigned')} />
          {audit.closedAt && <Row icon={<CheckCircle2 className="w-4 h-4" />} label="Closed" value={fmt(audit.closedAt)} />}
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Findings ({findings.length})</h3>
            <div className="space-y-2">
              {findings.map(f => (
                <div key={f.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      f.severity === 'MAJOR' ? 'bg-red-50 text-red-700' :
                      f.severity === 'MINOR' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{f.severity}</span>
                    {f.control && <span className="text-xs font-mono text-blue-700">{f.control.isoReference}</span>}
                  </div>
                  <p className="text-xs text-gray-700">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 flex gap-2 mt-auto">
          {(audit.status === 'DRAFT' || audit.status === 'PLANNED') && (
            <Button onClick={handleStart} disabled={acting} className="flex-1">
              {acting ? 'Starting…' : 'Start Audit'}
            </Button>
          )}
          {audit.status === 'IN_PROGRESS' && (
            <Button onClick={handleClose} disabled={acting} className="flex-1 bg-green-700 hover:bg-green-600">
              {acting ? 'Closing…' : 'Close / Complete Audit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: '' | AuditStatus; label: string }[] = [
  { value: '',            label: 'All' },
  { value: 'DRAFT',       label: 'Draft' },
  { value: 'PLANNED',     label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED',   label: 'Completed' },
];

export function AuditsPage() {
  const qc = useQueryClient();
  const [showModal,    setShowModal]    = useState(false);
  const [selected,     setSelected]     = useState<AuditRecord | null>(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | AuditStatus>('');
  const [typeFilter,   setTypeFilter]   = useState<'' | AuditType>('');
  const [toast,        setToast]        = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: AuditRecord[] }>({
    queryKey: ['audits', statusFilter, typeFilter],
    queryFn:  () => auditsService.list({
      status: statusFilter || undefined,
      type:   typeFilter   || undefined,
    } as any),
  });

  const audits = data?.data ?? [];

  const filtered = search
    ? audits.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.frameworkName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : audits;

  function onCreated() {
    showToast('success', 'Audit scheduled successfully');
    refetch();
  }

  // Stat strip
  const counts = {
    total:      audits.length,
    planned:    audits.filter(a => a.status === 'PLANNED').length,
    inProgress: audits.filter(a => a.status === 'IN_PROGRESS').length,
    completed:  audits.filter(a => a.status === 'COMPLETED').length,
  };

  return (
    <PageTemplate
      title="Audits"
      description="Schedule and track security and compliance audits."
      actions={
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule New Audit
        </Button>
      }
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',       value: counts.total,      color: 'text-gray-900' },
          { label: 'Planned',     value: counts.planned,    color: 'text-blue-700' },
          { label: 'In Progress', value: counts.inProgress, color: 'text-amber-700' },
          { label: 'Completed',   value: counts.completed,  color: 'text-green-700' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 bg-white flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            className="text-sm outline-none flex-1 placeholder-gray-400"
            placeholder="Search audits..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(f => (
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
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as '' | AuditType)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="INTERNAL">Internal</option>
          <option value="EXTERNAL">External</option>
          <option value="SURVEILLANCE">Surveillance</option>
          <option value="RECERTIFICATION">Recertification</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading audits…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No audits found</p>
            <p className="text-xs text-gray-400 mt-1">Click "Schedule New Audit" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Framework', 'Period', 'Type', 'Status', 'Auditor', 'Findings', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(audit => {
                  const findings     = audit.findings ?? [];
                  const majorCount   = findings.filter(f => f.severity === 'MAJOR').length;
                  const minorCount   = findings.filter(f => f.severity === 'MINOR').length;
                  const auditorLabel = audit.externalAuditorEmail
                    ? audit.externalAuditorEmail
                    : audit.assignedAuditorId
                    ? 'Internal'
                    : '—';

                  return (
                    <tr
                      key={audit.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(audit)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{audit.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{audit.frameworkName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {audit.periodStart ? `${fmt(audit.periodStart)} → ${fmt(audit.periodEnd)}` : fmt(audit.startDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{AUDIT_TYPE_LABELS[audit.type]}</td>
                      <td className="px-4 py-3"><StatusBadge status={audit.status} /></td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[140px] truncate">{auditorLabel}</td>
                      <td className="px-4 py-3">
                        {findings.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            {majorCount > 0 && <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">{majorCount} Major</span>}
                            {minorCount > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{minorCount} Minor</span>}
                          </div>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showModal && (
        <ScheduleAuditModal onClose={() => setShowModal(false)} onCreated={onCreated} />
      )}
      {selected && (
        <AuditDetailPanel
          audit={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => { refetch(); setSelected(null); }}
        />
      )}
    </PageTemplate>
  );
}
