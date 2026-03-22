import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { bamboohrService, HRIntegrationRecord } from '@/services/api/bamboohr';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function BambooHRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="18" fill="#73AC27"/>
      <path d="M28 75V25h10c0 0 0 12 12 12s12-12 12-12h10v50h-10V50c0 0-2 10-12 10S38 50 38 50v25H28z" fill="white"/>
    </svg>
  );
}

function BambooHRConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: HRIntegrationRecord) => void;
}) {
  const [subdomain, setSubdomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subdomain.trim() || !apiKey.trim()) { setError('Subdomain and API Key are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await bamboohrService.connect({ subdomain: subdomain.trim(), apiKey: apiKey.trim(), label: label.trim() || undefined });
      if (res.success) {
        const accountsRes = await bamboohrService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(a => a.subdomain === subdomain.trim());
        if (newAccount) onConnected(newAccount);
        else onConnected({ id: res.data.id, subdomain: res.data.subdomain, label: res.data.label, status: res.data.status, lastSyncAt: null, createdAt: res.data.createdAt, personnel: [] });
        onClose();
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect — check your subdomain and API key');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect BambooHR</h2>
        <p className="text-sm text-gray-500 mb-3">
          Generate a read-only API key in <strong>BambooHR → Account → API Keys</strong>.
          Use your company subdomain (e.g. <code className="bg-gray-100 px-1 rounded text-xs">mycompany</code> from{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">mycompany.bamboohr.com</code>).
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Subdomain <span className="text-gray-400 font-normal">(e.g. mycompany)</span>
            </label>
            <input
              type="text"
              value={subdomain}
              onChange={e => setSubdomain(e.target.value)}
              placeholder="mycompany"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73AC27]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key <span className="text-gray-400 font-normal">(read-only)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="BambooHR API Key"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73AC27] font-mono"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Production HR"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73AC27]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#73AC27] hover:bg-[#5e8e1f] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Connect BambooHR'}
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

export function BambooHRCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: HRIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: HRIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleSync(integrationId: string) {
    setSyncingId(integrationId);
    try {
      await bamboohrService.syncEmployees(integrationId);
      onToast('success', 'Employee sync started — roster will update shortly');
    } catch {
      onToast('error', 'Failed to start sync');
    } finally { setSyncingId(null); }
  }

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await bamboohrService.runScan(integrationId);
      onToast('success', 'BambooHR compliance scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(integrationId: string, label: string | null) {
    const confirmed = await confirm({
      title: 'Disconnect BambooHR',
      description: `Disconnect BambooHR${label ? ` (${label})` : ''}? Automated HR tests will stop running.`,
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await bamboohrService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', 'BambooHR disconnected');
    } catch {
      onToast('error', 'Failed to disconnect BambooHR');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <BambooHRIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">BambooHR</h3>
              <p className="text-sm text-gray-500">HR · Employee lifecycle & personnel compliance</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Sync your employee roster from BambooHR to automate HR compliance checks — detect new hires
          needing onboarding, terminated employees with outstanding access, missing managers, incomplete
          policy acceptance, and MDM enrollment gaps. All results appear in the Tests page.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.6.1 HR Policies', 'A.6.3 Security Awareness', 'A.6.5 Termination', 'A.8.1 Asset Responsibility'].map((l) => (
            <span key={l} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected accounts */}
        {isConnected && accounts.map(account => {
          const active = account.personnel.filter(p => p.status === 'ACTIVE').length;
          const total = account.personnel.length;
          return (
            <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{account.label ?? account.subdomain}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.subdomain}.bamboohr.com
                  {total > 0 && ` · ${active} active / ${total} total employees`}
                  {account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleSync(account.id)} disabled={syncingId === account.id}>
                  {syncingId === account.id ? 'Syncing…' : 'Sync'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                  {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label)} disabled={disconnectingId === account.id}
                  className="text-red-600 border-red-200 hover:bg-red-50">
                  {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            </div>
          );
        })}

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#73AC27] hover:bg-[#5e8e1f] text-white text-sm font-medium"
            >
              <BambooHRIcon className="w-4 h-4" />
              {isConnected ? '+ Add BambooHR Account' : 'Connect BambooHR'}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <BambooHRConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', 'BambooHR connected! Employee sync started and 6 automated tests are being seeded.');
          }}
        />
      )}
    </>
  );
}
