import { addMonths, addWeeks, addYears, differenceInCalendarDays } from 'date-fns';
import { registerRiskEngineTestSyncHandler, type RiskEngineEvaluationBridgePayload } from '@/domain/tests/bridge';
import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import type { ControlTestDefinition, EvidenceSnapshotRecord, TestResultRecord } from '@/domain/risk-engine/types';

type TestCategory = 'Custom' | 'Engineering' | 'HR' | 'IT' | 'Policy' | 'Risks';
type TestType = 'Document' | 'Automated' | 'Pipeline';
type TestStatus = 'Due_soon' | 'Needs_remediation' | 'OK' | 'Overdue';
type TestRunStatus = 'Pass' | 'Fail' | 'Warning' | 'Not_Run';
type RecurrenceRule = 'weekly' | 'monthly' | 'quarterly' | 'annual';
type AttestationStatus = 'Not_requested' | 'Pending_review' | 'Attested';

export interface TestControlLinkDto {
  id: string;
  controlId: string;
  control: { id: string; isoReference: string; title: string; status: string };
}

export interface TestFrameworkLinkDto {
  id: string;
  testId: string;
  frameworkName: string;
}

export interface TestAuditLinkDto {
  id: string;
  auditId: string;
  audit: { id: string; type: string; auditor: string; scope: string };
}

export interface TestEvidenceLinkDto {
  id: string;
  evidenceId: string;
  evidence: {
    id: string;
    type: string;
    fileName: string | null;
    fileUrl: string | null;
    createdAt: string;
  };
}

export interface TestRunRecordDto {
  id: string;
  integrationId: string;
  testId: string;
  status: TestRunStatus;
  summary: string;
  rawPayload: Record<string, unknown> | null;
  executedAt: string;
  durationMs: number | null;
}

