import type { IntegrationJobExecutionRecord, ScanRunRecord } from '@/domain/risk-engine/types';
import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import { getIntegrationProviderAdapter, type IntegrationScanPayload } from './providerAdapters';

function nowIso() {
  return new Date().toISOString();
}

const SUPPORTED_ROUTE_KEYS = ['aws', 'azure', 'cloudflare', 'fleet', 'okta', 'snyk', 'workspace'] as const;

export function registerGenericIntegrationModules(registrar: {
  route(definition: {
    method: 'POST';
    url: string;
    // user is injected by the global authenticate preHandler and passed by server/app.ts
    handler: (request?: {
      body?: unknown;
      params?: Record<string, string>;
      user?: { id: string; organizationId: string; role: string };
    }) => Promise<unknown>;
  }): void;
}) {
  for (const routeKey of SUPPORTED_ROUTE_KEYS) {
    registrar.route({
      method: 'POST',
      url: `/api/integrations/${routeKey}/:integrationId/scan`,
      handler: async (request) => {
        // Derive organization from the authenticated user — never from the request body.
        // Accepting organizationId from the body would allow any authenticated user to
        // inject signals into a different tenant's risk engine state.
        const organizationId = request?.user?.organizationId;
        if (!organizationId) {
          return { success: false, error: 'Unauthorized: missing organization context' };
        }

        const integrationId = request?.params?.integrationId ?? `int_${routeKey}_core`;
        const body = (request?.body ?? {}) as IntegrationScanPayload;
        const adapter = getIntegrationProviderAdapter(routeKey);
        if (!adapter) {
          return { success: false, error: `No adapter configured for ${routeKey}` };
        }

        const startedAt = nowIso();
        const completedAt = nowIso();
        const records = body.records ?? [];
        const signals = adapter.buildSignals({ organizationId, integrationId, records, collectedAt: completedAt });

        const execution: IntegrationJobExecutionRecord = {
          id: `job-${routeKey}-${Date.now()}`,
          provider: adapter.provider,
          integrationId,
          organizationId,
          jobType: 'scan',
          status: 'SUCCEEDED',
          startedAt,
          completedAt,
          metadata: { routeKey, recordCount: records.length },
        };

        const scanRun: ScanRunRecord = {
          id: `scan-${routeKey}-${Date.now()}`,
          provider: adapter.provider,
          integrationId,
          startedAt,
          completedAt,
          status: 'SUCCEEDED',
          signalsIngested: signals.length,
          testsExecuted: 0,
          risksGenerated: 0,
          trigger: 'manual',
        };

        const service = await getRiskEngineRuntimeService();
        const outcome = await service.ingestNormalizedSignals({ execution, scanRun, signals });

        return {
          success: true,
          message: `${routeKey} scan completed and ingested into the risk engine.`,
          data: {
            signals: signals.length,
            testResults: outcome.testResults.length,
            risks: outcome.risks.length,
          },
        };
      },
    });
  }
}
