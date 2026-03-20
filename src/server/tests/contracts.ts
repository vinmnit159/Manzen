import { z } from 'zod';

const testCategorySchema = z.enum([
  'Custom',
  'Engineering',
  'HR',
  'IT',
  'Policy',
  'Risks',
]);
const testTypeSchema = z.enum(['Document', 'Automated', 'Pipeline']);
const testStatusSchema = z.enum([
  'Due_soon',
  'Needs_remediation',
  'OK',
  'Overdue',
]);
const recurrenceRuleSchema = z.enum([
  'weekly',
  'monthly',
  'quarterly',
  'annual',
]);
const testRunStatusSchema = z.enum(['Pass', 'Fail', 'Warning', 'Not_Run']);
const attestationStatusSchema = z.enum([
  'Not_requested',
  'Pending_review',
  'Attested',
]);

const ownerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

const testControlLinkSchema = z.object({
  id: z.string(),
  controlId: z.string(),
  control: z.object({
    id: z.string(),
    isoReference: z.string(),
    title: z.string(),
    status: z.string(),
  }),
});

const testFrameworkLinkSchema = z.object({
  id: z.string(),
  testId: z.string(),
  frameworkName: z.string(),
});

const testAuditLinkSchema = z.object({
  id: z.string(),
  auditId: z.string(),
  audit: z.object({
    id: z.string(),
    type: z.string(),
    auditor: z.string(),
    scope: z.string(),
  }),
});

const testEvidenceLinkSchema = z.object({
  id: z.string(),
  evidenceId: z.string(),
  evidence: z.object({
    id: z.string(),
    type: z.string(),
    fileName: z.string().nullable(),
    fileUrl: z.string().nullable(),
    createdAt: z.string(),
  }),
});

const testIntegrationSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    status: z.string(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .nullable();

export const testRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: testCategorySchema,
  type: testTypeSchema,
  status: testStatusSchema,
  ownerId: z.string(),
  owner: ownerSchema.optional(),
  dueDate: z.string(),
  nextDueDate: z.string().nullable(),
  recurrenceRule: recurrenceRuleSchema.nullable(),
  completedAt: z.string().nullable(),
  organizationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  riskEngineTestId: z.string().nullable(),
  templateId: z.string().nullable().optional(),
  attestationStatus: attestationStatusSchema.optional(),
  reviewerId: z.string().nullable().optional(),
  reviewer: ownerSchema.nullable().optional(),
  attestedAt: z.string().nullable().optional(),
  automationKind: z.enum(['standard', 'pipeline']).optional(),
  pipelineProvider: z.string().nullable().optional(),
  lastRemediationAt: z.string().nullable().optional(),
  controls: z.array(testControlLinkSchema),
  frameworks: z.array(testFrameworkLinkSchema),
  audits: z.array(testAuditLinkSchema),
  evidences: z.array(testEvidenceLinkSchema),
  integrationId: z.string().nullable().optional(),
  lastRunAt: z.string().nullable().optional(),
  lastResult: testRunStatusSchema.optional(),
  lastResultDetails: z.record(z.string(), z.unknown()).nullable().optional(),
  autoRemediationSupported: z.boolean().optional(),
  integration: testIntegrationSchema.optional(),
});

export const testSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  passPercentage: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  dueSoon: z.number().int().nonnegative(),
});

export const testHistoryEntrySchema = z.object({
  id: z.string(),
  testId: z.string(),
  changedBy: z.string(),
  changeType: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  createdAt: z.string(),
});

export const testRunRecordSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  testId: z.string(),
  assetId: z.string().nullable().optional(),
  status: testRunStatusSchema,
  summary: z.string(),
  rawPayload: z.record(z.string(), z.unknown()).nullable(),
  executionSource: z.string().nullable().optional(),
  executedBy: z.string().nullable().optional(),
  correlationId: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  executedAt: z.string(),
  durationMs: z.number().nullable(),
});

export const listTestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  category: testCategorySchema.or(z.literal('')).optional(),
  status: testStatusSchema.or(z.literal('')).optional(),
  type: testTypeSchema.or(z.literal('')).optional(),
  ownerId: z.string().optional(),
  search: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
});

