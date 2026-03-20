import { addDays, differenceInCalendarDays } from 'date-fns';
import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import {
  getTestsRuntimeService,
  type TestRecordDto,
  type TestRunRecordDto,
} from './runtime';
import {
  createPgExecutor,
  getPostgresPool,
  readPostgresRuntimeConfig,
} from '@/server/db/postgres';
import {
  createJiraTicket,
  forwardSiemEvent,
  listWorkflowDeliveryLog,
  maybeDispatchEscalation,
  sendSlackNotification,
  triggerGithubActionsWorkflow,
} from './workflowIntegrations';
import { NotificationEventType } from '@/domain/notifications/eventTypes';
import { getNotificationServiceOrNull } from '@/server/notifications/module';

type ExportFormat = 'csv' | 'pdf';

export interface TestDashboardDto {
  controlCoverage: number;
  frameworkCoverage: Array<{ framework: string; count: number }>;
  automationCoverage: number;
  evidenceFreshness: number;
  slaCompliance: number;
  statusBreakdown: Array<{ label: string; count: number }>;
}

export interface TestGapAnalysisDto {
  controlsWithoutTests: string[];
  frameworksWithoutCoverage: string[];
  testsWithoutEvidence: Array<{ id: string; name: string }>;
}

export interface TestTemplateDto {
  id: string;
  framework: string;
  name: string;
  description: string;
  category: TestRecordDto['category'];
  type: TestRecordDto['type'];
  recurrenceRule: NonNullable<TestRecordDto['recurrenceRule']>;
  controls: string[];
}

export interface TestRiskContextDto {
  linkedTest: { id: string; riskEngineTestId: string | null };
  results: Array<{
    id: string;
    status: string;
    severity: string;
    reason: string;
    executedAt: string;
    resourceName: string;
    resourceId: string;
    signalType: string;
  }>;
  risks: Array<{
    id: string;
    title: string;
    severity: string;
    score: number;
    status: string;
    resourceName: string;
  }>;
}

export interface SecurityEventDto {
  id: string;
  testId: string;
  eventType: 'SIEM_FORWARD' | 'SOAR_TRIGGER';
  destination: string;
  status: 'QUEUED' | 'SENT';
  createdAt: string;
  summary: string;
}

export interface UnifiedEvidenceDto {
  id: string;
  sourceType: 'compliance-evidence' | 'risk-snapshot';
  sourceId: string;
  testId: string;
  title: string;
  capturedAt: string;
  provider: string;
}

export interface EscalationDto {
  id: string;
  testId: string;
  owner: string;
  stage: 'OWNER' | 'MANAGER' | 'CISO';
  dueAt: string;
  integration: string;
  status: 'PENDING' | 'TRIGGERED';
}

export interface ExportBundleDto {
  format: ExportFormat;
  fileName: string;
  content: string;
}

const TEMPLATE_LIBRARY: TestTemplateDto[] = [
  {
    id: 'soc2-access-reviews',
    framework: 'SOC 2',
    name: 'SOC 2 Access Review Suite',
    description:
      'Quarterly access reviews, privileged access checks, and evidence attestation.',
    category: 'Policy',
    type: 'Document',
    recurrenceRule: 'quarterly',
    controls: ['Access review', 'Privileged access'],
  },
  {
    id: 'iso-cloud-hardening',
    framework: 'ISO 27001',
    name: 'ISO Cloud Hardening Suite',
    description:
      'Automated control tests for cloud exposure, encryption, and WAF posture.',
    category: 'Risks',
    type: 'Automated',
    recurrenceRule: 'monthly',
    controls: ['Cloud configuration baseline', 'Perimeter hardening'],
  },
  {
    id: 'nist-devsecops',
    framework: 'NIST',
    name: 'NIST DevSecOps Pipeline Suite',
    description:
      'Pipeline-native checks for branch protection, reviews, scanning, and CI traceability.',
    category: 'Engineering',
    type: 'Pipeline',
    recurrenceRule: 'weekly',
    controls: ['Secure SDLC guardrails', 'Vulnerability remediation SLA'],
  },
  {
    id: 'hipaa-evidence-readiness',
    framework: 'HIPAA',
    name: 'HIPAA Evidence Readiness Suite',
    description:
      'Evidence freshness, control attestations, and audit-ready reporting for regulated systems.',
    category: 'IT',
    type: 'Document',
    recurrenceRule: 'monthly',
    controls: ['Data ownership mapping', 'Retention and encryption checks'],
  },
];

