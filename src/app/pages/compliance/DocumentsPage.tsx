import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  FileText, Loader2, ShieldCheck, Cpu, Upload, Download,
  X, Plus, AlertCircle, Hash, Calendar, User, Link2,
  FlaskConical, CheckCircle2, Clock, Shield,
} from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { evidenceService } from '@/services/api/evidence';
import { controlsService } from '@/services/api/controls';
import { testsService, type TestRecord } from '@/services/api/tests';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';

/**
 * Maps an ISO control reference prefix to a canonical framework slug.
 * ISO 27001 controls start with "A.", SOC 2 with "CC", NIST with category codes,
 * HIPAA with "164.". Evidence items inherit their framework from their linked control.
 */
function isoReferenceToFrameworkSlug(isoRef: string | undefined | null): string | null {
  if (!isoRef) return null;
  const ref = isoRef.trim().toUpperCase();
  if (ref.startsWith('A.') || ref.startsWith('ISO')) return 'iso-27001';
  if (ref.startsWith('CC') || ref.startsWith('A1') || ref.startsWith('C1') || ref.startsWith('P') || ref.startsWith('PI')) return 'soc-2';
  if (ref.startsWith('164.')) return 'hipaa';
  if (ref.startsWith('GV.') || ref.startsWith('ID.') || ref.startsWith('PR.') || ref.startsWith('DE.') || ref.startsWith('RS.') || ref.startsWith('RC.')) return 'nist-csf';
  return null;
}

interface EvidenceItem {
  id: string;
  type: string;
  fileName: string | null;
  fileUrl: string | null;
  hash: string;
  automated: boolean;
  collectedBy: string | null;
  createdAt: string;
  control: {
    id: string;
    isoReference: string;
    title: string;
    status: string;
  } | null;
}

interface ControlOption {
  id: string;
  isoReference: string;
  title: string;
}

function typeVariant(type: string): 'default' | 'secondary' | 'outline' {
  if (type === 'AUTOMATED') return 'default';
  if (type === 'FILE') return 'secondary';
  return 'outline';
}

