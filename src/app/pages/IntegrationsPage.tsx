import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { integrationsService, Integration, GitHubRepo } from '@/services/api/integrations';

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

// ─── Static cards (Slack, Jira, AWS — coming soon) ───────────────────────────

const STATIC_INTEGRATIONS = [
  { name: 'Slack', category: 'Communication', description: 'Security alerts and notifications' },
  { name: 'Jira', category: 'Project Management', description: 'Ticketing and task tracking' },
  { name: 'AWS', category: 'Cloud', description: 'Cloud infrastructure monitoring' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const [searchParams] = useSearchParams();
  const [githubIntegration, setGithubIntegration] = useState<Integration | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showRepos, setShowRepos] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const loadStatus = async () => {
    try {
      const { integrations } = await integrationsService.getStatus();
      const gh = integrations.find((i) => i.provider === 'GITHUB' && i.status === 'ACTIVE') ?? null;
      setGithubIntegration(gh);
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
    if (error) showToast('error', decodeURIComponent(error));
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    window.location.href = integrationsService.getConnectUrl();
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await integrationsService.triggerScan();
      showToast('success', 'Scan started — this may take a minute');
      setTimeout(async () => {
        try {
          const { repos: updated } = await integrationsService.getGitHubRepos();
          setRepos(updated);
        } catch {}
        setScanning(false);
      }, 5000);
    } catch {
      showToast('error', 'Failed to start scan');
      setScanning(false);
    }
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
                <Button variant="outline" onClick={handleScan} disabled={scanning}>
                  {scanning ? 'Scanning...' : 'Run Scan Now'}
                </Button>
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

        {/* ── Static coming-soon cards ─────────────────────────────────────── */}
        {STATIC_INTEGRATIONS.map((integration) => (
          <Card key={integration.name} className="p-6 opacity-60 select-none">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-500">{integration.category}</p>
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