export interface TestHistoryEntryDto {
  id: string;
  testId: string;
  changedBy: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TestRecordDto {
  id: string;
  name: string;
  category: TestCategory;
  type: TestType;
  status: TestStatus;
  ownerId: string;
  owner?: { id: string; name: string; email: string };
  dueDate: string;
  nextDueDate: string | null;
  recurrenceRule: RecurrenceRule | null;
  completedAt: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  riskEngineTestId: string | null;
  templateId?: string | null;
  attestationStatus?: AttestationStatus;
  reviewerId?: string | null;
  reviewer?: { id: string; name: string; email: string } | null;
  attestedAt?: string | null;
  automationKind?: 'standard' | 'pipeline';
  pipelineProvider?: string | null;
  lastRemediationAt?: string | null;
  controls: TestControlLinkDto[];
  frameworks: TestFrameworkLinkDto[];
  audits: TestAuditLinkDto[];
  evidences: TestEvidenceLinkDto[];
  integrationId?: string | null;
  lastRunAt?: string | null;
  lastResult?: TestRunStatus;
  lastResultDetails?: Record<string, unknown> | null;
  autoRemediationSupported?: boolean;
  integration?: { id: string; provider: string; status: string; metadata?: Record<string, string> } | null;
}

interface TestSummaryDto {
  total: number;
  completed: number;
  passPercentage: number;
  overdue: number;
  dueSoon: number;
}

interface CreateTestInput {
  name: string;
  category: TestCategory;
  type: TestType;
  ownerId: string;
  dueDate: string;
  recurrenceRule?: RecurrenceRule | null;
  riskEngineTestId?: string | null;
  templateId?: string | null;
}

interface UpdateTestInput {
  name?: string;
  category?: TestCategory;
  type?: TestType;
  ownerId?: string;
  dueDate?: string;
  recurrenceRule?: RecurrenceRule | null;
  status?: TestStatus;
  riskEngineTestId?: string | null;
}

interface ListTestsInput {
  page?: number;
  limit?: number;
  category?: TestCategory | '';
  status?: TestStatus | '';
  type?: TestType | '';
  ownerId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
}

const DEFAULT_ORG_ID = 'org_1';
const DEFAULT_OWNER_ID = 'user-compliance';

const OWNER_DIRECTORY = {
  'user-compliance': { id: 'user-compliance', name: 'Compliance Ops', email: 'compliance@manzen.dev' },
  'user-appsec': { id: 'user-appsec', name: 'AppSec Team', email: 'appsec@manzen.dev' },
  'user-devops': { id: 'user-devops', name: 'DevOps Team', email: 'devops@manzen.dev' },
  'user-it': { id: 'user-it', name: 'IT Operations', email: 'it@manzen.dev' },
 } as const;

const POLICY_TEST_TEMPLATES = [
  'Access review attestation',
  'Background checks validation',
  'Security awareness completion',
  'Offboarding evidence review',
  'Vendor due diligence sample',
  'Incident response tabletop',
  'Endpoint hardening spot check',
  'Encryption key rotation review',
  'Backup restore validation',
  'Log retention confirmation',
  'Joiner/mover/leaver audit',
  'Privilege recertification',
  'Policy acknowledgement sample',
  'Change management walkthrough',
];

const TEMPLATE_AUTOMATION_MAPPINGS: Record<string, { controls: string[]; frameworks: string[] }> = {
  'iso-cloud-hardening': {
    controls: ['Cloud configuration baseline', 'Perimeter hardening'],
    frameworks: ['ISO 27001'],
  },
  'nist-devsecops': {
    controls: ['Secure SDLC guardrails', 'Vulnerability remediation SLA'],
    frameworks: ['NIST'],
  },
};

const PROVIDER_AUTOMATION_MAPPINGS: Array<{ providers: string[]; controls: string[]; frameworks: string[] }> = [
  {
    providers: ['AWS', 'CLOUD_AWS'],
    controls: ['Cloud configuration baseline', 'Infrastructure exposure checks'],
    frameworks: ['ISO 27001', 'SOC 2'],
  },
  {
    providers: ['AZURE', 'CLOUD_AZURE'],
    controls: ['Cloud configuration baseline', 'Identity and access baseline'],
    frameworks: ['ISO 27001', 'SOC 2'],
  },
  {
    providers: ['GCP', 'CLOUD_GCP'],
    controls: ['Cloud configuration baseline', 'Identity and access baseline'],
    frameworks: ['ISO 27001', 'SOC 2'],
  },
  {
    providers: ['CLOUDFLARE', 'NETWORK_CLOUDFLARE'],
    controls: ['Perimeter hardening', 'Network edge protection'],
    frameworks: ['ISO 27001', 'SOC 2'],
  },
  {
    providers: ['GITHUB_ACTIONS', 'GITHUB', 'SOURCE_CODE_GITHUB'],
    controls: ['Secure SDLC guardrails', 'Vulnerability remediation SLA'],
    frameworks: ['NIST', 'SOC 2'],
  },
  {
    providers: ['SPLUNK', 'SIEM', 'SUMOLOGIC'],
    controls: ['Security monitoring and alerting', 'Retention and encryption checks'],
    frameworks: ['SOC 2', 'ISO 27001'],
  },
  {
    providers: ['JIRA'],
    controls: ['Remediation workflow governance'],
    frameworks: ['SOC 2'],
  },
  {
    providers: ['SLACK'],
    controls: ['Incident communication workflow'],
    frameworks: ['SOC 2'],
  },
];

interface TestsState {
  tests: TestRecordDto[];
  history: Record<string, TestHistoryEntryDto[]>;
  runs: Record<string, TestRunRecordDto[]>;
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function ownerForId(ownerId: string) {
  return OWNER_DIRECTORY[ownerId as keyof typeof OWNER_DIRECTORY] ?? {
    id: ownerId,
    name: ownerId,
    email: `${ownerId}@manzen.dev`,
  };
}

function ownerForRiskTest(test: ControlTestDefinition) {
  if (test.signalType.startsWith('IDENTITY_')) return ownerForId('user-it');
  if (test.signalType.startsWith('SOURCE_CODE_') || test.signalType.startsWith('VULNERABILITY_')) return ownerForId('user-appsec');
  if (test.signalType.startsWith('CLOUD_') || test.signalType.startsWith('NETWORK_')) return ownerForId('user-devops');
  return ownerForId(DEFAULT_OWNER_ID);
}

function recurrenceDueDate(base: Date, recurrenceRule: RecurrenceRule) {
  if (recurrenceRule === 'weekly') return addWeeks(base, 1);
  if (recurrenceRule === 'monthly') return addMonths(base, 1);
  if (recurrenceRule === 'quarterly') return addMonths(base, 3);
  return addYears(base, 1);
}

function asIsoDate(date: Date) {
  return date.toISOString();
}

function calculateStatus(input: {
  dueDate: string;
  lastResult?: TestRunStatus;
  explicitStatus?: TestStatus;
}) {
  if (input.explicitStatus) return input.explicitStatus;
  if (input.lastResult === 'Fail' || input.lastResult === 'Warning') return 'Needs_remediation' as const;

  const daysUntilDue = differenceInCalendarDays(new Date(input.dueDate), new Date());
  if (daysUntilDue < 0) return 'Overdue' as const;
  if (daysUntilDue <= 7) return 'Due_soon' as const;
  return 'OK' as const;
}

function mapRiskResultStatus(status: TestResultRecord['status']): TestRunStatus {
  if (status === 'FAIL' || status === 'ERROR') return 'Fail';
  if (status === 'WARNING') return 'Warning';
  if (status === 'PASS') return 'Pass';
  return 'Not_Run';
}

function controlLink(controlId: string, title: string): TestControlLinkDto {
  return {
    id: `control-link-${controlId}`,
    controlId,
    control: {
      id: controlId,
      isoReference: controlId.replace('control-', '').replace(/-/g, '.').toUpperCase(),
      title,
      status: 'IMPLEMENTED',
    },
  };
}

function normalizeProviderToken(value?: string | null) {
  return (value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64) || 'run';
}

function frameworkLinks(testId: string, frameworkIds: string[]) {
  return frameworkIds.map((frameworkName) => ({
    id: `framework-link-${testId}-${frameworkName}`,
    testId,
    frameworkName,
  }));
}

function evidenceLink(snapshot: EvidenceSnapshotRecord): TestEvidenceLinkDto {
  return {
    id: `evidence-link-${snapshot.id}`,
    evidenceId: snapshot.id,
    evidence: {
      id: snapshot.id,
      type: snapshot.kind,
      fileName: `${snapshot.provider}-${snapshot.resourceId}.json`,
      fileUrl: null,
      createdAt: snapshot.capturedAt,
    },
  };
}

function seedTestFromRiskDefinition(test: ControlTestDefinition): TestRecordDto {
  const owner = ownerForRiskTest(test);
  const createdAt = asIsoDate(addWeeks(new Date(), -2));
  const dueDate = asIsoDate(addWeeks(new Date(), 1));
  const nextDueDate = asIsoDate(addMonths(new Date(dueDate), 3));

  return {
    id: `compliance-${test.id}`,
    name: test.name,
    category: 'Risks',
    type: 'Automated',
    status: calculateStatus({ dueDate }),
    ownerId: owner.id,
    owner,
    dueDate,
    nextDueDate,
    recurrenceRule: 'quarterly',
    completedAt: null,
    organizationId: DEFAULT_ORG_ID,
    createdAt,
    updatedAt: createdAt,
    riskEngineTestId: test.id,
    templateId: null,
    attestationStatus: 'Not_requested',
    reviewerId: null,
    reviewer: null,
    attestedAt: null,
    automationKind: 'standard',
    pipelineProvider: null,
    lastRemediationAt: null,
    controls: [controlLink(test.controlId, test.controlName)],
    frameworks: frameworkLinks(`compliance-${test.id}`, test.frameworkIds),
    audits: [],
    evidences: [],
    integrationId: `integration-${test.signalType.toLowerCase()}`,
    lastRunAt: null,
    lastResult: 'Not_Run',
    lastResultDetails: null,
    autoRemediationSupported: true,
    integration: {
      id: `integration-${test.signalType.toLowerCase()}`,
      provider: test.signalType.split('_')[0],
      status: 'CONNECTED',
      metadata: { signalType: test.signalType },
    },
  };
}

function cloneState(state: TestsState): TestsState {
  return {
    tests: state.tests.map((test) => ({
      ...test,
      owner: test.owner ? { ...test.owner } : undefined,
      controls: test.controls.map((link) => ({ ...link, control: { ...link.control } })),
      frameworks: test.frameworks.map((link) => ({ ...link })),
      audits: test.audits.map((link) => ({ ...link, audit: { ...link.audit } })),
      evidences: test.evidences.map((link) => ({ ...link, evidence: { ...link.evidence } })),
      integration: test.integration ? { ...test.integration, metadata: test.integration.metadata ? { ...test.integration.metadata } : undefined } : null,
      lastResultDetails: test.lastResultDetails ? { ...test.lastResultDetails } : null,
    })),
    history: Object.fromEntries(Object.entries(state.history).map(([key, value]) => [key, value.map((entry) => ({ ...entry }))])),
    runs: Object.fromEntries(Object.entries(state.runs).map(([key, value]) => [key, value.map((entry) => ({ ...entry, rawPayload: entry.rawPayload ? { ...entry.rawPayload } : null }))])),
  };
}

function paginate<T>(items: T[], page = 1, limit = 25) {
  const start = Math.max(0, (page - 1) * limit);
  return items.slice(start, start + limit);
}

class TestsRuntimeService {
  private state: TestsState;

