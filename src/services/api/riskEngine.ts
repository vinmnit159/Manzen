import { apiClient } from './client';
import { riskEngineContracts, type RunEvaluationRequestDto } from './riskEngineContracts';

const BASE = '/api/risk-engine';

export const riskEngineService = {
  async runFoundationCycle() {
    return apiClient.post<unknown>(`${BASE}/run`);
  },

  async getFoundationSnapshot() {
    const raw = await apiClient.get<unknown>(`${BASE}/snapshot`);
    return riskEngineContracts.getSnapshot.response.parse(raw);
  },

  async getSignals() {
    const raw = await apiClient.get<unknown>(`${BASE}/signals`);
    return riskEngineContracts.listSignals.response.parse(raw);
  },

  async getTestResults() {
    const raw = await apiClient.get<unknown>(`${BASE}/test-results`);
    return riskEngineContracts.listTestResults.response.parse(raw);
  },

  async getEvidenceSnapshots() {
    const raw = await apiClient.get<unknown>(`${BASE}/evidence-snapshots`);
    return riskEngineContracts.listEvidence.response.parse(raw);
  },

  async getGeneratedRisks() {
    const raw = await apiClient.get<unknown>(`${BASE}/generated-risks`);
    return riskEngineContracts.listGeneratedRisks.response.parse(raw);
  },

  async getProviderStatuses() {
    const raw = await apiClient.get<unknown>(`${BASE}/provider-statuses`);
    return riskEngineContracts.listProviderStatuses.response.parse(raw);
  },

  async getScanRuns() {
    const raw = await apiClient.get<unknown>(`${BASE}/scan-runs`);
    return riskEngineContracts.listScanRuns.response.parse(raw);
  },

  async getEvents() {
    const raw = await apiClient.get<unknown>(`${BASE}/events`);
    return riskEngineContracts.listEvents.response.parse(raw);
  },

  async runEvaluation(input?: RunEvaluationRequestDto) {
    const body = riskEngineContracts.runEvaluation.body.parse(input ?? {});
    const raw = await apiClient.post<unknown>(`${BASE}/run`, body);
    return riskEngineContracts.runEvaluation.response.parse(raw);
  },
};
