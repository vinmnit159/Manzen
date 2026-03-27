import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { secretsManagerService, SecretsManagerIntegrationRecord } from '@/services/api/secretsmanager';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function SecretsManagerConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: SecretsManagerIntegrationRecord) => void;
}) {
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
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
      const res = await secretsManagerService.connect({ awsRegion, accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim(), label: label.trim() || undefined });
      onConnected(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect to AWS Secrets Manager. Check your region and credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect AWS Secrets Manager</h2>
        <p className="text-sm text-gray-500 mb-4">Provide IAM credentials with <code className="bg-gray-100 px-1 rounded text-xs">secretsmanager:ListSecrets</code> and <code className="bg-gray-100 px-1 rounded text-xs">secretsmanager:DescribeSecret</code> permissions.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
            <select value={awsRegion} onChange={e => setAwsRegion(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]">
              {AWS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Key ID</label>
            <input type="text" value={accessKeyId} onChange={e => setAccessKeyId(e.target.value)} placeholder="AKIAIOSFODNN7EXAMPLE" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] font-mono" required autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Access Key</label>
            <input type="password" value={secretAccessKey} onChange={e => setSecretAccessKey(e.target.value)} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] font-mono" required autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#FF9900] hover:bg-[#e68a00] text-white">
            {loading ? 'Connecting…' : 'Connect Secrets Manager'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SecretsManagerCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: SecretsManagerIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: SecretsManagerIntegrationRecord) => void;
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
    try { await secretsManagerService.runScan(id); onToast('success', 'AWS Secrets Manager scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await confirm({
      title: 'Disconnect AWS Secrets Manager',
      description: `Disconnect AWS Secrets Manager (${label ?? id})? Automated secrets tests will stop running.`,
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try { await secretsManagerService.disconnect(id); onAccountRemoved(id); onToast('success', 'AWS Secrets Manager disconnected'); }
    catch { onToast('error', 'Failed to disconnect AWS Secrets Manager'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF9900] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AWS Secrets Manager</h3>
              <p className="text-sm text-gray-500">Secrets Management · AWS secret lifecycle</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} region${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.awsRegion}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.awsRegion}
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Region' : 'Connect Secrets Manager'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <SecretsManagerConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'AWS Secrets Manager connected! 5 automated secrets tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}