  constructor(initialState: TestsState) {
    this.state = cloneState(initialState);
  }

  private addHistory(testId: string, changeType: string, oldValue: string | null, newValue: string | null, changedBy = 'system') {
    const entry: TestHistoryEntryDto = {
      id: makeId('history'),
      testId,
      changedBy,
      changeType,
      oldValue,
      newValue,
      createdAt: new Date().toISOString(),
    };
    this.state.history[testId] = [entry, ...(this.state.history[testId] ?? [])];
  }

  private updateRecord(testId: string, updater: (record: TestRecordDto) => TestRecordDto) {
    const current = this.state.tests.find((item) => item.id === testId);
    if (!current) throw new Error(`Test ${testId} not found`);
    const updated = updater(current);
    this.state.tests = this.state.tests.map((item) => (item.id === testId ? updated : item));
    return updated;
  }

  listTests(input: ListTestsInput = {}) {
    let records = [...this.state.tests].map((record) => ({
      ...record,
      status: calculateStatus({ dueDate: record.dueDate, lastResult: record.lastResult, explicitStatus: record.lastResult === 'Fail' || record.lastResult === 'Warning' ? 'Needs_remediation' : undefined }),
    }));

    if (input.search) {
      const search = input.search.toLowerCase();
      records = records.filter((record) => record.name.toLowerCase().includes(search));
    }
    if (input.category) records = records.filter((record) => record.category === input.category);
    if (input.status) records = records.filter((record) => record.status === input.status);
    if (input.type) records = records.filter((record) => record.type === input.type);
    if (input.ownerId) records = records.filter((record) => record.ownerId === input.ownerId);
    if (input.dueFrom) records = records.filter((record) => new Date(record.dueDate) >= new Date(input.dueFrom!));
    if (input.dueTo) records = records.filter((record) => new Date(record.dueDate) <= new Date(input.dueTo!));

    records.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return paginate(records, input.page, input.limit);
  }