/**
 * Returns the list of framework names that are active for the current org.
 * Falls back to the hardcoded baseline when no DB is available (e.g. in tests).
 * Gap 8 fix: replaced static constant with a live DB query to organization_frameworks.
 */
async function getActiveFrameworkNames(
  organizationId?: string,
): Promise<string[]> {
  const FALLBACK = ['SOC 2', 'ISO 27001', 'NIST', 'HIPAA'];
  if (!organizationId) return FALLBACK;
  try {
    const config = readPostgresRuntimeConfig();
    if (!config) return FALLBACK;
    const pool = getPostgresPool(config);
    const executor = createPgExecutor(pool);
    const result = await executor.query<{ name: string }>(
      `select f.name from organization_frameworks of
         join frameworks f on f.id = of.framework_id
        where of.organization_id = $1 and of.status = 'active'`,
      [organizationId],
    );
    if (result.rows.length === 0) return FALLBACK;
    return result.rows.map((r) => r.name);
  } catch {
    return FALLBACK;
  }
}

function plural(value: number, label: string) {
  return `${value} ${label}${value === 1 ? '' : 's'}`;
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
  }));
}

async function getMutableService() {
  return (await getTestsRuntimeService()) as any;
}

function emitNotification(
  payload: Parameters<
    NonNullable<ReturnType<typeof getNotificationServiceOrNull>>['emit']
  >[0],
) {
  const notificationService = getNotificationServiceOrNull();
  if (notificationService) {
    notificationService.emit(payload).catch((error) => {
      console.error('[NotificationService] emit failed:', error);
    });
  }
}

function asRecords(service: any): TestRecordDto[] {
  return service.listTests({ page: 1, limit: 1000 });
}

function getOrgIdForTest(service: any, testId: string) {
  const test = service.getTest(testId) as TestRecordDto;
  return test.organizationId;
}

export async function getTestsDashboard(): Promise<TestDashboardDto> {
  const service = await getMutableService();
  const tests = asRecords(service);
  const allControls = new Set(
    tests.flatMap((test) => test.controls.map((control) => control.controlId)),
  );
  const coveredControls = new Set(
    tests
      .filter((test) => test.controls.length > 0)
      .flatMap((test) => test.controls.map((control) => control.controlId)),
  );
  const evidenceAges = tests.flatMap((test) =>
    test.evidences.map((evidence) =>
      differenceInCalendarDays(
        new Date(),
        new Date(evidence.evidence.createdAt),
      ),
    ),
  );
  const onTimeCompleted = tests.filter(
    (test) =>
      test.completedAt && new Date(test.completedAt) <= new Date(test.dueDate),
  ).length;
  const completed = tests.filter((test) => Boolean(test.completedAt)).length;

  return {
    controlCoverage:
      allControls.size === 0
        ? 0
        : Math.round((coveredControls.size / allControls.size) * 100),
    frameworkCoverage: countBy(
      tests.flatMap((test) =>
        test.frameworks.map((framework) => framework.frameworkName),
      ),
    ).map((item) => ({ framework: item.label, count: item.count })),
    automationCoverage:
      tests.length === 0
        ? 0
        : Math.round(
            (tests.filter((test) => test.type !== 'Document').length /
              tests.length) *
              100,
          ),
    evidenceFreshness:
      evidenceAges.length === 0
        ? 0
        : Math.max(
            0,
            100 -
              Math.round(
                evidenceAges.reduce((sum, age) => sum + age, 0) /
                  evidenceAges.length,
              ),
          ),
    slaCompliance:
      completed === 0 ? 0 : Math.round((onTimeCompleted / completed) * 100),
    statusBreakdown: countBy(tests.map((test) => test.status)),
  };
}

