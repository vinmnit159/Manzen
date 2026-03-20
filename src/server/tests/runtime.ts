import { registerRiskEngineTestSyncHandler, type RiskEngineEvaluationBridgePayload } from '@/domain/tests/bridge';
import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import {
  InMemoryTestsRepository,
  seedTestFromRiskDefinition,
  ownerForRiskTest,
  mapRiskResultStatus,
  evidenceLink,
  calculateStatus,
  controlLink,
  frameworkLinks,
} from './inMemoryRepository';
import type { TestsRepository } from './repository';

/* ── re-export DTO types from contracts for external consumers ── */

export type {
  TestControlLinkDto,
  TestFrameworkLinkDto,
  TestAuditLinkDto,
  TestEvidenceLinkDto,
  TestRunRecordDto,
  TestHistoryEntryDto,
  TestRecordDto,
} from './contracts';

/* ── import DTO types for internal use ───────────────────────── */

import type {
  TestRecordDto,
  TestRunRecordDto,
} from './contracts';

export type {
  CreateTestInput,
  ListTestsInput,
  TestSummaryDto,
  UpdateTestInput,
} from './repository';

export type { RecurrenceRule } from './repository';

/* ── default org used when caller doesn't supply one ──────────── */

const DEFAULT_ORG_ID = 'org_1';

/* ── service wrapper ──────────────────────────────────────────── */

/**
 * A thin service that delegates to a {@link TestsRepository}.
 *
 * Every public method now accepts an optional `orgId` parameter.
 * When omitted it falls back to DEFAULT_ORG_ID so the existing
 * call-sites that don't pass an org continue to work unchanged.
 */
export class TestsRuntimeService {
  constructor(public readonly repo: TestsRepository) {}

  listTests(input: Parameters<TestsRepository['listTests']>[1] = {}, orgId = DEFAULT_ORG_ID) {
    return this.repo.listTests(orgId, input);
  }

  getSummary(orgId = DEFAULT_ORG_ID) {
    return this.repo.getSummary(orgId);
  }

  getTest(id: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.getTest(orgId, id);
  }

  createTest(input: Parameters<TestsRepository['createTest']>[1], orgId = DEFAULT_ORG_ID) {
    return this.repo.createTest(orgId, input);
  }

  updateTest(id: string, input: Parameters<TestsRepository['updateTest']>[2], orgId = DEFAULT_ORG_ID) {
    return this.repo.updateTest(orgId, id, input);
  }

  deleteTest(id: string, orgId = DEFAULT_ORG_ID) {
    this.repo.deleteTest(orgId, id);
  }

  completeTest(id: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.completeTest(orgId, id);
  }

  bulkComplete(testIds: string[], orgId = DEFAULT_ORG_ID) {
    return this.repo.bulkComplete(orgId, testIds);
  }

  bulkAssign(testIds: string[], ownerId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.bulkAssign(orgId, testIds, ownerId);
  }

  bulkLinkControl(testIds: string[], controlId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.bulkLinkControl(orgId, testIds, controlId);
  }

  attachEvidence(testId: string, evidenceId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.attachEvidence(orgId, testId, evidenceId);
  }

  detachEvidence(testId: string, evidenceId: string, orgId = DEFAULT_ORG_ID) {
    this.repo.detachEvidence(orgId, testId, evidenceId);
  }

  attachRunEvidenceFromRun(testId: string, run: TestRunRecordDto, orgId = DEFAULT_ORG_ID) {
    return this.repo.attachRunEvidenceFromRun(orgId, testId, run);
  }

  attachControl(testId: string, controlId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.attachControl(orgId, testId, controlId);
  }

  detachControl(testId: string, controlId: string, orgId = DEFAULT_ORG_ID) {
    this.repo.detachControl(orgId, testId, controlId);
  }

  attachAudit(testId: string, auditId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.attachAudit(orgId, testId, auditId);
  }

  detachAudit(testId: string, auditId: string, orgId = DEFAULT_ORG_ID) {
    this.repo.detachAudit(orgId, testId, auditId);
  }

