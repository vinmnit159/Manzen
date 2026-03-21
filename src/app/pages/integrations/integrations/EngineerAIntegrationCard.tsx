import { useEffect, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { testsService, type WorkflowIntegrationProvider } from '@/services/api/tests';
import { EngineerAIntegrationRecord } from '@/services/api/engineer-a-factory';

export type WorkflowConfigResult = {
  provider: WorkflowIntegrationProvider;
  values: Record<string, string | undefined>;
};

type EngineerAService = {
  getAccounts: () => Promise<{ success: boolean; data: EngineerAIntegrationRecord[] }>;
  connect: (payload: {
    apiKey: string;
    accountId?: string;
    tenant?: string;
    baseUrl?: string;
    region?: string;
    label?: string;
  }) => Promise<{ success: boolean; data: EngineerAIntegrationRecord }>;
  disconnect: (integrationId: string) => Promise<{ success: boolean }>;
  runScan: (integrationId: string) => Promise<{ success: boolean; jobId: string; status: string }>;
};

export type EngineerACardConfig = {
  key: string;
  name: string;
  subtitle: string;
  category: string;
  description: string;
  brandColor: string;
  isoTags: string[];
  iconBg: string;
  iconText?: string;
  iconSvg?: React.ReactNode;
  service: EngineerAService;
};

export function EngineerAIntegrationCard({
  config,
  loading,
  onToast,
  activeTab,
  onConnectionCountChange,
  onWorkflowConfigUpdated,
  getWorkflowConfig,
}: {
  config: EngineerACardConfig;
  loading: boolean;
  onToast: (type: 'success' | 'error', msg: string) => void;
  activeTab: 'connected' | 'available';
  onConnectionCountChange: (count: number) => void;
  onWorkflowConfigUpdated?: () => Promise<void>;
  getWorkflowConfig: (input: {
    key: string;
    apiKey: string;
    accountId: string;
    tenant: string;
    baseUrl: string;
  }) => WorkflowConfigResult | null;
}) {
  const [accounts, setAccounts] = useState<EngineerAIntegrationRecord[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [tenant, setTenant] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const connected = accounts.length > 0;

  const load = async () => {
    try {
      const res = await config.service.getAccounts();
      const list = res.data ?? [];
      setAccounts(list);
      onConnectionCountChange(list.length);
    } catch {
      setAccounts([]);
      onConnectionCountChange(0);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      onToast('error', 'API key is required');
      return;
    }

    setSubmitting(true);
    try {
      await config.service.connect({
        apiKey: apiKey.trim(),
        accountId: accountId.trim() || undefined,
        tenant: tenant.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        label: label.trim() || undefined,
      });

      const workflowConfig = getWorkflowConfig({
        key: config.key,
        apiKey,
        accountId,
        tenant,
        baseUrl,
      });
      if (workflowConfig) {
        try {
          await testsService.upsertWorkflowIntegrationConfig(workflowConfig.provider, workflowConfig.values);
          await onWorkflowConfigUpdated?.();
        } catch {
          onToast('error', `${config.name} connected, but workflow endpoint config sync failed`);
        }
      }

      setShowConnect(false);
      setApiKey('');
      setAccountId('');
      setTenant('');
      setBaseUrl('');
      setLabel('');
      await load();
      onToast('success', `${config.name} connected`);
    } catch (error: unknown) {
      onToast('error', (error as { message?: string }).message ?? `Failed to connect ${config.name}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect(integrationId: string) {
    if (!window.confirm(`Disconnect ${config.name}? Automated tests will stop running.`)) return;
    setDisconnectingId(integrationId);
    try {
      await config.service.disconnect(integrationId);
      await load();
      onToast('success', `${config.name} disconnected`);
    } catch {
      onToast('error', `Failed to disconnect ${config.name}`);
    } finally {
      setDisconnectingId(null);
    }
  }

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await config.service.runScan(integrationId);
      onToast('success', `${config.name} scan queued - results will appear in tests shortly`);
    } catch {
      onToast('error', `Failed to queue ${config.name} scan`);
    } finally {
      setScanningId(null);
    }
  }

  const visible = activeTab === 'connected' ? connected : !connected;
  if (!visible) return null;

  return (
    <Card className="p-6 md:col-span-2">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full p-1 ${config.iconBg}`}>
            {config.iconSvg ?? (
              <span className="text-sm font-bold text-white">
                {config.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
            <p className="text-sm text-gray-500">{config.subtitle}</p>
          </div>
        </div>
        <Badge variant={connected ? 'default' : 'outline'}>
          {loading ? 'Checking...' : connected ? `${accounts.length} connected` : 'Available'}
        </Badge>
      </div>

      <p className="mb-4 text-sm text-gray-600">{config.description}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {config.isoTags.map((label) => (
          <span key={label} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
            {label}
          </span>
        ))}
      </div>

      {connected && accounts.map((account) => (
        <div key={account.id} className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{(account.metadata?.['label'] as string | undefined) || config.name}</p>
            <p className="text-xs text-gray-400">{(account.metadata?.['accountId'] as string | undefined) || (account.metadata?.['tenant'] as string | undefined) || 'Active account'}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
              {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleDisconnect(account.id)}
              disabled={disconnectingId === account.id}
            >
              {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {!loading && (
          <button
            onClick={() => setShowConnect((value) => !value)}
            style={{ backgroundColor: config.brandColor }}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {connected ? `+ Add ${config.name} Account` : `Connect ${config.name}`}
          </button>
        )}
      </div>

      {showConnect && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Connect {config.name}</h4>
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">API Key <span className="text-red-500">*</span></label>
              <input
                type="password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Account ID <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tenant / Subdomain <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Tenant or subdomain"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Base URL <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="https://..."
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Label <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. Production"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? 'Connecting...' : `Connect ${config.name}`}
              </button>
              <button
                type="button"
                onClick={() => setShowConnect(false)}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
