import type {
  ControlTestDefinition,
  EvidenceSnapshotRecord,
  NormalizedSignal,
  TestResultRecord,
} from '@/domain/risk-engine/types';

export interface RiskEngineEvaluationBridgePayload {
  evaluatedAt: string;
  tests: ControlTestDefinition[];
  testResults: TestResultRecord[];
  signals: NormalizedSignal[];
  evidence: EvidenceSnapshotRecord[];
}

export type RiskEngineTestSyncHandler = (payload: RiskEngineEvaluationBridgePayload) => Promise<void> | void;

let registeredHandler: RiskEngineTestSyncHandler | null = null;

export function registerRiskEngineTestSyncHandler(handler: RiskEngineTestSyncHandler) {
  registeredHandler = handler;
}

export async function notifyRiskEngineTestSync(payload: RiskEngineEvaluationBridgePayload) {
  if (!registeredHandler) return;
  await registeredHandler(payload);
}
