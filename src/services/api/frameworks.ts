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

export interface ActivateFrameworkRequest {
  frameworkSlug: string;
  scopeNote?: string;
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
  async activateFramework(body: ActivateFrameworkRequest): Promise<{ success: boolean; data: OrgFrameworkDto }> {
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

  /** PATCH /api/org/requirements/:requirementId/owner */
  async updateRequirementOwner(requirementId: string, body: UpdateRequirementOwnerRequest): Promise<{ success: boolean; data: RequirementStatusDto }> {
    return apiClient.patch(`/api/org/requirements/${requirementId}/owner`, body);
  }

  /** PATCH /api/org/requirements/:requirementId/applicability */
  async updateApplicability(requirementId: string, body: UpdateApplicabilityRequest): Promise<{ success: boolean; data: RequirementStatusDto }> {
    return apiClient.patch(`/api/org/requirements/${requirementId}/applicability`, body);
  }

  /** POST /api/billing/entitlements/sync (SUPER_ADMIN only) */
  async syncEntitlement(body: SyncEntitlementRequest): Promise<{ success: boolean; data: { synced: boolean } }> {
    return apiClient.post('/api/billing/entitlements/sync', body);
  }
}

export const frameworksService = new FrameworksService();
