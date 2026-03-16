import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { cloudflareService, CloudflareAccountRecord } from '@/services/api/cloudflare';

function CloudflareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 109 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M82.3 19.6c-.4-2.9-2-5.5-4.4-7.2-2.4-1.7-5.4-2.4-8.3-1.9-1.9-3.6-5.3-6.2-9.3-7.1-4-.9-8.2.1-11.4 2.6-1.7-1.1-3.7-1.7-5.8-1.7-5.9 0-10.7 4.8-10.7 10.7v.3c-3.9 1.1-6.6 4.7-6.6 8.7 0 5 4.1 9.1 9.1 9.1H79c4.5 0 8.1-3.6 8.1-8.1 0-3.9-2.8-7.3-4.8-5.4z" fill="#F6821F"/>
      <path d="M79 31.1H35.9c-.5 0-.9-.4-.9-.9s.4-.9.9-.9H79c3.4 0 6.2-2.8 6.2-6.2 0-3-2.1-5.6-5.1-6.1l-1.4-.2-.2-1.4c-.3-2.4-1.7-4.6-3.7-6-2.1-1.4-4.6-1.9-7.1-1.5l-1.5.3-.7-1.4c-1.7-3.3-4.9-5.5-8.6-6.1-3.6-.5-7.3.6-9.9 3.1l-1 .9-1.1-.7c-1.5-.9-3.2-1.4-4.9-1.4-5.2 0-9.4 4.2-9.4 9.4v1.4l-1.4.4C27.5 15.8 25 19 25 22.7c0 4.6 3.8 8.4 8.4 8.4" fill="#FBAD41"/>
    </svg>
  );
}

function CloudflareConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: CloudflareAccountRecord) => void;
}) {
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiToken.trim()) { setError('API Token is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await cloudflareService.connect({ apiToken: apiToken.trim(), label: label.trim() || undefined });
      if (res.success) {
        // Reload accounts to get the full record with zones
        const accountsRes = await cloudflareService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(a => a.cfAccountId === res.data.cfAccountId);
        if (newAccount) onConnected(newAccount);
        else onConnected({ id: res.data.id, cfAccountId: res.data.cfAccountId, label: res.data.label, status: res.data.status, lastScanAt: null, createdAt: res.data.createdAt, zones: [] });
        onClose();
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to connect — check your API token and try again');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Cloudflare</h2>
        <p className="text-sm text-gray-500 mb-3">
          Create a scoped API token in{' '}
          <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Cloudflare Dashboard → My Profile → API Tokens
          </a>.
          Use "Create Custom Token" and grant: <strong>Zone:Read</strong>, <strong>Zone Settings:Read</strong>,{' '}
          <strong>WAF:Read</strong>, <strong>Firewall Services:Read</strong>, <strong>DNS:Read</strong>, <strong>SSL/TLS:Read</strong>.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scoped API Token <span className="text-gray-400 font-normal">(read-only)</span>
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder="Cloudflare scoped API token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6821F] font-mono"
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
              placeholder="e.g. Production, My Org"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6821F]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#F6821F] hover:bg-[#e07318] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Connect Cloudflare'}
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

export function CloudflareCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: CloudflareAccountRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: CloudflareAccountRecord) => void;
  onAccountRemoved: (accountId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(accountId: string) {
    setScanningId(accountId);
    try {
      await cloudflareService.runScan(accountId);
      onToast('success', 'Cloudflare scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(accountId: string, label: string | null) {
    if (!window.confirm(`Disconnect Cloudflare account ${label ?? accountId}? Automated tests will stop running.`)) return;
    setDisconnectingId(accountId);
    try {
      await cloudflareService.disconnect(accountId);
      onAccountRemoved(accountId);
      onToast('success', 'Cloudflare account disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Cloudflare account');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <CloudflareIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cloudflare</h3>
              <p className="text-sm text-gray-500">Network Security · WAF, DNS, TLS &amp; Bot Protection</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length > 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically collect ISO 27001 evidence from Cloudflare via a scoped read-only API token — no
          global keys stored. Runs 10 automated compliance checks across WAF, TLS, DNSSEC, rate limiting,
          bot protection, HTTPS enforcement, HSTS, audit logging, and email spoofing protection.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.20 WAF & Network', 'A.8.24 TLS & HTTPS', 'A.8.9 DNSSEC', 'A.8.15 Audit Logging'].map((l) => (
            <span key={l} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected accounts */}
        {isConnected && accounts.length > 0 && (
          <div className="mb-4 space-y-2">
            {accounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.label ?? account.cfAccountId}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {account.cfAccountId}
                    {account.zones.length > 0 && ` · ${account.zones.length} zone${account.zones.length > 1 ? 's' : ''}`}
                    {account.lastScanAt && ` · Last scan: ${new Date(account.lastScanAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScan(account.id)}
                    disabled={scanningId === account.id}
                  >
                    {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id, account.label)}
                    disabled={disconnectingId === account.id}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F6821F] hover:bg-[#e07318] text-white text-sm font-medium"
            >
              <CloudflareIcon className="w-4 h-4" />
              {isConnected ? '+ Add Cloudflare Account' : 'Connect Cloudflare'}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <CloudflareConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', `Cloudflare account connected! 10 automated tests are being seeded.`);
          }}
        />
      )}
    </>
  );
}
