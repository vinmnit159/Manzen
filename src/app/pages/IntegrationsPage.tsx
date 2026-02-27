import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { integrationsService, Integration, GitHubRepo } from '@/services/api/integrations';
import { mdmService, EnrollmentToken, CreatedToken, MdmOverview } from '@/services/api/mdm';
import { slackService, SlackIntegration, SlackChannel, SLACK_EVENT_TYPES } from '@/services/api/slack';
import { newRelicService, NewRelicStatus, NewRelicSyncLog } from '@/services/api/newrelic';
import { notionService, NotionStatus, NotionSyncLog, NotionAvailableDatabase } from '@/services/api/notion';
import { awsService, AwsAccountRecord } from '@/services/api/aws';
import { cloudflareService, CloudflareAccountRecord } from '@/services/api/cloudflare';
import { bamboohrService, HRIntegrationRecord } from '@/services/api/bamboohr';
import { redashService, RedashIntegrationRecord } from '@/services/api/redash';

// ─── Icons ────────────────────────────────────────────────────────────────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Compliance badge ─────────────────────────────────────────────────────────

function CompliancePill({ compliant }: { compliant: boolean | null }) {
  if (compliant === null || compliant === undefined)
    return <span className="text-xs text-gray-400">—</span>;
  return compliant ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckIcon /> Pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <XIcon /> Fail
    </span>
  );
}

// ─── Repo row ─────────────────────────────────────────────────────────────────

function RepoScanRow({ repo }: { repo: GitHubRepo }) {
  const scan = repo.rawData;
  const checks = scan
    ? [
        { label: 'Branch Protection (A.8.32)', compliant: scan.branchProtection?.result?.compliant ?? null },
        { label: 'Commit Signing (A.8.24)', compliant: scan.commitSigning?.result?.compliant ?? null },
        { label: 'CI/CD (A.8.25)', compliant: scan.cicd?.result?.compliant ?? null },
        { label: 'Access Control (A.5.15)', compliant: scan.accessControl?.result?.compliant ?? null },
        { label: 'Visibility (A.5.15)', compliant: scan.repoMeta?.result?.compliant ?? null },
      ]
    : [];

  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{repo.fullName}</p>
          <p className="text-xs text-gray-500">
            Branch: <span className="font-mono">{repo.defaultBranch}</span> · {repo.visibility}
          </p>
        </div>
        {repo.lastScannedAt && (
          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
            {new Date(repo.lastScannedAt).toLocaleString()}
          </span>
        )}
      </div>
      {checks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {checks.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between bg-white rounded px-2 py-1.5 border border-gray-100 gap-2"
            >
              <span className="text-xs text-gray-600 truncate">{c.label}</span>
              <CompliancePill compliant={c.compliant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Google Drive icon ────────────────────────────────────────────────────────

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

// ─── Google Drive card ────────────────────────────────────────────────────────

function GoogleDriveCard({
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
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = !!driveIntegration;

  const handleConnect = () => {
    window.location.href = integrationsService.getDriveConnectUrl();
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google Drive? Future uploads will revert to local storage.')) return;
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

// ─── Brand icons for static / coming-soon cards ───────────────────────────────

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
      <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
    </svg>
  );
}

function AwsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 304 182" xmlns="http://www.w3.org/2000/svg">
      <path d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6 6.1-5.2 14.2-7.8 24.5-7.8 3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-.5.2-1.8.7-3.9 1.6-.6.2-1.1.4-1.4.4-1.3 0-1.9-.9-1.9-2.8v-4.4c0-1.5.2-2.6.7-3.3s1.4-1.4 2.8-2.1c3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.5 0-2.5-.2-3.2-.7-.7-.4-1.3-1.4-1.8-2.8L96.7 10.2c-.5-1.5-.7-2.5-.7-3 0-1.2.6-1.9 1.8-1.9h7.4c1.6 0 2.7.2 3.3.7.7.4 1.2 1.4 1.7 2.8l18.1 71.4 16.8-71.4c.4-1.5 1-2.4 1.7-2.8.7-.4 1.9-.7 3.4-.7h6c1.6 0 2.7.2 3.4.7.7.4 1.4 1.4 1.7 2.8l17 72.4 18.7-72.4c.5-1.5 1.1-2.4 1.7-2.8.7-.4 1.8-.7 3.3-.7h7c1.2 0 1.9.6 1.9 1.9 0 .4-.1.8-.2 1.3-.1.5-.3 1.2-.7 2.2l-25.1 78.7c-.5 1.5-1.1 2.4-1.8 2.8-.7.4-1.8.7-3.2.7h-6.5c-1.6 0-2.7-.2-3.4-.7-.7-.5-1.4-1.4-1.7-2.9l-16.7-69.6-16.6 69.5c-.4 1.5-1 2.4-1.7 2.9-.7.5-1.9.7-3.4.7h-6.5zm133.3 2.8c-3.9 0-7.8-.5-11.6-1.4-3.8-.9-6.7-1.9-8.7-3-.5-.3-.9-.7-1.1-1.2-.2-.5-.3-1-.3-1.5V83c0-1.9.7-2.8 2.1-2.8.5 0 1 .1 1.5.3.5.2 1.2.5 2 .8 2.7 1.2 5.6 2.1 8.7 2.8 3.2.7 6.3 1 9.4 1 5 0 8.8-.9 11.5-2.6 2.7-1.7 4.1-4.2 4.1-7.4 0-2.2-.7-4-2.1-5.5-1.4-1.5-4-2.9-7.8-4.2l-11.2-3.5c-5.7-1.8-9.9-4.4-12.5-7.8-2.6-3.4-3.9-7.2-3.9-11.2 0-3.2.7-6.1 2.1-8.5 1.4-2.4 3.3-4.6 5.7-6.3 2.4-1.8 5.1-3.1 8.3-4 3.2-.9 6.6-1.3 10.2-1.3 1.8 0 3.7.1 5.5.3 1.9.2 3.6.5 5.3.9 1.6.3 3.2.7 4.7 1.2 1.5.5 2.7 1 3.5 1.5.6.3 1 .7 1.3 1.1.3.4.4 1 .4 1.7v4.1c0 1.9-.7 2.9-2 2.9-.7 0-1.9-.4-3.4-1.1-5.1-2.3-10.8-3.5-17.1-3.5-4.5 0-8 .7-10.5 2.2-2.5 1.5-3.8 3.8-3.8 7 0 2.2.8 4.1 2.4 5.6 1.6 1.5 4.5 3 8.7 4.3l11 3.5c5.6 1.8 9.7 4.3 12.1 7.5 2.4 3.2 3.6 6.9 3.6 10.9 0 3.3-.7 6.3-2 8.9-1.4 2.6-3.3 4.9-5.8 6.7-2.5 1.9-5.4 3.3-8.8 4.3-3.5 1.1-7.2 1.6-11.2 1.6z" fill="#252F3E"/>
      <path d="M273.5 143.7c-32.9 24.3-80.7 37.2-121.8 37.2-57.6 0-109.5-21.3-148.7-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.6 94.7 39.5 148.8 39.5 36.5 0 76.6-7.6 113.5-23.2 5.5-2.5 10.2 3.6 4.8 7.6z" fill="#FF9900"/>
      <path d="M287.2 128.1c-4.2-5.4-27.8-2.6-38.5-1.3-3.2.4-3.7-2.4-.8-4.5 18.8-13.2 49.7-9.4 53.3-5 3.6 4.5-1 35.4-18.6 50.2-2.7 2.3-5.3 1.1-4.1-1.9 3.9-9.9 12.9-32.2 8.7-37.5z" fill="#FF9900"/>
    </svg>
  );
}

function BambooHRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="18" fill="#73AC27"/>
      <path d="M28 75V25h10c0 0 0 12 12 12s12-12 12-12h10v50h-10V50c0 0-2 10-12 10S38 50 38 50v25H28z" fill="white"/>
    </svg>
  );
}

function CloudflareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 109 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M82.3 19.6c-.4-2.9-2-5.5-4.4-7.2-2.4-1.7-5.4-2.4-8.3-1.9-1.9-3.6-5.3-6.2-9.3-7.1-4-.9-8.2.1-11.4 2.6-1.7-1.1-3.7-1.7-5.8-1.7-5.9 0-10.7 4.8-10.7 10.7v.3c-3.9 1.1-6.6 4.7-6.6 8.7 0 5 4.1 9.1 9.1 9.1H79c4.5 0 8.1-3.6 8.1-8.1 0-3.9-2.8-7.3-4.8-5.4z" fill="#F6821F"/>
      <path d="M79 31.1H35.9c-.5 0-.9-.4-.9-.9s.4-.9.9-.9H79c3.4 0 6.2-2.8 6.2-6.2 0-3-2.1-5.6-5.1-6.1l-1.4-.2-.2-1.4c-.3-2.4-1.7-4.6-3.7-6-2.1-1.4-4.6-1.9-7.1-1.5l-1.5.3-.7-1.4c-1.7-3.3-4.9-5.5-8.6-6.1-3.6-.5-7.3.6-9.9 3.1l-1 .9-1.1-.7c-1.5-.9-3.2-1.4-4.9-1.4-5.2 0-9.4 4.2-9.4 9.4v1.4l-1.4.4C27.5 15.8 25 19 25 22.7c0 4.6 3.8 8.4 8.4 8.4" fill="#FBAD41"/>
    </svg>
  );
}

function FleetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="40" fill="#192147"/>
      <path d="M40 60h120v20H40zM40 90h80v20H40zM40 120h100v20H40z" fill="#6BA4FF"/>
    </svg>
  );
}

function GoogleWorkspaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.9 32.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.4 0-9.9-3.5-11.3-8.2l-6.6 5.1C9.7 39.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.7 2-2 3.8-3.8 5l6.2 5.2C40.9 34.7 44 29.7 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  );
}

function IllowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0F172A"/>
      <path d="M30 70V30h12v40H30zM44 70V42h12v28H44zM58 70V50h12v20H58z" fill="#38BDF8"/>
    </svg>
  );
}

function IntercomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#1F8DED"/>
      <path d="M16 6C10.5 6 6 10.5 6 16v8.5l2.1-2.1C9.9 24.7 12.8 26 16 26c5.5 0 10-4.5 10-10S21.5 6 16 6zm-5 10.8c0 .4-.3.7-.7.7s-.7-.3-.7-.7V12c0-.4.3-.7.7-.7s.7.3.7.7v4.8zm3.5 2c0 .4-.3.7-.7.7s-.7-.3-.7-.7v-8c0-.4.3-.7.7-.7s.7.3.7.7v8zm3.5-2c0 .4-.3.7-.7.7s-.7-.3-.7-.7V12c0-.4.3-.7.7-.7s.7.3.7.7v4.8zm3.5-2c0 .4-.3.7-.7.7s-.7-.3-.7-.7V14c0-.4.3-.7.7-.7s.7.3.7.7v2.8z" fill="white"/>
    </svg>
  );
}

function NewRelicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0L2 9v18l16 9 16-9V9L18 0z" fill="#00AC69"/>
      <path d="M18 4.3L5.5 11.5v14.9L18 31.7l12.5-5.3V11.5L18 4.3z" fill="#1CE783"/>
      <path d="M18 9l-8 4.5v9L18 27l8-4.5v-9L18 9z" fill="#00AC69"/>
    </svg>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="15" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
      <path d="M12 12l53 3.5c6.3.4 7.8 1 10.2 3.8l8.3 11.3c1.4 1.9 1.9 3.2 1.9 8.5v43.7c0 5.9-2.2 9.4-9.7 9.9L17.4 95.5c-5.5.3-8.1-1.1-10.8-4.4L1.9 83.5C.3 81.3 0 79.8 0 77.6V21.8C0 16.3 2.8 12.4 12 12z" fill="white"/>
      <path d="M65 19.5L18 16.2c-5.2-.3-7.6 2.5-7.6 6.9v52.8c0 4.6 1.4 7 5.7 7.4l56.4 3.3c4.5.3 6.9-1.8 6.9-6.7V27.2c0-4.5-2-7-14.4-7.7zM56 29.7L28 28v-.1c-1.2-.1-2.2-1.1-2.2-2.2 0-1.3 1.1-2.2 2.5-2.2l29.1 1.9c1.2.1 2 1 2 2.2 0 1.2-1.5 2.3-3.4 2.1zM22 72V38.3c0-1.8 1.6-2.8 3-1.9L59 56c1.2.7 1.2 2.3 0 3L25 72.7c-1.4.9-3-.1-3-1.7z" fill="#1a1a1a"/>
    </svg>
  );
}

function RedashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="36" fill="#FF6B35"/>
      <path d="M40 155l30-60 30 30 25-45 35 75H40z" fill="white" opacity="0.9"/>
      <circle cx="70" cy="95" r="8" fill="white"/>
      <circle cx="100" cy="125" r="8" fill="white"/>
      <circle cx="125" cy="80" r="8" fill="white"/>
    </svg>
  );
}

// ─── Icon map for static cards ─────────────────────────────────────────────────

function StaticIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Slack':            return <SlackIcon className={className} />;
    case 'AWS':              return <AwsIcon className={className} />;
    case 'BambooHR':         return <BambooHRIcon className={className} />;
    case 'Cloudflare':       return <CloudflareIcon className={className} />;
    case 'Fleet':            return <FleetIcon className={className} />;
    case 'Google Workspace': return <GoogleWorkspaceIcon className={className} />;
    case 'Illow':            return <IllowIcon className={className} />;
    case 'Intercom':         return <IntercomIcon className={className} />;
    case 'New Relic':        return <NewRelicIcon className={className} />;
    case 'Notion':           return <NotionIcon className={className} />;
    case 'Redash':           return <RedashIcon className={className} />;
    default:                 return <div className={`bg-gray-200 rounded-full ${className}`} />;
  }
}

// ─── Slack — Add Channel Modal ────────────────────────────────────────────────

function SlackAddChannelModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [eventType, setEventType] = useState(SLACK_EVENT_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId.trim() || !channelName.trim()) { setError('Channel ID and name are required'); return; }
    setLoading(true); setError('');
    try {
      await slackService.addChannel({ channelId: channelId.trim(), channelName: channelName.trim(), eventType });
      onAdded(); onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add channel mapping');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Add Channel Mapping</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slack Channel ID <span className="text-gray-400 font-normal">(e.g. C0123ABCDE)</span>
            </label>
            <input type="text" value={channelId} onChange={e => setChannelId(e.target.value)} placeholder="C0123ABCDE"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
            <input type="text" value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="#security-alerts"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]">
              {SLACK_EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-[#4A154B] hover:bg-[#3a1039] text-white">
              {loading ? 'Adding...' : 'Add Mapping'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Slack — full card ────────────────────────────────────────────────────────

function SlackCard({
  slackIntegration,
  channels,
  loadingStatus,
  onDisconnect,
  onChannelsChange,
  onToast,
}: {
  slackIntegration: SlackIntegration | null;
  channels: SlackChannel[];
  loadingStatus: boolean;
  onDisconnect: () => void;
  onChannelsChange: (channels: SlackChannel[]) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const isConnected = !!slackIntegration;
  const [disconnecting, setDisconnecting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Slack? This will remove all channel mappings.')) return;
    setDisconnecting(true);
    try {
      await slackService.disconnect();
      onDisconnect();
      onToast('success', 'Slack disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Slack');
    } finally { setDisconnecting(false); }
  }

  async function handleRemoveChannel(id: string) {
    try {
      await slackService.removeChannel(id);
      onChannelsChange(channels.filter(c => c.id !== id));
    } catch {
      onToast('error', 'Failed to remove channel mapping');
    }
  }

  async function handleChannelAdded() {
    try {
      const res = await slackService.getChannels();
      onChannelsChange(res.data ?? []);
    } catch {}
  }

  const eventLabel = (v: string) => SLACK_EVENT_TYPES.find(e => e.value === v)?.label ?? v;

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <SlackIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Slack</h3>
              <p className="text-sm text-gray-500">Communication · Alerts &amp; interactive notifications</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? 'Connected' : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Receive automated alerts for critical risks, audit findings, overdue tests, and audit events.
          Respond with interactive buttons directly from Slack — accept risks, start remediation, and more.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {['Critical Risks', 'Audit Findings', 'Overdue Tests', 'Audit Events'].map((l) => (
            <span key={l} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 font-medium">{l}</span>
          ))}
        </div>

        {isConnected && slackIntegration && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            Connected to workspace <strong>{slackIntegration.workspaceName}</strong> since {new Date(slackIntegration.createdAt).toLocaleDateString()}.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!loadingStatus && !isConnected && (
            <a href={slackService.getInstallUrl()}>
              <Button className="gap-2 bg-[#4A154B] hover:bg-[#3a1039] text-white">
                <SlackIcon className="w-4 h-4" />
                Connect Slack
              </Button>
            </a>
          )}
          {isConnected && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowChannels(v => !v)}>
                {showChannels ? 'Hide Channels' : `Channel Mappings (${channels.length})`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowChannels(true); setShowAddModal(true); }}
                className="bg-[#4A154B] hover:bg-[#3a1039] text-white border-0">
                + Add Mapping
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          )}
        </div>

        {/* Channel mappings table — inline, no separate page */}
        {isConnected && showChannels && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Channel Mappings</h4>
            {channels.length === 0 ? (
              <p className="text-sm text-gray-400">No channel mappings yet. Use "+ Add Mapping" to route events to Slack channels.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Channel</th>
                      <th className="py-2 pr-4">Event</th>
                      <th className="py-2 pr-4">Added</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {channels.map(ch => (
                      <tr key={ch.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {ch.channelName}
                          <span className="block text-xs text-gray-400 font-normal">{ch.channelId}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {eventLabel(ch.eventType)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-xs text-gray-400">{new Date(ch.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => handleRemoveChannel(ch.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {showAddModal && (
        <SlackAddChannelModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleChannelAdded}
        />
      )}
    </>
  );
}

// ─── New Relic — Connect Modal ────────────────────────────────────────────────

function NewRelicConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (status: NewRelicStatus) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [region, setRegion] = useState<'US' | 'EU'>('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !accountId.trim()) { setError('API Key and Account ID are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await newRelicService.connect({ apiKey: apiKey.trim(), accountId: accountId.trim(), region });
      if (res.success) {
        onConnected({ id: res.data.id, accountId: res.data.accountId, region: res.data.region as 'US' | 'EU', connectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect New Relic — check your API key and account ID');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect New Relic</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your New Relic User API key and Account ID to enable automated compliance monitoring.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User API Key <span className="text-gray-400 font-normal">(starts with NRAK-…)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="NRAK-XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
            <input
              type="text"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="1234567"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value as 'US' | 'EU')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="US">US (api.newrelic.com)</option>
              <option value="EU">EU (api.eu.newrelic.com)</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-[#00AC69] hover:bg-[#009558] text-white">
              {loading ? 'Connecting…' : 'Connect New Relic'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── New Relic — full card ────────────────────────────────────────────────────

function NewRelicCard({
  nrStatus,
  connected,
  loadingStatus,
  onConnected,
  onDisconnected,
  onToast,
}: {
  nrStatus: NewRelicStatus | null;
  connected: boolean;
  loadingStatus: boolean;
  onConnected: (status: NewRelicStatus) => void;
  onDisconnected: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<NewRelicSyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm('Disconnect New Relic? Automated tests will stop running.')) return;
    setDisconnecting(true);
    try {
      await newRelicService.disconnect();
      onDisconnected();
      onToast('success', 'New Relic disconnected');
    } catch {
      onToast('error', 'Failed to disconnect New Relic');
    } finally { setDisconnecting(false); }
  }

  async function handleScan() {
    setScanning(true);
    try {
      await newRelicService.runScan();
      onToast('success', 'New Relic scan started — results will appear in tests & logs shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanning(false); }
  }

  async function handleToggleLogs() {
    const next = !showLogs;
    setShowLogs(next);
    if (next && logs.length === 0) {
      setLogsLoading(true);
      try {
        const res = await newRelicService.getLogs();
        setLogs(res.data ?? []);
      } catch { /* ignore */ }
      finally { setLogsLoading(false); }
    }
  }

  function logStatusBadge(status: string) {
    switch (status) {
      case 'SUCCESS': return <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Success</span>;
      case 'FAILURE': return <span className="inline-block bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">Failure</span>;
      case 'PARTIAL': return <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">Partial</span>;
      default:        return <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">{status}</span>;
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <NewRelicIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">New Relic</h3>
              <p className="text-sm text-gray-500">Observability · Monitoring &amp; SLO compliance</p>
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : connected ? 'Connected' : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically collect ISO 27001 evidence from New Relic — verify monitoring is active, critical
          alerts are configured, incidents are tracked, uptime meets SLOs, and logs are retained for the
          required period.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.16 Monitoring', 'A.5.24 Incident Mgmt', 'A.5.30 Availability', 'A.8.15 Log Retention'].map((l) => (
            <span key={l} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected banner */}
        {connected && nrStatus && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            Connected to account <strong>{nrStatus.accountId}</strong> ({nrStatus.region} region) since {new Date(nrStatus.connectedAt).toLocaleDateString()}.
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && !connected && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00AC69] text-white text-sm font-medium hover:bg-[#009558]"
            >
              <NewRelicIcon className="w-4 h-4" />
              Connect New Relic
            </button>
          )}
          {connected && (
            <>
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
                {scanning ? 'Scanning…' : 'Run Scan Now'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleLogs}>
                {showLogs ? 'Hide Logs' : 'Sync Logs'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          )}
        </div>

        {/* Sync Logs section */}
        {connected && showLogs && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Sync Logs</h4>
            {logsLoading ? (
              <p className="text-sm text-gray-400">Loading logs…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-gray-400">No sync logs yet. Run a scan to see results here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{log.syncType}</span>
                        </td>
                        <td className="py-2 pr-4">{logStatusBadge(log.status)}</td>
                        <td className="py-2 text-xs text-gray-600">{log.message ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {showModal && (
        <NewRelicConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(status) => { onConnected(status); onToast('success', 'New Relic connected successfully!'); }}
        />
      )}
    </>
  );
}

// ─── Notion — Connect Modal ───────────────────────────────────────────────────

function NotionConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (status: NotionStatus) => void;
}) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) { setError('Integration token is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await notionService.connect(token.trim());
      if (res.success) {
        const statusRes = await notionService.getStatus();
        if (statusRes.connected && statusRes.data) {
          onConnected(statusRes.data);
        }
        onClose();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your token and try again');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Notion</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create a Notion Internal Integration at{' '}
          <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-blue-600 underline">
            notion.so/my-integrations
          </a>{' '}
          and paste the token below. Then share your task databases with the integration.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Integration Token <span className="text-gray-400 font-normal">(starts with secret_…)</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
              {loading ? 'Connecting…' : 'Connect Notion'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Notion — Link Database Modal ─────────────────────────────────────────────

function NotionLinkDbModal({ onClose, onLinked }: {
  onClose: () => void;
  onLinked: () => void;
}) {
  const [dbs, setDbs] = useState<NotionAvailableDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    notionService.getDatabases()
      .then(res => setDbs(res.data ?? []))
      .catch(() => setError('Failed to load databases'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLink(db: NotionAvailableDatabase) {
    setLinking(db.id);
    try {
      await notionService.linkDatabase(db.id, db.title);
      onLinked();
      onClose();
    } catch { setError('Failed to link database'); }
    finally { setLinking(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Link a Notion Database</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Select a database to sync tasks from. Make sure the database has been shared with your integration.
        </p>
        {loading && <p className="text-sm text-gray-400 animate-pulse">Loading databases…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && dbs.length === 0 && (
          <p className="text-sm text-gray-400">No databases found. Share at least one Notion database with your integration.</p>
        )}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {dbs.map(db => (
            <div key={db.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{db.title}</p>
                <p className="text-xs text-gray-400 font-mono">{db.id}</p>
              </div>
              {db.linked ? (
                <span className="text-xs text-green-600 font-medium">Linked</span>
              ) : (
                <Button size="sm" onClick={() => handleLink(db)} disabled={linking === db.id}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs">
                  {linking === db.id ? 'Linking…' : 'Link'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notion — full card ───────────────────────────────────────────────────────

function NotionCard({
  notionStatus,
  connected,
  loadingStatus,
  onConnected,
  onDisconnected,
  onToast,
}: {
  notionStatus: NotionStatus | null;
  connected: boolean;
  loadingStatus: boolean;
  onConnected: (status: NotionStatus) => void;
  onDisconnected: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showLinkDb, setShowLinkDb] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showDbs, setShowDbs] = useState(false);
  const [logs, setLogs] = useState<NotionSyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Notion? Task sync will stop.')) return;
    setDisconnecting(true);
    try {
      await notionService.disconnect();
      onDisconnected();
      onToast('success', 'Notion disconnected');
    } catch { onToast('error', 'Failed to disconnect Notion'); }
    finally { setDisconnecting(false); }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await notionService.sync();
      onToast('success', 'Notion sync started — tasks will update shortly');
    } catch { onToast('error', 'Failed to start sync'); }
    finally { setSyncing(false); }
  }

  async function handleToggleLogs() {
    const next = !showLogs;
    setShowLogs(next);
    if (next && logs.length === 0) {
      setLogsLoading(true);
      try {
        const res = await notionService.getLogs();
        setLogs(res.data ?? []);
      } catch { /* ignore */ }
      finally { setLogsLoading(false); }
    }
  }

  function logBadge(status: string) {
    switch (status) {
      case 'SUCCESS': return <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Success</span>;
      case 'FAILURE': return <span className="inline-block bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">Failure</span>;
      case 'PARTIAL': return <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">Partial</span>;
      default:        return <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">{status}</span>;
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <NotionIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notion</h3>
              <p className="text-sm text-gray-500">Knowledge Base · Task tracking &amp; remediation</p>
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : connected ? 'Connected' : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Sync compliance tasks from Notion boards into ISMS. Track task ownership, overdue items, and
          SLA compliance automatically. Push remediation tasks directly from failed tests to Notion.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.2 Task Ownership', 'A.5.31 Compliance Tasks', 'A.5.24 Remediation SLA', 'A.5.18 Access Reviews'].map(l => (
            <span key={l} className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected banner */}
        {connected && notionStatus && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 flex items-center justify-between flex-wrap gap-2">
            <span>
              Connected to workspace <strong>{notionStatus.workspaceName}</strong> since {new Date(notionStatus.connectedAt).toLocaleDateString()}.
              {notionStatus.linkedDatabases.length > 0
                ? ` ${notionStatus.linkedDatabases.length} database${notionStatus.linkedDatabases.length > 1 ? 's' : ''} linked.`
                : ' No databases linked yet.'}
            </span>
            {notionStatus.lastSync && (
              <span className="text-xs text-green-600">
                Last sync: {new Date(notionStatus.lastSync.createdAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && !connected && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
            >
              <NotionIcon className="w-4 h-4" />
              Connect Notion
            </button>
          )}
          {connected && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowLinkDb(true)}>
                Link Database
              </Button>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? 'Syncing…' : 'Sync Tasks'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDbs(v => !v)}>
                {showDbs ? 'Hide Databases' : `Databases (${notionStatus?.linkedDatabases.length ?? 0})`}
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleLogs}>
                {showLogs ? 'Hide Logs' : 'Sync Logs'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          )}
        </div>

        {/* Linked Databases */}
        {connected && showDbs && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Linked Databases</h4>
            {!notionStatus || notionStatus.linkedDatabases.length === 0 ? (
              <p className="text-sm text-gray-400">No databases linked. Click "Link Database" to connect a Notion board.</p>
            ) : (
              <div className="space-y-2">
                {notionStatus.linkedDatabases.map(db => (
                  <div key={db.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{db.databaseName}</p>
                      <p className="text-xs text-gray-400">{db.lastSyncedAt ? `Last synced: ${new Date(db.lastSyncedAt).toLocaleString()}` : 'Not yet synced'}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await notionService.unlinkDatabase(db.id).catch(() => {});
                        const res = await notionService.getStatus().catch(() => null);
                        if (res?.connected && res.data) onConnected(res.data);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Unlink
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sync Logs */}
        {connected && showLogs && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Sync Logs</h4>
            {logsLoading ? (
              <p className="text-sm text-gray-400">Loading logs…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-gray-400">No sync logs yet. Click "Sync Tasks" to start.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Found</th>
                      <th className="py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-2 pr-4">{logBadge(log.status)}</td>
                        <td className="py-2 pr-4 text-xs text-gray-600">{log.tasksFound} found / {log.tasksUpdated} updated</td>
                        <td className="py-2 text-xs text-gray-600 max-w-[200px] truncate" title={log.message ?? ''}>{log.message ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {showModal && (
        <NotionConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(status) => { onConnected(status); onToast('success', 'Notion connected successfully!'); }}
        />
      )}
      {showLinkDb && (
        <NotionLinkDbModal
          onClose={() => setShowLinkDb(false)}
          onLinked={async () => {
            const res = await notionService.getStatus().catch(() => null);
            if (res?.connected && res.data) onConnected(res.data);
            onToast('success', 'Database linked');
          }}
        />
      )}
    </>
  );
}

// ─── AWS — Onboard Modal ──────────────────────────────────────────────────────

function AwsOnboardModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: AwsAccountRecord) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [trustData, setTrustData] = useState<{ externalId: string; ismsAccountId: string; trustPolicyJson: string; permissionPolicyJson: string } | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState('');

  const [roleArn, setRoleArn] = useState('');
  const [awsAccountId, setAwsAccountId] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [label, setLabel] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [copied, setCopied] = useState<'trust' | 'perm' | null>(null);

  async function loadTrustPolicy() {
    setLoadingPolicy(true); setPolicyError('');
    try {
      const res = await awsService.getTrustPolicy();
      setTrustData(res.data);
    } catch (err: any) {
      setPolicyError(err?.message ?? 'Failed to generate trust policy');
    } finally { setLoadingPolicy(false); }
  }

  // Load trust policy as soon as modal opens
  useState(() => { loadTrustPolicy(); });

  function copyToClipboard(text: string, which: 'trust' | 'perm') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleArn.trim() || !awsAccountId.trim()) { setConnectError('Role ARN and AWS Account ID are required'); return; }
    if (!trustData) { setConnectError('Trust policy data missing — please go back and try again'); return; }
    setConnecting(true); setConnectError('');
    try {
      const res = await awsService.connect({
        roleArn: roleArn.trim(),
        awsAccountId: awsAccountId.trim(),
        externalId: trustData.externalId,
        region,
        label: label.trim() || undefined,
      });
      if (res.success) {
        onConnected(res.data);
        onClose();
      }
    } catch (err: any) {
      setConnectError(err?.message ?? 'Failed to connect — check your Role ARN and trust policy');
    } finally { setConnecting(false); }
  }

  const AWS_REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1',
    'ca-central-1', 'sa-east-1',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Connect AWS Account</h2>
            <p className="text-sm text-gray-500">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              Create a cross-account IAM role in your AWS account with the trust policy below. This allows ISMS to
              assume the role using a unique External ID — no access keys are stored.
            </p>

            {loadingPolicy && <p className="text-sm text-gray-400 animate-pulse">Generating trust policy…</p>}
            {policyError && <p className="text-sm text-red-600">{policyError}</p>}

            {trustData && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">1. Trust Policy (attach to IAM role)</label>
                    <button
                      onClick={() => copyToClipboard(trustData.trustPolicyJson, 'trust')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {copied === 'trust' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-5">
                    {trustData.trustPolicyJson}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">2. Permission Policy (inline or managed)</label>
                    <button
                      onClick={() => copyToClipboard(trustData.permissionPolicyJson, 'perm')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {copied === 'perm' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-5">
                    {trustData.permissionPolicyJson}
                  </pre>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <strong>External ID:</strong> <code className="font-mono">{trustData.externalId}</code>
                  <br />This ID is pre-filled in the trust policy above. Keep this page open while creating the role.
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!trustData || loadingPolicy}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                I&apos;ve created the role — Next
              </button>
              <button onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">Enter the ARN of the role you just created and your AWS Account ID.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role ARN <span className="text-gray-400 font-normal">(e.g. arn:aws:iam::123456789012:role/ISMSReadOnly)</span>
              </label>
              <input
                type="text"
                value={roleArn}
                onChange={e => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/ISMSReadOnly"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AWS Account ID <span className="text-gray-400 font-normal">(12 digits)</span></label>
              <input
                type="text"
                value={awsAccountId}
                onChange={e => setAwsAccountId(e.target.value)}
                placeholder="123456789012"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Region</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              >
                {AWS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Production, Staging, etc."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              />
            </div>
            {connectError && <p className="text-sm text-red-600">{connectError}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {connecting ? 'Connecting & validating…' : 'Connect AWS Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── AWS — full card ──────────────────────────────────────────────────────────

function AwsCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: AwsAccountRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: AwsAccountRecord) => void;
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
      await awsService.runScan(accountId);
      onToast('success', 'AWS scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(accountId: string, label: string | null) {
    if (!window.confirm(`Disconnect AWS account ${label ?? accountId}? Automated tests will stop running.`)) return;
    setDisconnectingId(accountId);
    try {
      await awsService.disconnect(accountId);
      onAccountRemoved(accountId);
      onToast('success', 'AWS account disconnected');
    } catch {
      onToast('error', 'Failed to disconnect AWS account');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <AwsIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AWS</h3>
              <p className="text-sm text-gray-500">Cloud Infrastructure · IAM, S3, CloudTrail, KMS, EC2, RDS</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length > 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically collect ISO 27001 evidence from AWS via cross-account IAM role assumption — no access
          keys stored. Runs 12 automated compliance checks across IAM, CloudTrail, S3, KMS, EC2 and RDS.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.15 IAM', 'A.5.18 Access Keys', 'A.8.15 CloudTrail', 'A.8.10 S3 Public', 'A.8.24 Encryption', 'A.8.20 Network', 'A.8.13 RDS Backups'].map((l) => (
            <span key={l} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected accounts */}
        {isConnected && accounts.length > 0 && (
          <div className="mb-4 space-y-2">
            {accounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.label ?? account.awsAccountId}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {account.awsAccountId} · {account.region}
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

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium"
            >
              <AwsIcon className="w-4 h-4" />
              {isConnected ? '+ Add AWS Account' : 'Connect AWS'}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <AwsOnboardModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', `AWS account ${account.label ?? account.awsAccountId} connected! 12 automated tests are being seeded.`);
          }}
        />
      )}
    </>
  );
}

// ─── BambooHR — Connect Modal ─────────────────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your subdomain and API key');
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

// ─── BambooHR — full card ─────────────────────────────────────────────────────

function BambooHRCard({
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
    if (!window.confirm(`Disconnect BambooHR${label ? ` (${label})` : ''}? Automated HR tests will stop running.`)) return;
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

// ─── Cloudflare — Connect Modal ──────────────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your API token and try again');
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

// ─── Cloudflare — full card ───────────────────────────────────────────────────

function CloudflareCard({
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

// ─── Redash — Connect Modal ───────────────────────────────────────────────────

function RedashConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: RedashIntegrationRecord) => void;
}) {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!baseUrl.trim() || !apiKey.trim()) { setError('Base URL and API Key are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await redashService.connect({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), label: label.trim() || undefined });
      if (res.success) {
        const accountsRes = await redashService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(a => a.baseUrl === baseUrl.trim().replace(/\/$/, ''));
        if (newAccount) onConnected(newAccount);
        else onConnected({ id: res.data.id, baseUrl: res.data.baseUrl, label: res.data.label, status: res.data.status, lastScanAt: null, createdAt: res.data.createdAt, users: [], dataSources: [] });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your base URL and API key');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Redash</h2>
        <p className="text-sm text-gray-500 mb-3">
          Enter your Redash instance URL and an API key with admin read access.
          Find your API key in <strong>Redash → Profile → API Key</strong>.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redash Instance URL <span className="text-gray-400 font-normal">(e.g. https://redash.example.com)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://redash.example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key <span className="text-gray-400 font-normal">(admin user)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Redash API Key"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] font-mono"
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
              placeholder="e.g. Production Analytics"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#e55c28] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Connect Redash'}
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

// ─── Redash — full card ───────────────────────────────────────────────────────

function RedashCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: RedashIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: RedashIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await redashService.runScan(integrationId);
      onToast('success', 'Redash scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(integrationId: string, label: string | null, baseUrl: string) {
    if (!window.confirm(`Disconnect Redash${label ? ` (${label})` : ` (${baseUrl})`}? Automated tests will stop running.`)) return;
    setDisconnectingId(integrationId);
    try {
      await redashService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', 'Redash disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Redash');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <RedashIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Redash</h3>
              <p className="text-sm text-gray-500">Analytics · Data governance &amp; query compliance</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically collect ISO 27001 evidence from your Redash instance — verify admin access controls,
          inactive users, public dashboards, query ownership, production data source restrictions, and
          approved connection types. All 7 results appear in the Tests page.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.2 Public Dashboards', 'A.8.9 Access Control', 'A.8.12 Query Ownership', 'A.5.15 Terminated Users'].map((l) => (
            <span key={l} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected accounts */}
        {isConnected && accounts.map(account => {
          const activeUsers = account.users.filter(u => u.isActive).length;
          const totalUsers = account.users.length;
          const dsSources = account.dataSources.length;
          return (
            <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{account.label ?? account.baseUrl}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.baseUrl}
                  {totalUsers > 0 && ` · ${activeUsers} active / ${totalUsers} users`}
                  {dsSources > 0 && ` · ${dsSources} data source${dsSources !== 1 ? 's' : ''}`}
                  {account.lastScanAt && ` · Last scan: ${new Date(account.lastScanAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                  {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label, account.baseUrl)} disabled={disconnectingId === account.id}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF6B35] hover:bg-[#e55c28] text-white text-sm font-medium"
            >
              <RedashIcon className="w-4 h-4" />
              {isConnected ? '+ Add Redash Instance' : 'Connect Redash'}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <RedashConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', 'Redash connected! 7 automated tests are being seeded.');
          }}
        />
      )}
    </>
  );
}

// ─── Static cards (coming soon) ───────────────────────────────────────────────

const STATIC_INTEGRATIONS = [
  { name: 'Fleet',              category: 'Endpoint',           description: 'Collect device inventory and vulnerability data from Fleet-managed endpoints.' },
  { name: 'Google Workspace',   category: 'Identity & Access',  description: 'Audit user accounts, group memberships and MFA enforcement across Workspace.' },
  { name: 'Illow',              category: 'Privacy',            description: 'Import consent records and cookie-banner logs for privacy compliance.' },
  { name: 'Intercom',           category: 'Customer Support',   description: 'Link customer data-access requests to your privacy controls and DSARs.' },
];

// ─── MDM sub-component ────────────────────────────────────────────────────────

function MdmCard({ onToast }: { onToast: (type: 'success' | 'error', msg: string) => void }) {
  const [tokens, setTokens] = useState<EnrollmentToken[]>([]);
  const [overview, setOverview] = useState<MdmOverview | null>(null);
  const [newToken, setNewToken] = useState<CreatedToken | null>(null);
  const [tokenLabel, setTokenLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tokRes, ovRes] = await Promise.all([
        mdmService.listTokens(),
        mdmService.getOverview(),
      ]);
      setTokens(tokRes.tokens);
      setOverview(ovRes);
    } catch { /* not admin or no devices yet — ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const t = await mdmService.createToken(tokenLabel || undefined);
      setNewToken(t);
      setTokenLabel('');
      await loadData();
      onToast('success', 'Enrollment token created');
    } catch (e: any) {
      onToast('error', e?.message ?? 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await mdmService.deleteToken(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
      if (newToken?.id === id) setNewToken(null);
      onToast('success', 'Token revoked');
    } catch {
      onToast('error', 'Failed to revoke token');
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Manzen MDM Agent</h3>
            <p className="text-sm text-gray-500">Endpoint · macOS device management</p>
          </div>
        </div>
        <Badge variant={overview && overview.total > 0 ? 'default' : 'outline'}>
          {loading ? 'Loading…' : overview && overview.total > 0 ? `${overview.total} device${overview.total !== 1 ? 's' : ''}` : 'No devices'}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Deploy the open-source Go agent to Mac endpoints. It collects device security posture every
        15 minutes and reports to this ISMS, automatically creating risks for non-compliant controls.
      </p>

      {/* ISO control tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['A.8.24 Disk Encryption', 'A.5.15 Screen Lock', 'A.8.20 Firewall', 'A.8.8 Patch Management', 'A.8.7 SIP/Gatekeeper'].map((l) => (
          <span key={l} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 font-medium">{l}</span>
        ))}
      </div>

      {/* Overview stats */}
      {overview && overview.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Compliant', value: overview.compliant, color: 'text-green-700 bg-green-50' },
            { label: 'Non-Compliant', value: overview.nonCompliant, color: 'text-red-600 bg-red-50' },
            { label: 'Unknown', value: overview.unknown, color: 'text-gray-600 bg-gray-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg px-3 py-2 text-center ${s.color}`}>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* New token result */}
      {newToken && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Token created — install the agent on the device:</p>
          <pre className="text-xs bg-gray-900 text-green-400 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {newToken.installCommand}
          </pre>
          <p className="text-xs text-green-700 mt-2">This token expires at {new Date(newToken.expiresAt).toLocaleString()} and can only be used once.</p>
        </div>
      )}

      {/* Create token form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Label (optional, e.g. Alice's MacBook)"
          value={tokenLabel}
          onChange={(e) => setTokenLabel(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Button size="sm" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create Enrollment Token'}
        </Button>
      </div>

      {/* Token list */}
      {tokens.length > 0 && (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tokens.map((t) => (
                <tr key={t.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{t.label ?? <span className="italic text-gray-400">Unlabelled</span>}</td>
                  <td className="px-4 py-2">
                    {t.usedAt
                      ? <Badge variant="secondary" className="text-xs">Used {new Date(t.usedAt).toLocaleDateString()}</Badge>
                      : <Badge variant="outline" className="text-xs">Pending</Badge>}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(t.expiresAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleRevoke(t.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Agent source: <a href="https://github.com/vinmnit159/manzen-mdm-agent" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">github.com/vinmnit159/manzen-mdm-agent</a>
      </p>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const [searchParams] = useSearchParams();
  const [githubIntegration, setGithubIntegration] = useState<Integration | null>(null);
  const [driveIntegration, setDriveIntegration] = useState<Integration | null>(null);
  const [slackIntegration, setSlackIntegration] = useState<SlackIntegration | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [nrConnected, setNrConnected] = useState(false);
  const [nrStatus, setNrStatus] = useState<NewRelicStatus | null>(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionStatus, setNotionStatus] = useState<NotionStatus | null>(null);
  const [awsAccounts, setAwsAccounts] = useState<AwsAccountRecord[]>([]);
  const [cloudflareAccounts, setCloudflareAccounts] = useState<CloudflareAccountRecord[]>([]);
  const [bamboohrAccounts, setBamboohrAccounts] = useState<HRIntegrationRecord[]>([]);
  const [redashAccounts, setRedashAccounts] = useState<RedashIntegrationRecord[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showRepos, setShowRepos] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const loadStatus = async () => {
    try {
      const [{ integrations }, slackRes, channelsRes, nrRes, notionRes, awsRes, cfRes, bambooRes, redashRes] = await Promise.all([
        integrationsService.getStatus(),
        slackService.getStatus().catch(() => ({ success: false, data: null })),
        slackService.getChannels().catch(() => ({ data: [] as SlackChannel[] })),
        newRelicService.getStatus().catch(() => ({ connected: false, data: null })),
        notionService.getStatus().catch(() => ({ connected: false, data: null })),
        awsService.getAccounts().catch(() => ({ success: true, data: [] as AwsAccountRecord[] })),
        cloudflareService.getAccounts().catch(() => ({ success: true, data: [] as CloudflareAccountRecord[] })),
        bamboohrService.getAccounts().catch(() => ({ success: true, data: [] as HRIntegrationRecord[] })),
        redashService.getAccounts().catch(() => ({ success: true, data: [] as RedashIntegrationRecord[] })),
      ]);
      const gh = integrations.find((i) => i.provider === 'GITHUB' && i.status === 'ACTIVE') ?? null;
      const drive = integrations.find((i) => i.provider === 'GOOGLE_DRIVE' && i.status === 'ACTIVE') ?? null;
      setGithubIntegration(gh);
      setDriveIntegration(drive);
      setSlackIntegration(slackRes.data);
      setSlackChannels(channelsRes.data ?? []);
      setNrConnected(nrRes.connected);
      setNrStatus(nrRes.data);
      setNotionConnected(notionRes.connected);
      setNotionStatus(notionRes.data);
      setAwsAccounts(awsRes.data ?? []);
      setCloudflareAccounts(cfRes.data ?? []);
      setBamboohrAccounts(bambooRes.data ?? []);
      setRedashAccounts(redashRes.data ?? []);
      if (gh) setRepos(gh.repos);
    } catch {
      /* unauthenticated or network — treat as disconnected */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'github') showToast('success', 'GitHub connected successfully!');
    if (connected === 'google_drive') showToast('success', 'Google Drive connected! Folder structure is being created.');
    if (connected === 'slack') showToast('success', 'Slack connected successfully!');
    if (error) showToast('error', decodeURIComponent(error));
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    window.location.href = integrationsService.getConnectUrl();
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect GitHub? Evidence collection will stop.')) return;
    setDisconnecting(true);
    try {
      await integrationsService.disconnect();
      setGithubIntegration(null);
      setRepos([]);
      setShowRepos(false);
      showToast('success', 'GitHub disconnected');
    } catch {
      showToast('error', 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = !!githubIntegration;

  return (
    <PageTemplate title="Integrations" description="Connect third-party tools and services to your ISMS.">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── GitHub — full-width active card ─────────────────────────────── */}
        <Card className="p-6 md:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <GitHubIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">GitHub</h3>
                <p className="text-sm text-gray-500">Development · Code repository integration</p>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'outline'}>
              {loading ? 'Checking...' : isConnected ? 'Connected' : 'Available'}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Automatically collect ISO 27001 evidence from your repositories including branch protection
            rules, commit signing, CI/CD workflows, and collaborator access controls.
          </p>

          {/* ISO control tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              'A.8.32 Branch Protection',
              'A.8.24 Commit Signing',
              'A.8.25 Secure SDLC',
              'A.5.15 Access Control',
            ].map((label) => (
              <span
                key={label}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!loading && !isConnected && (
              <Button onClick={handleConnect} className="gap-2">
                <GitHubIcon className="w-4 h-4" />
                Connect GitHub
              </Button>
            )}
            {isConnected && (
              <>
                <Button variant="outline" onClick={() => setShowRepos((v) => !v)}>
                  {showRepos ? 'Hide Repos' : `View Repos (${repos.length})`}
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </>
            )}
          </div>

          {/* Connected metadata */}
          {isConnected && githubIntegration && (
            <p className="mt-3 text-xs text-gray-400">
              Connected {new Date(githubIntegration.createdAt).toLocaleDateString()} ·{' '}
              {repos.length} {repos.length === 1 ? 'repository' : 'repositories'} · scans run daily at 02:00 UTC
            </p>
          )}

          {/* Repo scan results */}
          {showRepos && (
            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Repositories &amp; Compliance Evidence
              </h4>
              {repos.length === 0 ? (
                <p className="text-sm text-gray-400">No repositories found. Run a scan to discover them.</p>
              ) : (
                repos.map((repo) => <RepoScanRow key={repo.id} repo={repo} />)
              )}
            </div>
          )}


        </Card>

        {/* ── Google Drive ──────────────────────────────────────────────────── */}
        <GoogleDriveCard
          driveIntegration={driveIntegration}
          loading={loading}
          onToast={showToast}
          onDisconnect={() => setDriveIntegration(null)}
        />

        {/* ── Slack ────────────────────────────────────────────────────────── */}
        <SlackCard
          slackIntegration={slackIntegration}
          channels={slackChannels}
          loadingStatus={loading}
          onDisconnect={() => { setSlackIntegration(null); setSlackChannels([]); }}
          onChannelsChange={setSlackChannels}
          onToast={showToast}
        />

        {/* ── Manzen MDM Agent ─────────────────────────────────────────────── */}
        <MdmCard onToast={showToast} />

        {/* ── BambooHR ─────────────────────────────────────────────────────── */}
        <BambooHRCard
          accounts={bamboohrAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setBamboohrAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setBamboohrAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />

        {/* ── Notion ───────────────────────────────────────────────────────── */}
        <NotionCard
          notionStatus={notionStatus}
          connected={notionConnected}
          loadingStatus={loading}
          onConnected={(status) => { setNotionConnected(true); setNotionStatus(status); }}
          onDisconnected={() => { setNotionConnected(false); setNotionStatus(null); }}
          onToast={showToast}
        />

        {/* ── AWS ──────────────────────────────────────────────────────────── */}
        <AwsCard
          accounts={awsAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAwsAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(accountId) => setAwsAccounts(prev => prev.filter(a => a.id !== accountId))}
          onToast={showToast}
        />

        {/* ── Cloudflare ───────────────────────────────────────────────────── */}
        <CloudflareCard
          accounts={cloudflareAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCloudflareAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(accountId) => setCloudflareAccounts(prev => prev.filter(a => a.id !== accountId))}
          onToast={showToast}
        />

        {/* ── New Relic ────────────────────────────────────────────────────── */}
        <NewRelicCard
          nrStatus={nrStatus}
          connected={nrConnected}
          loadingStatus={loading}
          onConnected={(status) => { setNrConnected(true); setNrStatus(status); }}
          onDisconnected={() => { setNrConnected(false); setNrStatus(null); }}
          onToast={showToast}
        />

        {/* ── Redash ───────────────────────────────────────────────────────── */}
        <RedashCard
          accounts={redashAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setRedashAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setRedashAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />

        {/* ── Static coming-soon cards ─────────────────────────────────────── */}
        {STATIC_INTEGRATIONS.map((integration) => (
          <Card key={integration.name} className="p-6 opacity-60 select-none">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
                  <StaticIcon name={integration.name} className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-500">{integration.category}</p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </Card>
        ))}
      </div>
    </PageTemplate>
  );
}
