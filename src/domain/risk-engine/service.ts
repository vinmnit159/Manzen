import { RiskLevel } from '@/services/api/types';
import { seedEvidence, seedEvents, seedIntegrationExecutions, seedProviderStatuses, seedRules, seedScanRuns, seedSignalIngestions, seedSignals, seedTests } from './mockData';
import { InMemoryRiskEngineRepository, type RiskEngineRepository } from './repository';
import type {
  ControlTestDefinition,
  IntegrationJobExecutionRecord,
  NormalizedSignal,
  ProviderSyncStatusRecord,
  RiskEngineEventRecord,
  RiskEngineRecord,
  RiskEngineSnapshot,
  RiskRuleRecord,
  ScanRunRecord,
  SignalIngestionRecord,
  TestResultRecord,
} from './types';

function makeId(prefix: string, seed: string) {
  return `${prefix}-${seed}`;
}

function compareCondition(test: ControlTestDefinition, signal: NormalizedSignal) {
  const actual = signal.value;
  const { operator, expected } = test.condition;
  if (operator === 'equals') return actual === expected;
  if (operator === 'not_equals') return actual !== expected;
  if (typeof actual !== 'number' || typeof expected !== 'number') return false;
  if (operator === 'greater_than') return actual > expected;
  return actual < expected;
}

function durationDays(observedAt: string) {
  return Math.max(0, Math.round((Date.now() - new Date(observedAt).getTime()) / 86400000));
}

function likelihoodWeight(level: RiskLevel) {
  if (level === RiskLevel.CRITICAL) return 40;
  if (level === RiskLevel.HIGH) return 30;
  if (level === RiskLevel.MEDIUM) return 20;
  return 10;
}

function severityWeight(level: RiskLevel) {
  if (level === RiskLevel.CRITICAL) return 100;
  if (level === RiskLevel.HIGH) return 75;
  if (level === RiskLevel.MEDIUM) return 50;
  return 25;
}

function ownerForCategory(category: string) {
  if (category === 'Cloud') return 'DevOps';
  if (category === 'Identity') return 'IT & Identity';
  if (category === 'Application') return 'AppSec';
  if (category === 'Endpoint') return 'IT Operations';
  return 'Compliance';
}

function evaluateSignal(signal: NormalizedSignal, tests: ControlTestDefinition[]) {
  const matchingTests = tests.filter((test) => test.signalType === signal.signalType);
  return matchingTests.map<TestResultRecord>((test) => {
    const passed = compareCondition(test, signal);
    const status = passed ? 'PASS' : 'FAIL';
    return {
      id: makeId('tr', `${test.id}-${signal.id}`),
      organizationId: signal.organizationId,
      testId: test.id,
      signalId: signal.id,
      status,
      severity: test.severityOnFail,
      reason: passed ? `Signal matched expected condition for ${test.name}.` : `Signal value ${String(signal.value)} violated ${test.name}.`,
      executedAt: new Date().toISOString(),
      evidenceSnapshotIds: [],
    };
  });
}

function buildRisk(testResult: TestResultRecord, signal: NormalizedSignal, test: ControlTestDefinition, rule: RiskRuleRecord): RiskEngineRecord {
  const age = durationDays(signal.observedAt);
  const score = rule.severityWeight + rule.assetCriticalityWeight + age * rule.durationWeight + likelihoodWeight(rule.defaultLikelihood);
  const dedupeKey = `${signal.organizationId}:${rule.signalType}:${signal.resourceId}`;
  return {
    id: makeId('risk', `${rule.id}-${signal.resourceId}`),
    organizationId: signal.organizationId,
    dedupeKey,
    testResultId: testResult.id,
    ruleId: rule.id,
    title: test.name,
    category: rule.category,
    severity: testResult.severity,
    likelihood: rule.defaultLikelihood,
    score,
    status: 'OPEN',
    resourceId: signal.resourceId,
    resourceName: signal.resourceName,
    controlIds: [test.controlId],
    frameworkIds: test.frameworkIds,
    evidenceSnapshotIds: testResult.evidenceSnapshotIds,
    ownerTeam: ownerForCategory(rule.category),
    createdAt: testResult.executedAt,
    updatedAt: testResult.executedAt,
  };
}

export class RiskEngineFoundationService {
  constructor(private readonly repository: RiskEngineRepository) {}