export async function getTestGapAnalysis(
  organizationId?: string,
): Promise<TestGapAnalysisDto> {
  const service = await getMutableService();
  const tests = asRecords(service);
  const coveredFrameworks = new Set(
    tests.flatMap((test) =>
      test.frameworks.map((framework) => framework.frameworkName),
    ),
  );
  const controlsWithoutTests = TEMPLATE_LIBRARY.flatMap(
    (template) => template.controls,
  ).filter(
    (control) =>
      !tests.some((test) =>
        test.controls.some(
          (link) =>
            link.control.title === control || link.controlId === control,
        ),
      ),
  );
  const activeFrameworks = await getActiveFrameworkNames(organizationId);

  return {
    controlsWithoutTests: Array.from(new Set(controlsWithoutTests)),
    frameworksWithoutCoverage: activeFrameworks.filter(
      (framework) => !coveredFrameworks.has(framework),
    ),
    testsWithoutEvidence: tests
      .filter((test) => test.evidences.length === 0)
      .map((test) => ({ id: test.id, name: test.name })),
  };
}

export const getGapAnalysis = getTestGapAnalysis;

export async function getTestRiskContext(
  testId: string,
): Promise<TestRiskContextDto> {
  const service = await getMutableService();
  const linkedTest = service.getTest(testId) as TestRecordDto;
  const riskEngine = await getRiskEngineRuntimeService();
  const [results, risks, signals] = await Promise.all([
    riskEngine.listTestResults(),
    riskEngine.listRisks(),
    riskEngine.listSignals(),
  ]);

  const matchingResults = results.filter(
    (result) => result.testId === linkedTest.riskEngineTestId,
  );
  return {
    linkedTest: {
      id: linkedTest.id,
      riskEngineTestId: linkedTest.riskEngineTestId,
    },
    results: matchingResults.map((result) => {
      const signal = signals.find((item) => item.id === result.signalId);
      return {
        id: result.id,
        status: result.status,
        severity: result.severity,
        reason: result.reason,
        executedAt: result.executedAt,
        resourceName: signal?.resourceName ?? result.signalId,
        resourceId: signal?.resourceId ?? result.signalId,
        signalType: signal?.signalType ?? 'unknown',
      };
    }),
    risks: risks
      .filter((risk) =>
        matchingResults.some((result) => result.id === risk.testResultId),
      )
      .map((risk) => ({
        id: risk.id,
        title: risk.title,
        severity: risk.severity,
        score: risk.score,
        status: risk.status,
        resourceName: risk.resourceName,
      })),
  };
}

export async function listTestTemplates() {
  return TEMPLATE_LIBRARY;
}

export async function createTestSuiteFromTemplate(templateId: string) {
  const template = TEMPLATE_LIBRARY.find((item) => item.id === templateId);
  if (!template) throw new Error(`Template ${templateId} not found`);
  const service = await getMutableService();
  const created = [] as TestRecordDto[];
  for (const control of template.controls) {
    const record = service.createTest({
      name: `${template.name}: ${control}`,
      category: template.category,
      type: template.type,
      ownerId: 'user-compliance',
      dueDate: new Date().toISOString(),
      recurrenceRule: template.recurrenceRule,
      templateId: template.id,
    }) as TestRecordDto;
    service.attachFramework(record.id, template.framework);
    service.attachControl(record.id, control);
    service.updateTest(record.id, {
      status: record.status,
      riskEngineTestId: record.riskEngineTestId,
    });
    service.updateRecord(record.id, (current: TestRecordDto) => ({
      ...current,
      templateId: template.id,
      updatedAt: new Date().toISOString(),
    }));
    created.push(service.getTest(record.id));
  }
  return created;
}

export async function requestAttestation(testId: string, reviewerId: string) {
  const service = await getMutableService();
  const organizationId = getOrgIdForTest(service, testId);
  const currentTest = service.getTest(testId) as TestRecordDto;
  const reviewer = {
    id: reviewerId,
    name: reviewerId,
    email: `${reviewerId}@manzen.dev`,
  };
  service.updateRecord(testId, (current: TestRecordDto) => ({
    ...current,
    reviewerId,
    reviewer,
    attestationStatus: 'Pending_review',
    updatedAt: new Date().toISOString(),
  }));
  service.addHistory(
    testId,
    'Attestation requested',
    null,
    reviewerId,
    'workflow',
  );
  await Promise.all([
    createJiraTicket({
      testId,
      summary: `Attestation requested for ${testId}`,
      description: `Evidence review requested for test ${testId}. Reviewer: ${reviewerId}.`,
      labels: ['test-attestation'],
      organizationId,
    }),
  ]);
  emitNotification({
    organizationId,
    recipientUserIds: [reviewerId],
    eventType: NotificationEventType.ATTESTATION_REQUESTED,
    title: `Attestation requested for ${currentTest.name}`,
    body: `Please review and attest evidence for test "${currentTest.name}".`,
    severity: 'info',
    resourceType: 'test',
    resourceId: testId,
    recipientEmails: { [reviewerId]: reviewer.email },
    resourceUrl: `/tests/${testId}`,
  });
  return service.getTest(testId) as TestRecordDto;
}