  getSummary(): TestSummaryDto {
    const tests = this.listTests({ page: 1, limit: this.state.tests.length || 1 });
    const total = tests.length;
    const completed = tests.filter((item) => item.completedAt).length;
    const passed = tests.filter((item) => item.lastResult === 'Pass' || (item.status === 'OK' && item.type === 'Document')).length;
    return {
      total,
      completed,
      passPercentage: total === 0 ? 0 : Math.round((passed / total) * 100),
      overdue: tests.filter((item) => item.status === 'Overdue').length,
      dueSoon: tests.filter((item) => item.status === 'Due_soon').length,
    };
  }

  getTest(id: string) {
    const test = this.state.tests.find((item) => item.id === id);
    if (!test) throw new Error(`Test ${id} not found`);
    return { ...test, status: calculateStatus({ dueDate: test.dueDate, lastResult: test.lastResult }) };
  }

  createTest(input: CreateTestInput) {
    const now = new Date();
    const owner = ownerForId(input.ownerId);
    const nextDueDate = input.recurrenceRule ? asIsoDate(recurrenceDueDate(new Date(input.dueDate), input.recurrenceRule)) : null;
    const record: TestRecordDto = {
      id: makeId('test'),
      name: input.name,
      category: input.category,
      type: input.type,
      status: calculateStatus({ dueDate: input.dueDate }),
      ownerId: owner.id,
      owner,
      dueDate: input.dueDate,
      nextDueDate,
      recurrenceRule: input.recurrenceRule ?? null,
      completedAt: null,
      organizationId: DEFAULT_ORG_ID,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      riskEngineTestId: input.riskEngineTestId ?? null,
      templateId: input.templateId ?? null,
      attestationStatus: 'Not_requested',
      reviewerId: null,
      reviewer: null,
      attestedAt: null,
      automationKind: input.type === 'Pipeline' ? 'pipeline' : 'standard',
      pipelineProvider: input.type === 'Pipeline' ? 'GitHub Actions' : null,
      lastRemediationAt: null,
      controls: [],
      frameworks: [],
      audits: [],
      evidences: [],
      integrationId: null,
      lastRunAt: null,
      lastResult: 'Not_Run',
      lastResultDetails: null,
      autoRemediationSupported: false,
      integration: null,
    };
    this.state.tests = [record, ...this.state.tests];
    this.addHistory(record.id, 'Test created', null, record.name, 'api');
    return this.applyAutomationMappings(record.id);
  }

