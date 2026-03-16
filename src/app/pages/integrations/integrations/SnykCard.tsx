import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { snykService, SnykIntegrationRecord } from '@/services/api/snyk';

function SnykConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: SnykIntegrationRecord) => void;
}) {
  const [snykOrgId, setSnykOrgId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await snykService.connect({ snykOrgId: snykOrgId.trim(), apiToken: apiToken.trim(), label: label.trim() || undefined });
      onConnected(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect to Snyk. Check the org ID and API token.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect Snyk</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Snyk Organization ID and API token to enable code vulnerability scanning.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Snyk Organization ID</label>
            <input type="text" value={snykOrgId} onChange={e => setSnykOrgId(e.target.value)} placeholder="e.g. a1b2c3d4-..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="Snyk API token" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Snyk" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#4C1A6E] hover:bg-[#3a1254] text-white">
            {loading ? 'Connecting…' : 'Connect Snyk'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SnykCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: SnykIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: SnykIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await snykService.runScan(id); onToast('success', 'Snyk scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Snyk (${label ?? id})? Automated code security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await snykService.disconnect(id); onAccountRemoved(id); onToast('success', 'Snyk disconnected'); }
    catch { onToast('error', 'Failed to disconnect Snyk'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4C1A6E] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L19 8.5v7l-7 3.87L5 15.5v-7L12 4.18z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Snyk</h3>
              <p className="text-sm text-gray-500">Code Security · Vulnerability scanning</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connect Snyk to scan your codebase for vulnerabilities, open-source dependency risks, and exposed secrets. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.25 No Critical CVEs', 'A.8.31 OSS Dependencies', 'A.8.29 Quality Gate', 'A.8.28 Secrets Review', 'A.8.8 Remediation SLA'].map((l) => (
            <span key={l} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.snykOrgId}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.findingCount} finding{account.findingCount !== 1 ? 's' : ''}
                {account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Scan Now'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label)} disabled={disconnectingId === account.id} className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#4C1A6E] hover:bg-[#3a1254] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect Snyk'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <SnykConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Snyk connected! 5 automated code security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}
