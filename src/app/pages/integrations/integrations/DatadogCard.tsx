import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { datadogIncidentsService, DatadogIntegrationRecord } from '@/services/api/datadog-incidents';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function DatadogConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: DatadogIntegrationRecord) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [appKey, setAppKey] = useState('');
  const [datadogSite, setDatadogSite] = useState('datadoghq.com');
  const [label, setLabel] = useState('');
  const [slaHours, setSlaHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !appKey.trim()) { setError('API key and App key are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await datadogIncidentsService.connect({ apiKey: apiKey.trim(), appKey: appKey.trim(), datadogSite, label: label.trim() || undefined, slaHours: Number(slaHours) || 4 });
      onConnected(res.data);
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect to Datadog. Check credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Datadog Incidents</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Datadog API key and Application key to begin incident compliance scanning.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Datadog API key" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Key</label>
            <input type="password" value={appKey} onChange={e => setAppKey(e.target.value)} placeholder="Datadog Application key" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datadog Site</label>
            <select value={datadogSite} onChange={e => setDatadogSite(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="datadoghq.com">US1 (datadoghq.com)</option>
              <option value="us3.datadoghq.com">US3 (us3.datadoghq.com)</option>
              <option value="us5.datadoghq.com">US5 (us5.datadoghq.com)</option>
              <option value="datadoghq.eu">EU (datadoghq.eu)</option>
              <option value="ap1.datadoghq.com">AP1 (ap1.datadoghq.com)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SLA Hours <span className="text-gray-400 font-normal">(acknowledgement target)</span></label>
            <input type="number" min="1" max="72" value={slaHours} onChange={e => setSlaHours(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Datadog" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Datadog'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DatadogIncidentsCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: DatadogIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: DatadogIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const openConfirm = useConfirmDialog();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await datadogIncidentsService.runScan(id); onToast('success', 'Datadog scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    const confirmed = await openConfirm({
      title: 'Disconnect Datadog',
      description: `Disconnect Datadog (${label ?? id})? Automated incident tests will stop running.`,
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(id);
    try { await datadogIncidentsService.disconnect(id); onAccountRemoved(id); onToast('success', 'Datadog disconnected'); }
    catch { onToast('error', 'Failed to disconnect Datadog'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#632CA6] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M26.3 19.4l-2.8-1.9V6.8L16 3 8.5 6.8v10.7L5.7 19.4l1.6 7.3L16 29l8.7-2.3 1.6-7.3z" fill="white" opacity="0.9"/>
                <path d="M16 7l-5.5 3.2v6.4l5.5 3.2 5.5-3.2v-6.4L16 7z" fill="#632CA6"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Datadog Incidents</h3>
              <p className="text-sm text-gray-500">Observability · Incident tracking &amp; postmortems</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.datadogSite}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.incidentCount} incident{account.incidentCount !== 1 ? 's' : ''}
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#632CA6] hover:bg-[#4f2285] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect Datadog'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <DatadogConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Datadog connected! 5 automated incident tests are being seeded.'); }}
        />
      )}
    </>
  );
}