export async function signAttestation(testId: string, reviewerId: string) {
  const service = await getMutableService();
  const organizationId = getOrgIdForTest(service, testId);
  const currentTest = service.getTest(testId) as TestRecordDto;
  const now = new Date().toISOString();
  service.updateRecord(testId, (current: TestRecordDto) => ({
    ...current,
    reviewerId,
    reviewer: {
      id: reviewerId,
      name: reviewerId,
      email: `${reviewerId}@manzen.dev`,
    },
    attestationStatus: 'Attested',
    attestedAt: now,
    updatedAt: now,
  }));
  service.addHistory(testId, 'Evidence attested', null, reviewerId, 'auditor');
  emitNotification({
    organizationId,
    recipientUserIds: [currentTest.ownerId],
    eventType: NotificationEventType.ATTESTATION_SIGNED,
    title: `Evidence attested for ${currentTest.name}`,
    body: `Reviewer ${reviewerId} approved the evidence attached to "${currentTest.name}".`,
    severity: 'info',
    resourceType: 'test',
    resourceId: testId,
    recipientEmails: {
      [currentTest.ownerId]:
        currentTest.owner?.email ?? `${currentTest.ownerId}@manzen.dev`,
    },
    resourceUrl: `/tests/${testId}`,
  });
  return service.getTest(testId) as TestRecordDto;
}

export async function runAutoRemediation(testId: string) {
  const service = await getMutableService();
  const organizationId = getOrgIdForTest(service, testId);
  const current = service.getTest(testId) as TestRecordDto;
  const playbook =
    current.lastResult === 'Fail'
      ? `Auto-remediation playbook executed for ${current.name}`
      : `Remediation validation executed for ${current.name}`;
  const now = new Date().toISOString();
  service.updateRecord(testId, (record: TestRecordDto) => ({
    ...record,
    lastResult: 'Pass',
    status: 'OK',
    lastRunAt: now,
    lastRemediationAt: now,
    lastResultDetails: {
      ...(record.lastResultDetails ?? {}),
      remediationPlaybook: playbook,
      approvalWorkflow: 'Security owner approval captured',
    },
    updatedAt: now,
  }));
  service.addHistory(
    testId,
    'Auto-remediation executed',
    current.lastResult ?? null,
    'Pass',
    'soar',
  );
  await Promise.all([
    triggerGithubActionsWorkflow({
      testId,
      eventType: 'test-auto-remediation',
      organizationId,
      clientPayload: {
        testId,
        testName: current.name,
        previousResult: current.lastResult,
        remediationPlaybook: playbook,
      },
    }),
    sendSlackNotification({
      testId,
      title: 'Auto-remediation executed',
      body: `${playbook}. Status has been updated to pass.`,
      severity: 'warning',
      organizationId,
    }),
  ]);
  return service.getTest(testId) as TestRecordDto;
}