  attachFramework(testId: string, frameworkName: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.attachFramework(orgId, testId, frameworkName);
  }

  detachFramework(testId: string, frameworkId: string, orgId = DEFAULT_ORG_ID) {
    this.repo.detachFramework(orgId, testId, frameworkId);
  }

  getHistory(testId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.getHistory(orgId, testId);
  }

  getRuns(testId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.getRuns(orgId, testId);
  }

  seedPolicyTests(orgId = DEFAULT_ORG_ID) {
    return this.repo.seedPolicyTests(orgId);
  }

  runAutomationBackfillOnce(orgId = DEFAULT_ORG_ID) {
    this.repo.runAutomationBackfillOnce(orgId);
  }

  applyAutomationMappings(testId: string, orgId = DEFAULT_ORG_ID) {
    return this.repo.applyAutomationMappings(orgId, testId);
  }

  /** Low-level record updater kept for enterprise.ts compatibility */
  updateRecord(testId: string, updater: (record: TestRecordDto) => TestRecordDto, orgId = DEFAULT_ORG_ID) {
    return this.repo.updateRecord(orgId, testId, updater);
  }

  /** Low-level history appender kept for enterprise.ts compatibility */
  addHistory(testId: string, changeType: string, oldValue: string | null, newValue: string | null, changedBy = 'system', orgId = DEFAULT_ORG_ID) {
    this.repo.addHistory(orgId, testId, changeType, oldValue, newValue, changedBy);
  }

  /** Expose the underlying state for enterprise.ts pipeline ingest (runs accessor) */
  get state(): { runs: Record<string, TestRunRecordDto[]> } {
    // Provide a proxy-like interface that enterprise.ts uses: service.state.runs[testId]
    const repo = this.repo;
    return {
      runs: new Proxy({} as Record<string, TestRunRecordDto[]>, {
        get(_target, prop: string) {
          return (repo as InMemoryTestsRepository).getRuns(DEFAULT_ORG_ID, prop);
        },
        set(_target, prop: string, value: TestRunRecordDto[]) {
          // enterprise.ts does: service.state.runs[test.id] = [run, ...existing].slice(0, 25);
          // Replace the full runs list for this test
          repo.setRuns(DEFAULT_ORG_ID, prop, value);
          return true;
        },
      }),
    };
  }

  /* ── risk-engine sync ────────────────────────────────────────── */

