import type { IntegrationJobExecutionRecord, ScanRunRecord, SignalIngestionRecord } from '@/domain/risk-engine/types';
import { getRiskEngineRuntimeService } from './runtime';

export const riskEngineIntegrationTelemetry = {
  async recordExecution(execution: IntegrationJobExecutionRecord, scanRun?: ScanRunRecord) {
    const service = await getRiskEngineRuntimeService();
    await service.recordIntegrationExecution(execution, scanRun);
  },

  async recordSignalIngestion(record: SignalIngestionRecord) {
    const service = await getRiskEngineRuntimeService();
    await service.recordSignalIngestion(record);
  },
};
