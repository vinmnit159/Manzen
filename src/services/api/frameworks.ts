import { apiClient } from './client';

export interface FrameworkDto {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface FrameworkRequirementDto {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  domain: string | null;
  createdAt: string;
}

export interface OrgFrameworkDto {
  id: string;
  organizationId: string;
  frameworkId: string;
  frameworkSlug: string;
  frameworkName: string;
  frameworkVersion: string;
  status: 'setup_in_progress' | 'active' | 'archived';
  activatedAt: string | null;
  activatedBy: string | null;
  archivedAt: string | null;
  archivedBy: string | null;
  scopeNote: string | null;
  createdAt: string;
  updatedAt: string;
  // Latest coverage snapshot fields (null if no snapshot yet)
  controlCoveragePct: number | null;
  testPassRatePct: number | null;
  openGaps: number | null;
  covered: number | null;
  applicable: number | null;
  totalRequirements: number | null;
  snapshotCalculatedAt: string | null;
}

export interface RequirementStatusDto {
  id: string;
  organizationId: string;
  frameworkRequirementId: string;
  code: string;
  title: string;
  domain: string | null;
  applicabilityStatus: 'applicable' | 'not_applicable';
  justification: string | null;
  reviewStatus: 'not_started' | 'in_review' | 'accepted';
  ownerId: string | null;
  dueDate: string | null;
  updatedAt: string;
}

export interface CoverageSnapshotDto {
  id: string;
  organizationId: string;
  frameworkId: string;
  totalRequirements: number;
  totalMapped: number;
  notApplicable: number;
  applicable: number;
  covered: number;
  partiallyCovered: number;
  notCovered: number;
  controlCoveragePct: number;
  testPassRatePct: number;
  mappedTestCount: number;
  passingTestCount: number;
  openGaps: number;
  calculatedAt: string;
}

export interface FrameworkEntitlementDto {
  frameworkSlug: string;
  entitled: boolean;
  planName: string | null;
  validUntil: string | null;
}

export interface BillingEntitlementDto {
  frameworkSlug: string;
  planName: string | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
}

export interface ActivateFrameworkRequest {
  frameworkSlug: string;
  scopeNote?: string;
}

export interface ActivationSummaryDto {
  requirementsLoaded: number;
  mappingsSuggested: number;
  mappingsSkipped: number;
  requirementsNeedingReview: number;
  initialCoverageScore: number;
  isReactivation: boolean;
  warnings: string[];
}

export interface RemoveFrameworkRequest {
  reason?: string;
}

export interface UpdateRequirementOwnerRequest {
  ownerId?: string | null;
  dueDate?: string | null;
}

export interface UpdateApplicabilityRequest {
  applicabilityStatus: 'applicable' | 'not_applicable';
  justification?: string;
}

export interface SyncEntitlementRequest {
  organizationId: string;
  frameworkSlug: string;
  planName: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string | null;
}

export interface ControlMappingDto {
  id: string;
  controlId: string;
  frameworkRequirementId: string;
  frameworkId: string;
  mappingType: 'direct' | 'inherited' | 'suggested';
  createdAt: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
}

export interface TestMappingDto {
  id: string;
  testId: string;
  frameworkRequirementId: string;
  frameworkId: string;
  createdAt: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
}

export interface PolicyMappingDto {
  id: string;
  policyId: string;
  frameworkRequirementId: string;
  frameworkId: string;
  createdAt: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
}

export interface FrameworkMappingsDto {
  controls: ControlMappingDto[];
  tests: TestMappingDto[];
  policies: PolicyMappingDto[];
}

export interface FrameworkReadinessDto {
  slug: string;
  name: string;
  version: string;
  controlCoveragePct: number | null;
  testPassRatePct: number | null;
  openGaps: number | null;
  covered: number | null;
  applicable: number | null;
  totalRequirements: number | null;
  calculatedAt: string | null;
}

class FrameworksService {
  /** GET /api/frameworks — global catalog */
  async listCatalog(): Promise<{ success: boolean; data: FrameworkDto[] }> {
    return apiClient.get('/api/frameworks');
  }

  /** GET /api/frameworks/:slug — single framework */
  async getFramework(slug: string): Promise<{ success: boolean; data: FrameworkDto }> {
    return apiClient.get(`/api/frameworks/${slug}`);
  }

