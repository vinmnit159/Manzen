import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { integrationsService, Integration, GitHubRepo } from '@/services/api/integrations';
import { mdmService, EnrollmentToken, CreatedToken, MdmOverview } from '@/services/api/mdm';
import { slackService, SlackIntegration, SlackChannel, SLACK_EVENT_TYPES } from '@/services/api/slack';
import { newRelicService, NewRelicStatus, NewRelicSyncLog } from '@/services/api/newrelic';
import { notionService, NotionStatus, NotionSyncLog, NotionAvailableDatabase } from '@/services/api/notion';
import { awsService, AwsAccountRecord } from '@/services/api/aws';
import { cloudflareService, CloudflareAccountRecord } from '@/services/api/cloudflare';
import { bamboohrService, HRIntegrationRecord } from '@/services/api/bamboohr';
import { redashService, RedashIntegrationRecord } from '@/services/api/redash';
import { workspaceService, WorkspaceIntegrationRecord } from '@/services/api/workspace';
import { fleetService, FleetIntegrationRecord } from '@/services/api/fleet';
import { intercomService, IntercomIntegrationRecord } from '@/services/api/intercom';
import { bigIdService, BigIdIntegrationRecord } from '@/services/api/bigid';
import { pagerdutyService, PagerDutyIntegrationRecord } from '@/services/api/pagerduty';
import { opsgenieService, OpsgenieIntegrationRecord } from '@/services/api/opsgenie';
import { servicenowIncidentService, ServiceNowIntegrationRecord } from '@/services/api/servicenow-incident';
import { datadogIncidentsService, DatadogIntegrationRecord } from '@/services/api/datadog-incidents';
import { gcpService, GcpIntegrationRecord } from '@/services/api/gcp';
import { azureService, AzureIntegrationRecord } from '@/services/api/azure';
import { wizService, WizIntegrationRecord } from '@/services/api/wiz';
import { laceworkService, LaceworkIntegrationRecord } from '@/services/api/lacework';
import { snykService, SnykIntegrationRecord } from '@/services/api/snyk';
import { sonarqubeService, SonarQubeIntegrationRecord } from '@/services/api/sonarqube';
import { veracodeService, VeracodeIntegrationRecord } from '@/services/api/veracode';
import { checkmarxService, CheckmarxIntegrationRecord } from '@/services/api/checkmarx';
import { vaultService, VaultIntegrationRecord } from '@/services/api/vault';
import { secretsManagerService, SecretsManagerIntegrationRecord } from '@/services/api/secretsmanager';
import { certManagerService, CertManagerIntegrationRecord } from '@/services/api/certmanager';
import { oktaService, OktaIntegrationRecord } from '@/services/api/okta';
import { azureAdService, AzureAdIntegrationRecord } from '@/services/api/azuread';
import { jumpCloudService, JumpCloudIntegrationRecord } from '@/services/api/jumpcloud';
import { EngineerAIntegrationRecord } from '@/services/api/engineer-a-factory';
import { workspaceDirectoryService } from '@/services/api/workspace-directory';
import { oneLoginService } from '@/services/api/onelogin';
import { jamfService } from '@/services/api/jamf';
import { kandjiService } from '@/services/api/kandji';
import { intuneService } from '@/services/api/intune';
import { crowdstrikeService } from '@/services/api/crowdstrike';
import { workdayService } from '@/services/api/workday';
import { ripplingService } from '@/services/api/rippling';
import { hiBobService } from '@/services/api/hibob';

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

