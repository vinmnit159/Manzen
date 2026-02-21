import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { integrationsService, Integration, GitHubRepo } from '@/services/api/integrations';
import { mdmService, EnrollmentToken, CreatedToken, MdmOverview } from '@/services/api/mdm';

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

// ─── Static cards (Slack, Jira, AWS — coming soon) ───────────────────────────

const STATIC_INTEGRATIONS = [
  { name: 'Slack', category: 'Communication', description: 'Security alerts and notifications' },
  { name: 'Jira', category: 'Project Management', description: 'Ticketing and task tracking' },
  { name: 'AWS', category: 'Cloud', description: 'Cloud infrastructure monitoring' },
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
      const { integrations } = await integrationsService.getStatus();
      const gh = integrations.find((i) => i.provider === 'GITHUB' && i.status === 'ACTIVE') ?? null;
      const drive = integrations.find((i) => i.provider === 'GOOGLE_DRIVE' && i.status === 'ACTIVE') ?? null;
      setGithubIntegration(gh);
      setDriveIntegration(drive);
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

        {/* ── Manzen MDM Agent ─────────────────────────────────────────────── */}
        <MdmCard onToast={showToast} />

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
