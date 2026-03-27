import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { newRelicService, NewRelicStatus } from '@/services/api/newrelic';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function NewRelicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0L2 9v18l16 9 16-9V9L18 0z" fill="#00AC69"/>
      <path d="M18 4.3L5.5 11.5v14.9L18 31.7l12.5-5.3V11.5L18 4.3z" fill="#1CE783"/>
      <path d="M18 9l-8 4.5v9L18 27l8-4.5v-9L18 9z" fill="#00AC69"/>
    </svg>
  );
}

function NewRelicConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (status: NewRelicStatus) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !accountId.trim()) {
      setError('API Key and Account ID are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await newRelicService.connect({ apiKey, accountId });
      const status = await newRelicService.getStatus();
      if (!status.connected || !status.data) {
        throw new Error('Connected to New Relic, but failed to load status');
      }
      onConnected(status.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect to New Relic');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect New Relic</h2>
        <p className="text-sm text-gray-500 mb-4">Provide a User API Key and your Account ID.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
            <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="e.g. 1234567" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AC69]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="NRAK-..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00AC69]" required autoComplete="off" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#00AC69] hover:bg-[#009159] text-white">
            {loading ? 'Connecting…' : 'Connect New Relic'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function NewRelicCard({
  nrStatus,
  connected,
  loadingStatus,
  onConnected,
  onDisconnected,
  onToast,
}: {
  nrStatus: NewRelicStatus | null;
  connected: boolean;
  loadingStatus: boolean;
  onConnected: (status: NewRelicStatus) => void;
  onDisconnected: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const confirm = useConfirmDialog();
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: 'Disconnect New Relic',
      description: 'Disconnect New Relic?',
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnecting(true);
    try {
      await newRelicService.disconnect();
      onDisconnected();
      onToast('success', 'New Relic disconnected');
    } catch {
      onToast('error', 'Failed to disconnect New Relic');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <NewRelicIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">New Relic</h3>
              <p className="text-sm text-gray-500">APM & Infrastructure · Logging & monitoring</p>
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : connected ? 'Connected' : 'Available'}
          </Badge>
        </div>

        {connected && nrStatus && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            Connected to account <strong>{nrStatus.accountId}</strong> in <strong>{nrStatus.region}</strong>.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!loadingStatus && !connected && (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800"
            >
              <NewRelicIcon className="w-4 h-4" />
              Connect New Relic
            </button>
          )}
          {connected && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center px-4 py-2 rounded-md border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <NewRelicConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(status) => { onConnected(status); setShowConnectModal(false); onToast('success', 'New Relic connected!'); }}
        />
      )}
    </>
  );
}