function GitHubCard({
  githubIntegration,
  repos,
  loading,
  onDisconnect,
  onToast,
}: {
  githubIntegration: Integration | null;
  repos: GitHubRepo[];
  loading: boolean;
  onDisconnect: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [showRepos, setShowRepos] = useState(false);
  const isConnected = !!githubIntegration;

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect GitHub? Evidence collection will stop.')) return;
    setDisconnecting(true);
    try {
      await integrationsService.disconnect();
      onDisconnect();
      onToast('success', 'GitHub disconnected');
    } catch {
      onToast('error', 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnect = () => {
    window.location.href = integrationsService.getConnectUrl();
  };

  return (
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
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-4">
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
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnect = async () => {
    try {
      const res = await notionService.getConnectUrl();
      window.location.href = res.url;
    } catch {
      onToast('error', 'Failed to get Notion connect URL');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Notion?')) return;
    setDisconnecting(true);
    try {
      await notionService.disconnect();
      onDisconnected();
      onToast('success', 'Notion disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Notion');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
            <NotionIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notion</h3>
            <p className="text-sm text-gray-500">Knowledge Base · Policies, procedures & wikis</p>
          </div>
        </div>
        <Badge variant={connected ? 'default' : 'outline'}>
          {loadingStatus ? 'Checking...' : connected ? 'Connected' : 'Available'}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Connect Notion to sync policies, procedures, and other documents to your ISMS.
      </p>

      {/* ISO control tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['A.5.9 Policies', 'A.5.10 Procedures', 'A.5.33 Documentation'].map((l) => (
          <span key={l} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200 font-medium">{l}</span>
        ))}
      </div>

      {connected && notionStatus && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          Connected to workspace <strong>{notionStatus.workspaceName}</strong>.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!loadingStatus && !connected && (
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800"
          >
            <NotionIcon className="w-4 h-4" />
            Connect Notion
          </button>
        )}
        {connected && (
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
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect New Relic?')) return;
    setDisconnecting(true);
    try {
      await newRelicService.disconnect();
      onDisconnected();
      onToast('success', 'New Relic disconnected');
    } catch {
      onToast('error', 'Failed to disconnect New Relic');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <NewRelicIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">New Relic</h3>
              <p className="text-sm text-gray-500">APM & Infrastructure · Logging & monitoring</p>
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : connected ? 'Connected' : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Connect New Relic to monitor application and infrastructure security, and to generate evidence for compliance.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.15 Logging', 'A.8.16 Monitoring', 'A.8.25 Secure SDLC'].map((l) => (
            <span key={l} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-medium">{l}</span>
          ))}
        </div>

        {connected && nrStatus && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            Connected to account <strong>{nrStatus.accountName}</strong>.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!loadingStatus && !connected && (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800"
            >
              <NewRelicIcon className="w-4 h-4" />
              Connect New Relic
            </button>
          )}
          {connected && (
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
      {showConnectModal && (
        <NewRelicConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(status) => { onConnected(status); setShowConnectModal(false); onToast('success', 'New Relic connected!'); }}
        />
      )}
    </>
  );
}

function NewRelicConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (status: NewRelicStatus) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !accountId.trim()) {
      setError('API Key and Account ID are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await newRelicService.connect({ apiKey, accountId });
      onConnected(res.data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to New Relic');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect New Relic</h2>
        <p className="text-sm text-gray-500 mb-4">Provide a User API Key and your Account ID.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
            <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="e.g. 1234567" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AC69]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="NRAK-..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00AC69]" required autoComplete="off" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#00AC69] hover:bg-[#009159] text-white">
            {loading ? 'Connecting…' : 'Connect New Relic'}
          </Button>
        </div>
      </form>
    </div>
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

// ─── Azure — Connect Modal ────────────────────────────────────────────────────

function AzureConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: AzureIntegrationRecord) => void;
}) {
  const [subscriptionId, setSubscriptionId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await azureService.connect({ subscriptionId: subscriptionId.trim(), tenantId: tenantId.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim(), label: label.trim() || undefined });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Azure. Check the credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Azure</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Azure service principal credentials to enable cloud security scanning.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Subscription ID *</label>
            <input type="text" value={subscriptionId} onChange={e => setSubscriptionId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tenant ID *</label>
            <input type="text" value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Client ID *</label>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="App registration client ID" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Client Secret *</label>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="App registration client secret" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Azure" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-md bg-[#0078D4] hover:bg-[#006bc0] text-white disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Azure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AzureCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: AzureIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: AzureIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await azureService.runScan(id); onToast('success', 'Azure scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Azure (${label ?? id})? Automated cloud security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await azureService.disconnect(id); onAccountRemoved(id); onToast('success', 'Azure disconnected'); }
    catch { onToast('error', 'Failed to disconnect Azure'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0078D4] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 2L6 13.5h5.25L8.25 22 22 8.5H16.5L20.25 2z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Microsoft Azure</h3>
              <p className="text-sm text-gray-500">Cloud Security · Defender for Cloud &amp; NSG analysis</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} subscription${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Scan Azure subscriptions for security recommendations from Defender for Cloud, NSG exposure, encryption gaps, and IAM issues. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.15 IAM', 'A.8.15 Audit Logging', 'A.8.9 Misconfigs', 'A.8.24 Encryption', 'A.8.20 Network'].map((l) => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.subscriptionId}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0078D4] hover:bg-[#006bc0] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Subscription' : 'Connect Azure'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <AzureConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Azure connected! 5 automated cloud security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}

// ─── Wiz — Connect Modal ──────────────────────────────────────────────────────

function WizConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: WizIntegrationRecord) => void;
}) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [wizApiEndpoint, setWizApiEndpoint] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await wizService.connect({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), wizApiEndpoint: wizApiEndpoint.trim() || undefined, label: label.trim() || undefined });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Wiz. Check the client credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Wiz</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Wiz Service Account credentials to enable CSPM scanning.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Client ID *</label>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Wiz service account client ID" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Client Secret *</label>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Wiz service account client secret" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">API Endpoint (optional)</label>
            <input type="text" value={wizApiEndpoint} onChange={e => setWizApiEndpoint(e.target.value)} placeholder="https://api.app.wiz.io/graphql" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Wiz" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-md bg-[#3B1FDB] hover:bg-[#2e18b0] text-white disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Wiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WizCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: WizIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: WizIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await wizService.runScan(id); onToast('success', 'Wiz scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Wiz (${label ?? id})? Automated cloud security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await wizService.disconnect(id); onAccountRemoved(id); onToast('success', 'Wiz disconnected'); }
    catch { onToast('error', 'Failed to disconnect Wiz'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B1FDB] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 9l8 4 8-4-8-7zM4 15l8 7 8-7-8-4-8 4z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wiz</h3>
              <p className="text-sm text-gray-500">CSPM · Multi-cloud security posture management</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} tenant${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Pull open Wiz issues across your cloud environments to monitor IAM posture, misconfiguration risks, encryption gaps, and network exposure. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.15 IAM', 'A.8.15 Audit Logging', 'A.8.9 Misconfigs', 'A.8.24 Encryption', 'A.8.20 Network'].map((l) => (
            <span key={l} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? 'Wiz Tenant'}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#3B1FDB] hover:bg-[#2e18b0] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Tenant' : 'Connect Wiz'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <WizConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Wiz connected! 5 automated cloud security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}

// ─── Lacework — Connect Modal ─────────────────────────────────────────────────

function LaceworkConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: LaceworkIntegrationRecord) => void;
}) {
  const [accountName, setAccountName] = useState('');
  const [keyId, setKeyId] = useState('');
  const [secret, setSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await laceworkService.connect({ accountName: accountName.trim(), keyId: keyId.trim(), secret: secret.trim(), label: label.trim() || undefined });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Lacework. Check the credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Lacework</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Lacework API credentials to enable compliance scanning.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Account Name *</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="e.g. mycompany (subdomain before .lacework.net)" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Key ID *</label>
            <input type="text" value={keyId} onChange={e => setKeyId(e.target.value)} placeholder="API key ID" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Secret *</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="API key secret" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Lacework" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-md bg-[#2B8ACB] hover:bg-[#2274b0] text-white disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Lacework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LaceworkCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: LaceworkIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: LaceworkIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await laceworkService.runScan(id); onToast('success', 'Lacework scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Lacework (${label ?? id})? Automated cloud security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await laceworkService.disconnect(id); onAccountRemoved(id); onToast('success', 'Lacework disconnected'); }
    catch { onToast('error', 'Failed to disconnect Lacework'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2B8ACB] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lacework</h3>
              <p className="text-sm text-gray-500">Cloud Security · Compliance &amp; threat detection</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Pull Lacework compliance evaluations and alerts to track IAM posture, audit logging, encryption, and network security across your cloud infrastructure. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.15 IAM', 'A.8.15 Audit Logging', 'A.8.9 Misconfigs', 'A.8.24 Encryption', 'A.8.20 Network'].map((l) => (
            <span key={l} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full border border-cyan-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.accountName}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#2B8ACB] hover:bg-[#2274b0] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect Lacework'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <LaceworkConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Lacework connected! 5 automated cloud security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}

// ─── Snyk — Connect Modal ─────────────────────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Snyk. Check the org ID and API token.');
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

function SnykCard({
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

// ─── SonarQube — Connect Modal ────────────────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to SonarQube. Check the instance URL and token.');
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

function SonarQubeCard({
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

// ─── Veracode — Connect Modal ─────────────────────────────────────────────────

function VeracodeConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: VeracodeIntegrationRecord) => void;
}) {
  const [apiId, setApiId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await veracodeService.connect({ apiId: apiId.trim(), apiKey: apiKey.trim(), label: label.trim() || undefined });
      onConnected(res.data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Veracode. Check the API ID and key.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect Veracode</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Veracode API credentials to enable application security scanning.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API ID</label>
            <input type="text" value={apiId} onChange={e => setApiId(e.target.value)} placeholder="Veracode API ID" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Veracode API Key" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Veracode" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#E87722] hover:bg-[#c96314] text-white">
            {loading ? 'Connecting…' : 'Connect Veracode'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function VeracodeCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: VeracodeIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: VeracodeIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await veracodeService.runScan(id); onToast('success', 'Veracode scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Veracode (${label ?? id})? Automated code security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await veracodeService.disconnect(id); onAccountRemoved(id); onToast('success', 'Veracode disconnected'); }
    catch { onToast('error', 'Failed to disconnect Veracode'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E87722] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Veracode</h3>
              <p className="text-sm text-gray-500">Code Security · Application security testing</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connect Veracode to pull SAST, DAST, and SCA findings from your application security scans. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.25 No Critical CVEs', 'A.8.31 OSS Dependencies', 'A.8.29 Quality Gate', 'A.8.28 Secrets Review', 'A.8.8 Remediation SLA'].map((l) => (
            <span key={l} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.id}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#E87722] hover:bg-[#c96314] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect Veracode'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <VeracodeConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Veracode connected! 5 automated code security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}

// ─── Checkmarx — Connect Modal ────────────────────────────────────────────────

function CheckmarxConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: CheckmarxIntegrationRecord) => void;
}) {
  const [instanceUrl, setInstanceUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await checkmarxService.connect({ instanceUrl: instanceUrl.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim(), label: label.trim() || undefined });
      onConnected(res.data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Checkmarx. Check the instance URL and credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect Checkmarx</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Checkmarx One instance URL and OAuth2 credentials to enable SAST scanning.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance URL</label>
            <input type="url" value={instanceUrl} onChange={e => setInstanceUrl(e.target.value)} placeholder="https://your-tenant.checkmarx.net" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="OAuth2 Client ID" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="OAuth2 Client Secret" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Checkmarx" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#FF6B35] hover:bg-[#e0551f] text-white">
            {loading ? 'Connecting…' : 'Connect Checkmarx'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CheckmarxCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: CheckmarxIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: CheckmarxIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await checkmarxService.runScan(id); onToast('success', 'Checkmarx scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Checkmarx (${label ?? id})? Automated code security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await checkmarxService.disconnect(id); onAccountRemoved(id); onToast('success', 'Checkmarx disconnected'); }
    catch { onToast('error', 'Failed to disconnect Checkmarx'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Checkmarx</h3>
              <p className="text-sm text-gray-500">Code Security · SAST scanning</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connect Checkmarx One to run SAST scans and pull security findings across your application repositories. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.25 No Critical CVEs', 'A.8.31 OSS Dependencies', 'A.8.29 Quality Gate', 'A.8.28 Secrets Review', 'A.8.8 Remediation SLA'].map((l) => (
            <span key={l} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100 font-medium">{l}</span>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF6B35] hover:bg-[#e0551f] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect Checkmarx'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <CheckmarxConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Checkmarx connected! 5 automated code security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}

// ─── Vault — Connect Modal ────────────────────────────────────────────────────

function VaultConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: VaultIntegrationRecord) => void;
}) {
  const [vaultAddr, setVaultAddr] = useState('');
  const [token, setToken] = useState('');
  const [namespace, setNamespace] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await vaultService.connect({ vaultAddr: vaultAddr.trim(), token: token.trim(), namespace: namespace.trim() || undefined, label: label.trim() || undefined });
      onConnected(res.data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Vault. Check the address and token.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-1">Connect HashiCorp Vault</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Vault address and a token with list/read permissions on your KV secrets engine.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vault Address</label>
            <input type="url" value={vaultAddr} onChange={e => setVaultAddr(e.target.value)} placeholder="https://vault.example.com" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vault Token</label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="hvs.XXXXXXXXXXXX" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono" required autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Namespace <span className="text-gray-400 font-normal">(optional — Vault Enterprise)</span></label>
            <input type="text" value={namespace} onChange={e => setNamespace(e.target.value)} placeholder="admin/team" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Vault" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#1C1C1C] hover:bg-black text-white">
            {loading ? 'Connecting…' : 'Connect Vault'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function VaultCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: VaultIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: VaultIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await vaultService.runScan(id); onToast('success', 'Vault scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Vault (${label ?? id})? Automated secrets tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await vaultService.disconnect(id); onAccountRemoved(id); onToast('success', 'Vault disconnected'); }
    catch { onToast('error', 'Failed to disconnect Vault'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93C9.33 17.79 7 14.5 7 11V7.18L12 5z" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">HashiCorp Vault</h3>
              <p className="text-sm text-gray-500">Secrets Management · KV secrets &amp; rotation</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connect HashiCorp Vault to verify secrets are stored in an approved manager, rotation policies are met, and audit logging is enabled. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.24 Secrets Storage', 'A.8.24 Rotation Policy', 'A.8.15 Audit Logging', 'A.8.25 No Plaintext', 'A.5.14 Certificates'].map((l) => (
            <span key={l} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.vaultAddr}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.vaultAddr}
                {account.namespace && ` · ns: ${account.namespace}`}
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1C1C1C] hover:bg-black text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Instance' : 'Connect Vault'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <VaultConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'HashiCorp Vault connected! 5 automated secrets tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}

// ─── AWS Secrets Manager — Connect Modal ──────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to AWS Secrets Manager. Check your region and credentials.');
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

function SecretsManagerCard({
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
    if (!window.confirm(`Disconnect AWS Secrets Manager (${label ?? id})? Automated secrets tests will stop running.`)) return;
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
        <p className="text-sm text-gray-600 mb-4">
          Connect AWS Secrets Manager to audit secret rotation, expiry, and audit logging. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.24 Secrets Storage', 'A.8.24 Rotation Policy', 'A.8.15 Audit Logging', 'A.8.25 No Plaintext', 'A.5.14 Certificates'].map((l) => (
            <span key={l} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100 font-medium">{l}</span>
          ))}
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

// ─── Certificate Manager — Connect Modal ──────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect Certificate Manager. Check the credentials.');
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

function CertManagerCard({
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
    if (!window.confirm(`Disconnect Certificate Manager (${label ?? id})? Automated certificate tests will stop running.`)) return;
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
        <p className="text-sm text-gray-600 mb-4">
          Connect AWS ACM or a generic certificate manager to detect expired or soon-to-expire TLS/SSL certificates. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.14 No Expired Certs', 'A.8.24 Secrets Storage', 'A.8.24 Rotation Policy', 'A.8.15 Audit Logging', 'A.8.25 No Plaintext'].map((l) => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
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

// ─── Static cards (coming soon) ───────────────────────────────────────────────

const STATIC_INTEGRATIONS: { name: string; category: string; description: string }[] = [];

type EngineerACardConfig = {
  key: string;
  name: string;
  category: string;
  description: string;
  service: {
    getAccounts: () => Promise<{ success: boolean; data: EngineerAIntegrationRecord[] }>;
    connect: (payload: { apiKey: string; accountId?: string; tenant?: string; baseUrl?: string; region?: string; label?: string }) => Promise<{ success: boolean; data: EngineerAIntegrationRecord }>;
    disconnect: (integrationId: string) => Promise<{ success: boolean }>;
    runScan: (integrationId: string) => Promise<{ success: boolean; jobId: string; status: string }>;
  };
};

// ─── Restored card components ────────────────────────────────────────────────

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

// ─── Google Workspace — Connect Modal ─────────────────────────────────────────

function WorkspaceConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: WorkspaceIntegrationRecord) => void;
}) {
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceAccountJson.trim() || !adminEmail.trim()) {
      setError('Service Account JSON and Admin Email are required');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await workspaceService.connect({
        serviceAccountJson: serviceAccountJson.trim(),
        adminEmail: adminEmail.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        const accountsRes = await workspaceService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(a => a.domain === res.data.domain);
        if (newAccount) onConnected(newAccount);
        else onConnected({
          id: res.data.id,
          domain: res.data.domain,
          adminEmail: res.data.adminEmail,
          label: res.data.label,
          status: res.data.status,
          lastScanAt: null,
          createdAt: res.data.createdAt,
          users: [],
          findings: [],
        });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check service account key, admin email, and domain-wide delegation scopes');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 my-4">
        <h2 className="text-lg font-semibold mb-1">Connect Google Workspace</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create a service account with Domain-Wide Delegation in{' '}
          <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Google Cloud Console
          </a>{' '}
          and grant the following scopes in your Workspace Admin console:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-xs font-mono text-gray-700 space-y-1">
          <p>https://www.googleapis.com/auth/admin.directory.user.readonly</p>
          <p>https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly</p>
          <p>https://www.googleapis.com/auth/admin.reports.audit.readonly</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Account Key JSON
            </label>
            <textarea
              value={serviceAccountJson}
              onChange={e => setServiceAccountJson(e.target.value)}
              placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  "client_email": "isms@project.iam.gserviceaccount.com",\n  ...\n}'}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Super Admin Email <span className="text-gray-400 font-normal">(impersonated for API calls)</span>
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder="e.g. Production Workspace"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Connect Workspace'}
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

// ─── Google Workspace — full card ──────────────────────────────────────────────

function WorkspaceCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: WorkspaceIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: WorkspaceIntegrationRecord) => void;
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
      await workspaceService.runScan(integrationId);
      onToast('success', 'Google Workspace scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(integrationId: string, label: string | null, domain: string) {
    if (!window.confirm(`Disconnect Google Workspace${label ? ` (${label})` : ` (${domain})`}? Automated identity tests will stop running.`)) return;
    setDisconnectingId(integrationId);
    try {
      await workspaceService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', 'Google Workspace disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Google Workspace');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <GoogleWorkspaceIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Workspace</h3>
              <p className="text-sm text-gray-500">Identity &amp; Access · User lifecycle &amp; MFA compliance</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically collect ISO 27001 identity-governance evidence from Google Workspace — verify MFA
          enforcement, super admin count, inactive accounts, terminated employees, suspended user activity,
          and organisational unit assignment. All 6 results appear in the Tests page.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.17 MFA', 'A.5.15 Admin Access', 'A.8.9 Inactive Users', 'A.5.15 Terminated Employees'].map((l) => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected accounts */}
        {isConnected && accounts.map(account => {
          const activeUsers = account.users.filter(u => !u.isSuspended).length;
          const totalUsers = account.users.length;
          const mfaEnabled = account.users.filter(u => u.mfaEnabled && !u.isSuspended).length;
          const openFindings = account.findings.filter(f => f.severity === 'HIGH').length;
          return (
            <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{account.label ?? account.domain}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.domain}
                  {totalUsers > 0 && ` · ${activeUsers} active / ${totalUsers} users`}
                  {totalUsers > 0 && ` · ${mfaEnabled} MFA`}
                  {openFindings > 0 && ` · ${openFindings} HIGH finding${openFindings !== 1 ? 's' : ''}`}
                  {account.lastScanAt && ` · Last scan: ${new Date(account.lastScanAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                  {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label, account.domain)} disabled={disconnectingId === account.id}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              <GoogleWorkspaceIcon className="w-4 h-4" />
              {isConnected ? '+ Add Workspace Domain' : 'Connect Google Workspace'}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <WorkspaceConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', 'Google Workspace connected! 6 automated identity tests are being seeded.');
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

// ─── Fleet — Connect Modal ────────────────────────────────────────────────────

function FleetConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: FleetIntegrationRecord) => void;
}) {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!baseUrl.trim() || !apiToken.trim()) { setError('Fleet URL and API Token are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fleetService.connect({ baseUrl: baseUrl.trim(), apiToken: apiToken.trim(), label: label.trim() || undefined });
      if (res.success) {
        const accountsRes = await fleetService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(a => a.baseUrl === baseUrl.trim().replace(/\/$/, ''));
        if (newAccount) onConnected(newAccount);
        else onConnected({ id: res.data.id, baseUrl: res.data.baseUrl, label: res.data.label, status: res.data.status, lastScanAt: null, createdAt: res.data.createdAt, hosts: [], findings: [] });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your Fleet URL and API token');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 my-4">
        <h2 className="text-lg font-semibold mb-1">Connect Fleet</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your Fleet server URL and a read-only API token. Generate a token in{' '}
          <strong>Fleet → Settings → Integrations → API Tokens</strong> or using the Fleet CLI:{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">fleetctl login</code>.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fleet Server URL <span className="text-gray-400 font-normal">(e.g. https://fleet.company.com)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://fleet.company.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192147]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Token <span className="text-gray-400 font-normal">(read-only)</span>
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder="Fleet API token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192147] font-mono"
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
              placeholder="e.g. Production Fleet"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192147]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#192147] hover:bg-[#0f1833] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Connect Fleet'}
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

// ─── Fleet — full card ────────────────────────────────────────────────────────

function FleetCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: FleetIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: FleetIntegrationRecord) => void;
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
      await fleetService.runScan(integrationId);
      onToast('success', 'Fleet scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(integrationId: string, label: string | null, baseUrl: string) {
    if (!window.confirm(`Disconnect Fleet${label ? ` (${label})` : ` (${baseUrl})`}? Automated endpoint tests will stop running.`)) return;
    setDisconnectingId(integrationId);
    try {
      await fleetService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', 'Fleet disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Fleet');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <FleetIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fleet</h3>
              <p className="text-sm text-gray-500">Endpoint · Device posture &amp; policy compliance</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically collect ISO 27001 endpoint-compliance evidence from Fleet — verify disk encryption,
          MDM enrollment, OS version baselines, stale device detection, osquery policy results, and asset
          inventory completeness. All 6 results appear in the Tests page.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.24 Disk Encryption', 'A.8.1 MDM Enrollment', 'A.5.9 Asset Inventory', 'A.8.8 OS Patching', 'A.8.9 Policy Compliance'].map((l) => (
            <span key={l} className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded-full border border-slate-200 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected instances */}
        {isConnected && accounts.map(account => {
          const totalHosts = account.hosts.length;
          const encryptedCount = account.hosts.filter(h => h.diskEncrypted === true).length;
          const mdmCount = account.hosts.filter(h => h.mdmEnrolled === true).length;
          const openFindings = account.findings.filter(f => f.severity === 'HIGH').length;
          return (
            <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{account.label ?? account.baseUrl}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {account.baseUrl}
                  {totalHosts > 0 && ` · ${totalHosts} host${totalHosts !== 1 ? 's' : ''}`}
                  {totalHosts > 0 && ` · ${encryptedCount} encrypted`}
                  {totalHosts > 0 && ` · ${mdmCount} MDM`}
                  {openFindings > 0 && ` · ${openFindings} HIGH finding${openFindings !== 1 ? 's' : ''}`}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#192147] hover:bg-[#0f1833] text-white text-sm font-medium"
            >
              <FleetIcon className="w-4 h-4" />
              {isConnected ? '+ Add Fleet Instance' : 'Connect Fleet'}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <FleetConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', 'Fleet connected! 6 automated endpoint tests are being seeded.');
          }}
        />
      )}
    </>
  );
}

// ─── Intercom — full card ─────────────────────────────────────────────────────

function IntercomCard({
  accounts,
  loadingStatus,
  onAccountRemoved,
  onToast,
}: {
  accounts: IntercomIntegrationRecord[];
  loadingStatus: boolean;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await intercomService.runScan(integrationId);
      onToast('success', 'Intercom scan started — results will appear in tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleSync(integrationId: string) {
    setSyncingId(integrationId);
    try {
      const res = await intercomService.sync(integrationId);
      onToast('success', `Synced ${(res as any).synced ?? 0} conversation(s)`);
    } catch {
      onToast('error', 'Failed to sync conversations');
    } finally { setSyncingId(null); }
  }

  async function handleDisconnect(integrationId: string, workspaceName: string | null) {
    if (!window.confirm(`Disconnect Intercom${workspaceName ? ` (${workspaceName})` : ''}? Automated Policy tests will stop running.`)) return;
    setDisconnectingId(integrationId);
    try {
      await intercomService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', 'Intercom disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Intercom');
    } finally { setDisconnectingId(null); }
  }

  function handleConnect() {
    // Redirect to backend OAuth initiation endpoint (which requires auth header via cookie won't work)
    // Instead, navigate with the token in the URL via a redirect handled by the backend
    window.location.href = intercomService.getConnectUrl();
  }

  return (
    <Card className="p-6 md:col-span-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
            <IntercomIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Intercom</h3>
            <p className="text-sm text-gray-500">Customer Support · Trust request &amp; findings tracking</p>
          </div>
        </div>
        <Badge variant={isConnected ? 'default' : 'outline'}>
          {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} workspace${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Automatically track security requests via Intercom conversations — monitor SLA compliance for
        trust centre requests, triage times, and audit finding acknowledgements. All 3 results appear in the Tests page.
      </p>

      {/* ISO control tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['A.5.30 Availability', 'A.5.24 Incident Mgmt', 'SLA Tracking', 'Trust Requests'].map((l) => (
          <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
        ))}
      </div>

      {/* Connected workspace rows */}
      {isConnected && accounts.map(account => (
        <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{account.workspaceName ?? account.workspaceId}</p>
            <p className="text-xs text-gray-400 font-mono">
              {account.ticketCount} ticket{account.ticketCount !== 1 ? 's' : ''}
              {' · '}{account.openConversations} open
              {account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
              {scanningId === account.id ? 'Scanning…' : 'Scan Now'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSync(account.id)} disabled={syncingId === account.id}>
              {syncingId === account.id ? 'Syncing…' : 'Sync'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.workspaceName)} disabled={disconnectingId === account.id}
              className="text-red-600 border-red-200 hover:bg-red-50">
              {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        </div>
      ))}

      {/* Action button */}
      <div className="flex flex-wrap gap-2">
        {!loadingStatus && (
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1F8DED] hover:bg-[#1a7acb] text-white text-sm font-medium"
          >
            <IntercomIcon className="w-4 h-4" />
            {isConnected ? '+ Connect Another Workspace' : 'Connect Intercom'}
          </button>
        )}
      </div>
    </Card>
  );
}

// ─── BigID — Connect Modal ────────────────────────────────────────────────────

function BigIdConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: BigIdIntegrationRecord) => void;
}) {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!baseUrl.trim() || !apiToken.trim()) { setError('Base URL and API token are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await bigIdService.connect({ baseUrl: baseUrl.trim(), apiToken: apiToken.trim(), label: label.trim() || undefined });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to BigID. Check the URL and API token.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect BigID</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your BigID base URL and API token to begin data discovery compliance scanning.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://your-bigid-instance.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder="Bearer token from BigID Settings"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Production BigID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Connect BigID'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── BigID — full card ────────────────────────────────────────────────────────

function BigIdCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: BigIdIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: BigIdIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await bigIdService.runScan(integrationId);
      onToast('success', 'BigID scan started — results will appear in Tests shortly');
    } catch {
      onToast('error', 'Failed to start scan');
    } finally { setScanningId(null); }
  }

  async function handleDisconnect(integrationId: string, label: string | null, baseUrl: string) {
    const name = label ?? baseUrl;
    if (!window.confirm(`Disconnect BigID (${name})? Automated data-privacy tests will stop running.`)) return;
    setDisconnectingId(integrationId);
    try {
      await bigIdService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', 'BigID disconnected');
    } catch {
      onToast('error', 'Failed to disconnect BigID');
    } finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A2B6D] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="white">
                <path d="M4 8h24v3H4zM4 14.5h16v3H4zM4 21h20v3H4z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">BigID</h3>
              <p className="text-sm text-gray-500">Data Privacy · PII/PCI/PHI discovery &amp; classification</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically discover and classify sensitive data (PII, PCI, PHI) across your data sources.
          Monitor data inventory, scan SLA compliance, and ensure all data assets have assigned owners.
          All 5 results appear in the Tests page.
        </p>

        {/* ISO control tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.9 Data Inventory', 'A.5.12 Classification', 'A.5.34 PII Protection', 'A.8.16 Monitoring'].map((l) => (
            <span key={l} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected instance rows */}
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.baseUrl}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.dataSourceCount} data source{account.dataSourceCount !== 1 ? 's' : ''}
                {account.latestSummary && ` · ${account.latestSummary.piiCount.toLocaleString()} PII records`}
                {account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Scan Now'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(account.id, account.label, account.baseUrl)}
                disabled={disconnectingId === account.id}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1A2B6D] hover:bg-[#14225a] text-white text-sm font-medium"
            >
              {isConnected ? '+ Connect Another Instance' : 'Connect BigID'}
            </button>
          )}
        </div>
      </Card>

      {showConnectModal && (
        <BigIdConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', 'BigID connected! 5 automated data-privacy tests are being seeded.');
          }}
        />
      )}
    </>
  );
}

// ─── PagerDuty — Connect Modal ────────────────────────────────────────────────

function PagerDutyConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: PagerDutyIntegrationRecord) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [slaHours, setSlaHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) { setError('API key is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await pagerdutyService.connect({ apiKey: apiKey.trim(), label: label.trim() || undefined, slaHours: Number(slaHours) || 4 });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to PagerDuty. Check the API key.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect PagerDuty</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your PagerDuty API key (User or Account API key) to start incident compliance scanning.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="y_NbAkKc66ryYTWUXYEu" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SLA Hours <span className="text-gray-400 font-normal">(acknowledgement target)</span></label>
            <input type="number" min="1" max="72" value={slaHours} onChange={e => setSlaHours(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production PagerDuty" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect PagerDuty'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PagerDutyCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: PagerDutyIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: PagerDutyIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await pagerdutyService.runScan(id); onToast('success', 'PagerDuty scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect PagerDuty (${label ?? id})? Automated incident tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await pagerdutyService.disconnect(id); onAccountRemoved(id); onToast('success', 'PagerDuty disconnected'); }
    catch { onToast('error', 'Failed to disconnect PagerDuty'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#06AC38] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 4h-6v10h6c2.8 0 5-2.2 5-5s-2.2-5-5-5zM12 16v12h4v-8h2c4.4 0 8-3.6 8-8s-3.6-8-8-8h-6v12z" fill="white"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">PagerDuty</h3>
              <p className="text-sm text-gray-500">Incident Management · On-call &amp; escalation policies</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Monitor incident response SLAs, track open incidents, and verify on-call escalation policies against ISO 27001 A.5.24–A.5.27 controls. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.24 Incident Planning', 'A.5.25 Event Assessment', 'A.5.26 Incident Response', 'A.5.27 RCA Learning'].map((l) => (
            <span key={l} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? `PagerDuty Account`}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#06AC38] hover:bg-[#058f2e] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect PagerDuty'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <PagerDutyConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'PagerDuty connected! 5 automated incident tests are being seeded.'); }}
        />
      )}
    </>
  );
}

// ─── Opsgenie — Connect Modal ─────────────────────────────────────────────────

function OpsgenieConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: OpsgenieIntegrationRecord) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState('us');
  const [label, setLabel] = useState('');
  const [slaHours, setSlaHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) { setError('API key is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await opsgenieService.connect({ apiKey: apiKey.trim(), region, label: label.trim() || undefined, slaHours: Number(slaHours) || 4 });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Opsgenie. Check the API key.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Opsgenie</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your Opsgenie API key to start alert compliance scanning.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="us">US</option>
              <option value="eu">EU</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SLA Hours <span className="text-gray-400 font-normal">(acknowledgement target)</span></label>
            <input type="number" min="1" max="72" value={slaHours} onChange={e => setSlaHours(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Opsgenie" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Opsgenie'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OpsgenieCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: OpsgenieIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: OpsgenieIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await opsgenieService.runScan(id); onToast('success', 'Opsgenie scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Opsgenie (${label ?? id})? Automated incident tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await opsgenieService.disconnect(id); onAccountRemoved(id); onToast('success', 'Opsgenie disconnected'); }
    catch { onToast('error', 'Failed to disconnect Opsgenie'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D6AE7] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
                <path d="M16 8a8 8 0 1 0 0 16A8 8 0 0 0 16 8zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" fill="#2D6AE7"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Opsgenie</h3>
              <p className="text-sm text-gray-500">Alert Management · On-call schedules &amp; SLA tracking</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Track alert response SLAs, verify on-call schedule coverage, and ensure critical alerts are actively managed. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.24 Incident Planning', 'A.5.25 Event Assessment', 'A.5.26 Incident Response', 'A.5.27 RCA Learning'].map((l) => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? `Opsgenie (${account.region.toUpperCase()})`}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.incidentCount} alert{account.incidentCount !== 1 ? 's' : ''}
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#2D6AE7] hover:bg-[#2158c4] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Account' : 'Connect Opsgenie'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <OpsgenieConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Opsgenie connected! 5 automated incident tests are being seeded.'); }}
        />
      )}
    </>
  );
}

// ─── ServiceNow Incident — Connect Modal ──────────────────────────────────────

function ServiceNowConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: ServiceNowIntegrationRecord) => void;
}) {
  const [instanceUrl, setInstanceUrl] = useState('');
  const [authMethod, setAuthMethod] = useState('basic');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [slaHours, setSlaHours] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!instanceUrl.trim()) { setError('Instance URL is required'); return; }
    setLoading(true); setError('');
    try {
      const payload: any = { instanceUrl: instanceUrl.trim(), authMethod, label: label.trim() || undefined, slaHours: Number(slaHours) || 4 };
      if (authMethod === 'token') payload.token = token;
      else { payload.username = username; payload.password = password; }
      const res = await servicenowIncidentService.connect(payload);
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to ServiceNow. Check credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-1">Connect ServiceNow</h2>
        <p className="text-sm text-gray-500 mb-4">Connect your ServiceNow instance to track incident compliance.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance URL</label>
            <input type="url" value={instanceUrl} onChange={e => setInstanceUrl(e.target.value)} placeholder="https://yourinstance.service-now.com" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auth Method</label>
            <select value={authMethod} onChange={e => setAuthMethod(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="basic">Basic (username/password)</option>
              <option value="token">Bearer Token</option>
            </select>
          </div>
          {authMethod === 'basic' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
              <input type="password" value={token} onChange={e => setToken(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SLA Hours <span className="text-gray-400 font-normal">(acknowledgement target)</span></label>
            <input type="number" min="1" max="72" value={slaHours} onChange={e => setSlaHours(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production ServiceNow" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect ServiceNow'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ServiceNowIncidentCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: ServiceNowIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: ServiceNowIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await servicenowIncidentService.runScan(id); onToast('success', 'ServiceNow scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null, instanceUrl: string) {
    const name = label ?? instanceUrl;
    if (!window.confirm(`Disconnect ServiceNow (${name})? Automated incident tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await servicenowIncidentService.disconnect(id); onAccountRemoved(id); onToast('success', 'ServiceNow disconnected'); }
    catch { onToast('error', 'Failed to disconnect ServiceNow'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#81B5A1] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8h24v4H4zM4 14h18v4H4zM4 20h20v4H4z" fill="white"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ServiceNow</h3>
              <p className="text-sm text-gray-500">Incident Management · ITSM &amp; SLA compliance</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} instance${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Sync incidents from ServiceNow, monitor SLA compliance, and verify that critical incidents have resolution notes. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.24 Incident Planning', 'A.5.25 Event Assessment', 'A.5.26 Incident Response', 'A.5.27 RCA Learning'].map((l) => (
            <span key={l} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.instanceUrl}</p>
              <p className="text-xs text-gray-400 font-mono">
                {account.incidentCount} incident{account.incidentCount !== 1 ? 's' : ''}
                {account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Scan Now'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label, account.instanceUrl)} disabled={disconnectingId === account.id} className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#62A0A0] hover:bg-[#4f8686] text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Instance' : 'Connect ServiceNow'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <ServiceNowConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'ServiceNow connected! 5 automated incident tests are being seeded.'); }}
        />
      )}
    </>
  );
}

// ─── Datadog Incidents — Connect Modal ────────────────────────────────────────

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to Datadog. Check credentials.');
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

function DatadogIncidentsCard({
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
    if (!window.confirm(`Disconnect Datadog (${label ?? id})? Automated incident tests will stop running.`)) return;
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
        <p className="text-sm text-gray-600 mb-4">
          Monitor Datadog incident response, track SEV-1/SEV-2 SLA compliance, and verify postmortem coverage for critical incidents. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.24 Incident Planning', 'A.5.25 Event Assessment', 'A.5.26 Incident Response', 'A.5.27 RCA Learning'].map((l) => (
            <span key={l} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 font-medium">{l}</span>
          ))}
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

// ─── GCP — Connect Modal ──────────────────────────────────────────────────────

function GcpConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: GcpIntegrationRecord) => void;
}) {
  const [keyJson, setKeyJson] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await gcpService.connect({ keyJson: keyJson.trim(), label: label.trim() || undefined });
      onConnected(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect to GCP. Check the service account key.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-1">Connect GCP</h2>
        <p className="text-sm text-gray-500 mb-4">Paste your GCP Service Account key JSON to enable cloud security scanning.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production GCP" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Service Account Key JSON *</label>
            <textarea value={keyJson} onChange={e => setKeyJson(e.target.value)} placeholder='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}' rows={6} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-md bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect GCP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GcpCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: GcpIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: GcpIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await gcpService.runScan(id); onToast('success', 'GCP scan started — results will appear in Tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect GCP (${label ?? id})? Automated cloud security tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await gcpService.disconnect(id); onAccountRemoved(id); onToast('success', 'GCP disconnected'); }
    catch { onToast('error', 'Failed to disconnect GCP'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6.5l3 5.2-3 5.2-3-5.2z" fill="#EA4335"/>
                <path d="M6.5 17.5h11L15 12.5l-3 5.2-3-5.2z" fill="#FBBC05"/>
                <path d="M15 12.5l2.5-4.5H6.5L9 12.5z" fill="#4285F4"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Cloud (GCP)</h3>
              <p className="text-sm text-gray-500">Cloud Security · IAM, logging &amp; misconfigurations</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} project${accounts.length !== 1 ? 's' : ''} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Scan GCP projects for IAM misconfigurations, audit logging gaps, encryption coverage, and network exposure using Security Command Center. All 5 results appear in the Tests page.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.5.15 IAM', 'A.8.15 Audit Logging', 'A.8.9 Misconfigs', 'A.8.24 Encryption', 'A.8.20 Network'].map((l) => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.projectId}</p>
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
            <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium">
              {isConnected ? '+ Connect Another Project' : 'Connect GCP'}
            </button>
          )}
        </div>
      </Card>
      {showConnectModal && (
        <GcpConnectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'GCP connected! 5 automated cloud security tests are being seeded.'); setShowConnectModal(false); }}
        />
      )}
    </>
  );
}