export async function ingestPipelineRun(input: {
  pipelineName: string;
  provider: string;
  status: 'success' | 'failure';
  summary: string;
  branch?: string;
}) {
  const service = await getMutableService();
  const existing = asRecords(service).find(
    (test) => test.name === input.pipelineName && test.type === 'Pipeline',
  );
  const test =
    existing ??
    service.createTest({
      name: input.pipelineName,
      category: 'Engineering',
      type: 'Pipeline',
      ownerId: 'user-appsec',
      dueDate: new Date().toISOString(),
      recurrenceRule: 'weekly',
    });

  const now = new Date().toISOString();
  const organizationId = (test as TestRecordDto).organizationId;
  const run: TestRunRecordDto = {
    id: `pipeline-${Date.now()}`,
    integrationId: input.provider,
    testId: test.id,
    status: input.status === 'success' ? 'Pass' : 'Fail',
    summary: input.summary,
    rawPayload: { branch: input.branch ?? 'main', provider: input.provider },
    executedAt: now,
    durationMs: null,
  };

  service.state.runs[test.id] = [
    run,
    ...(service.state.runs[test.id] ?? []),
  ].slice(0, 25);
  service.updateRecord(test.id, (current: TestRecordDto) => ({
    ...current,
    type: 'Pipeline',
    automationKind: 'pipeline',
    pipelineProvider: input.provider,
    lastRunAt: now,
    lastResult: run.status,
    status: run.status === 'Fail' ? 'Needs_remediation' : 'OK',
    lastResultDetails: {
      summary: input.summary,
      branch: input.branch ?? 'main',
      provider: input.provider,
    },
    updatedAt: now,
  }));
  service.applyAutomationMappings(test.id);
  service.attachRunEvidenceFromRun(test.id, run);
  service.addHistory(test.id, 'Pipeline run ingested', null, run.status, 'ci');
  if (run.status === 'Fail') {
    await Promise.all([
      createJiraTicket({
        testId: test.id,
        summary: `Pipeline failure: ${input.pipelineName}`,
        description: input.summary,
        labels: ['pipeline-test', 'failure'],
        organizationId,
      }),
      forwardSiemEvent({
        testId: test.id,
        organizationId,
        summary: `Forwarded failing pipeline test ${input.pipelineName}`,
        event: {
          testId: test.id,
          pipelineName: input.pipelineName,
          provider: input.provider,
          status: input.status,
          summary: input.summary,
          branch: input.branch ?? 'main',
        },
      }),
    ]);
    emitNotification({
      organizationId,
      recipientUserIds: [(test as TestRecordDto).ownerId],
      eventType: NotificationEventType.TEST_FAILED,
      title: `Pipeline test failed: ${(test as TestRecordDto).name}`,
      body: `${input.pipelineName} reported a failing ${input.provider} run on ${input.branch ?? 'main'}.`,
      severity: 'critical',
      resourceType: 'test',
      resourceId: test.id,
      metadata: { provider: input.provider, branch: input.branch ?? 'main' },
      recipientEmails: {
        [(test as TestRecordDto).ownerId]:
          (test as TestRecordDto).owner?.email ??
          `${(test as TestRecordDto).ownerId}@manzen.dev`,
      },
      resourceUrl: `/tests/${test.id}`,
    });
  }
  return service.getTest(test.id) as TestRecordDto;
}

export async function listSecurityEvents(): Promise<SecurityEventDto[]> {
  return listWorkflowDeliveryLog()
    .filter(
      (entry) =>
        entry.kind === 'siem' ||
        entry.kind === 'jira' ||
        entry.kind === 'slack' ||
        entry.kind === 'github-actions',
    )
    .map((entry) => ({
      id: entry.id,
      testId: entry.testId,
      eventType: entry.kind === 'siem' ? 'SIEM_FORWARD' : 'SOAR_TRIGGER',
      destination: entry.destination,
      status: entry.status === 'sent' ? 'SENT' : 'QUEUED',
      createdAt: entry.createdAt,
      summary: entry.summary,
    }));
}

export async function listUnifiedEvidence(
  testId?: string,
): Promise<UnifiedEvidenceDto[]> {
  const service = await getMutableService();
  const tests = testId
    ? [service.getTest(testId) as TestRecordDto]
    : asRecords(service);
  const riskEngine = await getRiskEngineRuntimeService();
  const riskEvidence = await riskEngine.listEvidence();
  const result: UnifiedEvidenceDto[] = [];
  for (const test of tests) {
    for (const evidence of test.evidences) {
      result.push({
        id: `unified-${test.id}-${evidence.evidenceId}`,
        sourceType: 'compliance-evidence',
        sourceId: evidence.evidenceId,
        testId: test.id,
        title: evidence.evidence.fileName ?? evidence.evidence.type,
        capturedAt: evidence.evidence.createdAt,
        provider: 'compliance',
      });
    }
    for (const snapshot of riskEvidence.filter(
      (item) =>
        item.testId === test.riskEngineTestId ||
        test.evidences.some((link) => link.evidenceId === item.id),
    )) {
      result.push({
        id: `unified-risk-${snapshot.id}`,
        sourceType: 'risk-snapshot',
        sourceId: snapshot.id,
        testId: test.id,
        title: `${snapshot.kind} snapshot`,
        capturedAt: snapshot.capturedAt,
        provider: snapshot.provider,
      });
    }
  }
  return result.sort(
    (a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt),
  );
}

