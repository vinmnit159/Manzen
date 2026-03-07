import { riskEngineFoundationService } from '@/domain/risk-engine/service';
import { riskEngineContracts, type RunEvaluationRequestDto } from './riskEngineContracts';

export const riskEngineService = {
  async runFoundationCycle() {
    return riskEngineFoundationService.runEvaluationCycle();
  },

  async getFoundationSnapshot() {
    const snapshot = await riskEngineFoundationService.getSnapshot();
    return riskEngineContracts.getSnapshot.response.parse({ success: true, data: snapshot });
  },

  async getSignals() {
    const signals = await riskEngineFoundationService.listSignals();
    return riskEngineContracts.listSignals.response.parse({ success: true, data: signals });
  },

  async getTestResults() {
    const results = await riskEngineFoundationService.listTestResults();
    return riskEngineContracts.listTestResults.response.parse({ success: true, data: results });
  },

  async getEvidenceSnapshots() {
    const evidence = await riskEngineFoundationService.listEvidence();
    return riskEngineContracts.listEvidence.response.parse({ success: true, data: evidence });
  },

  async getGeneratedRisks() {
    const risks = await riskEngineFoundationService.listRisks();
    return riskEngineContracts.listGeneratedRisks.response.parse({ success: true, data: risks });
  },

  async getProviderStatuses() {
    const statuses = await riskEngineFoundationService.listProviderStatuses();
    return riskEngineContracts.listProviderStatuses.response.parse({ success: true, data: statuses });
  },

  async getScanRuns() {
    const runs = await riskEngineFoundationService.listScanRuns();
    return riskEngineContracts.listScanRuns.response.parse({ success: true, data: runs });
  },

  async getEvents() {
    const events = await riskEngineFoundationService.listEvents();
    return riskEngineContracts.listEvents.response.parse({ success: true, data: events });
  },

  async runEvaluation(input?: RunEvaluationRequestDto) {
    const body = riskEngineContracts.runEvaluation.body.parse(input ?? {});
    if (body.dryRun) {
      const signals = await riskEngineFoundationService.listSignals();
      return riskEngineContracts.runEvaluation.response.parse({
        success: true,
        data: {
          testResultsCreated: signals.length,
          generatedRisks: 0,
          dryRun: true,
        },
      });
    }

    const outcome = await riskEngineFoundationService.runEvaluationCycle();
    return riskEngineContracts.runEvaluation.response.parse({
      success: true,
      data: {
        testResultsCreated: outcome.testResults.length,
        generatedRisks: outcome.risks.length,
        dryRun: false,
      },
    });
  },
};
