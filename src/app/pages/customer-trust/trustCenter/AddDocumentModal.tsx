import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { trustCenterService, TrustDocumentCategory, CreateDocumentPayload } from '@/services/api/trustCenter';
import { DOC_CATEGORY_LABELS } from './helpers';

// ── Add Document Modal ────────────────────────────────────────────────────────

export function AddDocumentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create document');
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