export const createTestRequestSchema = z.object({
  name: z.string().min(1),
  category: testCategorySchema,
  type: testTypeSchema,
  ownerId: z.string().min(1),
  dueDate: z.string().min(1),
  recurrenceRule: recurrenceRuleSchema.nullable().optional(),
  riskEngineTestId: z.string().nullable().optional(),
});

export const updateTestRequestSchema = z.object({
  name: z.string().min(1).optional(),
  category: testCategorySchema.optional(),
  type: testTypeSchema.optional(),
  ownerId: z.string().min(1).optional(),
  dueDate: z.string().optional(),
  recurrenceRule: recurrenceRuleSchema.nullable().optional(),
  status: testStatusSchema.optional(),
  riskEngineTestId: z.string().nullable().optional(),
});

export const attachEvidenceRequestSchema = z.object({
  evidenceId: z.string().min(1),
});
export const attachControlRequestSchema = z.object({
  controlId: z.string().min(1),
});
export const attachAuditRequestSchema = z.object({
  auditId: z.string().min(1),
});
export const attachFrameworkRequestSchema = z.object({
  frameworkName: z.string().min(1),
});

export const bulkCompleteRequestSchema = z.object({
  testIds: z.array(z.string().min(1)).min(1),
});
export const bulkAssignRequestSchema = z.object({
  testIds: z.array(z.string().min(1)).min(1),
  ownerId: z.string().min(1),
});
export const bulkLinkControlRequestSchema = z.object({
  testIds: z.array(z.string().min(1)).min(1),
  controlId: z.string().min(1),
});
export const exportTestsQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  framework: z.string().optional(),
});
export const createSuiteFromTemplateParamsSchema = z.object({
  templateId: z.string().min(1),
});
export const requestAttestationSchema = z.object({
  reviewerId: z.string().min(1),
});
export const signAttestationSchema = z.object({
  reviewerId: z.string().min(1),
});
export const pipelineRunRequestSchema = z.object({
  pipelineName: z.string().min(1),
  provider: z.string().min(1),
  status: z.enum(['success', 'failure']),
  summary: z.string().min(1),
  branch: z.string().optional(),
});

const workflowIntegrationProviderSchema = z.enum([
  'slack',
  'jira',
  'github-actions',
  'siem',
]);

const workflowIntegrationConfigUpsertSchema = z.object({
  organizationId: z.string().optional(),
  values: z.record(z.string(), z.unknown()),
});

const workflowIntegrationConfigStatusSchema = z.object({
  provider: workflowIntegrationProviderSchema,
  organizationId: z.string(),
  configured: z.boolean(),
  updatedAt: z.string().nullable(),
  configuredKeys: z.array(z.string()),
});

const dashboardSchema = z.object({
  controlCoverage: z.number().int().nonnegative(),
  frameworkCoverage: z.array(
    z.object({ framework: z.string(), count: z.number().int().nonnegative() }),
  ),
  automationCoverage: z.number().int().nonnegative(),
  evidenceFreshness: z.number().int().nonnegative(),
  slaCompliance: z.number().int().nonnegative(),
  statusBreakdown: z.array(
    z.object({ label: z.string(), count: z.number().int().nonnegative() }),
  ),
});

const gapAnalysisSchema = z.object({
  controlsWithoutTests: z.array(z.string()),
  frameworksWithoutCoverage: z.array(z.string()),
  testsWithoutEvidence: z.array(z.object({ id: z.string(), name: z.string() })),
});

const testTemplateSchema = z.object({
  id: z.string(),
  framework: z.string(),
  name: z.string(),
  description: z.string(),
  category: testCategorySchema,
  type: testTypeSchema,
  recurrenceRule: recurrenceRuleSchema,
  controls: z.array(z.string()),
});

const riskContextSchema = z.object({
  linkedTest: z.object({
    id: z.string(),
    riskEngineTestId: z.string().nullable(),
  }),
  results: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      severity: z.string(),
      reason: z.string(),
      executedAt: z.string(),
      resourceName: z.string(),
      resourceId: z.string(),
      signalType: z.string(),
    }),
  ),
  risks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.string(),
      score: z.number(),
      status: z.string(),
      resourceName: z.string(),
    }),
  ),
});

const securityEventSchema = z.object({
  id: z.string(),
  testId: z.string(),
  eventType: z.enum(['SIEM_FORWARD', 'SOAR_TRIGGER']),
  destination: z.string(),
  status: z.enum(['QUEUED', 'SENT']),
  createdAt: z.string(),
  summary: z.string(),
});