const ENGINEER_A_CARDS: EngineerACardConfig[] = [
  { key: 'workspace-directory', name: 'Google Workspace Directory', category: 'Identity', description: 'Directory posture, admin controls, and account lifecycle checks.', service: workspaceDirectoryService as any },
  { key: 'onelogin', name: 'OneLogin', category: 'Identity', description: 'Identity and SSO governance checks for OneLogin tenants.', service: oneLoginService as any },
  { key: 'jamf', name: 'Jamf Pro', category: 'Endpoint / MDM', description: 'macOS fleet security baseline and endpoint policy coverage.', service: jamfService as any },
  { key: 'kandji', name: 'Kandji', category: 'Endpoint / MDM', description: 'Device posture controls and compliance blueprint monitoring.', service: kandjiService as any },
  { key: 'intune', name: 'Microsoft Intune', category: 'Endpoint / MDM', description: 'Windows and mobile compliance baseline verification.', service: intuneService as any },
  { key: 'crowdstrike', name: 'CrowdStrike Falcon', category: 'Endpoint Security', description: 'EDR coverage, detections, and host hygiene posture checks.', service: crowdstrikeService as any },
  { key: 'workday', name: 'Workday', category: 'HRIS', description: 'Employee lifecycle sync and HR access governance checks.', service: workdayService as any },
  { key: 'rippling', name: 'Rippling', category: 'HRIS', description: 'Onboarding/offboarding and HR data governance controls.', service: ripplingService as any },
  { key: 'hibob', name: 'HiBob', category: 'HRIS', description: 'People operations lifecycle and privacy controls.', service: hiBobService as any },
];

