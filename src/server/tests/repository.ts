import type {
  TestRecordDto,
  TestHistoryEntryDto,
  TestRunRecordDto,
  TestControlLinkDto,
  TestAuditLinkDto,
  TestEvidenceLinkDto,
  TestFrameworkLinkDto,
} from './contracts';

export type RecurrenceRule = 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface ListTestsInput {
  page?: number;
  limit?: number;
  category?: 'Custom' | 'Engineering' | 'HR' | 'IT' | 'Policy' | 'Risks' | '';
  status?: 'Due_soon' | 'Needs_remediation' | 'OK' | 'Overdue' | '';
  type?: 'Document' | 'Automated' | 'Pipeline' | '';
  ownerId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
}

export interface CreateTestInput {
  name: string;
  category: 'Custom' | 'Engineering' | 'HR' | 'IT' | 'Policy' | 'Risks';
  type: 'Document' | 'Automated' | 'Pipeline';
  ownerId: string;
  dueDate: string;
  recurrenceRule?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | null;
  riskEngineTestId?: string | null;
  templateId?: string | null;
}

export interface UpdateTestInput {
  name?: string;
  category?: 'Custom' | 'Engineering' | 'HR' | 'IT' | 'Policy' | 'Risks';
  type?: 'Document' | 'Automated' | 'Pipeline';
  ownerId?: string;
  dueDate?: string;
  recurrenceRule?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | null;
  status?: 'Due_soon' | 'Needs_remediation' | 'OK' | 'Overdue';
  riskEngineTestId?: string | null;
}

export interface TestSummaryDto {
  total: number;
  completed: number;
  passPercentage: number;
  overdue: number;
  dueSoon: number;
}

/**
 * Repository interface that abstracts data access for the Tests subsystem.
 *
 * Every method that touches tenant data takes an `orgId` parameter so the
 * implementation can scope reads/writes to the correct organisation.
 */
export interface TestsRepository {
  /* ── core CRUD ───────────────────────────────────────────────── */

  listTests(orgId: string, filters: ListTestsInput): TestRecordDto[];
  getSummary(orgId: string): TestSummaryDto;
  getTest(orgId: string, id: string): TestRecordDto;
  createTest(orgId: string, input: CreateTestInput): TestRecordDto;
  updateTest(orgId: string, id: string, input: UpdateTestInput): TestRecordDto;
  deleteTest(orgId: string, id: string): void;
  completeTest(orgId: string, id: string): TestRecordDto;

  /* ── bulk operations ─────────────────────────────────────────── */

  bulkComplete(orgId: string, testIds: string[]): TestRecordDto[];
  bulkAssign(orgId: string, testIds: string[], ownerId: string): TestRecordDto[];
  bulkLinkControl(orgId: string, testIds: string[], controlId: string): TestControlLinkDto[];

  /* ── evidence ────────────────────────────────────────────────── */

  attachEvidence(orgId: string, testId: string, evidenceId: string): TestEvidenceLinkDto;
  detachEvidence(orgId: string, testId: string, evidenceId: string): void;
  attachRunEvidenceFromRun(orgId: string, testId: string, run: TestRunRecordDto): TestRecordDto;

  /* ── controls ────────────────────────────────────────────────── */

  attachControl(orgId: string, testId: string, controlId: string): TestControlLinkDto;
  detachControl(orgId: string, testId: string, controlId: string): void;

  /* ── audits ──────────────────────────────────────────────────── */

  attachAudit(orgId: string, testId: string, auditId: string): TestAuditLinkDto;
  detachAudit(orgId: string, testId: string, auditId: string): void;

  /* ── frameworks ──────────────────────────────────────────────── */

  attachFramework(orgId: string, testId: string, frameworkName: string): TestFrameworkLinkDto;
  detachFramework(orgId: string, testId: string, frameworkId: string): void;

  /* ── history & runs ──────────────────────────────────────────── */

  getHistory(orgId: string, testId: string): TestHistoryEntryDto[];
  getRuns(orgId: string, testId: string): TestRunRecordDto[];

  /* ── seed / sync ─────────────────────────────────────────────── */

  seedPolicyTests(orgId: string): { created: number; skipped: number };
  runAutomationBackfillOnce(orgId: string): void;
  applyAutomationMappings(orgId: string, testId: string): TestRecordDto;

  /* ── internal helpers exposed for enterprise.ts ───────────────── */

  /** Low-level record updater – used by enterprise.ts for attestation, remediation, etc. */
  updateRecord(orgId: string, testId: string, updater: (record: TestRecordDto) => TestRecordDto): TestRecordDto;
  /** Low-level history appender */
  addHistory(orgId: string, testId: string, changeType: string, oldValue: string | null, newValue: string | null, changedBy?: string): void;
  /** Low-level runs accessor (mutable) – used by enterprise.ts pipeline ingest */
  pushRun(orgId: string, testId: string, run: TestRunRecordDto): void;
  /** Replace the full runs list for a test (used by state.runs proxy) */
  setRuns(orgId: string, testId: string, runs: TestRunRecordDto[]): void;
}
