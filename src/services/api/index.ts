// Export all API services for easy import
export { apiClient } from './client';
export { authService } from './auth';
export { assetsService } from './assets';
export { risksService } from './risks';
export { controlsService } from './controls';
export { evidenceService } from './evidence';
export { auditsService } from './audits';
export { policiesService } from './policies';
export { usersService } from './users';
export type { UserWithGit, UserGitAccount, GitHubMember, LinkedGitAccount } from './users';
export { mdmService } from './mdm';
export type { ManagedDevice, DeviceCompliance, EnrollmentToken, CreatedToken, MdmOverview, DeviceCheckin } from './mdm';
export { testsService } from './tests';
export type {
  TestRecord,
  TestSummary,
  TestHistoryEntry,
  TestCategory,
  TestType,
  TestStatus,
  TestRecurrenceRule,
  TestAttestationStatus,
  TestControlLink,
  TestFrameworkLink,
  TestAuditLink,
  TestEvidenceLink,
  TestDashboard,
  TestGapAnalysis,
  TestTemplate,
  TestRiskContext,
  TestSecurityEvent,
  UnifiedTestEvidence,
  TestEscalation,
  TestExportBundle,
  ListTestsParams,
  CreateTestRequest,
  UpdateTestRequest,
} from './tests';

export { findingsService } from './findings';
export type {
  FindingRecord,
  FindingSeverity,
  FindingStatus,
  CreateFindingRequest,
  UpdateFindingRequest,
  ListFindingsParams,
} from './findings';

// Export types
export * from './types';
