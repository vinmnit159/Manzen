import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { policiesService, PolicyTemplate } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Edit3,
  AlertCircle,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  Upload,
  Download,
  Eye,
  Loader2,
  Plus,
  LayoutTemplate,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface PolicyFilter {
  search: string;
  status: string;
}

type SortKey = 'name' | 'version' | 'status' | 'createdAt';

const POLICY_STATUSES = ['PUBLISHED', 'DRAFT', 'REVIEW', 'ARCHIVED'] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  PUBLISHED: { label: 'Published',  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  icon: CheckCircle2 },
  DRAFT:     { label: 'Draft',      bg: 'bg-gray-50',   text: 'text-gray-600',   dot: 'bg-gray-400',   icon: Edit3 },
  REVIEW:    { label: 'In Review',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500',  icon: Clock },
  ARCHIVED:  { label: 'Archived',   bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400',    icon: AlertCircle },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', icon: FileText };
}

// ── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({
  policy,
  onClose,
  onUploaded,
}: {
  policy: Policy;
  onClose: () => void;
  onUploaded: (updated: Policy) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await policiesService.uploadPolicyDocument(policy.id, file) as any;
      onUploaded(res.data.policy);
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
          <div>
            <h2 className="text-base font-semibold text-gray-900">Upload Policy Document</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{policy.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
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
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
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
              <p className="text-xs text-gray-400">PDF, Word, Excel, images — max 50 MB</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Templates Modal ──────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['ISMS Core', 'Technical', 'People', 'Resilience'] as const;

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'ISMS Core':  { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'Technical':  { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'People':     { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  'Resilience': { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
};

function TemplatesModal({
  onClose,
  onUseTemplate,
}: {
  onClose: () => void;
  onUseTemplate: (t: PolicyTemplate) => void;
}) {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    policiesService.getTemplates().then(res => {
      if (res.success && res.data) setTemplates(res.data);
      else setError('Failed to load templates');
    }).catch(() => setError('Failed to load templates')).finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.isoReferences.some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = CATEGORY_ORDER.reduce<Record<string, PolicyTemplate[]>>((acc, cat) => {
    const items = filtered.filter(t => t.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Policy Templates</h2>
            <p className="text-sm text-gray-500 mt-0.5">27 ISO 27001 templates — click "Use This Template" to pre-fill the form</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category, or ISO reference…"
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading templates…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No templates match your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, items]) => {
                const cfg = CATEGORY_CONFIG[category] ?? { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                        {category}
                      </span>
                      <span className="text-xs text-gray-400">{items.length} template{items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map(template => (
                        <div
                          key={template.name}
                          className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{template.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{template.description}</p>
                            {template.isoReferences.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.isoReferences.map(ref => (
                                  <span key={ref} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onUseTemplate(template)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Use This Template
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create Policy Modal ──────────────────────────────────────────────────────

function CreatePolicyModal({
  onClose,
  onCreated,
  prefill,
}: {
  onClose: () => void;
  onCreated: (p: Policy) => void;
  prefill?: { name?: string; version?: string; status?: string };
}) {
  const [form, setForm] = useState({
    name: prefill?.name ?? '',
    version: prefill?.version ?? '1.0',
    status: prefill?.status ?? 'DRAFT',
    approvedBy: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.version.trim()) {
      setError('Name and version are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await policiesService.createPolicy({
        name: form.name,
        version: form.version,
        status: form.status,
        approvedBy: form.approvedBy || undefined,
      }) as any;
      const created: Policy = res.data;

      // If a file was selected, upload it now
      if (file) {
        try {
          const uploadRes = await policiesService.uploadPolicyDocument(created.id, file) as any;
          onCreated(uploadRes.data.policy);
        } catch {
          // Policy created, file upload failed — still return the policy
          onCreated(created);
        }
      } else {
        onCreated(created);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create policy');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">New Policy</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Policy Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Access Control Policy"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Version *</label>
              <input
                type="text"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder="1.0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {POLICY_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Approved By</label>
            <input
              type="text"
              value={form.approvedBy}
              onChange={e => setForm(f => ({ ...f, approvedBy: e.target.value }))}
              placeholder="e.g. Jane Smith"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Optional document upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Attach Document (optional)</label>
            <div
              onClick={() => inputRef.current?.click()}
              className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors text-sm ${
                file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {file ? (
                <span className="truncate text-blue-700 font-medium">{file.name}</span>
              ) : (
                <span className="text-gray-400">Click to attach a file…</span>
              )}
              {file && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="ml-auto text-gray-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function PoliciesPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PolicyFilter>({ search: '', status: '' });
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadPolicy, setUploadPolicy] = useState<Policy | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templatePrefill, setTemplatePrefill] = useState<{ name?: string; version?: string; status?: string } | undefined>(undefined);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await policiesService.getPolicies({
        search: filter.search || undefined,
        status: filter.status || undefined,
      });
      if (response.success && response.data) {
        let data = [...response.data];
        data.sort((a, b) => {
          const aVal = String(a[sortKey as keyof Policy] ?? '');
          const bVal = String(b[sortKey as keyof Policy] ?? '');
          const cmp = aVal.localeCompare(bVal);
          return sortDir === 'desc' ? -cmp : cmp;
        });
        setPolicies(data);
      } else {
        setError('Failed to load policies from the server.');
      }
    } catch (err: any) {
      if (err?.statusCode === 401) { localStorage.removeItem('isms_token'); navigate('/login'); return; }
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [filter, sortKey, sortDir, navigate]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleFilterChange = (field: keyof PolicyFilter, value: string) =>
    setFilter(prev => ({ ...prev, [field]: value }));

  const clearFilters = () => setFilter({ search: '', status: '' });
  const hasActiveFilters = !!(filter.search || filter.status);

  const published = policies.filter(p => p.status === 'PUBLISHED').length;
  const draft     = policies.filter(p => p.status === 'DRAFT').length;
  const inReview  = policies.filter(p => p.status === 'REVIEW').length;
  const archived  = policies.filter(p => p.status === 'ARCHIVED').length;

  const handleUploadDone = (updated: Policy) => {
    setPolicies(prev => prev.map(p => p.id === updated.id ? updated : p));
    setUploadPolicy(null);
  };

  const handleCreated = (policy: Policy) => {
    setPolicies(prev => [policy, ...prev]);
    setShowCreate(false);
    setTemplatePrefill(undefined);
  };

  const handleUseTemplate = (t: PolicyTemplate) => {
    setShowTemplates(false);
    setTemplatePrefill({ name: t.name, version: t.version, status: t.status });
    setShowCreate(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Modals */}
      {uploadPolicy && (
        <UploadModal
          policy={uploadPolicy}
          onClose={() => setUploadPolicy(null)}
          onUploaded={handleUploadDone}
        />
      )}
      {showTemplates && (
        <TemplatesModal
          onClose={() => setShowTemplates(false)}
          onUseTemplate={handleUseTemplate}
        />
      )}
      {showCreate && (
        <CreatePolicyModal
          onClose={() => { setShowCreate(false); setTemplatePrefill(undefined); }}
          onCreated={handleCreated}
          prefill={templatePrefill}
        />
      )}

      {/* ── Top App Bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Policies</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Security policy management and lifecycle tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Filters active
            </span>
          )}
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">Use Template</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Policy</span>
          </button>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={[
              'lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              hasActiveFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{hasActiveFilters ? ' •' : ''}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {!loading && !error && policies.length > 0 && (
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total Policies"   value={policies.length}   color="text-gray-900"  bg="bg-white"    accent="border-gray-200" />
            <SummaryCard label="Published"         value={published}         color="text-green-700" bg="bg-green-50"  accent="border-green-200" />
            <SummaryCard label="In Review"         value={inReview}          color="text-amber-700" bg="bg-amber-50"  accent="border-amber-200" />
            <SummaryCard label="Draft / Archived"  value={draft + archived}  color="text-gray-600"  bg="bg-gray-50"   accent="border-gray-200" />
          </div>
          {policies.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Publication rate</span>
                <span className="text-sm font-semibold text-blue-700">
                  {Math.round((published / policies.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.round((published / policies.length) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-3 sm:px-6 py-4 flex-1 min-h-0">

        {filterOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setFilterOpen(false)} />
        )}

        <div className={[
          'fixed bottom-0 left-0 right-0 z-30 lg:static lg:z-auto',
          'lg:w-72 lg:flex-shrink-0',
          'transition-transform duration-300 ease-in-out lg:transition-none lg:translate-y-0',
          filterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
        ].join(' ')}>
          <div className="lg:hidden flex items-center justify-between px-5 pt-4 pb-2 bg-white rounded-t-2xl border-t border-x border-gray-200 shadow-lg">
            <span className="text-sm font-semibold text-gray-900">Filters</span>
            <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <FilterPanel filter={filter} onChange={handleFilterChange} onClear={clearFilters} hasActiveFilters={hasActiveFilters} mobileDrawer />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchPolicies} />
          ) : policies.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} onCreate={() => setShowCreate(true)} />
          ) : (
            <>
              <PoliciesTable
                policies={policies}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onUpload={setUploadPolicy}
              />
              <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-800">{policies.length}</span>{' '}
                  polic{policies.length !== 1 ? 'ies' : 'y'}
                  {hasActiveFilters && ' (filtered)'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter Panel ────────────────────────────────────────────────────────────

function FilterPanel({
  filter, onChange, onClear, hasActiveFilters, mobileDrawer,
}: {
  filter: PolicyFilter;
  onChange: (field: keyof PolicyFilter, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  mobileDrawer?: boolean;
}) {
  return (
    <div className={`bg-white border border-gray-200 shadow-sm overflow-hidden ${mobileDrawer ? 'rounded-b-xl lg:rounded-xl' : 'rounded-xl'}`}>
      <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between ${mobileDrawer ? 'hidden lg:flex' : ''}`}>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filters</h2>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-xs font-medium text-blue-600 hover:text-blue-700">Clear all</button>
        )}
      </div>
      <div className="px-5 py-4 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filter.search}
              onChange={e => onChange('search', e.target.value)}
              placeholder="Search by policy name…"
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            {filter.search && (
              <button onClick={() => onChange('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
          <select
            value={filter.status}
            onChange={e => onChange('status', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All statuses</option>
            {POLICY_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
            ))}
          </select>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {filter.search && <FilterChip label={`"${filter.search}"`} onRemove={() => onChange('search', '')} />}
          {filter.status && <FilterChip label={filter.status} onRemove={() => onChange('status', '')} />}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-blue-500 hover:text-blue-700">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Policies Table ──────────────────────────────────────────────────────────

function PoliciesTable({
  policies, sortKey, sortDir, onSort, onUpload,
}: {
  policies: Policy[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  onUpload: (p: Policy) => void;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (policy: Policy) => {
    setDownloading(policy.id);
    try {
      const name = policy.documentUrl
        ? policy.documentUrl.split('/').pop() ?? `${policy.name}.pdf`
        : `${policy.name}.pdf`;
      await policiesService.downloadPolicyDocument(policy.id, name);
    } catch {
      // silently fail — file may not exist yet
    } finally {
      setDownloading(null);
    }
  };

  const columns: { key: SortKey; label: string; sortable?: boolean; minWidth?: number }[] = [
    { key: 'name',      label: 'Policy Name', sortable: true, minWidth: 240 },
    { key: 'version',   label: 'Version',     sortable: true, minWidth: 90  },
    { key: 'status',    label: 'Status',      sortable: true, minWidth: 120 },
    { key: 'createdAt', label: 'Created',     sortable: true, minWidth: 130 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
                    col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : '',
                  ].join(' ')}
                  style={{ minWidth: col.minWidth }}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDir} />}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 120 }}>
                Approved By
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 140 }}>
                Document
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policies.map(policy => {
              const cfg = getStatusCfg(policy.status);
              const StatusIcon = cfg.icon;
              const hasFile = !!policy.documentUrl;
              const isDownloading = downloading === policy.id;

              return (
                <tr key={policy.id} className="hover:bg-blue-50/40 transition-colors group">
                  {/* Name */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 240 }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="font-medium text-gray-900 leading-snug">{policy.name}</p>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 90 }}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      v{policy.version}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 120 }}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-500 whitespace-nowrap" style={{ minWidth: 130 }}>
                    {new Date(policy.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>

                  {/* Approved By */}
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-500" style={{ minWidth: 120 }}>
                    {policy.approvedBy ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        </span>
                        {policy.approvedBy}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Document actions */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 140 }}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Upload / Replace */}
                      <button
                        onClick={() => onUpload(policy)}
                        title={hasFile ? 'Replace document' : 'Upload document'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-gray-600 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {hasFile ? 'Replace' : 'Upload'}
                      </button>

                      {/* Download / View */}
                      {hasFile && (
                        <button
                          onClick={() => handleDownload(policy)}
                          disabled={isDownloading}
                          title="Download document"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-600 transition-colors disabled:opacity-50"
                        >
                          {isDownloading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />}
                          {isDownloading ? '…' : 'Download'}
                        </button>
                      )}

                      {/* View in new tab — for external URLs */}
                      {hasFile && policy.documentUrl && !policy.documentUrl.startsWith('/files/') && (
                        <a
                          href={policy.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View in new tab"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 text-gray-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sort Icon ───────────────────────────────────────────────────────────────

function SortIcon({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />;
}

// ── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, bg, accent = 'border-gray-200' }: {
  label: string; value: number; color: string; bg: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} ${bg} px-4 py-3 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

// ── States ───────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading policies…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">Failed to load policies</p>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ hasFilters, onClear, onCreate }: { hasFilters: boolean; onClear: () => void; onCreate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">No policies found</p>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters ? 'No policies match your current filters.' : 'No policies have been created yet.'}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
          Clear filters
        </button>
      ) : (
        <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
          <Plus className="w-4 h-4" />
          Create your first policy
        </button>
      )}
    </div>
  );
}
