import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/app/components/ui/button';
import { Search, X } from 'lucide-react';
import {
  auditsService,
  AuditType,
  CreateAuditPayload,
} from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { controlsService } from '@/services/api/controls';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface ControlRecord {
  id: string;
  isoReference: string;
  title: string;
}

export function ScheduleAuditModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AuditType>('INTERNAL');
  const [frameworkName, setFw] = useState('ISO 27001:2022');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditorType, setAuditorType] = useState<'internal' | 'external'>(
    'internal',
  );
  const [assignedAuditorId, setAssignedAuditorId] = useState('');
  const [externalAuditorEmail, setExternalEmail] = useState('');
  const [scopeAll, setScopeAll] = useState(true);
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([]);
  const [controlSearch, setControlSearch] = useState('');

  // Fetch users and controls for dropdowns
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
    staleTime: 30_000,
  });
  const { data: controlsData } = useQuery({
    queryKey: ['controls'],
    queryFn: () => controlsService.getControls(),
    staleTime: 30_000,
  });

  const users: UserRecord[] = (usersData ?? []) as UserRecord[];
  const controls: ControlRecord[] = ((controlsData as { data?: ControlRecord[] } | undefined)?.data ?? []) as ControlRecord[];

  const filteredControls = controls.filter(
    (c) =>
      !controlSearch ||
      c.isoReference.toLowerCase().includes(controlSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(controlSearch.toLowerCase()),
  );

  function toggleControl(id: string) {
    setSelectedControlIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!name.trim()) return setError('Audit name is required.');
    if (!startDate) return setError('Start date is required.');
    if (!scopeAll && selectedControlIds.length === 0)
      return setError(
        'Select at least one control, or choose "Entire Framework".',
      );

    setSaving(true);
    setError(null);
    try {
      const payload: CreateAuditPayload = {
        name: name.trim(),
        type,
        frameworkName: frameworkName || undefined,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        startDate,
        endDate: endDate || undefined,
        allControls: scopeAll,
        controlIds: scopeAll ? undefined : selectedControlIds,
        assignedAuditorId:
          auditorType === 'internal' && assignedAuditorId
            ? assignedAuditorId
            : undefined,
        externalAuditorEmail:
          auditorType === 'external' && externalAuditorEmail
            ? externalAuditorEmail
            : undefined,
      };
      await auditsService.create(payload);
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create audit');
    } finally {
      setSaving(false);
    }
  }

  // Field group helper
  const Field = ({
    label,
    children,
    required,
  }: {
    label: string;
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls =
    'w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls = inputCls;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Schedule New Audit
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Step {step} of 2 —{' '}
              {step === 1 ? 'Audit Details' : 'Scope & Auditor'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <Field label="Audit Name" required>
                <input
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ISO 27001 Annual Surveillance Audit"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Audit Type" required>
                  <select
                    className={selectCls}
                    value={type}
                    onChange={(e) => setType(e.target.value as AuditType)}
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External</option>
                    <option value="SURVEILLANCE">Surveillance</option>
                    <option value="RECERTIFICATION">Recertification</option>
                  </select>
                </Field>
                <Field label="Framework">
                  <input
                    className={inputCls}
                    value={frameworkName}
                    onChange={(e) => setFw(e.target.value)}
                    placeholder="ISO 27001:2022"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Audit Period Start">
                  <input
                    type="date"
                    className={inputCls}
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </Field>
                <Field label="Audit Period End">
                  <input
                    type="date"
                    className={inputCls}
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Scheduled Start Date" required>
                  <input
                    type="date"
                    className={inputCls}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field>
                <Field label="Scheduled End Date">
                  <input
                    type="date"
                    className={inputCls}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Scope */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Audit Scope
                </label>
                <div className="flex gap-3 mb-3">
                  <label
                    className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${scopeAll ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <input
                      type="radio"
                      className="accent-blue-600"
                      checked={scopeAll}
                      onChange={() => setScopeAll(true)}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Entire Framework
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      All {controls.length} controls
                    </span>
                  </label>
                  <label
                    className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${!scopeAll ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <input
                      type="radio"
                      className="accent-blue-600"
                      checked={!scopeAll}
                      onChange={() => setScopeAll(false)}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Specific Controls
                    </span>
                    {!scopeAll && selectedControlIds.length > 0 && (
                      <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 ml-auto">
                        {selectedControlIds.length}
                      </span>
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
                        onChange={(e) => setControlSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {filteredControls.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No controls found
                        </p>
                      ) : (
                        filteredControls.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="accent-blue-600"
                              checked={selectedControlIds.includes(c.id)}
                              onChange={() => toggleControl(c.id)}
                            />
                            <span className="text-xs font-mono font-semibold text-blue-700 w-14 flex-shrink-0">
                              {c.isoReference}
                            </span>
                            <span className="text-xs text-gray-700 truncate">
                              {c.title}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Auditor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Assign Auditor
                </label>
                <div className="flex gap-3 mb-3">
                  {(['internal', 'external'] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${auditorType === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <input
                        type="radio"
                        className="accent-blue-600"
                        checked={auditorType === t}
                        onChange={() => setAuditorType(t)}
                      />
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>

                {auditorType === 'internal' ? (
                  <Field label="Select Internal Auditor">
                    <select
                      className={selectCls}
                      value={assignedAuditorId}
                      onChange={(e) => setAssignedAuditorId(e.target.value)}
                    >
                      <option value="">— None assigned —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name ?? u.email} ({u.role})
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="External Auditor Email">
                    <input
                      type="email"
                      className={inputCls}
                      value={externalAuditorEmail}
                      onChange={(e) => setExternalEmail(e.target.value)}
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
              <Button
                onClick={() => {
                  if (!name.trim()) return setError('Audit name is required.');
                  if (!startDate) return setError('Start date is required.');
                  setError(null);
                  setStep(2);
                }}
              >
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