function EngineerAIntegrationCard({
  config,
  loading,
  onToast,
  activeTab,
  onConnectionCountChange,
}: {
  config: EngineerACardConfig;
  loading: boolean;
  onToast: (type: 'success' | 'error', msg: string) => void;
  activeTab: 'connected' | 'available';
  onConnectionCountChange: (count: number) => void;
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
  }, []);

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
      setShowConnect(false);
      setApiKey('');
      setAccountId('');
      setTenant('');
      setBaseUrl('');
      setLabel('');
      await load();
      onToast('success', `${config.name} connected`);
    } catch (error: any) {
      onToast('error', error?.message ?? `Failed to connect ${config.name}`);
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
      onToast('success', `${config.name} scan queued — results will appear in tests shortly`);
    } catch {
      onToast('error', `Failed to queue ${config.name} scan`);
    } finally {
      setScanningId(null);
    }
  }

  const visible = activeTab === 'connected' ? connected : !connected;
  if (!visible) return null;

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <span className="text-sm font-bold text-gray-600">
                {config.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
              <p className="text-sm text-gray-500">{config.category}</p>
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'outline'}>
            {loading ? 'Checking...' : connected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">{config.description}</p>

        {/* ISO control tags — generic */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['ISO 27001 Automated Tests', 'Compliance Evidence'].map((l) => (
            <span key={l} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full border border-gray-200 font-medium">{l}</span>
          ))}
        </div>

        {/* Connected banner */}
        {connected && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected. Automated compliance scans are active.
          </p>
        )}

        {/* Connected account rows */}
        {connected && accounts.map((a) => (
          <div key={a.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{(a.metadata as any)?.label || config.name}</p>
              <p className="text-xs text-gray-400">{(a.metadata as any)?.accountId || (a.metadata as any)?.tenant || 'Active account'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(a.id)} disabled={scanningId === a.id}>
                {scanningId === a.id ? 'Scanning…' : 'Run Scan'}
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDisconnect(a.id)} disabled={disconnectingId === a.id}>
                {disconnectingId === a.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!loading && (
            <button
              onClick={() => setShowConnect(v => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
            >
              {connected ? `+ Add ${config.name} Account` : `Connect ${config.name}`}
            </button>
          )}
        </div>

        {/* Inline connect form */}
        {showConnect && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Connect {config.name}</h4>
            <form onSubmit={handleConnect} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                  placeholder="API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Account ID"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant / Subdomain <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Tenant or subdomain"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="https://..."
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="e.g. Production"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Connecting...' : `Connect ${config.name}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConnect(false)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </>
  );
}

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

function OktaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 0C14.37 0 0 14.267 0 32s14.268 32 32 32 32-14.268 32-32S49.63 0 32 0zm0 48c-8.866 0-16-7.134-16-16s7.134-16 16-16 16 7.134 16 16-7.134 16-16 16z" fill="#007DC1"/>
    </svg>
  );
}

// ─── Okta — Connect Modal ─────────────────────────────────────────────────────

function OktaConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: OktaIntegrationRecord) => void;
}) {
  const [domain, setDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || !apiToken.trim()) { setError('Domain and API Token are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await oktaService.connect({ domain: domain.trim(), apiToken: apiToken.trim(), label: label.trim() || undefined });
      if (res.success) { onConnected(res.data); onClose(); }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your domain and API token');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Okta</h2>
        <p className="text-sm text-gray-500 mb-4">
          Generate a read-only API token in <strong>Okta Admin → Security → API → Tokens</strong>.
          Use your Okta domain (e.g. <code className="bg-gray-100 px-1 rounded text-xs">mycompany.okta.com</code>).
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Okta Domain <span className="text-gray-400 font-normal">(e.g. mycompany.okta.com)</span>
            </label>
            <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="mycompany.okta.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token (SSWS)</label>
            <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="SSWS token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1] font-mono" autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DC1]" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#007DC1] hover:bg-[#006aa8] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Okta'}
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

function OktaCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: OktaIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: OktaIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await oktaService.runScan(id); onToast('success', 'Okta scan started — results will appear in tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Okta${label ? ` (${label})` : ''}? Automated tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await oktaService.disconnect(id); onAccountRemoved(id); onToast('success', 'Okta disconnected'); }
    catch { onToast('error', 'Failed to disconnect Okta'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
              <OktaIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Okta</h3>
              <p className="text-sm text-gray-500">Identity & SSO · MFA, stale accounts, access reviews</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Automatically verify MFA enforcement, detect stale/inactive accounts, check least-privilege for
          privileged users, confirm SSO coverage, and track user access review schedules via the Okta API.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.5 MFA', 'A.5.16 Stale Accounts', 'A.5.15 Least Privilege', 'A.8.2 SSO Coverage', 'A.5.18 Access Reviews'].map(l => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.domain}</p>
              <p className="text-xs text-gray-400">{account.domain}{account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label)} disabled={disconnectingId === account.id}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#007DC1] hover:bg-[#006aa8] text-white text-sm font-medium">
              {isConnected ? '+ Add Okta Account' : 'Connect Okta'}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <OktaConnectModal onClose={() => setShowModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Okta connected! 5 automated identity tests are being seeded.'); }} />
      )}
    </>
  );
}

function AzureAdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.867 7.282l-4.733 9.533 8.333 9.66L8 28.23l24 .25zm-.934-3.762L8.067 12.613 0 26.223l6.867-.7z" fill="#035BDA"/>
    </svg>
  );
}

