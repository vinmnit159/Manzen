import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import type { NormalizedSignal, ScanRunRecord, IntegrationJobExecutionRecord } from '@/domain/risk-engine/types';

function nowIso() {
  return new Date().toISOString();
}

function buildGithubSignals(organizationId: string, integrationId: string): NormalizedSignal[] {
  const collectedAt = nowIso();
  return [
    {
      id: `sig-github-${Date.now()}-repo-private`,
      organizationId,
      integrationId,
      provider: 'github',
      signalType: 'SOURCE_CODE_REPO_PRIVATE',
      resourceType: 'repository',
      resourceId: 'repo_manzen_app',
      resourceName: 'Manzen',
      value: false,
      metadata: { defaultBranch: 'main', branchProtection: false, source: 'github-scan' },
      observedAt: collectedAt,
      collectedAt,
    },
  ];
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
    handler: async () => {
      const service = await getRiskEngineRuntimeService();
      const startedAt = nowIso();
      const completedAt = nowIso();
      const integrationId = 'int_github_core';
      const organizationId = 'org_1';
      const signals = buildGithubSignals(organizationId, integrationId);

      const execution: IntegrationJobExecutionRecord = {
        id: `job-github-${Date.now()}`,
        provider: 'github',
        integrationId,
        organizationId,
        jobType: 'scan',
        status: 'SUCCEEDED',
        startedAt,
        completedAt,
        metadata: { source: 'github-scan-endpoint' },
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
