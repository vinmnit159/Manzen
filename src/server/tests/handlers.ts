import { testsContracts } from './contracts';
import {
  createTestSuiteFromTemplate,
  exportTestsBundle,
  getGapAnalysis as getTestGapAnalysis,
  getTestRiskContext,
  getTestsDashboard,
  ingestPipelineRun,
  listEscalations,
  listSecurityEvents,
  listTestTemplates,
  listUnifiedEvidence,
  requestAttestation,
  runAutoRemediation,
  signAttestation,
} from './enterprise';
import { getTestsRuntimeService } from './runtime';

function ok<T>(data: T) {
  return { success: true as const, data };
}

export function createTestsHandlers() {
  return {
    async listTests(request?: { query?: unknown }) {
      const service = await getTestsRuntimeService();
      const query = testsContracts.listTests.query.parse(request?.query ?? {});
      return testsContracts.listTests.response.parse(ok(service.listTests(query)));
    },

    async getSummary() {
      const service = await getTestsRuntimeService();
      return testsContracts.getSummary.response.parse(ok(service.getSummary()));
    },

    async getDashboard() {
      return testsContracts.getDashboard.response.parse(ok(await getTestsDashboard()));
    },

    async getGapAnalysis() {
      return testsContracts.getGapAnalysis.response.parse(ok(await getTestGapAnalysis()));
    },

    async listTemplates() {
      return testsContracts.listTemplates.response.parse(ok(await listTestTemplates()));
    },

    async createSuiteFromTemplate(request?: { params?: Record<string, string> }) {
      return testsContracts.createSuiteFromTemplate.response.parse(ok(await createTestSuiteFromTemplate(request?.params?.templateId ?? '')));
    },

    async getTest(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      return testsContracts.getTest.response.parse(ok(service.getTest(request?.params?.id ?? '')));
    },

    async createTest(request?: { body?: unknown }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.createTest.body.parse(request?.body ?? {});
      return testsContracts.createTest.response.parse(ok(service.createTest(body)));
    },

    async updateTest(request?: { body?: unknown; params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.updateTest.body.parse(request?.body ?? {});
      return testsContracts.updateTest.response.parse(ok(service.updateTest(request?.params?.id ?? '', body)));
    },

    async deleteTest(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      service.deleteTest(request?.params?.id ?? '');
      return testsContracts.deleteTest.response.parse(ok({ deleted: true as const }));
    },

    async completeTest(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      return testsContracts.completeTest.response.parse(ok(service.completeTest(request?.params?.id ?? '')));
    },

    async attachEvidence(request?: { body?: unknown; params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.attachEvidence.body.parse(request?.body ?? {});
      return testsContracts.attachEvidence.response.parse(ok(service.attachEvidence(request?.params?.id ?? '', body.evidenceId)));
    },

    async detachEvidence(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      service.detachEvidence(request?.params?.id ?? '', request?.params?.evidenceId ?? '');
      return testsContracts.detachEvidence.response.parse(ok({ deleted: true as const }));
    },

    async attachControl(request?: { body?: unknown; params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.attachControl.body.parse(request?.body ?? {});
      return testsContracts.attachControl.response.parse(ok(service.attachControl(request?.params?.id ?? '', body.controlId)));
    },

    async detachControl(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      service.detachControl(request?.params?.id ?? '', request?.params?.controlId ?? '');
      return testsContracts.detachControl.response.parse(ok({ deleted: true as const }));
    },

    async attachAudit(request?: { body?: unknown; params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.attachAudit.body.parse(request?.body ?? {});
      return testsContracts.attachAudit.response.parse(ok(service.attachAudit(request?.params?.id ?? '', body.auditId)));
    },

    async detachAudit(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      service.detachAudit(request?.params?.id ?? '', request?.params?.auditId ?? '');
      return testsContracts.detachAudit.response.parse(ok({ deleted: true as const }));
    },

    async attachFramework(request?: { body?: unknown; params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.attachFramework.body.parse(request?.body ?? {});
      return testsContracts.attachFramework.response.parse(ok(service.attachFramework(request?.params?.id ?? '', body.frameworkName)));
    },

    async detachFramework(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      service.detachFramework(request?.params?.id ?? '', request?.params?.frameworkId ?? '');
      return testsContracts.detachFramework.response.parse(ok({ deleted: true as const }));
    },

    async getHistory(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      return testsContracts.getHistory.response.parse(ok(service.getHistory(request?.params?.id ?? '')));
    },

    async seedTests() {
      const service = await getTestsRuntimeService();
      return testsContracts.seedTests.response.parse(ok(service.seedPolicyTests()));
    },

    async getRuns(request?: { params?: Record<string, string> }) {
      const service = await getTestsRuntimeService();
      return testsContracts.getRuns.response.parse(ok(service.getRuns(request?.params?.id ?? '')));
    },

    async getRiskContext(request?: { params?: Record<string, string> }) {
      return testsContracts.getRiskContext.response.parse(ok(await getTestRiskContext(request?.params?.id ?? '')));
    },

    async requestAttestation(request?: { body?: unknown; params?: Record<string, string> }) {
      const body = testsContracts.requestAttestation.body.parse(request?.body ?? {});
      return testsContracts.requestAttestation.response.parse(ok(await requestAttestation(request?.params?.id ?? '', body.reviewerId)));
    },

    async signAttestation(request?: { body?: unknown; params?: Record<string, string> }) {
      const body = testsContracts.signAttestation.body.parse(request?.body ?? {});
      return testsContracts.signAttestation.response.parse(ok(await signAttestation(request?.params?.id ?? '', body.reviewerId)));
    },

    async autoRemediate(request?: { params?: Record<string, string> }) {
      return testsContracts.autoRemediate.response.parse(ok(await runAutoRemediation(request?.params?.id ?? '')));
    },

    async exportTests(request?: { query?: unknown }) {
      const query = testsContracts.exportTests.query.parse(request?.query ?? {});
      return testsContracts.exportTests.response.parse(ok(await exportTestsBundle(query.format, query.framework)));
    },

    async ingestPipelineRun(request?: { body?: unknown }) {
      const body = testsContracts.ingestPipelineRun.body.parse(request?.body ?? {});
      return testsContracts.ingestPipelineRun.response.parse(ok(await ingestPipelineRun(body)));
    },

    async listSecurityEvents() {
      return testsContracts.listSecurityEvents.response.parse(ok(await listSecurityEvents()));
    },

    async listUnifiedEvidence() {
      return testsContracts.listUnifiedEvidence.response.parse(ok(await listUnifiedEvidence()));
    },

    async listEscalations() {
      return testsContracts.listEscalations.response.parse(ok(await listEscalations()));
    },

    async bulkComplete(request?: { body?: unknown }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.bulkComplete.body.parse(request?.body ?? {});
      return testsContracts.bulkComplete.response.parse(ok(service.bulkComplete(body.testIds)));
    },

    async bulkAssign(request?: { body?: unknown }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.bulkAssign.body.parse(request?.body ?? {});
      return testsContracts.bulkAssign.response.parse(ok(service.bulkAssign(body.testIds, body.ownerId)));
    },

    async bulkLinkControl(request?: { body?: unknown }) {
      const service = await getTestsRuntimeService();
      const body = testsContracts.bulkLinkControl.body.parse(request?.body ?? {});
      return testsContracts.bulkLinkControl.response.parse(ok(service.bulkLinkControl(body.testIds, body.controlId)));
    },
  };
}