// ─── Azure AD — Connect Modal ─────────────────────────────────────────────────

function AzureAdConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: AzureAdIntegrationRecord) => void;
}) {
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) { setError('Tenant ID, Client ID, and Client Secret are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await azureAdService.connect({ tenantId: tenantId.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim(), label: label.trim() || undefined });
      if (res.success) { onConnected(res.data); onClose(); }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your tenant ID, client ID, and secret');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect Azure AD</h2>
        <p className="text-sm text-gray-500 mb-4">
          Register an app in <strong>Azure Portal → App Registrations</strong> and grant it
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">User.Read.All</code>,
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">Policy.Read.All</code>,
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">Directory.Read.All</code> (application permissions).
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
            <input type="text" value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID (App ID)</label>
            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Client secret value"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono" autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production Tenant"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4]" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#0078D4] hover:bg-[#006abc] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Azure AD'}
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

function AzureAdCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: AzureAdIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: AzureAdIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await azureAdService.runScan(id); onToast('success', 'Azure AD scan started — results will appear in tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect Azure AD${label ? ` (${label})` : ''}? Automated tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await azureAdService.disconnect(id); onAccountRemoved(id); onToast('success', 'Azure AD disconnected'); }
    catch { onToast('error', 'Failed to disconnect Azure AD'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1">
              <AzureAdIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Azure AD (Entra ID)</h3>
              <p className="text-sm text-gray-500">Identity & SSO · MFA, conditional access, user reviews</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Verify MFA enforcement via Conditional Access, detect stale accounts, check privileged role
          assignments, confirm SSO app coverage, and validate access review completion via Microsoft Graph API.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.5 MFA', 'A.5.16 Stale Accounts', 'A.5.15 Least Privilege', 'A.8.2 SSO Coverage', 'A.5.18 Access Reviews'].map(l => (
            <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? account.tenantId}</p>
              <p className="text-xs text-gray-400 font-mono">{account.tenantId}{account.lastSyncAt && ` · Last sync: ${new Date(account.lastSyncAt).toLocaleString()}`}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label)} disabled={disconnectingId === account.id}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0078D4] hover:bg-[#006abc] text-white text-sm font-medium">
              {isConnected ? '+ Add Azure AD Tenant' : 'Connect Azure AD'}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <AzureAdConnectModal onClose={() => setShowModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'Azure AD connected! 5 automated identity tests are being seeded.'); }} />
      )}
    </>
  );
}

