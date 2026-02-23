import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  FileText, Plus, X, Trash2, CheckCircle2, XCircle, Clock,
  ExternalLink, Megaphone, Mail, FileQuestion, ChevronDown, Eye, EyeOff,
  Lock, Globe, AlertTriangle, Award, Info,
} from 'lucide-react';
import {
  trustCenterService,
  TrustDocument, TrustAnnouncement, TrustAccessRequest, TrustQuestionnaireRequest,
  TrustDocumentCategory, TrustAnnouncementType,
  CreateDocumentPayload, CreateAnnouncementPayload,
} from '@/services/api/trustCenter';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://isms.bitcoingames1346.com';

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const DOC_CATEGORY_LABELS: Record<TrustDocumentCategory, string> = {
  POLICY:      'Policy',
  REPORT:      'Report',
  CERTIFICATE: 'Certificate',
  WHITEPAPER:  'Whitepaper',
  OTHER:       'Other',
};

const ANNOUNCEMENT_TYPE_META: Record<TrustAnnouncementType, { label: string; color: string; icon: React.ReactNode }> = {
  SECURITY_UPDATE: { label: 'Security Update', color: 'bg-blue-50 text-blue-700',   icon: <AlertTriangle className="w-3 h-3" /> },
  INCIDENT:        { label: 'Incident',         color: 'bg-red-50 text-red-700',     icon: <AlertTriangle className="w-3 h-3" /> },
  CERTIFICATION:   { label: 'Certification',    color: 'bg-green-50 text-green-700', icon: <Award className="w-3 h-3" /> },
  GENERAL:         { label: 'General',           color: 'bg-gray-100 text-gray-600',  icon: <Info className="w-3 h-3" /> },
};

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'documents',       label: 'Documents',          icon: <FileText className="w-4 h-4" /> },
  { key: 'announcements',   label: 'Announcements',      icon: <Megaphone className="w-4 h-4" /> },
  { key: 'access-requests', label: 'Access Requests',    icon: <Mail className="w-4 h-4" /> },
  { key: 'questionnaires',  label: 'Questionnaires',     icon: <FileQuestion className="w-4 h-4" /> },
] as const;
type TabKey = (typeof TABS)[number]['key'];

// ── Add Document Modal ────────────────────────────────────────────────────────

function AddDocumentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name,          setName]          = useState('');
  const [category,      setCategory]      = useState<TrustDocumentCategory>('POLICY');
  const [fileUrl,       setFileUrl]       = useState('');
  const [requiresNda,   setRequiresNda]   = useState(false);
  const [publicVisible, setPublicVisible] = useState(true);
  const [version,       setVersion]       = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');

  const inputCls = 'w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  async function handleSubmit() {
    if (!name.trim()) return setError('Document name is required');
    if (!fileUrl.trim()) return setError('File URL is required');
    setError('');
    setSaving(true);
    try {
      const payload: CreateDocumentPayload = { name: name.trim(), category, fileUrl: fileUrl.trim(), requiresNda, publicVisible, version: version || null };
      await trustCenterService.createDocument(payload);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create document');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Document</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ISO 27001 Certificate" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select className={inputCls} value={category} onChange={e => setCategory(e.target.value as TrustDocumentCategory)}>
                {(Object.keys(DOC_CATEGORY_LABELS) as TrustDocumentCategory[]).map(k => (
                  <option key={k} value={k}>{DOC_CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Version</label>
              <input className={inputCls} value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. 2024-v1" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File URL <span className="text-red-500">*</span></label>
            <input className={inputCls} value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={publicVisible} onChange={e => setPublicVisible(e.target.checked)} />
              <span className="text-sm text-gray-700">Public visible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={requiresNda} onChange={e => setRequiresNda(e.target.checked)} />
              <span className="text-sm text-gray-700">Requires NDA</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Add Document'}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Add Announcement Modal ────────────────────────────────────────────────────

function AddAnnouncementModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [type,      setType]      = useState<TrustAnnouncementType>('GENERAL');
  const [published, setPublished] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const inputCls = 'w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  async function handleSubmit() {
    if (!title.trim()) return setError('Title is required');
    if (!content.trim()) return setError('Content is required');
    setError('');
    setSaving(true);
    try {
      const payload: CreateAnnouncementPayload = { title: title.trim(), content: content.trim(), type, published };
      await trustCenterService.createAnnouncement(payload);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Announcement</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. ISO 27001 Certification Achieved" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select className={inputCls} value={type} onChange={e => setType(e.target.value as TrustAnnouncementType)}>
              <option value="GENERAL">General</option>
              <option value="SECURITY_UPDATE">Security Update</option>
              <option value="INCIDENT">Incident</option>
              <option value="CERTIFICATION">Certification</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
            <textarea className={`${inputCls} resize-none`} rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Announcement body…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={published} onChange={e => setPublished(e.target.checked)} />
            <span className="text-sm text-gray-700">Publish immediately</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Post Announcement'}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-documents'],
    queryFn:  () => trustCenterService.listDocuments(),
  });
  const docs = data?.data ?? [];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleToggleVisibility(doc: TrustDocument) {
    try {
      await trustCenterService.updateDocument(doc.id, { publicVisible: !doc.publicVisible });
      qc.invalidateQueries({ queryKey: ['trust-documents'] });
    } catch { showToast('error', 'Failed to update'); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this document?')) return;
    try {
      await trustCenterService.deleteDocument(id);
      qc.invalidateQueries({ queryKey: ['trust-documents'] });
      showToast('success', 'Document deleted');
    } catch { showToast('error', 'Failed to delete'); }
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Manage documents shared on your public trust portal</p>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1" />Add Document</Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No documents yet</p>
            <p className="text-xs text-gray-400 mt-1">Add policies, certificates and reports to share with customers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Category', 'Version', 'Visibility', 'NDA', 'Added', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center gap-1">
                        {doc.name}<ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{DOC_CATEGORY_LABELS[doc.category]}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{doc.version ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleVisibility(doc)} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${doc.publicVisible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {doc.publicVisible ? <><Eye className="w-3 h-3" />Public</> : <><EyeOff className="w-3 h-3" />Hidden</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {doc.requiresNda
                        ? <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" />NDA</span>
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(doc.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(doc.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && <AddDocumentModal onClose={() => setShowModal(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['trust-documents'] })} />}
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────────────────────

function AnnouncementsTab() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-announcements'],
    queryFn:  () => trustCenterService.listAnnouncements(),
  });
  const items = data?.data ?? [];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleTogglePublish(item: TrustAnnouncement) {
    try {
      await trustCenterService.updateAnnouncement(item.id, { published: !item.published });
      qc.invalidateQueries({ queryKey: ['trust-announcements'] });
    } catch { showToast('error', 'Failed to update'); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await trustCenterService.deleteAnnouncement(id);
      qc.invalidateQueries({ queryKey: ['trust-announcements'] });
      showToast('success', 'Deleted');
    } catch { showToast('error', 'Failed to delete'); }
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Publish security updates, incidents, and certifications to customers</p>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1" />New Announcement</Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No announcements yet</p>
            <p className="text-xs text-gray-400 mt-1">Post security updates and certifications for customers.</p>
          </Card>
        ) : items.map(item => {
          const meta = ANNOUNCEMENT_TYPE_META[item.type];
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.icon}{meta.label}
                    </span>
                    {item.published
                      ? <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"><Globe className="w-3 h-3" />Published</span>
                      : <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />Draft</span>
                    }
                    <span className="text-xs text-gray-400 ml-auto">{fmt(item.createdAt)}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.content}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(item)}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 font-medium text-gray-600"
                  >
                    {item.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {showModal && <AddAnnouncementModal onClose={() => setShowModal(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['trust-announcements'] })} />}
    </div>
  );
}

// ── Access Requests Tab ───────────────────────────────────────────────────────

function AccessRequestsTab() {
  const qc = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-access-requests'],
    queryFn:  () => trustCenterService.listAccessRequests(),
  });
  const requests = data?.data ?? [];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDecision(id: string, status: 'APPROVED' | 'REJECTED') {
    setActing(id);
    try {
      await trustCenterService.decideAccessRequest(id, status);
      qc.invalidateQueries({ queryKey: ['trust-access-requests'] });
      showToast('success', status === 'APPROVED' ? 'Access approved' : 'Request rejected');
    } catch (e: any) {
      showToast('error', e?.message ?? 'Failed');
    } finally {
      setActing(null);
    }
  }

  const statusMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING:  { label: 'Pending',  color: 'bg-amber-50 text-amber-700',  icon: <Clock className="w-3 h-3" /> },
    APPROVED: { label: 'Approved', color: 'bg-green-50 text-green-700',  icon: <CheckCircle2 className="w-3 h-3" /> },
    REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-700',      icon: <XCircle className="w-3 h-3" /> },
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
      )}
      <p className="text-sm text-gray-500 mb-4">Review and approve customer requests for restricted documents</p>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No access requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Requester', 'Company', 'Document', 'NDA', 'Status', 'Requested', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map(req => {
                  const sm = statusMeta[req.status] ?? statusMeta.PENDING;
                  return (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{req.requesterName}</div>
                        <div className="text-xs text-gray-500">{req.requesterEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{req.company ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[120px] truncate">{req.document?.name ?? 'General'}</td>
                      <td className="px-4 py-3">
                        {req.ndaSigned
                          ? <span className="text-xs text-green-600 font-medium">Signed</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sm.color}`}>
                          {sm.icon}{sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(req.createdAt)}</td>
                      <td className="px-4 py-3">
                        {req.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDecision(req.id, 'APPROVED')}
                              disabled={acting === req.id}
                              className="px-2.5 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(req.id, 'REJECTED')}
                              disabled={acting === req.id}
                              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status === 'APPROVED' && req.approvalToken && (
                          <span className="text-xs text-gray-400">Expires {fmt(req.expiresAt)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Questionnaires Tab ────────────────────────────────────────────────────────

function QuestionnairesTab() {
  const qc = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trust-questionnaires'],
    queryFn:  () => trustCenterService.listQuestionnaireRequests(),
  });
  const items = data?.data ?? [];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleComplete(id: string) {
    if (!editUrl.trim()) return showToast('error', 'Response file URL is required');
    setActing(id);
    try {
      await trustCenterService.updateQuestionnaireRequest(id, { status: 'COMPLETED', responseFileUrl: editUrl.trim() });
      qc.invalidateQueries({ queryKey: ['trust-questionnaires'] });
      setEditId(null);
      setEditUrl('');
      showToast('success', 'Questionnaire marked complete');
    } catch (e: any) {
      showToast('error', e?.message ?? 'Failed');
    } finally {
      setActing(null);
    }
  }

  const statusColor: Record<string, string> = {
    PENDING:     'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    COMPLETED:   'bg-green-50 text-green-700',
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
      )}
      <p className="text-sm text-gray-500 mb-4">Manage inbound security questionnaire requests from customers</p>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileQuestion className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No questionnaire requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Requester', 'Type', 'Status', 'Requested', 'Response', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{item.requesterEmail}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">{item.questionnaireType}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(item.createdAt)}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.responseFileUrl
                        ? <a href={item.responseFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />View</a>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {item.status !== 'COMPLETED' && (
                        editId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Response URL…"
                              value={editUrl}
                              onChange={e => setEditUrl(e.target.value)}
                            />
                            <button onClick={() => handleComplete(item.id)} disabled={acting === item.id} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                              {acting === item.id ? '…' : 'Save'}
                            </button>
                            <button onClick={() => { setEditId(null); setEditUrl(''); }} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditId(item.id); setEditUrl(''); }} className="text-xs text-blue-600 hover:underline">
                            Attach Response
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TrustCenterPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('documents');

  // Get settings to show portal link
  const { data: settingsData } = useQuery({
    queryKey: ['trust-settings'],
    queryFn:  () => trustCenterService.getSettings(),
  });
  const settings = settingsData?.data?.settings;
  const portalUrl = settings?.orgSlug ? `${BASE_URL}/trust/${settings.orgSlug}` : null;

  return (
    <PageTemplate
      title="Trust Center"
      description="Manage documents, announcements, and customer access for your trust portal."
      actions={
        portalUrl && settings?.enabled ? (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1.5" /> View Live Portal
            </Button>
          </a>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'documents'       && <DocumentsTab />}
      {activeTab === 'announcements'   && <AnnouncementsTab />}
      {activeTab === 'access-requests' && <AccessRequestsTab />}
      {activeTab === 'questionnaires'  && <QuestionnairesTab />}
    </PageTemplate>
  );
}
