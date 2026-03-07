import type { IntegrationJobExecutionRecord, ScanRunRecord, SignalIngestionRecord } from '@/domain/risk-engine/types';
import { riskEngineIntegrationTelemetry } from '@/server/risk-engine/integrationTelemetry';

export async function recordIntegrationScanCompleted(execution: IntegrationJobExecutionRecord, scanRun?: ScanRunRecord) {
  await riskEngineIntegrationTelemetry.recordExecution(execution, scanRun);
}

export async function recordNormalizedSignal(record: SignalIngestionRecord) {
  await riskEngineIntegrationTelemetry.recordSignalIngestion(record);
}

export function createTelemetryAwareIntegrationPipeline(provider: IntegrationJobExecutionRecord['provider'], integrationId: string, organizationId: string) {
  return {
    async recordSuccess(params: { jobId: string; startedAt: string; completedAt: string; scanRun?: ScanRunRecord; metadata?: Record<string, unknown> }) {
      await recordIntegrationScanCompleted(
        {
          id: params.jobId,
          provider,
          integrationId,
          organizationId,
          jobType: 'scan',
          status: 'SUCCEEDED',
          startedAt: params.startedAt,
          completedAt: params.completedAt,
          metadata: params.metadata ?? {},
        },
        params.scanRun,
      );
    },
    async recordFailure(params: { jobId: string; startedAt: string; completedAt: string; errorMessage: string; scanRun?: ScanRunRecord; metadata?: Record<string, unknown> }) {
      await recordIntegrationScanCompleted(
        {
          id: params.jobId,
          provider,
          integrationId,
          organizationId,
          jobType: 'scan',
          status: 'FAILED',
          startedAt: params.startedAt,
          completedAt: params.completedAt,
          errorMessage: params.errorMessage,
          metadata: params.metadata ?? {},
        },
        params.scanRun,
      );
    },
    async recordSignal(record: Omit<SignalIngestionRecord, 'provider' | 'integrationId' | 'organizationId'>) {
      await recordNormalizedSignal({
        ...record,
        provider: provider === 'risk-engine' ? 'system' : provider,
        integrationId,
        organizationId,
      });
    },
  };
}