// ─── JumpCloud — Connect Modal ────────────────────────────────────────────────

function JumpCloudConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: JumpCloudIntegrationRecord) => void;
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
      const res = await jumpCloudService.connect({ apiToken: apiToken.trim(), label: label.trim() || undefined });
      if (res.success) { onConnected(res.data); onClose(); }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect — check your API token');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Connect JumpCloud</h2>
        <p className="text-sm text-gray-500 mb-4">
          Generate an API key in <strong>JumpCloud Admin → Settings → API Settings</strong>.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="JumpCloud API token"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009DDC] font-mono" autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Production"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#009DDC]" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#009DDC] hover:bg-[#0089c0] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect JumpCloud'}
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

function JumpCloudCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: JumpCloudIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: JumpCloudIntegrationRecord) => void;
  onAccountRemoved: (id: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const isConnected = accounts.length > 0;

  async function handleScan(id: string) {
    setScanningId(id);
    try { await jumpCloudService.runScan(id); onToast('success', 'JumpCloud scan started — results will appear in tests shortly'); }
    catch { onToast('error', 'Failed to start scan'); }
    finally { setScanningId(null); }
  }

  async function handleDisconnect(id: string, label: string | null) {
    if (!window.confirm(`Disconnect JumpCloud${label ? ` (${label})` : ''}? Automated tests will stop running.`)) return;
    setDisconnectingId(id);
    try { await jumpCloudService.disconnect(id); onAccountRemoved(id); onToast('success', 'JumpCloud disconnected'); }
    catch { onToast('error', 'Failed to disconnect JumpCloud'); }
    finally { setDisconnectingId(null); }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#009DDC' }}>
              <span className="text-white font-bold text-xs">JC</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">JumpCloud</h3>
              <p className="text-sm text-gray-500">Identity & SSO · MFA, user lifecycle, SSO apps</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? `${accounts.length} connected` : 'Available'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Verify MFA enforcement, detect stale/inactive user accounts, check privileged group membership,
          confirm all applications are covered by SSO, and validate user access review compliance via
          the JumpCloud API.
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {['A.8.5 MFA', 'A.5.16 Stale Accounts', 'A.5.15 Least Privilege', 'A.8.2 SSO Coverage', 'A.5.18 Access Reviews'].map(l => (
            <span key={l} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full border border-cyan-100 font-medium">{l}</span>
          ))}
        </div>
        {isConnected && accounts.map(account => (
          <div key={account.id} className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{account.label ?? 'JumpCloud Account'}</p>
              <p className="text-xs text-gray-400">{account.lastSyncAt ? `Last sync: ${new Date(account.lastSyncAt).toLocaleString()}` : 'Not yet synced'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleScan(account.id)} disabled={scanningId === account.id}>
                {scanningId === account.id ? 'Scanning…' : 'Run Scan'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id, account.label)} disabled={disconnectingId === account.id}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnectingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#009DDC] hover:bg-[#0089c0] text-white text-sm font-medium">
              {isConnected ? '+ Add JumpCloud Account' : 'Connect JumpCloud'}
            </button>
          )}
        </div>
      </Card>
      {showModal && (
        <JumpCloudConnectModal onClose={() => setShowModal(false)}
          onConnected={(account) => { onAccountAdded(account); onToast('success', 'JumpCloud connected! 5 automated identity tests are being seeded.'); }} />
      )}
    </>
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
  const [workspaceAccounts, setWorkspaceAccounts] = useState<WorkspaceIntegrationRecord[]>([]);
  const [fleetAccounts, setFleetAccounts] = useState<FleetIntegrationRecord[]>([]);
  const [intercomAccounts, setIntercomAccounts] = useState<IntercomIntegrationRecord[]>([]);
  const [bigIdAccounts, setBigIdAccounts] = useState<BigIdIntegrationRecord[]>([]);
  const [pagerdutyAccounts, setPagerdutyAccounts] = useState<PagerDutyIntegrationRecord[]>([]);
  const [opsgenieAccounts, setOpsgenieAccounts] = useState<OpsgenieIntegrationRecord[]>([]);
  const [servicenowAccounts, setServicenowAccounts] = useState<ServiceNowIntegrationRecord[]>([]);
  const [datadogAccounts, setDatadogAccounts] = useState<DatadogIntegrationRecord[]>([]);
  const [gcpAccounts, setGcpAccounts] = useState<GcpIntegrationRecord[]>([]);
  const [azureAccounts, setAzureAccounts] = useState<AzureIntegrationRecord[]>([]);
  const [wizAccounts, setWizAccounts] = useState<WizIntegrationRecord[]>([]);
  const [laceworkAccounts, setLaceworkAccounts] = useState<LaceworkIntegrationRecord[]>([]);
  const [snykAccounts, setSnykAccounts] = useState<SnykIntegrationRecord[]>([]);
  const [sonarqubeAccounts, setSonarqubeAccounts] = useState<SonarQubeIntegrationRecord[]>([]);
  const [veracodeAccounts, setVeracodeAccounts] = useState<VeracodeIntegrationRecord[]>([]);
  const [checkmarxAccounts, setCheckmarxAccounts] = useState<CheckmarxIntegrationRecord[]>([]);
  const [vaultAccounts, setVaultAccounts] = useState<VaultIntegrationRecord[]>([]);
  const [secretsManagerAccounts, setSecretsManagerAccounts] = useState<SecretsManagerIntegrationRecord[]>([]);
  const [certManagerAccounts, setCertManagerAccounts] = useState<CertManagerIntegrationRecord[]>([]);
  const [oktaAccounts, setOktaAccounts] = useState<OktaIntegrationRecord[]>([]);
  const [azureAdAccounts, setAzureAdAccounts] = useState<AzureAdIntegrationRecord[]>([]);
  const [jumpCloudAccounts, setJumpCloudAccounts] = useState<JumpCloudIntegrationRecord[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [mdmOverview, setMdmOverview] = useState<MdmOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected');
  const [engineerAConnectionCounts, setEngineerAConnectionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
   const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const loadStatus = async () => {
    try {
      // Run requests in batches of 5 with a small delay between batches to avoid
      // overwhelming the backend with 33 simultaneous DB queries (causes SIGSEGV).
      async function batchedAll<T>(fns: (() => Promise<T>)[], batchSize = 5, delayMs = 80): Promise<T[]> {
        const results: T[] = [];
        for (let i = 0; i < fns.length; i += batchSize) {
          if (i > 0) await new Promise(r => setTimeout(r, delayMs));
          const batch = await Promise.all(fns.slice(i, i + batchSize).map(fn => fn()));
          results.push(...batch);
        }
        return results;
      }

      const [
        { integrations }, slackRes, channelsRes, mdmRes, nrRes, notionRes,
        awsRes, cfRes, bambooRes, redashRes, workspaceRes,
        fleetRes, intercomRes, bigIdRes, pdRes, ogRes,
        snRes, ddRes, gcpRes, azureRes, wizRes,
        laceworkRes, snykRes, sonarqubeRes, veracodeRes, checkmarxRes,
        vaultRes, secretsManagerRes, certManagerRes, oktaRes, azureAdRes, jumpCloudRes,
      ] = await batchedAll([
        () => integrationsService.getStatus(),
        () => slackService.getStatus().catch(() => ({ success: false, data: null })),
        () => slackService.getChannels().catch(() => ({ data: [] as SlackChannel[] })),
        () => mdmService.getOverview().catch(() => ({ total: 0, compliant: 0, nonCompliant: 0, unknown: 0 } as MdmOverview)),
        () => newRelicService.getStatus().catch(() => ({ connected: false, data: null })),
        () => notionService.getStatus().catch(() => ({ connected: false, data: null })),
        () => awsService.getAccounts().catch(() => ({ success: true, data: [] as AwsAccountRecord[] })),
        () => cloudflareService.getAccounts().catch(() => ({ success: true, data: [] as CloudflareAccountRecord[] })),
        () => bamboohrService.getAccounts().catch(() => ({ success: true, data: [] as HRIntegrationRecord[] })),
        () => redashService.getAccounts().catch(() => ({ success: true, data: [] as RedashIntegrationRecord[] })),
        () => workspaceService.getAccounts().catch(() => ({ success: true, data: [] as WorkspaceIntegrationRecord[] })),
        () => fleetService.getAccounts().catch(() => ({ success: true, data: [] as FleetIntegrationRecord[] })),
        () => intercomService.getAccounts().catch(() => ({ success: true, data: [] as IntercomIntegrationRecord[] })),
        () => bigIdService.getAccounts().catch(() => ({ success: true, data: [] as BigIdIntegrationRecord[] })),
        () => pagerdutyService.getAccounts().catch(() => ({ success: true, data: [] as PagerDutyIntegrationRecord[] })),
        () => opsgenieService.getAccounts().catch(() => ({ success: true, data: [] as OpsgenieIntegrationRecord[] })),
        () => servicenowIncidentService.getAccounts().catch(() => ({ success: true, data: [] as ServiceNowIntegrationRecord[] })),
        () => datadogIncidentsService.getAccounts().catch(() => ({ success: true, data: [] as DatadogIntegrationRecord[] })),
        () => gcpService.getAccounts().catch(() => ({ success: true, data: [] as GcpIntegrationRecord[] })),
        () => azureService.getAccounts().catch(() => ({ success: true, data: [] as AzureIntegrationRecord[] })),
        () => wizService.getAccounts().catch(() => ({ success: true, data: [] as WizIntegrationRecord[] })),
        () => laceworkService.getAccounts().catch(() => ({ success: true, data: [] as LaceworkIntegrationRecord[] })),
        () => snykService.getAccounts().catch(() => ({ success: true, data: [] as SnykIntegrationRecord[] })),
        () => sonarqubeService.getAccounts().catch(() => ({ success: true, data: [] as SonarQubeIntegrationRecord[] })),
        () => veracodeService.getAccounts().catch(() => ({ success: true, data: [] as VeracodeIntegrationRecord[] })),
        () => checkmarxService.getAccounts().catch(() => ({ success: true, data: [] as CheckmarxIntegrationRecord[] })),
        () => vaultService.getAccounts().catch(() => ({ success: true, data: [] as VaultIntegrationRecord[] })),
        () => secretsManagerService.getAccounts().catch(() => ({ success: true, data: [] as SecretsManagerIntegrationRecord[] })),
        () => certManagerService.getAccounts().catch(() => ({ success: true, data: [] as CertManagerIntegrationRecord[] })),
        () => oktaService.getAccounts().catch(() => ({ success: true, data: [] as OktaIntegrationRecord[] })),
        () => azureAdService.getAccounts().catch(() => ({ success: true, data: [] as AzureAdIntegrationRecord[] })),
        () => jumpCloudService.getAccounts().catch(() => ({ success: true, data: [] as JumpCloudIntegrationRecord[] })),
      ]);
      const gh = integrations.find((i) => i.provider === 'GITHUB' && i.status === 'ACTIVE') ?? null;
      const drive = integrations.find((i) => i.provider === 'GOOGLE_DRIVE' && i.status === 'ACTIVE') ?? null;
      setGithubIntegration(gh);
      setDriveIntegration(drive);
      setSlackIntegration(slackRes.data);
      setSlackChannels(channelsRes.data ?? []);
      setMdmOverview(mdmRes);
      setNrConnected(nrRes.connected);
      setNrStatus(nrRes.data);
      setNotionConnected(notionRes.connected);
      setNotionStatus(notionRes.data);
      setAwsAccounts(awsRes.data ?? []);
      setCloudflareAccounts(cfRes.data ?? []);
      setBamboohrAccounts(bambooRes.data ?? []);
      setRedashAccounts(redashRes.data ?? []);
      setWorkspaceAccounts(workspaceRes.data ?? []);
      setFleetAccounts(fleetRes.data ?? []);
      setIntercomAccounts(intercomRes.data ?? []);
      setBigIdAccounts(bigIdRes.data ?? []);
      setPagerdutyAccounts(pdRes.data ?? []);
      setOpsgenieAccounts(ogRes.data ?? []);
      setServicenowAccounts(snRes.data ?? []);
      setDatadogAccounts(ddRes.data ?? []);
      setGcpAccounts(gcpRes.data ?? []);
      setAzureAccounts(azureRes.data ?? []);
      setWizAccounts(wizRes.data ?? []);
      setLaceworkAccounts(laceworkRes.data ?? []);
      setSnykAccounts(snykRes.data ?? []);
      setSonarqubeAccounts(sonarqubeRes.data ?? []);
      setVeracodeAccounts(veracodeRes.data ?? []);
      setCheckmarxAccounts(checkmarxRes.data ?? []);
      setVaultAccounts(vaultRes.data ?? []);
      setSecretsManagerAccounts(secretsManagerRes.data ?? []);
      setCertManagerAccounts(certManagerRes.data ?? []);
      setOktaAccounts(oktaRes.data ?? []);
      setAzureAdAccounts(azureAdRes.data ?? []);
      setJumpCloudAccounts(jumpCloudRes.data ?? []);
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
    const intercomConnected = searchParams.get('intercom');
    if (intercomConnected === 'connected') showToast('success', 'Intercom connected! 3 automated Policy tests are being seeded.');
    if (error) showToast('error', decodeURIComponent(error));
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const isConnected = !!githubIntegration;
  const driveConnected = !!driveIntegration;
  const slackConnected = !!slackIntegration;
  const mdmConnected = (mdmOverview?.total ?? 0) > 0;
  const awsConnected = awsAccounts.length > 0;
  const cloudflareConnected = cloudflareAccounts.length > 0;
  const bamboohrConnected = bamboohrAccounts.length > 0;
  const redashConnected = redashAccounts.length > 0;
  const workspaceConnected = workspaceAccounts.length > 0;
  const fleetConnected = fleetAccounts.length > 0;
  const intercomConnected = intercomAccounts.length > 0;
  const bigIdConnected = bigIdAccounts.length > 0;
  const pagerdutyConnected = pagerdutyAccounts.length > 0;
  const opsgenieConnected = opsgenieAccounts.length > 0;
  const servicenowConnected = servicenowAccounts.length > 0;
  const datadogConnected = datadogAccounts.length > 0;
  const gcpConnected = gcpAccounts.length > 0;
  const azureConnected = azureAccounts.length > 0;
  const wizConnected = wizAccounts.length > 0;
  const laceworkConnected = laceworkAccounts.length > 0;
  const snykConnected = snykAccounts.length > 0;
  const sonarqubeConnected = sonarqubeAccounts.length > 0;
  const veracodeConnected = veracodeAccounts.length > 0;
  const checkmarxConnected = checkmarxAccounts.length > 0;
  const vaultConnected = vaultAccounts.length > 0;
  const secretsManagerConnected = secretsManagerAccounts.length > 0;
  const certManagerConnected = certManagerAccounts.length > 0;
  const oktaConnected = oktaAccounts.length > 0;
  const azureAdConnected = azureAdAccounts.length > 0;
  const jumpCloudConnected = jumpCloudAccounts.length > 0;

  const baseConnectedCount = [
    isConnected,
    driveConnected,
    slackConnected,
    nrConnected,
    notionConnected,
    mdmConnected,
    awsConnected,
    cloudflareConnected,
    bamboohrConnected,
    redashConnected,
    workspaceConnected,
    fleetConnected,
    intercomConnected,
    bigIdConnected,
    pagerdutyConnected,
    opsgenieConnected,
    servicenowConnected,
    datadogConnected,
    gcpConnected,
    azureConnected,
    wizConnected,
    laceworkConnected,
    snykConnected,
    sonarqubeConnected,
    veracodeConnected,
    checkmarxConnected,
    vaultConnected,
    secretsManagerConnected,
    certManagerConnected,
    oktaConnected,
    azureAdConnected,
    jumpCloudConnected,
  ].filter(Boolean).length;

  const engineerAConnectedCount = Object.values(engineerAConnectionCounts).filter((count) => count > 0).length;
  const connectedCount = baseConnectedCount + engineerAConnectedCount;
  const totalToolCount = 32 + ENGINEER_A_CARDS.length + STATIC_INTEGRATIONS.length;
  const availableCount = Math.max(totalToolCount - connectedCount, 0);

  const shouldShowTile = (connected: boolean) =>
    activeTab === 'connected' ? connected : !connected;

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'connected' | 'available')} className="gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="connected">Connected Tools ({connectedCount})</TabsTrigger>
          <TabsTrigger value="available">Available Tools ({availableCount})</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* ── GitHub ────────────────────────────────────────────────────────── */}
        {shouldShowTile(isConnected) && <GitHubCard
          githubIntegration={githubIntegration}
          repos={repos}
          loading={loading}
          onDisconnect={() => {
            setGithubIntegration(null);
            setRepos([]);
          }}
          onToast={showToast}
        />}

        {/* ── Google Drive ──────────────────────────────────────────────────── */}
        {shouldShowTile(driveConnected) && <GoogleDriveCard
          driveIntegration={driveIntegration}
          loading={loading}
          onToast={showToast}
          onDisconnect={() => setDriveIntegration(null)}
        />}

        {/* ── Slack ────────────────────────────────────────────────────────── */}
        {shouldShowTile(slackConnected) && <SlackCard
          slackIntegration={slackIntegration}
          channels={slackChannels}
          loadingStatus={loading}
          onDisconnect={() => { setSlackIntegration(null); setSlackChannels([]); }}
          onChannelsChange={setSlackChannels}
          onToast={showToast}
        />}

        {/* ── Manzen MDM Agent ─────────────────────────────────────────────── */}
        {shouldShowTile(mdmConnected) && <MdmCard onToast={showToast} />}

        {/* ── BambooHR ─────────────────────────────────────────────────────── */}
        {shouldShowTile(bamboohrConnected) && <BambooHRCard
          accounts={bamboohrAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setBamboohrAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setBamboohrAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Notion ───────────────────────────────────────────────────────── */}
        {shouldShowTile(notionConnected) && <NotionCard
          notionStatus={notionStatus}
          connected={notionConnected}
          loadingStatus={loading}
          onConnected={(status) => { setNotionConnected(true); setNotionStatus(status); }}
          onDisconnected={() => { setNotionConnected(false); setNotionStatus(null); }}
          onToast={showToast}
        />}

        {/* ── AWS ──────────────────────────────────────────────────────────── */}
        {shouldShowTile(awsConnected) && <AwsCard
          accounts={awsAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAwsAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(accountId) => setAwsAccounts(prev => prev.filter(a => a.id !== accountId))}
          onToast={showToast}
        />}

        {/* ── Cloudflare ───────────────────────────────────────────────────── */}
        {shouldShowTile(cloudflareConnected) && <CloudflareCard
          accounts={cloudflareAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCloudflareAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(accountId) => setCloudflareAccounts(prev => prev.filter(a => a.id !== accountId))}
          onToast={showToast}
        />}

        {/* ── New Relic ────────────────────────────────────────────────────── */}
        {shouldShowTile(nrConnected) && <NewRelicCard
          nrStatus={nrStatus}
          connected={nrConnected}
          loadingStatus={loading}
          onConnected={(status) => { setNrConnected(true); setNrStatus(status); }}
          onDisconnected={() => { setNrConnected(false); setNrStatus(null); }}
          onToast={showToast}
        />}

        {/* ── Redash ───────────────────────────────────────────────────────── */}
        {shouldShowTile(redashConnected) && <RedashCard
          accounts={redashAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setRedashAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setRedashAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Google Workspace ─────────────────────────────────────────────── */}
        {shouldShowTile(workspaceConnected) && <WorkspaceCard
          accounts={workspaceAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setWorkspaceAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setWorkspaceAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Fleet ────────────────────────────────────────────────────────── */}
        {shouldShowTile(fleetConnected) && <FleetCard
          accounts={fleetAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setFleetAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setFleetAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Intercom ──────────────────────────────────────────────────────── */}
        {shouldShowTile(intercomConnected) && <IntercomCard
          accounts={intercomAccounts}
          loadingStatus={loading}
          onAccountRemoved={(id) => setIntercomAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── BigID ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(bigIdConnected) && <BigIdCard
          accounts={bigIdAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setBigIdAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setBigIdAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── PagerDuty ─────────────────────────────────────────────────────── */}
        {shouldShowTile(pagerdutyConnected) && <PagerDutyCard
          accounts={pagerdutyAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setPagerdutyAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setPagerdutyAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Opsgenie ──────────────────────────────────────────────────────── */}
        {shouldShowTile(opsgenieConnected) && <OpsgenieCard
          accounts={opsgenieAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setOpsgenieAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setOpsgenieAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── ServiceNow Incident ───────────────────────────────────────────── */}
        {shouldShowTile(servicenowConnected) && <ServiceNowIncidentCard
          accounts={servicenowAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setServicenowAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setServicenowAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Datadog Incidents ─────────────────────────────────────────────── */}
        {shouldShowTile(datadogConnected) && <DatadogIncidentsCard
          accounts={datadogAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setDatadogAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setDatadogAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── GCP ───────────────────────────────────────────────────────────── */}
        {shouldShowTile(gcpConnected) && <GcpCard
          accounts={gcpAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setGcpAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setGcpAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Azure ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(azureConnected) && <AzureCard
          accounts={azureAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAzureAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setAzureAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Wiz ───────────────────────────────────────────────────────────── */}
        {shouldShowTile(wizConnected) && <WizCard
          accounts={wizAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setWizAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setWizAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Lacework ──────────────────────────────────────────────────────── */}
        {shouldShowTile(laceworkConnected) && <LaceworkCard
          accounts={laceworkAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setLaceworkAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setLaceworkAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Snyk ──────────────────────────────────────────────────────────── */}
        {shouldShowTile(snykConnected) && <SnykCard
          accounts={snykAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setSnykAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setSnykAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── SonarQube ─────────────────────────────────────────────────────── */}
        {shouldShowTile(sonarqubeConnected) && <SonarQubeCard
          accounts={sonarqubeAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setSonarqubeAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setSonarqubeAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Veracode ──────────────────────────────────────────────────────── */}
        {shouldShowTile(veracodeConnected) && <VeracodeCard
          accounts={veracodeAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setVeracodeAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setVeracodeAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Checkmarx ─────────────────────────────────────────────────────── */}
        {shouldShowTile(checkmarxConnected) && <CheckmarxCard
          accounts={checkmarxAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCheckmarxAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setCheckmarxAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── HashiCorp Vault ──────────────────────────────────────────────── */}
        {shouldShowTile(vaultConnected) && <VaultCard
          accounts={vaultAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setVaultAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setVaultAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── AWS Secrets Manager ──────────────────────────────────────────── */}
        {shouldShowTile(secretsManagerConnected) && <SecretsManagerCard
          accounts={secretsManagerAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setSecretsManagerAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setSecretsManagerAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Certificate Manager ──────────────────────────────────────────── */}
        {shouldShowTile(certManagerConnected) && <CertManagerCard
          accounts={certManagerAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCertManagerAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setCertManagerAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Okta ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(oktaConnected) && <OktaCard
          accounts={oktaAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setOktaAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setOktaAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Azure AD ─────────────────────────────────────────────────────── */}
        {shouldShowTile(azureAdConnected) && <AzureAdCard
          accounts={azureAdAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAzureAdAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setAzureAdAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── JumpCloud ────────────────────────────────────────────────────── */}
        {shouldShowTile(jumpCloudConnected) && <JumpCloudCard
          accounts={jumpCloudAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setJumpCloudAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setJumpCloudAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {ENGINEER_A_CARDS.map((card) => (
          <EngineerAIntegrationCard
            key={card.key}
            config={card}
            loading={loading}
            onToast={showToast}
            activeTab={activeTab}
            onConnectionCountChange={(count) =>
              setEngineerAConnectionCounts((prev) => ({ ...prev, [card.key]: count }))
            }
          />
        ))}

        {/* ── Static coming-soon cards ─────────────────────────────────────── */}
        {activeTab === 'available' && STATIC_INTEGRATIONS.map((integration) => (
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
      </Tabs>
    </PageTemplate>
  );
}
