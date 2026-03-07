import { riskEngineFoundationService } from '@/domain/risk-engine/service';
import { getRiskEngineRuntimeService } from './runtime';
import { riskEngineContracts } from './contracts';

type MaybePromise<T> = T | Promise<T>;

export interface RiskEngineHandlerDeps {
  service?: typeof riskEngineFoundationService;
}

function ok<T>(data: T) {
  return { success: true as const, data };
}

export function createRiskEngineHandlers(deps: RiskEngineHandlerDeps = {}) {
  return {
    async getSnapshot() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.getSnapshot();
      return riskEngineContracts.getSnapshot.response.parse(ok(data));
    },

    async listSignals() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listSignals();
      return riskEngineContracts.listSignals.response.parse(ok(data));
    },

    async listTestResults() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listTestResults();
      return riskEngineContracts.listTestResults.response.parse(ok(data));
    },

    async listEvidence() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listEvidence();
      return riskEngineContracts.listEvidence.response.parse(ok(data));
    },

    async listGeneratedRisks() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listRisks();
      return riskEngineContracts.listGeneratedRisks.response.parse(ok(data));
    },

    async listProviderStatuses() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listProviderStatuses();
      return riskEngineContracts.listProviderStatuses.response.parse(ok(data));
    },

    async listScanRuns() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listScanRuns();
      return riskEngineContracts.listScanRuns.response.parse(ok(data));
    },

    async listEvents() {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const data = await service.listEvents();
      return riskEngineContracts.listEvents.response.parse(ok(data));
    },

    async runEvaluation(rawBody?: unknown) {
      const service = deps.service ?? await getRiskEngineRuntimeService();
      const body = riskEngineContracts.runEvaluation.body.parse(rawBody ?? {});
      if (!body.dryRun) {
        const outcome = await service.runEvaluationCycle();
        return riskEngineContracts.runEvaluation.response.parse(ok({
          testResultsCreated: outcome.testResults.length,
          generatedRisks: outcome.risks.length,
          dryRun: false,
        }));
      }

      const [signals, tests] = await Promise.all([service.listSignals(), service.listTestResults()]);
      return riskEngineContracts.runEvaluation.response.parse(ok({
        testResultsCreated: Math.max(tests.length, signals.length),
        generatedRisks: 0,
        dryRun: true,
      }));
    },
  } satisfies Record<string, (...args: any[]) => MaybePromise<unknown>>;
}