  async syncFromRiskEngine(payload: RiskEngineEvaluationBridgePayload, orgId = DEFAULT_ORG_ID) {
    for (const result of payload.testResults) {
      const definition = payload.tests.find((item) => item.id === result.testId);
      if (!definition) continue;

      const allTests = this.listTests({ page: 1, limit: 10000 }, orgId);
      const existing = allTests.find((item) => item.riskEngineTestId === definition.id);
      const signal = payload.signals.find((item) => item.id === result.signalId);
      const snapshots = payload.evidence.filter((item) => result.evidenceSnapshotIds.includes(item.id));
      const runStatus = mapRiskResultStatus(result.status);

      const record = existing ?? this.createTest({
        name: definition.name,
        category: 'Risks',
        type: 'Automated',
        ownerId: ownerForRiskTest(definition).id,
        dueDate: payload.evaluatedAt,
        recurrenceRule: 'quarterly',
        riskEngineTestId: definition.id,
      }, orgId);

      const run: TestRunRecordDto = {
        id: result.id,
        integrationId: signal?.integrationId ?? record.integrationId ?? 'risk-engine',
        testId: record.id,
        status: runStatus,
        summary: result.reason,
        rawPayload: {
          riskEngineTestId: definition.id,
          signalId: result.signalId,
          severity: result.severity,
          evidenceSnapshotIds: result.evidenceSnapshotIds,
        },
        executedAt: result.executedAt,
        durationMs: null,
      };

      this.repo.pushRun(orgId, record.id, run);

      const nextEvidence = snapshots.map(evidenceLink);
      const currentEvidence = this.getTest(record.id, orgId).evidences;
      const mergedEvidence = [...currentEvidence];
      for (const evidenceItem of nextEvidence) {
        if (!mergedEvidence.some((item) => item.evidenceId === evidenceItem.evidenceId)) {
          mergedEvidence.push(evidenceItem);
        }
      }
      const runEvidenceItem = this.buildRunEvidenceLink(record, run);
      if (runEvidenceItem && !mergedEvidence.some((item) => item.evidenceId === runEvidenceItem.evidenceId)) {
        mergedEvidence.push(runEvidenceItem);
      }

      const nextStatus = runStatus === 'Fail'
        ? 'Needs_remediation' as const
        : calculateStatus({ dueDate: record.dueDate, lastResult: runStatus });

      this.updateRecord(record.id, (current) => ({
        ...current,
        name: definition.name,
        ownerId: ownerForRiskTest(definition).id,
        owner: ownerForRiskTest(definition),
        status: nextStatus,
        riskEngineTestId: definition.id,
        controls: [controlLink(definition.controlId, definition.controlName)],
        frameworks: frameworkLinks(current.id, definition.frameworkIds),
        evidences: mergedEvidence,
        type: 'Automated',
        category: 'Risks',
        integrationId: signal?.integrationId ?? current.integrationId,
        lastRunAt: result.executedAt,
        lastResult: runStatus,
        lastResultDetails: {
          summary: result.reason,
          signalId: result.signalId,
          signalType: signal?.signalType,
          resourceName: signal?.resourceName,
        },
        autoRemediationSupported: true,
        integration: signal ? {
          id: signal.integrationId,
          provider: signal.provider.toUpperCase(),
          status: 'CONNECTED',
          metadata: {
            signalType: signal.signalType,
            resourceId: signal.resourceId,
          },
        } : current.integration,
        updatedAt: payload.evaluatedAt,
      }), orgId);

      this.addHistory(record.id, 'Risk engine sync', existing ? existing.status : null, nextStatus, 'risk-engine', orgId);
      this.applyAutomationMappings(record.id, orgId);
    }
  }

  /** private helper replicating the logic from InMemoryTestsRepository */
  private buildRunEvidenceLink(test: TestRecordDto, run: TestRunRecordDto) {
    if (run.status !== 'Pass' && run.status !== 'Fail') return null;
    const evidenceId = `run-evidence-${run.id}`;
    const resultLabel = run.status.toLowerCase();
    const testSlug = test.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64) || 'run';
    return {
      id: `evidence-link-${evidenceId}`,
      evidenceId,
      evidence: {
        id: evidenceId,
        type: run.status === 'Pass' ? 'automated-pass' : 'automated-fail',
        fileName: `${testSlug}-${resultLabel}-run.json`,
        fileUrl: null,
        createdAt: run.executedAt,
      },
    };
  }
}

/* ── bootstrap ─────────────────────────────────────────────────── */

async function createInitialRepo(): Promise<{ repo: InMemoryTestsRepository; orgId: string }> {
  const orgId = DEFAULT_ORG_ID;
  const riskEngine = await getRiskEngineRuntimeService();
  const definitions = await riskEngine.listTestDefinitions();
  const seeded = definitions.map((def) => seedTestFromRiskDefinition(def, orgId));

  const repo = new InMemoryTestsRepository();
  repo.seedOrg(orgId, {
    tests: seeded,
    history: Object.fromEntries(seeded.map((record) => [record.id, []])),
    runs: Object.fromEntries(seeded.map((record) => [record.id, []])),
  });

  return { repo, orgId };
}

let runtimePromise: Promise<TestsRuntimeService> | null = null;

export async function getTestsRuntimeService() {
  if (!runtimePromise) {
    runtimePromise = createInitialRepo().then(({ repo, orgId }) => {
      const service = new TestsRuntimeService(repo);
      service.runAutomationBackfillOnce(orgId);
      return service;
    });
  }
  return runtimePromise;
}

registerRiskEngineTestSyncHandler(async (payload) => {
  const service = await getTestsRuntimeService();
  await service.syncFromRiskEngine(payload);
});
