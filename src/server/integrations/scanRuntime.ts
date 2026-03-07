import type { IntegrationJobExecutionRecord, ScanRunRecord, SignalIngestionRecord } from '@/domain/risk-engine/types';
import { recordIntegrationScanCompleted, recordNormalizedSignal } from './pipelineHooks';

export async function runTelemetryAwareScan<T>(params: {
  execution: IntegrationJobExecutionRecord;
  scanRun: ScanRunRecord;
  run: () => Promise<T>;
}) {
  try {
    const result = await params.run();
    await recordIntegrationScanCompleted({ ...params.execution, status: 'SUCCEEDED' }, params.scanRun);
    return result;
  } catch (error) {
    await recordIntegrationScanCompleted(
      {
        ...params.execution,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown integration scan failure',
      },
      { ...params.scanRun, status: 'FAILED' },
    );
    throw error;
  }
}

export async function recordNormalizedSignals(records: SignalIngestionRecord[]) {
  for (const record of records) {
    await recordNormalizedSignal(record);
  }
}