  async runEvaluationCycle() {
    const [signals, tests, rules, evidence] = await Promise.all([
      this.repository.listSignals(),
      this.repository.listTests(),
      this.repository.listRules(),
      this.repository.listEvidence(),
    ]);

    const testResults = signals.flatMap((signal) => evaluateSignal(signal, tests)).map((result) => {
      const signal = signals.find((item) => item.id === result.signalId)!;
      const linkedEvidence = evidence.filter((item) => item.resourceId === signal.resourceId).map((item) => item.id);
      return { ...result, evidenceSnapshotIds: linkedEvidence };
    });

    const failedResults = testResults.filter((result) => result.status === 'FAIL');
    const risks = failedResults.map((result) => {
      const signal = signals.find((item) => item.id === result.signalId)!;
      const test = tests.find((item) => item.id === result.testId)!;
      const rule = rules.find((item) => item.signalType === signal.signalType)!;
      return buildRisk(result, signal, test, rule);
    });

    const deduped = Array.from(new Map(risks.map((risk) => [risk.dedupeKey, risk])).values());

    const scanRun: ScanRunRecord = {
      id: `scan-${Date.now()}`,
      provider: 'risk-engine',
      integrationId: 'risk-engine-foundation',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'SUCCEEDED',
      signalsIngested: signals.length,
      testsExecuted: testResults.length,
      risksGenerated: deduped.length,
      trigger: 'manual',
    };

    const jobExecution: IntegrationJobExecutionRecord = {
      id: `job-${Date.now()}`,
      provider: 'risk-engine',
      integrationId: 'risk-engine-foundation',
      organizationId: 'org_1',
      jobType: 'evaluation',
      status: 'SUCCEEDED',
      startedAt: scanRun.startedAt,
      completedAt: scanRun.completedAt,
      metadata: { scanRunId: scanRun.id },
    };

    const signalIngestions: SignalIngestionRecord[] = signals.map((signal) => ({
      id: `ingest-${signal.id}-${Date.now()}`,
      signalId: signal.id,
      provider: signal.provider,
      integrationId: signal.integrationId,
      organizationId: signal.organizationId,
      resourceId: signal.resourceId,
      ingestedAt: scanRun.completedAt,
      normalizedAt: scanRun.completedAt,
      jobExecutionId: jobExecution.id,
    }));

    const providerStatuses = await this.repository.listProviderStatuses();
    const updatedProviderStatuses = providerStatuses.map((status) => {
      const matchingSignals = signals.filter((signal) => signal.provider === status.provider && signal.integrationId === status.integrationId);
      const matchingRisks = deduped.filter((risk) => matchingSignals.some((signal) => signal.resourceId === risk.resourceId));
      return {
        ...status,
        lastSyncAt: scanRun.completedAt,
        lastSuccessAt: scanRun.completedAt,
        signalsCollected: matchingSignals.length || status.signalsCollected,
        testsEvaluated: testResults.filter((result) => matchingSignals.some((signal) => signal.id === result.signalId)).length || status.testsEvaluated,
        openRisks: matchingRisks.length,
      };
    });

    const events: RiskEngineEventRecord[] = [
      {
        id: `event-sync-${Date.now()}`,
        eventType: 'integration.sync.completed',
        provider: 'system',
        integrationId: 'risk-engine-foundation',
        organizationId: 'org_1',
        resourceId: 'risk-engine-foundation',
        severity: 'info',
        message: `Evaluation cycle completed for ${signals.length} normalized signals.`,
        createdAt: new Date().toISOString(),
        metadata: { scanRunId: scanRun.id },
      },
      ...failedResults.map((result) => ({
        id: `event-fail-${result.id}`,
        eventType: 'test.failed' as const,
        provider: signals.find((item) => item.id === result.signalId)?.provider ?? 'system',
        integrationId: signals.find((item) => item.id === result.signalId)?.integrationId ?? 'risk-engine-foundation',
        organizationId: result.organizationId,
        resourceId: signals.find((item) => item.id === result.signalId)?.resourceId ?? result.signalId,
        severity: 'critical' as const,
        message: result.reason,
        createdAt: result.executedAt,
        metadata: { testResultId: result.id, testId: result.testId },
      })),
      ...deduped.map((risk) => ({
        id: `event-risk-${risk.id}`,
        eventType: 'risk.created' as const,
        provider: 'system' as const,
        integrationId: 'risk-engine-foundation',
        organizationId: risk.organizationId,
        resourceId: risk.resourceId,
        severity: risk.severity === RiskLevel.CRITICAL || risk.severity === RiskLevel.HIGH ? 'critical' as const : 'warning' as const,
        message: `Generated risk ${risk.title} with score ${risk.score}.`,
        createdAt: risk.createdAt,
        metadata: { riskId: risk.id, dedupeKey: risk.dedupeKey },
      })),
    ];

    await Promise.all([
      this.repository.saveTestResults(testResults),
      this.repository.saveRisks(deduped),
      this.repository.saveIntegrationExecutions([jobExecution]),
      this.repository.saveSignalIngestions(signalIngestions),
      this.repository.saveProviderStatuses(updatedProviderStatuses),
      this.repository.saveScanRun(scanRun),
      this.repository.appendEvents(events),
    ]);

    return { testResults, risks: deduped };
  }