  /** GET /api/frameworks/:slug/requirements */
  async listRequirements(slug: string): Promise<{ success: boolean; data: FrameworkRequirementDto[] }> {
    return apiClient.get(`/api/frameworks/${slug}/requirements`);
  }

  /** GET /api/org/frameworks — org's active frameworks */
  async listOrgFrameworks(): Promise<{ success: boolean; data: OrgFrameworkDto[] }> {
    return apiClient.get('/api/org/frameworks');
  }

  /** POST /api/org/frameworks — activate a framework */
  async activateFramework(body: ActivateFrameworkRequest): Promise<{
    success: boolean;
    data: OrgFrameworkDto;
    summary: ActivationSummaryDto;
  }> {
    return apiClient.post('/api/org/frameworks', body);
  }

  /** PATCH /api/org/frameworks/:slug/remove — remove from active scope */
  async removeFramework(frameworkSlug: string, body: RemoveFrameworkRequest = {}): Promise<{ success: boolean; data: OrgFrameworkDto }> {
    return apiClient.patch(`/api/org/frameworks/${frameworkSlug}/remove`, body);
  }

  /** GET /api/org/frameworks/:slug/entitlement */
  async checkEntitlement(frameworkSlug: string): Promise<{ success: boolean; data: FrameworkEntitlementDto }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/entitlement`);
  }

  /** GET /api/org/frameworks/:slug/requirements — requirement status per org */
  async listOrgRequirements(frameworkSlug: string): Promise<{ success: boolean; data: RequirementStatusDto[] }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/requirements`);
  }

  /** GET /api/org/frameworks/:slug/coverage — latest coverage snapshot */
  async getCoverage(frameworkSlug: string): Promise<{ success: boolean; data: CoverageSnapshotDto | null }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/coverage`);
  }

  /** GET /api/org/frameworks/:slug/coverage/history — recent coverage snapshots */
  async getCoverageHistory(frameworkSlug: string, limit = 24): Promise<{ success: boolean; data: CoverageSnapshotDto[] }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/coverage/history`, { limit: String(limit) });
  }

  /** GET /api/org/frameworks/:slug/mappings — all control/test/policy mappings */
  async getFrameworkMappings(frameworkSlug: string): Promise<{ success: boolean; data: FrameworkMappingsDto }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/mappings`);
  }

  /** POST /api/org/frameworks/:slug/mappings/confirm — confirm a suggested mapping */
  async confirmMapping(frameworkSlug: string, body: { mappingType: 'control' | 'test' | 'policy'; mappingId: string }): Promise<{ success: boolean; data: any }> {
    return apiClient.post(`/api/org/frameworks/${frameworkSlug}/mappings/confirm`, body);
  }

  /** PATCH /api/org/requirements/:requirementId/owner */
  async updateRequirementOwner(requirementId: string, body: UpdateRequirementOwnerRequest): Promise<{ success: boolean; data: RequirementStatusDto }> {
    return apiClient.patch(`/api/org/requirements/${requirementId}/owner`, body);
  }

  /** PATCH /api/org/requirements/:requirementId/applicability */
  async updateApplicability(requirementId: string, body: UpdateApplicabilityRequest): Promise<{ success: boolean; data: RequirementStatusDto }> {
    return apiClient.patch(`/api/org/requirements/${requirementId}/applicability`, body);
  }

  /** GET /api/org/frameworks/readiness — readiness summary for all active frameworks */
  async getReadinessSummary(): Promise<{ success: boolean; data: FrameworkReadinessDto[] }> {
    return apiClient.get('/api/org/frameworks/readiness');
  }

  /** GET /api/billing/entitlements — current org entitlements */
  async listEntitlements(): Promise<{ success: boolean; data: BillingEntitlementDto[] }> {
    return apiClient.get('/api/billing/entitlements');
  }

  /** POST /api/billing/entitlements/sync (SUPER_ADMIN only) */
  async syncEntitlement(body: SyncEntitlementRequest): Promise<{ success: boolean; data: { synced: boolean } }> {
    return apiClient.post('/api/billing/entitlements/sync', body);
  }
}

export const frameworksService = new FrameworksService();