  updateTest(id: string, input: UpdateTestInput) {
    const updated = this.updateRecord(id, (record) => {
      const next: TestRecordDto = {
        ...record,
        ...input,
        owner: input.ownerId ? ownerForId(input.ownerId) : record.owner,
        nextDueDate: input.recurrenceRule === undefined
          ? record.nextDueDate
          : input.recurrenceRule
            ? asIsoDate(recurrenceDueDate(new Date(input.dueDate ?? record.dueDate), input.recurrenceRule))
            : null,
        updatedAt: new Date().toISOString(),
      };
      next.status = calculateStatus({ dueDate: next.dueDate, lastResult: next.lastResult, explicitStatus: input.status });
      return next;
    });
    this.addHistory(id, 'Test updated', null, updated.name, 'api');
    return this.applyAutomationMappings(id);
  }

  private buildRunEvidenceLink(test: TestRecordDto, run: TestRunRecordDto): TestEvidenceLinkDto | null {
    if (run.status !== 'Pass' && run.status !== 'Fail') return null;
    const evidenceId = `run-evidence-${run.id}`;
    const resultLabel = run.status.toLowerCase();
    return {
      id: `evidence-link-${evidenceId}`,
      evidenceId,
      evidence: {
        id: evidenceId,
        type: run.status === 'Pass' ? 'automated-pass' : 'automated-fail',
        fileName: `${slug(test.name)}-${resultLabel}-run.json`,
        fileUrl: null,
        createdAt: run.executedAt,
      },
    };
  }

