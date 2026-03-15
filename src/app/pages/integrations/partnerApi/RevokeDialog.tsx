import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { partnerService, PartnerApiKey } from '@/services/api/partner';

/** Revoke confirmation dialog */
export function RevokeDialog({
  keyRecord,
  onConfirm,
  onClose,
}: {
  keyRecord: PartnerApiKey;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await partnerService.revokeKey(keyRecord.id);
      onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700">Revoke API Key</DialogTitle>
          <DialogDescription>
            This will immediately invalidate <strong>"{keyRecord.name}"</strong>. Any external system using this key will stop being able to push scan results.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? 'Revoking…' : 'Yes, revoke key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
