import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { sonarqubeService, SonarQubeIntegrationRecord } from '@/services/api/sonarqube';

function SonarQubeConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: SonarQubeIntegrationRecord) => void;
}) {
  const [instanceUrl, setInstanceUrl] = useState('');
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await sonarqubeService.connect({ instanceUrl: instanceUrl.trim(), token: token.trim(), label: label.trim() || undefined });
      onConnected(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect to SonarQube. Check the instance URL and token.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect SonarQube</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your SonarQube instance URL and user token to enable static analysis.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance URL</label>
            <input type="url" value={instanceUrl} onChange={e => setInstanceUrl(e.target.value)} placeholder="https://sonarqube.example.com" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Token</label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="SonarQube user token" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production SonarQube" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#CB1C2E] hover:bg-[#a81626] text-white">
            {loading ? 'Connecting…' : 'Connect SonarQube'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SonarQubeCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: SonarQubeIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: SonarQubeIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await sonarqubeService.runScan(id); onToast('success', 'SonarQube scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect SonarQube (${label ?? id})? Automated code security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await sonarqubeService.disconnect(id); onAccountRemoved(id); onToast('success', 'SonarQube disconnected'); }
    catch { onToast('error', 'Failed to disconnect SonarQube'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#CB1C2E] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-1-11h2v6h-2zm0 8h2v2h-2z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">SonarQube</h3>
              <p className="text-sm text-gray-500">Code Security · Static analysis</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connect SonarQube to evaluate code quality gates, security hotspots, and static analysis results across your projects. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.25 No Critical CVEs', 'A.8.31 OSS Dependencies', 'A.8.29 Quality Gate', 'A.8.28 Secrets Review', 'A.8.8 Remediation SLA'].map((l) => (
            <span key={l} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.instanceUrl}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#CB1C2E] hover:bg-[#a81626] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect SonarQube'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <SonarQubeConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'SonarQube connected! 5 automated code security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}
