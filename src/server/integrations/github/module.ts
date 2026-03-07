import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import type { NormalizedSignal, ScanRunRecord, IntegrationJobExecutionRecord } from '@/domain/risk-engine/types';
import type { GitHubRepo } from '@/services/api/integrations';

function nowIso() {
  return new Date().toISOString();
}

function getRepoProtection(repo: GitHubRepo) {
  const raw = repo.rawData ?? {};
  const protection = raw.branchProtection ?? raw.protection ?? {};
  return {
    branchProtectionEnabled: Boolean(protection.enabled ?? raw.branchProtectionEnabled ?? false),
    requiredReviewsEnabled: Boolean(protection.requiredReviewsEnabled ?? ((protection.requiredApprovingReviewCount ?? 0) > 0) ?? false),
    requiredApprovingReviewCount: Number(protection.requiredApprovingReviewCount ?? raw.requiredApprovingReviewCount ?? 0),
    secretScanningEnabled: Boolean(raw.secretScanningEnabled ?? raw.secretScanning ?? false),
    pushProtectionEnabled: Boolean(raw.pushProtectionEnabled ?? raw.secretScanningPushProtection ?? false),
    defaultBranchStandard: ['main', 'master', 'trunk'].includes(String(repo.defaultBranch || '').toLowerCase()),
  };
}

function buildGithubSignals(organizationId: string, integrationId: string, repos: GitHubRepo[]): NormalizedSignal[] {
  const collectedAt = nowIso();
  return repos.flatMap((repo, index) => {
    const protection = getRepoProtection(repo);
    const baseId = `${repo.id || repo.fullName || repo.name}-${index}`;
    const metadata = {
      fullName: repo.fullName,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranch,
      source: 'github-collector',
      ...protection,
    };

    return [
      {
        id: `sig-github-private-${baseId}`,
        organizationId,
        integrationId,
        provider: 'github',
        signalType: 'SOURCE_CODE_REPO_PRIVATE',
        resourceType: 'repository',
        resourceId: repo.id || repo.fullName,
        resourceName: repo.name,
        value: repo.private,
        metadata,
        observedAt: collectedAt,
        collectedAt,
      },
      {
        id: `sig-github-branch-protection-${baseId}`,
        organizationId,
        integrationId,
        provider: 'github',
        signalType: 'SOURCE_CODE_BRANCH_PROTECTION_ENABLED',
        resourceType: 'repository',
        resourceId: repo.id || repo.fullName,
        resourceName: repo.name,
        value: protection.branchProtectionEnabled,
        metadata,
        observedAt: collectedAt,
        collectedAt,
      },
      {
        id: `sig-github-required-reviews-${baseId}`,
        organizationId,
        integrationId,
        provider: 'github',
        signalType: 'SOURCE_CODE_REQUIRED_REVIEWS_ENABLED',
        resourceType: 'repository',
        resourceId: repo.id || repo.fullName,
        resourceName: repo.name,
        value: protection.requiredReviewsEnabled,
        metadata,
        observedAt: collectedAt,
        collectedAt,
      },
      {
        id: `sig-github-secret-scanning-${baseId}`,
        organizationId,
        integrationId,
        provider: 'github',
        signalType: 'SOURCE_CODE_SECRET_SCANNING_ENABLED',
        resourceType: 'repository',
        resourceId: repo.id || repo.fullName,
        resourceName: repo.name,
        value: protection.secretScanningEnabled,
        metadata,
        observedAt: collectedAt,
        collectedAt,
      },
      {
        id: `sig-github-default-branch-${baseId}`,
        organizationId,
        integrationId,
        provider: 'github',
        signalType: 'SOURCE_CODE_DEFAULT_BRANCH_STANDARD',
        resourceType: 'repository',
        resourceId: repo.id || repo.fullName,
        resourceName: repo.name,
        value: protection.defaultBranchStandard,
        metadata,
        observedAt: collectedAt,
        collectedAt,
      },
    ];
  });
}

export function registerGithubIntegrationModule(registrar: {
  route(definition: {
    method: 'GET' | 'POST';
    url: string;
    handler: (request?: { body?: unknown; params?: Record<string, string> }) => Promise<unknown>;
  }): void;
}) {
  registrar.route({
    method: 'POST',
    url: '/api/integrations/github/scan',
    handler: async (request) => {
      const service = await getRiskEngineRuntimeService();
      const startedAt = nowIso();
      const completedAt = nowIso();
      const body = (request?.body ?? {}) as { integrationId?: string; organizationId?: string; repos?: GitHubRepo[] };
      const integrationId = body.integrationId ?? 'int_github_core';
      const organizationId = body.organizationId ?? 'org_1';
      const repos = body.repos && body.repos.length > 0 ? body.repos : [{
        id: 'repo_manzen_app',
        name: 'Manzen',
        fullName: 'vinmnit159/Manzen',
        private: false,
        defaultBranch: 'main',
        visibility: 'public',
        lastScannedAt: null,
        rawData: { branchProtectionEnabled: false, requiredApprovingReviewCount: 0, secretScanningEnabled: false },
      } satisfies GitHubRepo];
      const signals = buildGithubSignals(organizationId, integrationId, repos);

      const execution: IntegrationJobExecutionRecord = {
        id: `job-github-${Date.now()}`,
        provider: 'github',
        integrationId,
        organizationId,
        jobType: 'scan',
        status: 'SUCCEEDED',
        startedAt,
        completedAt,
        metadata: { source: 'github-scan-endpoint', repositoryCount: repos.length },
      };

      const scanRun: ScanRunRecord = {
        id: `scan-github-${Date.now()}`,
        provider: 'github',
        integrationId,
        startedAt,
        completedAt,
        status: 'SUCCEEDED',
        signalsIngested: signals.length,
        testsExecuted: 0,
        risksGenerated: 0,
        trigger: 'manual',
      };

      const outcome = await service.ingestNormalizedSignals({ execution, scanRun, signals });

      return {
        success: true,
        message: 'GitHub scan completed and risk engine telemetry recorded.',
        data: {
          signals: signals.length,
          testResults: outcome.testResults.length,
          risks: outcome.risks.length,
        },
      };
    },
  });

  registrar.route({
    method: 'GET',
    url: '/api/integrations/github/risk-preview',
    handler: async () => {
      const service = await getRiskEngineRuntimeService();
      const signals = await service.listSignals();
      const githubSignals = signals.filter((signal) => signal.provider === 'github');
      const risks = (await service.listRisks()).filter((risk) => githubSignals.some((signal) => signal.resourceId === risk.resourceId));
      return { success: true, data: { signals: githubSignals, risks } };
    },
  });
}
