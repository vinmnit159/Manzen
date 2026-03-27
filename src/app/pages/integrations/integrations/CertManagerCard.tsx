import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { certManagerService, CertManagerIntegrationRecord } from '@/services/api/certmanager';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function CertManagerConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: CertManagerIntegrationRecord) => void;
}) {
  const [providerType, setProviderType] = useState('AWS_ACM');
  const [instanceUrl, setInstanceUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const AWS_REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1',
    'ca-central-1', 'sa-east-1',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload: Parameters<typeof certManagerService.connect>[0] = {
        instanceUrl: providerType === 'AWS_ACM' ? `https://acm.${region}.amazonaws.com` : instanceUrl.trim(),
        providerType,
        label: label.trim() || undefined,
      };
      if (providerType === 'AWS_ACM') {
        payload.accessKeyId = accessKeyId.trim();
        payload.secretAccessKey = secretAccessKey.trim();
        payload.region = region;
      } else {
        payload.apiKey = apiKey.trim();
      }
      const res = await certManagerService.connect(payload);
      onConnected(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect Certificate Manager. Check the credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-1">Connect Certificate Manager</h2>
        <p className="text-sm text-gray-500 mb-4">Monitor TLS/SSL certificate expiry and compliance.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select value={providerType} onChange={e => setProviderType(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]">
              <option value="AWS_ACM">AWS Certificate Manager (ACM)</option>
              <option value="GENERIC">Generic / REST API</option>
            </select>
          </div>
          {providerType === 'AWS_ACM' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]">
                  {AWS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Key ID</label>
                <input type="text" value={accessKeyId} onChange={e => setAccessKeyId(e.target.value)} placeholder="AKIAIOSFODNN7EXAMPLE" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] font-mono" required autoComplete="off" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Access Key</label>
                <input type="password" value={secretAccessKey} onChange={e => setSecretAccessKey(e.target.value)} placeholder="Secret access key" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] font-mono" required autoComplete="off" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instance URL</label>
                <input type="url" value={instanceUrl} onChange={e => setInstanceUrl(e.target.value)} placeholder="https://certmanager.example.com" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API key or Bearer token" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] font-mono" required autoComplete="off" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production ACM" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#0052CC] hover:bg-[#0041a8] text-white">
            {loading ? 'Connecting…' : 'Connect Cert Manager'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CertManagerCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: CertManagerIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: CertManagerIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const confirm = useConfirmDialog();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await certManagerService.runScan(id); onToast('success', 'Certificate Manager scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: 'Disconnect Certificate Manager',
      description: `Disconnect Certificate Manager (${label ?? id})? Automated certificate tests will stop running.`,
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try { await certManagerService.disconnect(id); onAccountRemoved(id); onToast('success', 'Certificate Manager disconnected'); }
    catch { onToast('error', 'Failed to disconnect Certificate Manager'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0052CC] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-4-4 1.41-1.41L11 12.17l6.59-6.59L19 7l-8 8z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Certificate Manager</h3>
              <p className="text-sm text-gray-500">Secrets &amp; Certs · TLS/SSL certificate lifecycle</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.instanceUrl}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.providerType}
                {` · ${account.findingCount} finding${account.findingCount !== 1 ? 's' : ''}`}
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0052CC] hover:bg-[#0041a8] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Instance' : 'Connect Cert Manager'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <CertManagerConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Certificate Manager connected! 5 automated certificate tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}