  async getSnapshot(): Promise<RiskEngineSnapshot> {
    const [signals, tests, evidence, testResults, risks] = await Promise.all([
      this.repository.listSignals(),
      this.repository.listTests(),
      this.repository.listEvidence(),
      this.repository.listTestResults(),
      this.repository.listRisks(),
    ]);

    return {
      signals: signals.length,
      tests: tests.length,
      failingTests: testResults.filter((item) => item.status === 'FAIL').length,
      evidenceSnapshots: evidence.length,
      openRisks: risks.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length,
    };
  }

  async listSignals() { return this.repository.listSignals(); }
  async listTestResults() { return this.repository.listTestResults(); }
  async listEvidence() { return this.repository.listEvidence(); }
  async listRisks() { return this.repository.listRisks(); }
  async listProviderStatuses(): Promise<ProviderSyncStatusRecord[]> { return this.repository.listProviderStatuses(); }
  async listScanRuns(): Promise<ScanRunRecord[]> { return this.repository.listScanRuns(); }
  async listEvents(): Promise<RiskEngineEventRecord[]> { return this.repository.listEvents(); }

  async ingestNormalizedSignals(params: {
    execution: IntegrationJobExecutionRecord;
    scanRun: ScanRunRecord;
    signals: NormalizedSignal[];
  }) {
    const { execution, scanRun, signals } = params;
    const currentStatuses = await this.repository.listProviderStatuses();
    const matchingStatus = currentStatuses.find((status) => status.provider === execution.provider && status.integrationId === execution.integrationId);

    const nextStatus: ProviderSyncStatusRecord = matchingStatus
      ? {
          ...matchingStatus,
          status: execution.status === 'FAILED' ? 'ERROR' : 'HEALTHY',
          lastSyncAt: execution.completedAt,
          lastSuccessAt: execution.status === 'SUCCEEDED' ? execution.completedAt : matchingStatus.lastSuccessAt,
          signalsCollected: signals.length,
        }
      : {
          id: `provider-${execution.provider}-${execution.integrationId}`,
          provider: execution.provider === 'risk-engine' ? 'system' : execution.provider,
          integrationId: execution.integrationId,
          status: execution.status === 'FAILED' ? 'ERROR' : 'HEALTHY',
          lastSyncAt: execution.completedAt,
          lastSuccessAt: execution.status === 'SUCCEEDED' ? execution.completedAt : execution.startedAt,
          signalsCollected: signals.length,
          testsEvaluated: 0,
          openRisks: 0,
        };

    const statuses = matchingStatus
      ? currentStatuses.map((status) => (status.id === matchingStatus.id ? nextStatus : status))
      : [nextStatus, ...currentStatuses];

    const ingestions: SignalIngestionRecord[] = signals.map((signal) => ({
      id: `ingest-${signal.id}-${Date.now()}`,
      signalId: signal.id,
      provider: signal.provider,
      integrationId: signal.integrationId,
      organizationId: signal.organizationId,
      resourceId: signal.resourceId,
      ingestedAt: execution.completedAt,
      normalizedAt: execution.completedAt,
      jobExecutionId: execution.id,
    }));

    const events: RiskEngineEventRecord[] = [
      {
        id: `event-exec-${execution.id}`,
        eventType: 'integration.sync.completed',
        provider: execution.provider,
        integrationId: execution.integrationId,
        organizationId: execution.organizationId,
        resourceId: execution.integrationId,
        severity: execution.status === 'FAILED' ? 'critical' : 'info',
        message: execution.status === 'FAILED' ? `Integration execution failed: ${execution.errorMessage ?? 'unknown error'}` : `Integration execution completed with ${signals.length} normalized signals.`,
        createdAt: execution.completedAt,
        metadata: execution.metadata,
      },
      ...ingestions.map((record) => ({
        id: `event-ingest-${record.id}`,
        eventType: 'signal.normalized' as const,
        provider: record.provider,
        integrationId: record.integrationId,
        organizationId: record.organizationId,
        resourceId: record.resourceId,
        severity: 'info' as const,
        message: `Signal ${record.signalId} normalized for ${record.resourceId}.`,
        createdAt: record.normalizedAt,
        metadata: { signalId: record.signalId, jobExecutionId: record.jobExecutionId },
      })),
    ];

    await Promise.all([
      this.repository.saveSignals(signals),
      this.repository.saveIntegrationExecutions([execution]),
      this.repository.saveSignalIngestions(ingestions),
      this.repository.saveProviderStatuses(statuses),
      this.repository.saveScanRun(scanRun),
      this.repository.appendEvents(events),
    ]);

    return this.runEvaluationCycle();
  }

