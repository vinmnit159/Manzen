import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { integrationsService, Integration } from '@/services/api/integrations';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
      <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0c-1.55 0-3.1.4-4.5 1.2L7.2 25h36.45z" fill="#00AC47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.1l5.85 11.95 7.6 11.85z" fill="#EA4335"/>
      <path d="M43.65 25L57.4 1.2C56 .4 54.45 0 52.9 0H34.4c-1.55 0-3.1.4-4.5 1.2L43.65 25z" fill="#00832D"/>
      <path d="M60.1 53H27.5L13.75 76.8c1.4.8 2.95 1.2 4.5 1.2h50.8c1.55 0 3.1-.4 4.5-1.2L60.1 53z" fill="#2684FC"/>
      <path d="M73.4 26.5l-6.65-11.5c-.8-1.35-1.9-2.5-3.3-3.3L43.65 25l16.45 28H87.3c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" fill="#FFBA00"/>
    </svg>
  );
}

export function GoogleDriveCard({
  driveIntegration,
  loading,
  onToast,
  onDisconnect,
}: {
  driveIntegration: Integration | null;
  loading: boolean;
  onToast: (type: 'success' | 'error', msg: string) => void;
  onDisconnect: () => void;
}) {
  const confirm = useConfirmDialog();
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = !!driveIntegration;

  const handleConnect = () => {
    window.location.href = integrationsService.getDriveConnectUrl();
  };

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: 'Disconnect Google Drive',
      description: 'Disconnect Google Drive? Future uploads will revert to local storage.',
      confirmLabel: 'Disconnect',
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnecting(true);
    try {
      await integrationsService.disconnectDrive();
      onDisconnect();
      onToast('success', 'Google Drive disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Google Drive');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
            <GoogleDriveIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Drive</h3>
            <p className="text-sm text-gray-500">Document Storage · Evidence &amp; Policy files</p>
          </div>
        </div>
        <Badge variant={isConnected ? 'default' : 'outline'}>
          {loading ? 'Checking...' : isConnected ? 'Connected' : 'Available'}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Store evidence and policy documents in your organisation's Google Drive. Files are organised
        into <code className="bg-gray-100 px-1 rounded text-xs">ISMS-{'{OrgName}'}/Evidence/</code> and{' '}
        <code className="bg-gray-100 px-1 rounded text-xs">ISMS-{'{OrgName}'}/Policies/</code> folders
        automatically. Uploads fall back to local storage when Drive is not connected.
      </p>

      {/* ISO control tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['A.5.33 Protection of Records', 'A.5.34 Privacy & PII', 'A.7.10 Storage Media'].map((l) => (
          <span key={l} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-100 font-medium">{l}</span>
        ))}
      </div>

      {isConnected && driveIntegration && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          Drive connected since {new Date(driveIntegration.createdAt).toLocaleDateString()}.
          New evidence and policy uploads will be stored in your Drive.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!loading && !isConnected && (
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <GoogleDriveIcon className="w-4 h-4" />
            Connect Google Drive
          </button>
        )}
        {isConnected && (
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
  );
}