export async function listEscalations(): Promise<EscalationDto[]> {
  const service = await getMutableService();
  const tests = asRecords(service).filter((test) => test.status === 'Overdue');
  const escalations = tests.flatMap((test) => [
    {
      id: `${test.id}-owner`,
      testId: test.id,
      owner: test.owner?.name ?? test.ownerId,
      stage: 'OWNER' as const,
      dueAt: test.dueDate,
      integration: 'Slack',
      status: 'TRIGGERED' as const,
    },
    {
      id: `${test.id}-manager`,
      testId: test.id,
      owner: test.owner?.name ?? test.ownerId,
      stage: 'MANAGER' as const,
      dueAt: addDays(new Date(test.dueDate), 3).toISOString(),
      integration: 'Jira',
      status:
        differenceInCalendarDays(
          new Date(),
          addDays(new Date(test.dueDate), 3),
        ) >= 0
          ? ('TRIGGERED' as const)
          : ('PENDING' as const),
    },
    {
      id: `${test.id}-ciso`,
      testId: test.id,
      owner: test.owner?.name ?? test.ownerId,
      stage: 'CISO' as const,
      dueAt: addDays(new Date(test.dueDate), 7).toISOString(),
      integration: 'Slack + Jira',
      status:
        differenceInCalendarDays(
          new Date(),
          addDays(new Date(test.dueDate), 7),
        ) >= 0
          ? ('TRIGGERED' as const)
          : ('PENDING' as const),
    },
  ]);
  await Promise.all(
    escalations
      .filter((item) => item.status === 'TRIGGERED')
      .map((item) =>
        maybeDispatchEscalation({
          escalationKey: item.id,
          testId: item.testId,
          stage: item.stage,
          organizationId: tests.find((test) => test.id === item.testId)
            ?.organizationId,
          message: `Escalation stage ${item.stage} triggered for overdue test ${item.testId}. Owner: ${item.owner}.`,
          channels:
            item.stage === 'OWNER' ? { slack: false, jira: true } : undefined,
        }),
      ),
  );
  escalations
    .filter((item) => item.stage === 'OWNER' && item.status === 'TRIGGERED')
    .forEach((item) => {
      const test = tests.find((record) => record.id === item.testId);
      if (!test) return;
      emitNotification({
        organizationId: test.organizationId,
        recipientUserIds: [test.ownerId],
        eventType: NotificationEventType.TEST_OVERDUE,
        title: `Overdue test: ${test.name}`,
        body: `"${test.name}" is overdue and needs attention from ${item.owner}.`,
        severity: 'warning',
        resourceType: 'test',
        resourceId: test.id,
        recipientEmails: {
          [test.ownerId]: test.owner?.email ?? `${test.ownerId}@manzen.dev`,
        },
        resourceUrl: `/tests/${test.id}`,
      });
    });
  return escalations;
}

export async function exportTestsBundle(
  format: ExportFormat,
  framework?: string,
): Promise<ExportBundleDto> {
  const service = await getMutableService();
  const tests = asRecords(service).filter(
    (test) =>
      !framework ||
      test.frameworks.some((item) => item.frameworkName === framework),
  );
  if (format === 'csv') {
    const rows = [
      [
        'Name',
        'Type',
        'Status',
        'Frameworks',
        'Controls',
        'Evidence',
        'Owner',
      ].join(','),
      ...tests.map((test) =>
        [
          test.name,
          test.type,
          test.status,
          test.frameworks.map((item) => item.frameworkName).join('|'),
          test.controls.map((item) => item.control.title).join('|'),
          String(test.evidences.length),
          test.owner?.name ?? test.ownerId,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    return {
      format,
      fileName: `tests-${framework ?? 'all'}.csv`,
      content: rows,
    };
  }

  const content = [
    `Compliance Test Report${framework ? ` - ${framework}` : ''}`,
    '',
    ...tests.map(
      (test) =>
        `${test.name}\nStatus: ${test.status}\nFrameworks: ${test.frameworks.map((item) => item.frameworkName).join(', ') || 'None'}\nControls: ${test.controls.map((item) => item.control.title).join(', ') || 'None'}\nEvidence: ${plural(test.evidences.length, 'item')}\nOwner: ${test.owner?.name ?? test.ownerId}`,
    ),
  ].join('\n\n');
  return { format, fileName: `tests-${framework ?? 'all'}.pdf`, content };
}
