import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  CheckCircle,
  Tag,
  Link2,
  Shield,
  FileText,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
  RefreshCw,
  Plus,
  Search,
  Wrench,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  ClipboardCheck,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { controlsService } from '@/services/api/controls';
import { evidenceService } from '@/services/api/evidence';
import { auditsService } from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { authService } from '@/services/api/auth';
import { notionService, NotionAvailableDatabase } from '@/services/api/notion';
import type {
  TestRecord,
  TestStatus,
  TestCategory,
  TestRunRecord,
} from '@/services/api/tests';
import type { Control } from '@/services/api/types';
import type { AuditRecord } from '@/services/api/audits';

// ─── Provider scan registry ──────────────────────────────────────────────────
// Replaces the large if/else dispatch chain with a declarative registry.

interface ProviderScanEntry {
  match: (provider: string) => boolean;
  run: (meta: Record<string, string>) => Promise<unknown>;
  label: string;
}

function buildScanRegistry(): ProviderScanEntry[] {
  // Lazy-loaded to avoid circular import issues at module-parse time
  return [
    { match: (p) => p === 'NEWRELIC', label: 'New Relic', run: async () => { const { newRelicService } = await import('@/services/api/newrelic'); return newRelicService.runScan(); } },
    { match: (p) => p.startsWith('AWS_'), label: 'AWS', run: async (m) => { const { awsService } = await import('@/services/api/aws'); return awsService.runScan(m.awsAccountDbId ?? ''); } },
    { match: (p) => p.startsWith('CLOUDFLARE_'), label: 'Cloudflare', run: async (m) => { const { cloudflareService } = await import('@/services/api/cloudflare'); return cloudflareService.runScan(m.cfAccountDbId ?? ''); } },
    { match: (p) => p.startsWith('BAMBOOHR_'), label: 'BambooHR', run: async (m) => { const { bamboohrService } = await import('@/services/api/bamboohr'); return bamboohrService.runScan(m.hrIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('REDASH_'), label: 'Redash', run: async (m) => { const { redashService } = await import('@/services/api/redash'); return redashService.runScan(m.redashIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('GOOGLE_WORKSPACE_'), label: 'Google Workspace', run: async (m) => { const { workspaceService } = await import('@/services/api/workspace'); return workspaceService.runScan(m.workspaceIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('FLEET_'), label: 'Fleet', run: async (m) => { const { fleetService } = await import('@/services/api/fleet'); return fleetService.runScan(m.fleetIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('INTERCOM_'), label: 'Intercom', run: async (m) => { const { intercomService } = await import('@/services/api/intercom'); return intercomService.runScan(m.intercomIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('BIGID_'), label: 'BigID', run: async (m) => { const { bigIdService } = await import('@/services/api/bigid'); return bigIdService.runScan(m.bigIdIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('PAGERDUTY_'), label: 'PagerDuty', run: async (m) => { const { pagerdutyService } = await import('@/services/api/pagerduty'); return pagerdutyService.runScan(m.pagerdutyIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('OPSGENIE_'), label: 'Opsgenie', run: async (m) => { const { opsgenieService } = await import('@/services/api/opsgenie'); return opsgenieService.runScan(m.opsgenieIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SERVICENOW_INCIDENT_'), label: 'ServiceNow', run: async (m) => { const { servicenowIncidentService } = await import('@/services/api/servicenow-incident'); return servicenowIncidentService.runScan(m.servicenowIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('DATADOG_INCIDENTS_'), label: 'Datadog', run: async (m) => { const { datadogIncidentsService } = await import('@/services/api/datadog-incidents'); return datadogIncidentsService.runScan(m.datadogIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('GCP_'), label: 'GCP', run: async (m) => { const { gcpService } = await import('@/services/api/gcp'); return gcpService.runScan(m.gcpIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('AZURE_AD_'), label: 'Azure AD', run: async (m) => { const { azureAdService } = await import('@/services/api/azuread'); return azureAdService.runScan(m.azureAdIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('AZURE_'), label: 'Azure', run: async (m) => { const { azureService } = await import('@/services/api/azure'); return azureService.runScan(m.azureIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('WIZ_'), label: 'Wiz', run: async (m) => { const { wizService } = await import('@/services/api/wiz'); return wizService.runScan(m.wizIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('LACEWORK_'), label: 'Lacework', run: async (m) => { const { laceworkService } = await import('@/services/api/lacework'); return laceworkService.runScan(m.laceworkIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SNYK_'), label: 'Snyk', run: async (m) => { const { snykService } = await import('@/services/api/snyk'); return snykService.runScan(m.snykIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SONARQUBE_'), label: 'SonarQube', run: async (m) => { const { sonarqubeService } = await import('@/services/api/sonarqube'); return sonarqubeService.runScan(m.sonarQubeIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('VERACODE_'), label: 'Veracode', run: async (m) => { const { veracodeService } = await import('@/services/api/veracode'); return veracodeService.runScan(m.veracodeIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('CHECKMARX_'), label: 'Checkmarx', run: async (m) => { const { checkmarxService } = await import('@/services/api/checkmarx'); return checkmarxService.runScan(m.checkmarxIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('VAULT_'), label: 'HashiCorp Vault', run: async (m) => { const { vaultService } = await import('@/services/api/vault'); return vaultService.runScan(m.vaultIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SECRETS_MANAGER_'), label: 'AWS Secrets Manager', run: async (m) => { const { secretsManagerService } = await import('@/services/api/secretsmanager'); return secretsManagerService.runScan(m.secretsManagerIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('CERT_MANAGER_'), label: 'Certificate Manager', run: async (m) => { const { certManagerService } = await import('@/services/api/certmanager'); return certManagerService.runScan(m.certManagerIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('OKTA_'), label: 'Okta', run: async (m) => { const { oktaService } = await import('@/services/api/okta'); return oktaService.runScan(m.oktaIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('JUMPCLOUD_'), label: 'JumpCloud', run: async (m) => { const { jumpCloudService } = await import('@/services/api/jumpcloud'); return jumpCloudService.runScan(m.jumpCloudIntegrationId ?? ''); } },
  ];
}

let _scanRegistry: ProviderScanEntry[] | null = null;
function getScanRegistry(): ProviderScanEntry[] {
  if (!_scanRegistry) _scanRegistry = buildScanRegistry();
  return _scanRegistry;
}

async function dispatchScan(provider: string, metadata: Record<string, string>): Promise<unknown> {
  const entry = getScanRegistry().find((e) => e.match(provider));
  if (entry) return entry.run(metadata);
  const { integrationsService } = await import('@/services/api/integrations');
  return integrationsService.runAutomatedTests();
}

function getProviderLabel(provider: string): string {
  return getScanRegistry().find((e) => e.match(provider))?.label ?? provider;
}

// ─── Status / category config ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<TestStatus, { label: string; bg: string; text: string; dot: string }> = {
  OK:                { label: 'OK',                bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Due_soon:          { label: 'Due Soon',          bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Overdue:           { label: 'Overdue',           bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Needs_remediation: { label: 'Needs Remediation', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const CATEGORY_COLOR: Record<TestCategory, string> = {
  Custom:      'bg-gray-100 text-gray-700',
  Engineering: 'bg-blue-100 text-blue-700',
  HR:          'bg-pink-100 text-pink-700',
  IT:          'bg-cyan-100 text-cyan-700',
  Policy:      'bg-indigo-100 text-indigo-700',
  Risks:       'bg-orange-100 text-orange-700',
};

const LAST_RESULT_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pass:    { label: 'Pass',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Fail:    { label: 'Fail',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Warning: { label: 'Warning', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  Not_Run: { label: 'Not Run', bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-300'   },
};

function StatusBadge({ status }: { status: TestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LastResultBadge({ result }: { result: string }) {
  const cfg = LAST_RESULT_CONFIG[result] ?? { label: result, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  actions,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon}
          {title}
        </span>
        <div className="flex items-center gap-2">
          {actions && <span onClick={(e) => e.stopPropagation()}>{actions}</span>}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ─── History section ──────────────────────────────────────────────────────────

function HistorySection({ testId }: { testId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: QK.testHistory(testId),
    queryFn: async () => {
      const res = await testsService.getHistory(testId);
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading history...</p>;
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No history recorded yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-4">
      {data.map((entry) => (
        <li key={entry.id} className="ml-4">
          <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
          <p className="text-xs text-gray-400">{fmtDate(entry.createdAt)}</p>
          <p className="text-sm font-medium text-gray-800">{entry.changeType}</p>
          {(entry.oldValue || entry.newValue) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {entry.oldValue && <span className="line-through mr-2">{entry.oldValue}</span>}
              {entry.newValue && <span className="text-green-700">{entry.newValue}</span>}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

// ─── Automated test runs section ──────────────────────────────────────────────

function RunsSection({ testId }: { testId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: QK.testRuns(testId),
    queryFn: async () => {
      const res = await testsService.getTestRuns(testId);
      if (res.success && res.data) return res.data as TestRunRecord[];
      return [];
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading scan history...</p>;
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No scan runs recorded yet. Run a scan from the Integrations page.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <th className="text-left pb-2 pr-3">Run At</th>
            <th className="text-left pb-2 pr-3">Result</th>
            <th className="text-left pb-2 pr-3">Summary</th>
            <th className="text-left pb-2">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((run) => (
            <tr key={run.id} className="py-2">
              <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(run.executedAt)}</td>
              <td className="py-2 pr-3"><LastResultBadge result={run.status} /></td>
              <td className="py-2 pr-3 text-xs text-gray-700 max-w-[200px] truncate" title={run.summary}>{run.summary || '\u2014'}</td>
              <td className="py-2 text-xs text-gray-400">{run.durationMs != null ? `${run.durationMs}ms` : '\u2014'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendSparkline({ testId }: { testId: string }) {
  const { data } = useQuery({
    queryKey: QK.testRuns(testId),
    queryFn: async () => {
      const res = await testsService.getTestRuns(testId);
      return (res.data ?? []) as TestRunRecord[];
    },
    staleTime: STALE.TESTS,
  });

  const items = (data ?? []).slice(0, 10).reverse();
  if (items.length === 0) return <p className="text-xs text-gray-400">No trend data yet.</p>;

  const colorFor = (status: string) => status === 'Pass' ? 'bg-green-500' : status === 'Fail' ? 'bg-red-500' : status === 'Warning' ? 'bg-amber-500' : 'bg-gray-300';
  const heightFor = (status: string) => status === 'Pass' ? 'h-6' : status === 'Fail' ? 'h-10' : status === 'Warning' ? 'h-8' : 'h-4';

  return (
    <div>
      <div className="flex items-end gap-1.5 h-10">
        {items.map((run) => (
          <div key={run.id} title={`${run.status} - ${fmtDateTime(run.executedAt)}`} className={`w-3 rounded-sm ${colorFor(run.status)} ${heightFor(run.status)}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">Last {items.length} execution result{items.length === 1 ? '' : 's'}.</p>
    </div>
  );
}

function RiskContextSection({ testId }: { testId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tests', 'risk-context', testId],
    queryFn: async () => {
      const res = await testsService.getRiskContext(testId);
      return res.data ?? null;
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading) return <p className="text-sm text-gray-400 animate-pulse">Loading linked risk context...</p>;
  if (!data || (data.results.length === 0 && data.risks.length === 0)) return <p className="text-sm text-gray-400">No linked risk engine evaluation found.</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Linked risk engine test</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{data.linkedTest.riskEngineTestId ?? 'Not linked'}</p>
      </div>
      {data.results.slice(0, 3).map((result) => (
        <div key={result.id} className="rounded-lg border border-gray-100 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">{result.resourceName}</p>
            <span className="text-xs text-gray-500">{result.signalType}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{result.reason}</p>
        </div>
      ))}
      {data.risks.slice(0, 2).map((risk) => (
        <div key={risk.id} className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-sm font-medium text-red-900">{risk.title}</p>
          <p className="mt-1 text-xs text-red-700">{risk.severity} risk · Score {risk.score} · {risk.status}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Notion icon (panel-local) ────────────────────────────────────────────────

function NotionPanelIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="15" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <path d="M12 12l53 3.5c6.3.4 7.8 1 10.2 3.8l8.3 11.3c1.4 1.9 1.9 3.2 1.9 8.5v43.7c0 5.9-2.2 9.4-9.7 9.9L17.4 95.5c-5.5.3-8.1-1.1-10.8-4.4L1.9 83.5C.3 81.3 0 79.8 0 77.6V21.8C0 16.3 2.8 12.4 12 12z" fill="white" />
      <path d="M65 19.5L18 16.2c-5.2-.3-7.6 2.5-7.6 6.9v52.8c0 4.6 1.4 7 5.7 7.4l56.4 3.3c4.5.3 6.9-1.8 6.9-6.7V27.2c0-4.5-2-7-14.4-7.7zM56 29.7L28 28v-.1c-1.2-.1-2.2-1.1-2.2-2.2 0-1.3 1.1-2.2 2.5-2.2l29.1 1.9c1.2.1 2 1 2 2.2 0 1.2-1.5 2.3-3.4 2.1zM22 72V38.3c0-1.8 1.6-2.8 3-1.9L59 56c1.2.7 1.2 2.3 0 3L25 72.7c-1.4.9-3-.1-3-1.7z" fill="#1a1a1a" />
    </svg>
  );
}

// ─── Create Notion Task Modal ─────────────────────────────────────────────────

function CreateNotionTaskModal({
  testId,
  testName,
  controlId,
  onClose,
  onCreated,
}: {
  testId: string;
  testName: string;
  controlId?: string;
  onClose: () => void;
  onCreated: (url: string) => void;
}) {
  const [dbs, setDbs] = useState<NotionAvailableDatabase[]>([]);
  const [loadingDbs, setLoadingDbs] = useState(true);
  const [selectedDb, setSelectedDb] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const taskTitle = `Remediate: ${testName}`;

  React.useEffect(() => {
    notionService
      .getDatabases()
      .then((res) => {
        const linked = (res.data ?? []).filter((d) => d.linked);
        setDbs(linked);
        if (linked.length === 1) setSelectedDb(linked[0].id);
      })
      .catch(() => setError('Failed to load Notion databases'))
      .finally(() => setLoadingDbs(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDb) { setError('Select a Notion database'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await notionService.createTask({ testId, databaseId: selectedDb, title: taskTitle, dueDate: dueDate || undefined, controlId });
      onCreated(res.data.notionPageUrl);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create Notion task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Create Notion Task</h2>
        <p className="text-sm text-gray-500 mb-4">Push a remediation task to your linked Notion database.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input type="text" value={taskTitle} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notion Database</label>
            {loadingDbs ? (
              <p className="text-sm text-gray-400 animate-pulse">Loading databases...</p>
            ) : dbs.length === 0 ? (
              <p className="text-sm text-red-600">No linked databases. Link a Notion database from the Integrations page first.</p>
            ) : (
              <select value={selectedDb} onChange={(e) => setSelectedDb(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">Select a database...</option>
                {dbs.map((db) => <option key={db.id} value={db.id}>{db.title}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {controlId && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              Control: <span className="font-mono font-semibold">{controlId}</span> will be linked to the task.
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting || dbs.length === 0} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Task in Notion'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Attach Evidence Picker ───────────────────────────────────────────────────

function AttachEvidenceSection({ testId, existingIds }: { testId: string; existingIds: Set<string> }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allEvidence, isLoading } = useQuery({
    queryKey: ['evidence', 'all'],
    queryFn: async () => {
      const res = await evidenceService.getEvidence();
      return res.data ?? [];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allEvidence) return [];
    return allEvidence.filter(
      (e) => !existingIds.has(e.id) && (e.fileName ?? e.type ?? '').toLowerCase().includes(search.toLowerCase()),
    );
  }, [allEvidence, existingIds, search]);

  const attachMutation = useMutation({
    mutationFn: (evidenceId: string) => testsService.attachEvidence(testId, evidenceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Attach evidence
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search available evidence..."
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus
        />
        <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading evidence...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No available evidence to attach.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.slice(0, 20).map((e) => (
            <li key={e.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm">
              <div className="min-w-0">
                <p className="text-gray-800 truncate">{e.fileName ?? e.type}</p>
                <p className="text-xs text-gray-400">{fmtDate(e.createdAt)}</p>
              </div>
              <button
                onClick={() => attachMutation.mutate(e.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Attach
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Attach Control Picker ────────────────────────────────────────────────────

function AttachControlSection({ testId, existingIds }: { testId: string; existingIds: Set<string> }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allControls, isLoading } = useQuery({
    queryKey: ['controls', 'all-for-picker'],
    queryFn: async () => {
      const res = await controlsService.getControls({ limit: 500 });
      return (res.data ?? []) as Control[];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allControls) return [];
    const q = search.toLowerCase();
    return allControls.filter(
      (c) => !existingIds.has(c.id) && (`${c.isoReference} ${c.title}`.toLowerCase().includes(q)),
    );
  }, [allControls, existingIds, search]);

  const attachMutation = useMutation({
    mutationFn: (controlId: string) => testsService.attachControl(testId, controlId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Link control
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search controls by reference or title..."
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus
        />
        <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading controls...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No available controls to link.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.slice(0, 20).map((c) => (
            <li key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm">
              <div className="min-w-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                  {c.isoReference}
                </span>
                <span className="text-gray-700 truncate">{c.title}</span>
              </div>
              <button
                onClick={() => attachMutation.mutate(c.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                Link
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Attach Audit Picker ──────────────────────────────────────────────────────

function AttachAuditSection({ testId, existingIds }: { testId: string; existingIds: Set<string> }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: allAudits, isLoading } = useQuery({
    queryKey: ['audits', 'all-for-picker'],
    queryFn: async () => {
      const res = await auditsService.list();
      return (res.data ?? []) as AuditRecord[];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allAudits) return [];
    return allAudits.filter((a) => !existingIds.has(a.id));
  }, [allAudits, existingIds]);

  const attachMutation = useMutation({
    mutationFn: (auditId: string) => testsService.attachAudit(testId, auditId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Link audit
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Select an audit to link</span>
        <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading audits...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">No available audits to link.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm">
              <div className="min-w-0">
                <p className="text-gray-800 font-medium truncate">{a.name}</p>
                <p className="text-xs text-gray-400">{a.type} &middot; {a.status}</p>
              </div>
              <button
                onClick={() => attachMutation.mutate(a.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                Link
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Add Framework Inline ─────────────────────────────────────────────────────

function AddFrameworkSection({ testId }: { testId: string }) {
  const qc = useQueryClient();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');

  const attachMutation = useMutation({
    mutationFn: (frameworkName: string) => testsService.attachFramework(testId, frameworkName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      setName('');
      setShowInput(false);
    },
  });

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Add framework
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Framework name (e.g. SOC 2, ISO 27001)"
        className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) attachMutation.mutate(name.trim()); }}
      />
      <button
        onClick={() => name.trim() && attachMutation.mutate(name.trim())}
        disabled={!name.trim() || attachMutation.isPending}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Add
      </button>
      <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── How to Remediate Section ─────────────────────────────────────────────────

function RemediationGuide({ test }: { test: TestRecord }) {
  const isAutomated = test.type !== 'Document';
  const isFailing = test.lastResult === 'Fail' || test.status === 'Needs_remediation';
  const isOverdue = test.status === 'Overdue';
  const providerLabel = test.integration?.provider ? getProviderLabel(test.integration.provider) : null;

  // Build contextual step-wise remediation based on test state
  const steps: Array<{ title: string; description: string; severity: 'info' | 'warning' | 'critical' }> = [];

  // Step 1: Identify the issue
  if (isFailing && isAutomated) {
    steps.push({
      title: 'Investigate the failing scan result',
      description: `Review the latest scan output from ${providerLabel ?? 'the integration'}. Check the Scan Run History section above for the detailed failure summary and root cause.`,
      severity: 'critical',
    });
  } else if (isFailing) {
    steps.push({
      title: 'Review the test requirements',
      description: `This test requires manual verification. Review the linked controls and evidence requirements to understand what compliance gap exists.`,
      severity: 'critical',
    });
  } else if (isOverdue) {
    steps.push({
      title: 'Acknowledge the overdue status',
      description: `This test was due on ${fmtDate(test.dueDate)} and is now overdue. Prioritize completing this test to avoid compliance drift.`,
      severity: 'warning',
    });
  } else {
    steps.push({
      title: 'Review current test status',
      description: `This test is currently ${STATUS_CONFIG[test.status]?.label ?? test.status}. Review linked controls and evidence to ensure continued compliance.`,
      severity: 'info',
    });
  }

  // Step 2: Controls mapping
  if (test.controls.length > 0) {
    const controlNames = test.controls.map((c) => c.control.isoReference).join(', ');
    steps.push({
      title: 'Verify linked control implementation',
      description: `Ensure the following controls are fully implemented: ${controlNames}. Check each control's status and verify its implementation aligns with the test requirements.`,
      severity: test.controls.some((c) => c.control.status !== 'IMPLEMENTED') ? 'warning' : 'info',
    });
  } else {
    steps.push({
      title: 'Map relevant controls',
      description: 'No controls are linked to this test. Use the Controls section below to link the applicable ISO/SOC controls that this test validates.',
      severity: 'warning',
    });
  }

  // Step 3: Evidence collection
  if (test.evidences.length === 0) {
    steps.push({
      title: 'Collect and attach evidence',
      description: 'No evidence is currently attached. Gather the required documentation, screenshots, or automated reports that prove compliance and attach them using the Evidence section below.',
      severity: 'warning',
    });
  } else if (isFailing) {
    steps.push({
      title: 'Update evidence with remediation proof',
      description: `Current evidence (${test.evidences.length} items) may reflect the pre-remediation state. After fixing the issue, collect fresh evidence showing the resolved state and attach it.`,
      severity: 'warning',
    });
  } else {
    steps.push({
      title: 'Verify evidence freshness',
      description: `${test.evidences.length} evidence item(s) attached. Ensure the latest evidence is still current and reflects the actual state of the system.`,
      severity: 'info',
    });
  }

  // Step 4: Automated remediation specifics
  if (isAutomated && isFailing) {
    steps.push({
      title: `Apply the fix in ${providerLabel ?? 'the integration'}`,
      description: `Make the necessary configuration changes directly in ${providerLabel ?? 'the connected system'}. Common fixes include updating security policies, enabling required features, or patching vulnerable components.`,
      severity: 'critical',
    });
    steps.push({
      title: 'Re-run the automated scan',
      description: 'After applying the fix, trigger a new scan using the "Run Scan Now" button above. Wait for the scan to complete and verify the result changes to Pass.',
      severity: 'info',
    });
  }

  // Step 5: Framework alignment
  if (test.frameworks.length > 0) {
    steps.push({
      title: 'Confirm framework alignment',
      description: `This test maps to: ${test.frameworks.map((f) => f.frameworkName).join(', ')}. Verify that remediation actions satisfy the requirements of all linked frameworks.`,
      severity: 'info',
    });
  }

  // Step 6: Complete
  if (!isAutomated) {
    steps.push({
      title: 'Mark the test as complete',
      description: 'Once all controls are implemented, evidence is collected, and the compliance gap is resolved, use the "Mark Complete" button to close this test cycle.',
      severity: 'info',
    });
  }

  // Step 7: Audit trail
  if (test.audits.length > 0) {
    steps.push({
      title: 'Document for audit readiness',
      description: `This test is linked to ${test.audits.length} audit(s). Ensure all remediation actions and evidence are thoroughly documented for the auditor.`,
      severity: 'info',
    });
  }

  const severityIcon = (sev: string) => {
    if (sev === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (sev === 'warning') return <Lightbulb className="w-4 h-4 text-amber-500" />;
    return <ClipboardCheck className="w-4 h-4 text-blue-500" />;
  };

  const severityBg = (sev: string) => {
    if (sev === 'critical') return 'border-red-200 bg-red-50/50';
    if (sev === 'warning') return 'border-amber-200 bg-amber-50/50';
    return 'border-gray-100 bg-gray-50/50';
  };

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      {(isFailing || isOverdue) && (
        <div className={`rounded-lg px-4 py-3 text-sm ${isFailing ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {isFailing ? 'This test is failing and requires remediation' : 'This test is overdue and needs attention'}
          </div>
          <p className="mt-1 text-xs opacity-80">
            Follow the steps below to resolve the issue and bring this test back into compliance.
          </p>
        </div>
      )}

      {/* Step-wise guide */}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className={`rounded-lg border p-3 ${severityBg(step.severity)}`}>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {severityIcon(step.severity)}
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface TestDetailPanelProps {
  testId: string;
  onClose: () => void;
  onMutated?: () => void;
}

const ADMIN_ROLES = ['ORG_ADMIN', 'SUPER_ADMIN', 'SECURITY_OWNER'];
const AUDIT_REVIEW_ROLES = ['AUDITOR', 'ORG_ADMIN', 'SUPER_ADMIN', 'SECURITY_OWNER'];

export function TestDetailPanel({ testId, onClose, onMutated }: TestDetailPanelProps) {
  const qc = useQueryClient();
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionTaskUrl, setNotionTaskUrl] = useState<string | null>(null);

  const currentUser = authService.getCachedUser();
  const isAdmin = ADMIN_ROLES.includes(currentUser?.role ?? '');
  const isReviewer = AUDIT_REVIEW_ROLES.includes(currentUser?.role ?? '');

  // Load org users for owner picker (only for admins)
  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      const res = await usersService.listUsers();
      return res.users ?? [];
    },
    staleTime: STALE.USERS,
    enabled: isAdmin,
  });

  const { data: test, isLoading, isError } = useQuery({
    queryKey: QK.testDetail(testId),
    queryFn: async () => {
      const res = await testsService.getTest(testId);
      if (res.success && res.data) return res.data as TestRecord;
      throw new Error('Failed to load test');
    },
    staleTime: STALE.TESTS,
  });

  const { data: unifiedEvidence = [] } = useQuery({
    queryKey: ['tests', 'unified-evidence', testId],
    queryFn: async () => {
      const res = await testsService.listUnifiedEvidence();
      return (res.data ?? []).filter((item) => item.testId === testId);
    },
    staleTime: STALE.TESTS,
  });

  const { data: securityEvents = [] } = useQuery({
    queryKey: ['tests', 'security-events', testId],
    queryFn: async () => {
      const res = await testsService.listSecurityEvents();
      return (res.data ?? []).filter((item) => item.testId === testId);
    },
    staleTime: STALE.TESTS,
  });

  const completeMutation = useMutation({
    mutationFn: () => testsService.completeTest(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      onMutated?.();
    },
  });

  const runMutation = useMutation({
    mutationFn: () => {
      const provider = test?.integration?.provider ?? '';
      const meta = (test?.integration?.metadata ?? {}) as Record<string, string>;
      return dispatchScan(provider, meta);
    },
    onSuccess: () => {
      setRunMsg('Scan triggered. Results will update shortly.');
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['tests'] });
        qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
        setRunMsg(null);
      }, 4000);
    },
    onError: () => {
      setRunMsg('Failed to trigger scan.');
      setTimeout(() => setRunMsg(null), 3000);
    },
  });

  const reassignOwner = useMutation({
    mutationFn: (ownerId: string) => testsService.updateTest(testId, { ownerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      onMutated?.();
    },
  });

  const detachEvidence = useMutation({
    mutationFn: (evidenceId: string) => testsService.detachEvidence(testId, evidenceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const detachControl = useMutation({
    mutationFn: (controlId: string) => testsService.detachControl(testId, controlId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const detachFramework = useMutation({
    mutationFn: (fwId: string) => testsService.detachFramework(testId, fwId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const requestAttestationMutation = useMutation({
    mutationFn: (reviewerId: string) => testsService.requestAttestation(testId, reviewerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const signAttestationMutation = useMutation({
    mutationFn: (reviewerId: string) => testsService.signAttestation(testId, reviewerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const autoRemediateMutation = useMutation({
    mutationFn: () => testsService.autoRemediate(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
    },
  });

  const isAutomated = test?.type === 'Automated';
  const isSystemDriven = test?.type === 'Automated' || test?.type === 'Pipeline';
  const providerLabel = test?.integration?.provider ? getProviderLabel(test.integration.provider) : null;
  const isOwner = currentUser?.id != null && currentUser.id === test?.ownerId;
  const canEditTest = isAdmin || isOwner;
  const canAttest = Boolean(test && isReviewer && currentUser?.id && currentUser.id !== test.ownerId);

  return (
    // Overlay
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0">
          {isLoading ? (
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          ) : test ? (
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{test.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={test.status} />
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[test.category]}`}>{test.category}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isSystemDriven ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>{test.type}</span>
              </div>
            </div>
          ) : null}
          <button onClick={onClose} className="ml-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0" aria-label="Close panel">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">Failed to load test details.</div>
          )}

          {test && (
            <>
              {/* ── Overview ── */}
              <Section title="Overview" icon={<FileText className="w-4 h-4 text-gray-500" />}>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Due Date', value: fmtDate(test.dueDate) },
                    { label: 'Next Due', value: fmtDate(test.nextDueDate) },
                    { label: 'Cadence', value: test.recurrenceRule ? test.recurrenceRule[0].toUpperCase() + test.recurrenceRule.slice(1) : 'One-time' },
                    { label: 'Completed', value: fmtDate(test.completedAt) },
                    { label: 'Type', value: test.type },
                    { label: 'Category', value: test.category },
                    { label: 'Created', value: fmtDate(test.createdAt) },
                    { label: 'Risk Engine ID', value: test.riskEngineTestId ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{value}</dd>
                    </div>
                  ))}
                  {/* Owner field -- editable for admins */}
                  <div className="col-span-2">
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Owner</dt>
                    {canEditTest && usersData && usersData.length > 0 ? (
                      <select
                        value={test.ownerId}
                        onChange={(e) => reassignOwner.mutate(e.target.value)}
                        disabled={reassignOwner.isPending}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {usersData.map((u) => (
                          <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                        ))}
                      </select>
                    ) : (
                      <dd className="font-medium text-gray-800">{test.owner?.name ?? test.owner?.email ?? test.ownerId}</dd>
                    )}
                  </div>
                </dl>

                {/* Automated-test metadata */}
                {isSystemDriven && (
                  <div className="mt-4 p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wide">
                      <Zap className="w-3.5 h-3.5" />
                        Automated via {providerLabel ?? test.pipelineProvider ?? 'Integration'}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Scan</dt>
                        <dd className="mt-0.5 font-medium text-gray-800">{fmtDateTime(test.lastRunAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Result</dt>
                        <dd className="mt-0.5"><LastResultBadge result={test.lastResult ?? 'Not_Run'} /></dd>
                      </div>
                    </div>
                    {test.lastResultDetails?.summary && (
                      <p className="text-xs text-gray-600 mt-1">{test.lastResultDetails.summary}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {isSystemDriven ? (
                  <div className="mt-4 space-y-2">
                    {test.type === 'Pipeline' ? (
                      <button
                        onClick={async () => {
                          await testsService.ingestPipelineRun({
                            pipelineName: test.name,
                            provider: test.pipelineProvider ?? 'GitHub Actions',
                            status: 'success',
                            summary: 'Pipeline execution imported from CI/CD webhook.',
                            branch: 'main',
                          });
                          qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
                          qc.invalidateQueries({ queryKey: ['tests'] });
                          qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Ingest Pipeline Run
                      </button>
                    ) : (
                      <button
                        onClick={() => runMutation.mutate()}
                        disabled={runMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${runMutation.isPending ? 'animate-spin' : ''}`} />
                        {runMutation.isPending ? 'Running...' : 'Run Scan Now'}
                      </button>
                    )}
                    {runMsg && <p className="text-xs text-gray-500">{runMsg}</p>}
                    <p className="text-xs text-gray-400">
                      This test is system-driven via {providerLabel ?? test.pipelineProvider ?? 'the integration'}. Results update automatically on every scan.
                    </p>
                    {test.autoRemediationSupported && test.lastResult === 'Fail' && (
                      <button
                        onClick={() => autoRemediateMutation.mutate()}
                        disabled={autoRemediateMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium disabled:opacity-50"
                      >
                        <Wrench className="w-4 h-4" />
                        {autoRemediateMutation.isPending ? 'Executing remediation...' : 'Run Auto-remediation'}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {test.status !== 'OK' && canEditTest && (
                      <button
                        onClick={() => completeMutation.mutate()}
                        disabled={completeMutation.isPending}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completeMutation.isPending ? 'Marking...' : 'Mark Complete'}
                      </button>
                    )}
                    {test.status === 'OK' && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        Completed {fmtDate(test.completedAt)}
                      </div>
                    )}
                    {!canEditTest && (
                      <p className="mt-4 text-xs text-gray-500">Only the assigned owner, team lead, or CISO override roles can change this test.</p>
                    )}
                  </>
                )}

                {/* Create Notion Task -- shown for any failing/needs-remediation test */}
                {(test.status === 'Needs_remediation' || test.status === 'Overdue' || test.lastResult === 'Fail') && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowNotionModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium shadow-sm transition-colors"
                    >
                      <NotionPanelIcon />
                      Create Notion Task
                    </button>
                    {notionTaskUrl && (
                      <p className="mt-1.5 text-xs text-green-700">
                        Task created:{' '}
                        <a href={notionTaskUrl} target="_blank" rel="noreferrer" className="underline hover:text-green-900">Open in Notion</a>
                      </p>
                    )}
                  </div>
                )}
              </Section>

              {/* ── How to Remediate ── */}
              <Section title="How to Remediate" icon={<Wrench className="w-4 h-4 text-gray-500" />}>
                <RemediationGuide test={test} />
              </Section>

              <Section title="Result Trend" icon={<Activity className="w-4 h-4 text-gray-500" />}>
                <TrendSparkline testId={testId} />
              </Section>

              <Section title="Risk Context" icon={<AlertTriangle className="w-4 h-4 text-gray-500" />}>
                <RiskContextSection testId={testId} />
              </Section>

              <Section title="Governance" icon={<ClipboardCheck className="w-4 h-4 text-gray-500" />}>
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Attestation Status</p>
                    <p className="mt-1 font-medium text-gray-900">{(test.attestationStatus ?? 'Not_requested').replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-xs text-gray-500">Reviewer: {test.reviewer?.name ?? 'Unassigned'}</p>
                    {test.attestedAt && <p className="mt-1 text-xs text-gray-500">Signed {fmtDateTime(test.attestedAt)}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEditTest && usersData?.[0] && test.attestationStatus !== 'Pending_review' && test.attestationStatus !== 'Attested' && (
                      <button
                        onClick={() => requestAttestationMutation.mutate(usersData[0].id)}
                        disabled={requestAttestationMutation.isPending}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                      >
                        Request Attestation
                      </button>
                    )}
                    {canAttest && currentUser?.id && test.attestationStatus === 'Pending_review' && (
                      <button
                        onClick={() => signAttestationMutation.mutate(currentUser.id)}
                        disabled={signAttestationMutation.isPending}
                        className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
                      >
                        {signAttestationMutation.isPending ? 'Signing...' : 'Attest Evidence'}
                      </button>
                    )}
                  </div>
                  {securityEvents.length > 0 && (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-amber-700">SIEM / SOAR</p>
                      <div className="mt-2 space-y-1">
                        {securityEvents.slice(0, 3).map((item) => (
                          <p key={item.id} className="text-xs text-amber-900">{item.eventType} to {item.destination} ({item.status})</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Owners can edit and complete, auditors can attest, and CISO/admin roles retain override authority.</p>
                </div>
              </Section>

              {/* ── Scan Run History (Automated only) ── */}
              {isSystemDriven && (
                <Section title="Scan Run History" icon={<Zap className="w-4 h-4 text-gray-500" />}>
                  <RunsSection testId={testId} />
                </Section>
              )}

              {/* ── Evidence ── */}
              <Section title={`Evidence (${test.evidences.length})`} icon={<Shield className="w-4 h-4 text-gray-500" />}>
                {test.evidences.length === 0 ? (
                  <p className="text-sm text-gray-400">No evidence attached.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.evidences.map(({ id, evidenceId, evidence }) => (
                      <li key={id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{evidence.fileName ?? evidence.type}</p>
                          {evidence.fileUrl && (
                            <a href={evidence.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View file
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(evidence.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => detachEvidence.mutate(evidenceId)}
                          disabled={!canEditTest}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Detach evidence"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {canEditTest && (
                  <AttachEvidenceSection
                    testId={testId}
                    existingIds={new Set(test.evidences.map((e) => e.evidenceId))}
                  />
                )}
              </Section>

              <Section title={`Unified Evidence (${unifiedEvidence.length})`} icon={<Shield className="w-4 h-4 text-gray-500" />}>
                {unifiedEvidence.length === 0 ? (
                  <p className="text-sm text-gray-400">No unified evidence records yet.</p>
                ) : (
                  <div className="space-y-2">
                    {unifiedEvidence.slice(0, 6).map((item) => (
                      <div key={item.id} className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <span className="text-xs text-gray-500">{item.sourceType}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{item.provider} · {fmtDateTime(item.capturedAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* ── Linked Controls ── */}
              <Section title={`Controls (${test.controls.length})`} icon={<Shield className="w-4 h-4 text-gray-500" />}>
                {test.controls.length === 0 ? (
                  <p className="text-sm text-gray-400">No controls linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.controls.map(({ id, controlId, control }) => (
                      <li key={id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                            {control.isoReference}
                          </span>
                          <span className="text-sm text-gray-700">{control.title}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${control.status === 'IMPLEMENTED' ? 'bg-green-50 text-green-700' : control.status === 'PARTIALLY_IMPLEMENTED' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                            {control.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => detachControl.mutate(controlId)}
                          disabled={!canEditTest}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Detach control"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {canEditTest && (
                  <AttachControlSection
                    testId={testId}
                    existingIds={new Set(test.controls.map((c) => c.controlId))}
                  />
                )}
              </Section>

              {/* ── Linked Frameworks ── */}
              <Section title={`Frameworks (${test.frameworks.length})`} icon={<Tag className="w-4 h-4 text-gray-500" />}>
                {test.frameworks.length === 0 ? (
                  <p className="text-sm text-gray-400">No frameworks linked.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {test.frameworks.map(({ id, frameworkName }) => (
                      <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {frameworkName}
                        <button onClick={() => detachFramework.mutate(id)} className="hover:text-red-500 transition-colors" title="Remove framework">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {canEditTest && <AddFrameworkSection testId={testId} />}
              </Section>

              {/* ── Linked Audits ── */}
              <Section title={`Audits (${test.audits.length})`} icon={<Link2 className="w-4 h-4 text-gray-500" />}>
                {test.audits.length === 0 ? (
                  <p className="text-sm text-gray-400">No audits linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.audits.map(({ id, audit }) => (
                      <li key={id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm">
                        <p className="font-medium text-gray-800">{audit.type}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Auditor: {audit.auditor}</p>
                        {audit.scope && <p className="text-xs text-gray-400 mt-0.5">{audit.scope}</p>}
                      </li>
                    ))}
                  </ul>
                )}
                {canEditTest && (
                  <AttachAuditSection
                    testId={testId}
                    existingIds={new Set(test.audits.map((a) => a.auditId))}
                  />
                )}
              </Section>

              {/* ── History ── */}
              <Section title="History" icon={<History className="w-4 h-4 text-gray-500" />}>
                <HistorySection testId={testId} />
              </Section>
            </>
          )}
        </div>
      </div>

      {/* Notion task creation modal */}
      {showNotionModal && test && (
        <CreateNotionTaskModal
          testId={testId}
          testName={test.name}
          controlId={test.controls[0]?.control?.isoReference}
          onClose={() => setShowNotionModal(false)}
          onCreated={(url) => setNotionTaskUrl(url)}
        />
      )}
    </div>
  );
}
