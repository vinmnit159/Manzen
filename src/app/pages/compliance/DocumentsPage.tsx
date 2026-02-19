import { useEffect, useState, useRef } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  FileText, Loader2, ShieldCheck, Cpu, Upload, Download,
  X, Plus, AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { evidenceService } from '@/services/api/evidence';
import { controlsService } from '@/services/api/controls';

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
  if (status === 'IMPLEMENTED') return 'text-green-600 bg-green-50';
  if (status === 'PARTIALLY_IMPLEMENTED') return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
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
  const [filter, setFilter] = useState<'ALL' | 'AUTOMATED' | 'FILE'>('ALL');
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get<any>('/api/evidence'),
      apiClient.get<any>('/api/evidence/stats'),
      controlsService.getControls({ limit: 200 } as any),
    ])
      .then(([evidRes, statsRes, ctrlRes]: any[]) => {
        setEvidence(evidRes?.data ?? []);
        setStats(statsRes?.data ?? null);
        const ctrlData: any[] = ctrlRes?.data ?? [];
        setControls(ctrlData.map((c: any) => ({ id: c.id, isoReference: c.isoReference, title: c.title })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = filter === 'ALL' ? evidence : evidence.filter(e => e.type === filter);

  const handleDownload = async (ev: EvidenceItem) => {
    if (!ev.fileUrl) return;
    setDownloading(ev.id);
    try {
      await evidenceService.downloadEvidence(ev.id, ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`);
    } catch {
      // silently fail
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

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['ALL', 'AUTOMATED', 'FILE'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filter === f
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f === 'ALL'
                  ? `All (${evidence.length})`
                  : `${f} (${evidence.filter(e => e.type === f).length})`}
              </button>
            ))}
          </div>

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
                      <tr key={ev.id} className="hover:bg-gray-50">
                        {/* Evidence / File */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {ev.automated
                              ? <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            <span className="truncate max-w-[200px]">
                              {ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`}
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
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${controlStatusColor(ev.control.status)}`}>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isFile ? (
                            <button
                              onClick={() => handleDownload(ev)}
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