const unifiedEvidenceSchema = z.object({
  id: z.string(),
  sourceType: z.enum(['compliance-evidence', 'risk-snapshot']),
  sourceId: z.string(),
  testId: z.string(),
  title: z.string(),
  capturedAt: z.string(),
  provider: z.string(),
});

const escalationSchema = z.object({
  id: z.string(),
  testId: z.string(),
  owner: z.string(),
  stage: z.enum(['OWNER', 'MANAGER', 'CISO']),
  dueAt: z.string(),
  integration: z.string(),
  status: z.enum(['PENDING', 'TRIGGERED']),
});

const exportBundleSchema = z.object({
  format: z.enum(['csv', 'pdf']),
  fileName: z.string(),
  content: z.string(),
});

const okEnvelope = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ success: z.literal(true), data: schema });

export const testsContracts = {
  listTests: {
    method: 'GET',
    path: '/api/tests',
    query: listTestsQuerySchema,
    response: okEnvelope(z.array(testRecordSchema)),
  },
  getSummary: {
    method: 'GET',
    path: '/api/tests/summary',
    response: okEnvelope(testSummarySchema),
  },
  getDashboard: {
    method: 'GET',
    path: '/api/tests/dashboard',
    response: okEnvelope(dashboardSchema),
  },
  getGapAnalysis: {
    method: 'GET',
    path: '/api/tests/gaps',
    response: okEnvelope(gapAnalysisSchema),
  },
  listTemplates: {
    method: 'GET',
    path: '/api/tests/library',
    response: okEnvelope(z.array(testTemplateSchema)),
  },
  createSuiteFromTemplate: {
    method: 'POST',
    path: '/api/tests/library/:templateId/create-suite',
    response: okEnvelope(z.array(testRecordSchema)),
  },
  getTest: {
    method: 'GET',
    path: '/api/tests/:id',
    response: okEnvelope(testRecordSchema),
  },
  createTest: {
    method: 'POST',
    path: '/api/tests',
    body: createTestRequestSchema,
    response: okEnvelope(testRecordSchema),
  },
  updateTest: {
    method: 'PUT',
    path: '/api/tests/:id',
    body: updateTestRequestSchema,
    response: okEnvelope(testRecordSchema),
  },
  deleteTest: {
    method: 'DELETE',
    path: '/api/tests/:id',
    response: okEnvelope(z.object({ deleted: z.literal(true) })),
  },
  completeTest: {
    method: 'POST',
    path: '/api/tests/:id/complete',
    response: okEnvelope(testRecordSchema),
  },
  attachEvidence: {
    method: 'POST',
    path: '/api/tests/:id/evidence',
    body: attachEvidenceRequestSchema,
    response: okEnvelope(testEvidenceLinkSchema),
  },
  detachEvidence: {
    method: 'DELETE',
    path: '/api/tests/:id/evidence/:evidenceId',
    response: okEnvelope(z.object({ deleted: z.literal(true) })),
  },
  attachControl: {
    method: 'POST',
    path: '/api/tests/:id/controls',
    body: attachControlRequestSchema,
    response: okEnvelope(testControlLinkSchema),
  },
  detachControl: {
    method: 'DELETE',
    path: '/api/tests/:id/controls/:controlId',
    response: okEnvelope(z.object({ deleted: z.literal(true) })),
  },
  attachAudit: {
    method: 'POST',
    path: '/api/tests/:id/audits',
    body: attachAuditRequestSchema,
    response: okEnvelope(testAuditLinkSchema),
  },
  detachAudit: {
    method: 'DELETE',
    path: '/api/tests/:id/audits/:auditId',
    response: okEnvelope(z.object({ deleted: z.literal(true) })),
  },
  attachFramework: {
    method: 'POST',
    path: '/api/tests/:id/frameworks',
    body: attachFrameworkRequestSchema,
    response: okEnvelope(testFrameworkLinkSchema),
  },
  detachFramework: {
    method: 'DELETE',
    path: '/api/tests/:id/frameworks/:frameworkId',
    response: okEnvelope(z.object({ deleted: z.literal(true) })),
  },
  getHistory: {
    method: 'GET',
    path: '/api/tests/:id/history',
    response: okEnvelope(z.array(testHistoryEntrySchema)),
  },
  seedTests: {
    method: 'POST',
    path: '/api/tests/seed',
    response: okEnvelope(
      z.object({
        created: z.number().int().nonnegative(),
        skipped: z.number().int().nonnegative(),
      }),
    ),
  },
  getRuns: {
    method: 'GET',
    path: '/api/tests/:id/runs',
    response: okEnvelope(z.array(testRunRecordSchema)),
  },
  getRiskContext: {
    method: 'GET',
    path: '/api/tests/:id/risk-context',
    response: okEnvelope(riskContextSchema),
  },
  requestAttestation: {
    method: 'POST',
    path: '/api/tests/:id/attest/request',
    body: requestAttestationSchema,
    response: okEnvelope(testRecordSchema),
  },
  signAttestation: {
    method: 'POST',
    path: '/api/tests/:id/attest/sign',
    body: signAttestationSchema,
    response: okEnvelope(testRecordSchema),
  },
  autoRemediate: {
    method: 'POST',
    path: '/api/tests/:id/auto-remediate',
    response: okEnvelope(testRecordSchema),
  },
  exportTests: {
    method: 'GET',
    path: '/api/tests/export',
    query: exportTestsQuerySchema,
    response: okEnvelope(exportBundleSchema),
  },
  ingestPipelineRun: {
    method: 'POST',
    path: '/api/tests/pipeline/runs',
    body: pipelineRunRequestSchema,
    response: okEnvelope(testRecordSchema),
  },
  listSecurityEvents: {
    method: 'GET',
    path: '/api/tests/security-events',
    response: okEnvelope(z.array(securityEventSchema)),
  },
  listUnifiedEvidence: {
    method: 'GET',
    path: '/api/tests/unified-evidence',
    response: okEnvelope(z.array(unifiedEvidenceSchema)),
  },
  listEscalations: {
    method: 'GET',
    path: '/api/tests/escalations',
    response: okEnvelope(z.array(escalationSchema)),
  },
  listWorkflowIntegrationConfigStatus: {
    method: 'GET',
    path: '/api/tests/workflow-integrations/config',
    response: okEnvelope(z.array(workflowIntegrationConfigStatusSchema)),
  },
  upsertWorkflowIntegrationConfig: {
    method: 'PUT',
    path: '/api/tests/workflow-integrations/:provider/config',
    body: workflowIntegrationConfigUpsertSchema,
    response: okEnvelope(workflowIntegrationConfigStatusSchema),
  },
  bulkComplete: {
    method: 'POST',
    path: '/api/tests/bulk/complete',
    body: bulkCompleteRequestSchema,
    response: okEnvelope(z.array(testRecordSchema)),
  },
  bulkAssign: {
    method: 'POST',
    path: '/api/tests/bulk/assign',
    body: bulkAssignRequestSchema,
    response: okEnvelope(z.array(testRecordSchema)),
  },
  bulkLinkControl: {
    method: 'POST',
    path: '/api/tests/bulk/link-control',
    body: bulkLinkControlRequestSchema,
    response: okEnvelope(z.array(testControlLinkSchema)),
  },
} as const;

export type TestControlLinkDto = z.infer<typeof testControlLinkSchema>;
export type TestFrameworkLinkDto = z.infer<typeof testFrameworkLinkSchema>;
export type TestAuditLinkDto = z.infer<typeof testAuditLinkSchema>;
export type TestEvidenceLinkDto = z.infer<typeof testEvidenceLinkSchema>;
export type TestRecordDto = z.infer<typeof testRecordSchema>;
export type TestSummaryDto = z.infer<typeof testSummarySchema>;
export type TestHistoryEntryDto = z.infer<typeof testHistoryEntrySchema>;
export type TestRunRecordDto = z.infer<typeof testRunRecordSchema>;
export type ListTestsQueryDto = z.infer<typeof listTestsQuerySchema>;
export type CreateTestRequestDto = z.infer<typeof createTestRequestSchema>;
export type UpdateTestRequestDto = z.infer<typeof updateTestRequestSchema>;
export type BulkCompleteRequestDto = z.infer<typeof bulkCompleteRequestSchema>;
export type BulkAssignRequestDto = z.infer<typeof bulkAssignRequestSchema>;
export type BulkLinkControlRequestDto = z.infer<
  typeof bulkLinkControlRequestSchema
>;
