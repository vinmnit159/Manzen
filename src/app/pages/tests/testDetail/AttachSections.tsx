import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { controlsService } from '@/services/api/controls';
import { evidenceService } from '@/services/api/evidence';
import { auditsService } from '@/services/api/audits';
import type { Control } from '@/services/api/types';
import type { AuditRecord } from '@/services/api/audits';
import { fmtDate } from './utils';

// ─── Attach Evidence ──────────────────────────────────────────────────────────

export function AttachEvidenceSection({ testId, existingIds }: { testId: string; existingIds: Set<string> }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allEvidence, isLoading } = useQuery({
    queryKey: ['evidence', 'all'],
    queryFn: async () => {
      const res = await evidenceService.getEvidence();
      return res.data ?? [];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allEvidence) return [];
    return allEvidence.filter(
      (e) => !existingIds.has(e.id) && (e.fileName ?? e.type ?? '').toLowerCase().includes(search.toLowerCase()),
    );
  }, [allEvidence, existingIds, search]);

  const attachMutation = useMutation({
    mutationFn: (evidenceId: string) => testsService.attachEvidence(testId, evidenceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Attach evidence
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search available evidence..."
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus
        />
        <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading evidence...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No available evidence to attach.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.slice(0, 20).map((e) => (
            <li key={e.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm">
              <div className="min-w-0">
                <p className="text-gray-800 truncate">{e.fileName ?? e.type}</p>
                <p className="text-xs text-gray-400">{fmtDate(e.createdAt)}</p>
              </div>
              <button
                onClick={() => attachMutation.mutate(e.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Attach
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Attach Control ───────────────────────────────────────────────────────────

export function AttachControlSection({ testId, existingIds }: { testId: string; existingIds: Set<string> }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allControls, isLoading } = useQuery({
    queryKey: ['controls', 'all-for-picker'],
    queryFn: async () => {
      const res = await controlsService.getControls({ limit: 500 });
      return (res.data ?? []) as Control[];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allControls) return [];
    const q = search.toLowerCase();
    return allControls.filter(
      (c) => !existingIds.has(c.id) && (`${c.isoReference} ${c.title}`.toLowerCase().includes(q)),
    );
  }, [allControls, existingIds, search]);

  const attachMutation = useMutation({
    mutationFn: (controlId: string) => testsService.attachControl(testId, controlId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Link control
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search controls by reference or title..."
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus
        />
        <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading controls...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No available controls to link.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.slice(0, 20).map((c) => (
            <li key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm">
              <div className="min-w-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                  {c.isoReference}
                </span>
                <span className="text-gray-700 truncate">{c.title}</span>
              </div>
              <button
                onClick={() => attachMutation.mutate(c.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                Link
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Attach Audit ─────────────────────────────────────────────────────────────

export function AttachAuditSection({ testId, existingIds }: { testId: string; existingIds: Set<string> }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: allAudits, isLoading } = useQuery({
    queryKey: ['audits', 'all-for-picker'],
    queryFn: async () => {
      const res = await auditsService.list();
      return (res.data ?? []) as AuditRecord[];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allAudits) return [];
    return allAudits.filter((a) => !existingIds.has(a.id));
  }, [allAudits, existingIds]);

  const attachMutation = useMutation({
    mutationFn: (auditId: string) => testsService.attachAudit(testId, auditId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Link audit
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Select an audit to link</span>
        <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading audits...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No available audits to link.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm">
              <div className="min-w-0">
                <p className="text-gray-800 font-medium truncate">{a.name}</p>
                <p className="text-xs text-gray-400">{a.type} &middot; {a.status}</p>
              </div>
              <button
                onClick={() => attachMutation.mutate(a.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                Link
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Add Framework ────────────────────────────────────────────────────────────

export function AddFrameworkSection({ testId }: { testId: string }) {
  const qc = useQueryClient();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');

  const attachMutation = useMutation({
    mutationFn: (frameworkName: string) => testsService.attachFramework(testId, frameworkName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      setName('');
      setShowInput(false);
    },
  });

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Add framework
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Framework name (e.g. SOC 2, ISO 27001)"
        className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) attachMutation.mutate(name.trim()); }}
      />
      <button
        onClick={() => name.trim() && attachMutation.mutate(name.trim())}
        disabled={!name.trim() || attachMutation.isPending}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Add
      </button>
      <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