  async recordIntegrationExecution(execution: IntegrationJobExecutionRecord, relatedScanRun?: ScanRunRecord) {
    const currentStatuses = await this.repository.listProviderStatuses();
    const matchingStatus = currentStatuses.find((status) => status.provider === execution.provider && status.integrationId === execution.integrationId);
    const nextStatus: ProviderSyncStatusRecord = matchingStatus
      ? {
          ...matchingStatus,
          status: execution.status === 'FAILED' ? 'ERROR' : 'HEALTHY',
          lastSyncAt: execution.completedAt,
          lastSuccessAt: execution.status === 'SUCCEEDED' ? execution.completedAt : matchingStatus.lastSuccessAt,
        }
      : {
          id: `provider-${execution.provider}-${execution.integrationId}`,
          provider: execution.provider === 'risk-engine' ? 'system' : execution.provider,
          integrationId: execution.integrationId,
          status: execution.status === 'FAILED' ? 'ERROR' : 'HEALTHY',
          lastSyncAt: execution.completedAt,
          lastSuccessAt: execution.status === 'SUCCEEDED' ? execution.completedAt : execution.startedAt,
          signalsCollected: 0,
          testsEvaluated: 0,
          openRisks: 0,
        };

    const nextStatuses = matchingStatus
      ? currentStatuses.map((status) => (status.id === matchingStatus.id ? nextStatus : status))
      : [nextStatus, ...currentStatuses];

    const events: RiskEngineEventRecord[] = [
      {
        id: `event-job-${execution.id}`,
        eventType: 'integration.sync.completed',
        provider: execution.provider,
        integrationId: execution.integrationId,
        organizationId: execution.organizationId,
        resourceId: execution.integrationId,
        severity: execution.status === 'FAILED' ? 'critical' : 'info',
        message: execution.status === 'FAILED' ? `Integration execution failed: ${execution.errorMessage ?? 'unknown error'}` : 'Integration execution completed successfully.',
        createdAt: execution.completedAt,
        metadata: execution.metadata,
      },
    ];

    await Promise.all([
      this.repository.saveIntegrationExecutions([execution]),
      this.repository.saveProviderStatuses(nextStatuses),
      this.repository.appendEvents(events),
      relatedScanRun ? this.repository.saveScanRun(relatedScanRun) : Promise.resolve(),
    ]);
  }

  async recordSignalIngestion(record: SignalIngestionRecord) {
    const signals = await this.repository.listSignals();
    const signal = signals.find((item) => item.id === record.signalId);
    const statuses = await this.repository.listProviderStatuses();
    const matchingStatus = statuses.find((status) => status.provider === record.provider && status.integrationId === record.integrationId);
    const nextStatuses = matchingStatus
      ? statuses.map((status) => status.id === matchingStatus.id ? { ...status, signalsCollected: status.signalsCollected + 1, lastSyncAt: record.normalizedAt } : status)
      : statuses;

    await Promise.all([
      this.repository.saveSignalIngestions([record]),
      this.repository.saveProviderStatuses(nextStatuses),
      this.repository.appendEvents([
        {
          id: `event-ingest-${record.id}`,
          eventType: signal ? 'signal.normalized' : 'signal.ingested',
          provider: record.provider,
          integrationId: record.integrationId,
          organizationId: record.organizationId,
          resourceId: record.resourceId,
          severity: 'info',
          message: signal ? `Signal ${record.signalId} normalized for ${record.resourceId}.` : `Signal ${record.signalId} ingested for ${record.resourceId}.`,
          createdAt: record.normalizedAt,
          metadata: { signalId: record.signalId, jobExecutionId: record.jobExecutionId },
        },
      ]),
    ]);
  }
}

export function createInMemoryRiskEngineFoundationService() {
  const repository = new InMemoryRiskEngineRepository({
    signals: seedSignals,
    tests: seedTests,
    rules: seedRules,
    evidence: seedEvidence,
    integrationExecutions: seedIntegrationExecutions,
    signalIngestions: seedSignalIngestions,
    providerStatuses: seedProviderStatuses,
    scanRuns: seedScanRuns,
    events: seedEvents,
    testResults: [],
    risks: [],
  });

  return new RiskEngineFoundationService(repository);
}

export const riskEngineFoundationService = createInMemoryRiskEngineFoundationService();