  attachRunEvidenceFromRun(testId: string, run: TestRunRecordDto) {
    const test = this.getTest(testId);
    const runEvidence = this.buildRunEvidenceLink(test, run);
    if (!runEvidence) return test;
    return this.updateRecord(testId, (record) => {
      if (record.evidences.some((item) => item.evidenceId === runEvidence.evidenceId)) return record;
      return {
        ...record,
        evidences: [...record.evidences, runEvidence],
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private resolveMapping(record: TestRecordDto) {
    const controls = new Set<string>();
    const frameworks = new Set<string>();

    const templateMapping = record.templateId ? TEMPLATE_AUTOMATION_MAPPINGS[record.templateId] : null;
    if (templateMapping) {
      templateMapping.controls.forEach((control) => controls.add(control));
      templateMapping.frameworks.forEach((framework) => frameworks.add(framework));
    }

    const providerCandidates = [
      record.integration?.provider,
      record.pipelineProvider,
      record.integrationId,
      record.integration?.metadata?.signalType,
    ].map((item) => normalizeProviderToken(item)).filter(Boolean);

    for (const mapping of PROVIDER_AUTOMATION_MAPPINGS) {
      if (mapping.providers.some((provider) => providerCandidates.some((candidate) => candidate.includes(provider)))) {
        mapping.controls.forEach((control) => controls.add(control));
        mapping.frameworks.forEach((framework) => frameworks.add(framework));
      }
    }

    return { controls: Array.from(controls), frameworks: Array.from(frameworks) };
  }

  applyAutomationMappings(testId: string) {
    return this.updateRecord(testId, (record) => {
      if (record.type === 'Document') return record;
      const mapping = this.resolveMapping(record);
      if (mapping.controls.length === 0 && mapping.frameworks.length === 0) return record;

      const controls = [...record.controls];
      const frameworks = [...record.frameworks];
      let changed = false;

      for (const controlId of mapping.controls) {
        if (controls.some((item) => item.controlId === controlId)) continue;
        controls.push(controlLink(controlId, controlId));
        changed = true;
      }

      for (const frameworkName of mapping.frameworks) {
        if (frameworks.some((item) => item.frameworkName === frameworkName)) continue;
        frameworks.push({ id: makeId('test-framework'), testId: record.id, frameworkName });
        changed = true;
      }

      if (!changed) return record;
      return {
        ...record,
        controls,
        frameworks,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  runAutomationBackfillOnce() {
    for (const test of [...this.state.tests]) {
      if (test.type !== 'Document') {
        this.applyAutomationMappings(test.id);
      }

      for (const run of this.state.runs[test.id] ?? []) {
        if (run.status === 'Pass' || run.status === 'Fail') {
          this.attachRunEvidenceFromRun(test.id, run);
        }
      }
    }
  }

  deleteTest(id: string) {
    this.state.tests = this.state.tests.filter((item) => item.id !== id);
    delete this.state.history[id];
    delete this.state.runs[id];
  }

  completeTest(id: string) {
    const now = new Date().toISOString();
    const updated = this.updateRecord(id, (record) => {
      if (!record.recurrenceRule) {
        return {
          ...record,
          completedAt: now,
          status: 'OK',
          updatedAt: now,
        };
      }

      const nextDue = record.nextDueDate ?? asIsoDate(recurrenceDueDate(new Date(record.dueDate), record.recurrenceRule));
      return {
        ...record,
        completedAt: now,
        dueDate: nextDue,
        nextDueDate: asIsoDate(recurrenceDueDate(new Date(nextDue), record.recurrenceRule)),
        status: calculateStatus({ dueDate: nextDue, lastResult: record.lastResult === 'Fail' ? 'Pass' : record.lastResult }),
        updatedAt: now,
      };
    });
    this.addHistory(id, 'Test completed', null, updated.completedAt, 'api');
    return updated;
  }

  bulkComplete(testIds: string[]) {
    return testIds.map((testId) => this.completeTest(testId));
  }

  bulkAssign(testIds: string[], ownerId: string) {
    return testIds.map((testId) => this.updateTest(testId, { ownerId }));
  }

  bulkLinkControl(testIds: string[], controlId: string) {
    return testIds.map((testId) => this.attachControl(testId, controlId));
  }

  attachEvidence(testId: string, evidenceId: string) {
    const link: TestEvidenceLinkDto = {
      id: makeId('test-evidence'),
      evidenceId,
      evidence: {
        id: evidenceId,
        type: 'manual',
        fileName: `Evidence ${evidenceId}`,
        fileUrl: null,
        createdAt: new Date().toISOString(),
      },
    };
    const updated = this.updateRecord(testId, (record) => {
      if (record.evidences.some((item) => item.evidenceId === evidenceId)) return record;
      return { ...record, evidences: [...record.evidences, link], updatedAt: new Date().toISOString() };
    });
    this.addHistory(testId, 'Evidence attached', null, evidenceId, 'api');
    return updated.evidences.find((item) => item.evidenceId === evidenceId)!;
  }

  detachEvidence(testId: string, evidenceId: string) {
    this.updateRecord(testId, (record) => ({
      ...record,
      evidences: record.evidences.filter((item) => item.evidenceId !== evidenceId),
      updatedAt: new Date().toISOString(),
    }));
    this.addHistory(testId, 'Evidence detached', evidenceId, null, 'api');
  }

  attachControl(testId: string, controlId: string) {
    const link = controlLink(controlId, `Linked control ${controlId}`);
    const updated = this.updateRecord(testId, (record) => {
      if (record.controls.some((item) => item.controlId === controlId)) return record;
      return { ...record, controls: [...record.controls, link], updatedAt: new Date().toISOString() };
    });
    this.addHistory(testId, 'Control linked', null, controlId, 'api');
    return updated.controls.find((item) => item.controlId === controlId)!;
  }

  detachControl(testId: string, controlId: string) {
    this.updateRecord(testId, (record) => ({
      ...record,
      controls: record.controls.filter((item) => item.controlId !== controlId),
      updatedAt: new Date().toISOString(),
    }));
    this.addHistory(testId, 'Control detached', controlId, null, 'api');
  }

  attachAudit(testId: string, auditId: string) {
    const link: TestAuditLinkDto = {
      id: makeId('test-audit'),
      auditId,
      audit: {
        id: auditId,
        type: 'INTERNAL',
        auditor: 'Audit Program',
        scope: 'Linked from enterprise test workflow',
      },
    };
    const updated = this.updateRecord(testId, (record) => {
      if (record.audits.some((item) => item.auditId === auditId)) return record;
      return { ...record, audits: [...record.audits, link], updatedAt: new Date().toISOString() };
    });
    this.addHistory(testId, 'Audit linked', null, auditId, 'api');
    return updated.audits.find((item) => item.auditId === auditId)!;
  }

  detachAudit(testId: string, auditId: string) {
    this.updateRecord(testId, (record) => ({
      ...record,
      audits: record.audits.filter((item) => item.auditId !== auditId),
      updatedAt: new Date().toISOString(),
    }));
    this.addHistory(testId, 'Audit detached', auditId, null, 'api');
  }

  attachFramework(testId: string, frameworkName: string) {
    const link: TestFrameworkLinkDto = { id: makeId('test-framework'), testId, frameworkName };
    const updated = this.updateRecord(testId, (record) => {
      if (record.frameworks.some((item) => item.frameworkName === frameworkName)) return record;
      return { ...record, frameworks: [...record.frameworks, link], updatedAt: new Date().toISOString() };
    });
    this.addHistory(testId, 'Framework linked', null, frameworkName, 'api');
    return updated.frameworks.find((item) => item.frameworkName === frameworkName)!;
  }

  detachFramework(testId: string, frameworkId: string) {
    this.updateRecord(testId, (record) => ({
      ...record,
      frameworks: record.frameworks.filter((item) => item.id !== frameworkId),
      updatedAt: new Date().toISOString(),
    }));
    this.addHistory(testId, 'Framework detached', frameworkId, null, 'api');
  }

  getHistory(testId: string) {
    return this.state.history[testId] ?? [];
  }

  getRuns(testId: string) {
    return this.state.runs[testId] ?? [];
  }

  seedPolicyTests() {
    let created = 0;
    for (const template of POLICY_TEST_TEMPLATES) {
      if (this.state.tests.some((item) => item.name === template)) continue;
      this.createTest({
        name: template,
        category: 'Policy',
        type: 'Document',
        ownerId: DEFAULT_OWNER_ID,
        dueDate: asIsoDate(addWeeks(new Date(), 2)),
        recurrenceRule: 'quarterly',
      });
      created += 1;
    }
    return { created, skipped: POLICY_TEST_TEMPLATES.length - created };
  }

  async syncFromRiskEngine(payload: RiskEngineEvaluationBridgePayload) {
    for (const result of payload.testResults) {
      const definition = payload.tests.find((item) => item.id === result.testId);
      if (!definition) continue;

      const existing = this.state.tests.find((item) => item.riskEngineTestId === definition.id);
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
      });

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

      this.state.runs[record.id] = [run, ...(this.state.runs[record.id] ?? []).filter((item) => item.id !== run.id)].slice(0, 25);

      const nextEvidence = snapshots.map(evidenceLink);
      const currentEvidence = this.getTest(record.id).evidences;
      const mergedEvidence = [...currentEvidence];
      for (const evidenceItem of nextEvidence) {
        if (!mergedEvidence.some((item) => item.evidenceId === evidenceItem.evidenceId)) {
          mergedEvidence.push(evidenceItem);
        }
      }
      const runEvidence = this.buildRunEvidenceLink(record, run);
      if (runEvidence && !mergedEvidence.some((item) => item.evidenceId === runEvidence.evidenceId)) {
        mergedEvidence.push(runEvidence);
      }

      const nextStatus = runStatus === 'Fail'
        ? 'Needs_remediation'
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
      }));

      this.addHistory(record.id, 'Risk engine sync', existing ? existing.status : null, nextStatus, 'risk-engine');
      this.applyAutomationMappings(record.id);
    }
  }
}

async function createInitialState(): Promise<TestsState> {
  const riskEngine = await getRiskEngineRuntimeService();
  const definitions = await riskEngine.listTestDefinitions();
  const seeded = definitions.map(seedTestFromRiskDefinition);

  return {
    tests: seeded,
    history: Object.fromEntries(seeded.map((record) => [record.id, []])),
    runs: Object.fromEntries(seeded.map((record) => [record.id, []])),
  };
}

let runtimePromise: Promise<TestsRuntimeService> | null = null;

export async function getTestsRuntimeService() {
  if (!runtimePromise) {
    runtimePromise = createInitialState().then((state) => {
      const service = new TestsRuntimeService(state);
      service.runAutomationBackfillOnce();
      return service;
    });
  }
  return runtimePromise;
}

registerRiskEngineTestSyncHandler(async (payload) => {
  const service = await getTestsRuntimeService();
  await service.syncFromRiskEngine(payload);
});

export type {
  CreateTestInput,
  ListTestsInput,
  RecurrenceRule,
  TestHistoryEntryDto,
  TestRecordDto,
  TestRunRecordDto,
  TestSummaryDto,
  UpdateTestInput,
};
