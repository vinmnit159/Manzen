import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { trustCenterService, TrustAnnouncementType, CreateAnnouncementPayload } from '@/services/api/trustCenter';

// ── Add Announcement Modal ────────────────────────────────────────────────────

export function AddAnnouncementModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create announcement');
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