function controlStatusColor(status: string) {
  if (status === 'IMPLEMENTED') return 'text-green-600 bg-green-50 border-green-200';
  if (status === 'PARTIALLY_IMPLEMENTED') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Evidence Detail Panel ─────────────────────────────────────────────────────

function EvidenceDetailPanel({
  evidence,
  onClose,
}: {
  evidence: EvidenceItem;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  // Related tests — those linked to the same control
  const { data: allTests = [] } = useQuery({
    queryKey: ['tests', 'list', {}],
    queryFn: async () => {
      const r = await testsService.listTests({ limit: 999 });
      return r.data ?? [];
    },
    staleTime: 30_000,
  });

  const relatedTests = evidence.control
    ? (allTests as TestRecord[]).filter((t) =>
        t.controls?.some((c) => c.id === evidence.control!.id)
      ).slice(0, 8)
    : [];

  const handleDownload = async () => {
    if (!evidence.fileUrl) return;
    setDownloading(true);
    try {
      await evidenceService.downloadEvidence(
        evidence.id,
        evidence.fileName ?? `evidence-${evidence.id.slice(0, 8)}`
      );
    } catch (err) {
      console.error('Failed to download evidence', err);
    } finally {
      setDownloading(false);
    }
  };

  const isFile = !!evidence.fileUrl;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant={typeVariant(evidence.type)}>{evidence.type}</Badge>
              {evidence.automated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Cpu className="w-3 h-3" /> Automated
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 leading-snug truncate">
              {evidence.fileName ?? `evidence-${evidence.id.slice(0, 8)}`}
            </h2>
            {evidence.control && (
              <p className="text-xs text-gray-500 mt-1">
                Linked to control{' '}
                <span className="font-mono font-semibold text-blue-700">{evidence.control.isoReference}</span>
                {' '}— {evidence.control.title}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className={`text-2xl font-bold ${isFile ? 'text-green-600' : 'text-gray-400'}`}>
                {isFile ? '✓' : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">File attached</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{relatedTests.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Related tests</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${evidence.control ? 'text-blue-600' : 'text-gray-400'}`}>
                {evidence.control ? '✓' : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Control linked</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="rounded-xl bg-slate-100 p-1 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="control">Control</TabsTrigger>
              <TabsTrigger value="tests">Tests ({relatedTests.length})</TabsTrigger>
              {isFile && <TabsTrigger value="file">File</TabsTrigger>}
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">Evidence Metadata</span>
                </div>
                <div className="p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Type</dt>
                      <dd className="mt-1"><Badge variant={typeVariant(evidence.type)}>{evidence.type}</Badge></dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Collection</dt>
                      <dd className="mt-1 text-gray-700">{evidence.automated ? 'Automated' : 'Manual'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Collected
                      </dt>
                      <dd className="mt-1 text-gray-700">{fmtDate(evidence.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <User className="w-3 h-3" /> Collected By
                      </dt>
                      <dd className="mt-1 text-gray-700">{evidence.collectedBy ?? 'system'}</dd>
                    </div>
                    {evidence.hash && (
                      <div className="col-span-2">
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Integrity Hash
                        </dt>
                        <dd className="mt-1 font-mono text-xs text-gray-600 break-all bg-gray-50 rounded px-2 py-1 border border-gray-100">
                          {evidence.hash}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {evidence.control && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">Linked Control</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex-shrink-0">
                          {evidence.control.isoReference}
                        </span>
                        <p className="text-sm font-medium text-gray-800">{evidence.control.title}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ml-2 ${controlStatusColor(evidence.control.status)}`}>
                        {evidence.control.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Control tab */}
            <TabsContent value="control" className="space-y-3 mt-0">
              {!evidence.control ? (
                <div className="text-center py-12 text-gray-400">
                  <Link2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No control linked to this evidence.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
                        {evidence.control.isoReference}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 mt-1">{evidence.control.title}</h3>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${controlStatusColor(evidence.control.status)}`}>
                      {evidence.control.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    This evidence supports control compliance for{' '}
                    <span className="font-semibold text-gray-600">{evidence.control.isoReference}</span>.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tests tab */}
            <TabsContent value="tests" className="space-y-3 mt-0">
              {relatedTests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No tests linked via this control.</p>
                </div>
              ) : (relatedTests as any[]).map((t: any) => {
                const badgeCls: Record<string, string> = {
                  OK: 'bg-green-100 text-green-700 border-green-200',
                  Overdue: 'bg-red-100 text-red-700 border-red-200',
                  Due_soon: 'bg-amber-100 text-amber-700 border-amber-200',
                  Needs_remediation: 'bg-orange-100 text-orange-700 border-orange-200',
                };
                return (
                  <div key={t.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.type} · {t.category}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${badgeCls[t.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </TabsContent>

            {/* File tab */}
            {isFile && (
              <TabsContent value="file" className="space-y-4 mt-0">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                        {evidence.fileName ?? `evidence-${evidence.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Attached evidence file</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloading ? 'Downloading…' : 'Download File'}
                  </button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ── Upload Evidence Modal ────────────────────────────────────────────────────

function UploadEvidenceModal({
  controls,
  onClose,
  onUploaded,
}: {
  controls: ControlOption[];
  onClose: () => void;
  onUploaded: (ev: EvidenceItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [controlId, setControlId] = useState(controls[0]?.id ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    if (!controlId) { setError('Please select a control'); return; }
    setUploading(true);
    setError(null);
    try {
      const res = await evidenceService.uploadEvidenceFile(file, controlId) as any;
      onUploaded(res.data);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Upload Evidence File</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Control picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
            Link to ISO Control *
          </label>
          {controls.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No controls found — create a control first.</p>
          ) : (
            <select
              value={controlId}
              onChange={e => setControlId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {controls.map(c => (
                <option key={c.id} value={c.id}>{c.isoReference} — {c.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.log,.json,.zip"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-blue-500" />
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:text-red-700 mt-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Drag & drop or click to select</p>
              <p className="text-xs text-gray-400">PDF, Word, images, logs, ZIP — max 50 MB</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !controlId || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [stats, setStats] = useState<{ total: number; automated: number; manual: number } | null>(null);
  const [controls, setControls] = useState<ControlOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, update, reset } = useUrlFilterState({
    defaults: { type: 'ALL', search: '', frameworks: [] as string[] },
    arrayKeys: ['frameworks'],
  });
  const filter = filters.type as 'ALL' | 'AUTOMATED' | 'FILE';
  const search = filters.search;
  const frameworkFilter = filters.frameworks;
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get<{ data?: EvidenceItem[] }>('/api/evidence'),
      apiClient.get<{ data?: { total: number; automated: number; manual: number } }>('/api/evidence/stats'),
      controlsService.getControls({ limit: 200 }),
    ])
      .then(([evidRes, statsRes, ctrlRes]) => {
        setEvidence(evidRes?.data ?? []);
        setStats(statsRes?.data ?? null);
        const ctrlData = (ctrlRes as { data?: ControlOption[] })?.data ?? [];
        setControls(ctrlData.map((c) => ({ id: c.id, isoReference: c.isoReference, title: c.title })));
      })
      .catch((err: unknown) => { console.error('Failed to load evidence data', err); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []); // loadData is stable — no deps that change after mount

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      const matchesType = filter === 'ALL' || e.type === filter;
      const haystack = `${e.fileName ?? ''} ${e.control?.isoReference ?? ''} ${e.control?.title ?? ''} ${e.collectedBy ?? ''}`.toLowerCase();
      const matchesSearch = search.trim() === '' || haystack.includes(search.trim().toLowerCase());
      const matchesFramework =
        frameworkFilter.length === 0 ||
        (() => {
          const slug = isoReferenceToFrameworkSlug(e.control?.isoReference ?? null);
          return slug !== null && frameworkFilter.includes(slug);
        })();
      return matchesType && matchesFramework && matchesSearch;
    });
  }, [evidence, filter, frameworkFilter, search]);

  const activeFilters = [
    ...(search.trim() ? [{ key: 'search', label: `Search: ${search.trim()}`, onRemove: () => update({ search: '' }) }] : []),
    ...(filter !== 'ALL' ? [{ key: 'type', label: `Type: ${filter}`, onRemove: () => update({ type: 'ALL' }) }] : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `Framework: ${slug.replace(/-/g, ' ')}`,
      onRemove: () => update({ frameworks: frameworkFilter.filter((item) => item !== slug) }),
    })),
  ];

  const handleDownload = async (ev: EvidenceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ev.fileUrl) return;
    setDownloading(ev.id);
    try {
      await evidenceService.downloadEvidence(ev.id, ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`);
    } catch (err) {
      console.error('Failed to download evidence', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleUploaded = (newEv: EvidenceItem) => {
    setEvidence(prev => [newEv, ...prev]);
    setStats(prev => prev ? { ...prev, total: prev.total + 1, manual: prev.manual + 1 } : prev);
    setShowUpload(false);
  };

  return (
    <PageTemplate
      title="Evidence & Documents"
      description="Compliance evidence collected automatically from GitHub and uploaded manually."
    >
      {/* Upload Modal */}
      {showUpload && (
        <UploadEvidenceModal
          controls={controls}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}

      {/* Evidence detail slide-over */}
      {selectedEvidence && (
        <EvidenceDetailPanel
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats + Upload button row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {stats && (
              <div className="grid grid-cols-3 gap-4 flex-1">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <Cpu className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Automated</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{stats.automated}</div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">Manual</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{stats.manual}</div>
                </Card>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors flex-shrink-0 self-start"
            >
              <Plus className="w-4 h-4" />
              Upload Evidence
            </button>
          </div>

          <PageFilterBar
            searchValue={search}
            onSearchChange={(value) => update({ search: value })}
            searchPlaceholder="Search files, controls, or collected by"
            selects={[
              {
                key: 'type',
                value: filter,
                placeholder: 'Type',
                onChange: (value) => update({ type: value as 'ALL' | 'AUTOMATED' | 'FILE' }),
                options: [
                  { value: 'ALL', label: `All (${evidence.length})` },
                  { value: 'AUTOMATED', label: `Automated (${evidence.filter((item) => item.type === 'AUTOMATED').length})` },
                  { value: 'FILE', label: `File (${evidence.filter((item) => item.type === 'FILE').length})` },
                ],
              },
            ]}
            auxiliary={<FrameworkFilter selected={frameworkFilter} onChange={(value) => update({ frameworks: value })} />}
            resultCount={filtered.length}
            resultLabel="evidence items"
            activeFilters={activeFilters}
            onClearAll={reset}
          />

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Evidence / File', 'Type', 'ISO Control', 'Control Status', 'Collected By', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                        No evidence records found.{' '}
                        {filter === 'ALL'
                          ? 'Connect GitHub and run a scan, or upload a file manually.'
                          : 'Try switching to "All".'}
                      </td>
                    </tr>
                  ) : filtered.map(ev => {
                    const isFile = !!ev.fileUrl;
                    const isDownloading = downloading === ev.id;

                    return (
                      <tr
                        key={ev.id}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedEvidence(ev)}
                      >
                        {/* Evidence / File */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {ev.automated
                              ? <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            <span className="truncate max-w-[200px]">
                              {ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 transition-opacity flex-shrink-0">
                              View →
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={typeVariant(ev.type)}>{ev.type}</Badge>
                        </td>

                        {/* ISO Control */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {ev.control ? (
                            <div>
                              <span className="font-mono text-blue-600 font-medium">{ev.control.isoReference}</span>
                              <p className="text-xs text-gray-400 truncate max-w-[150px]">{ev.control.title}</p>
                            </div>
                          ) : '—'}
                        </td>

                        {/* Control Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ev.control ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${controlStatusColor(ev.control.status)}`}>
                              {ev.control.status.replace(/_/g, ' ')}
                            </span>
                          ) : '—'}
                        </td>

                        {/* Collected By */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ev.collectedBy ?? 'system'}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {isFile ? (
                            <button
                              onClick={(e) => handleDownload(ev, e)}
                              disabled={isDownloading}
                              title="Download file"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-600 transition-colors disabled:opacity-50"
                            >
                              {isDownloading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Download className="w-3.5 h-3.5" />}
                              {isDownloading ? '…' : 'Download'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
