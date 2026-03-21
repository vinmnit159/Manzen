import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { partnerService, CatalogueTool } from '@/services/api/partner';
import { KeyIcon } from './icons';
import { categoryBadge } from './helpers';

/** Issue key dialog */
export function IssueKeyDialog({
  open,
  catalogue,
  onClose,
  onIssued,
}: {
  open: boolean;
  catalogue: CatalogueTool[];
  onClose: () => void;
  onIssued: (rawKey: string, keyName: string, toolName: string) => void;
}) {
  const [form, setForm] = useState({ name: '', toolName: '', toolCategory: '', expiresAt: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill category when tool is selected
  function handleToolChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tool = catalogue.find(c => c.provider === e.target.value);
    setForm(f => ({ ...f, toolName: e.target.value, toolCategory: tool?.category ?? '' }));
  }

  async function submit() {
    if (!form.name.trim() || !form.toolName || !form.toolCategory) {
      setError('Key name and tool are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await partnerService.issueKey({
        name: form.name.trim(),
        toolName: form.toolName,
        toolCategory: form.toolCategory,
        expiresAt: form.expiresAt || undefined,
      });
      onIssued(res.data.rawKey, res.data.name, res.data.toolName);
      setForm({ name: '', toolName: '', toolCategory: '', expiresAt: '' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to issue key.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-slate-600" /> Issue Partner API Key
          </DialogTitle>
          <DialogDescription>
            Generate a key for an external team to push scan results from their tool into ISMS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Key label *</label>
            <Input
              placeholder="e.g. Huntress Team — Production"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">A human-readable name to identify this key later.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tool *</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={form.toolName}
              onChange={handleToolChange}
            >
              <option value="">Select a tool…</option>
              {Object.entries(
                catalogue.reduce<Record<string, CatalogueTool[]>>((acc, t) => {
                  (acc[t.category] ??= []).push(t);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, tools]) => (
                  <optgroup key={cat} label={cat}>
                    {tools.map(t => (
                      <option key={t.provider} value={t.provider}>{t.provider}</option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </div>

          {form.toolCategory && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Category:</span>
              <Badge variant="outline" className={`text-xs ${categoryBadge(form.toolCategory)}`}>
                {form.toolCategory}
              </Badge>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Expiry <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">Leave blank for no expiry.</p>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Generating…' : 'Generate key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
