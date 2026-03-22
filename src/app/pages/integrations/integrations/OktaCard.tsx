import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { oktaService, OktaIntegrationRecord } from '@/services/api/okta';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function OktaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 0C14.37 0 0 14.267 0 32s14.268 32 32 32 32-14.268 32-32S49.63 0 32 0zm0 48c-8.866 0-16-7.134-16-16s7.134-16 16-16 16 7.134 16 16-7.134 16-16 16z" fill="#007DC1"/>
    </svg>
  );
}

function OktaConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: OktaIntegrationRecord) => void;
}) {
  const [domain, setDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || !apiToken.trim()) { setError('Domain and API Token are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await oktaService.connect({ domain: domain.trim(), apiToken: apiToken.trim(), label: label.trim() || undefined });
      if (res.success) { onConnected(res.data); onClose(); }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect — check your domain and API token');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Okta</h2>
        <p className="text-sm text-gray-500 mb-4">
          Generate a read-only API token in <strong>Okta Admin → Security → API → Tokens</strong>.
          Use your Okta domain (e.g. <code className="bg-gray-100 px-1 rounded text-xs">mycompany.okta.com</code>).
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Okta Domain <span className="text-gray-400 font-normal">(e.g. mycompany.okta.com)</span>
            </label>
            <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="mycompany.okta.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token (SSWS)</label>
            <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="SSWS token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1] font-mono" autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1]" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#007DC1] hover:bg-[#006aa8] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Okta'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OktaCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: OktaIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: OktaIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await oktaService.runScan(id); onToast('success', 'Okta scan started — results will appear in tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: 'Disconnect Okta',
      description: `Disconnect Okta${label ? ` (${label})` : ''}? Automated tests will stop running.`,
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try { await oktaService.disconnect(id); onAccountRemoved(id); onToast('success', 'Okta disconnected'); }
    catch { onToast('error', 'Failed to disconnect Okta'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
              <OktaIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Okta</h3>
              <p className="text-sm text-gray-500">Identity & SSO · MFA, stale accounts, access reviews</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Automatically verify MFA enforcement, detect stale/inactive accounts, check least-privilege for
          privileged users, confirm SSO coverage, and track user access review schedules via the Okta API.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.5 MFA', 'A.5.16 Stale Accounts', 'A.5.15 Least Privilege', 'A.8.2 SSO Coverage', 'A.5.18 Access Reviews'].map(l => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.domain}</p>
              <p className="text-xs text-gray-400">{account.domain}{account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label)} disabled={disconnectingId === account.id}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#007DC1] hover:bg-[#006aa8] text-white text-sm font-medium">
              {isConnected ? '+ Add Okta Account' : 'Connect Okta'}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <OktaConnectModal onClose={() => setShowModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Okta connected! 5 automated identity tests are being seeded.'); }} />
      )}
    </>
  );
}
