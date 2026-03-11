import { z } from 'zod';

// ─── Shared envelope ──────────────────────────────────────────────────────────

export const okEnvelope = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ success: z.literal(true), data: schema });

// ─── Framework catalog ────────────────────────────────────────────────────────

export const frameworkSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});

export const frameworkRequirementSchema = z.object({
  id: z.string(),
  frameworkId: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  domain: z.string().nullable(),
  createdAt: z.string(),
});

// ─── Organization framework (activation) ─────────────────────────────────────

export const orgFrameworkStatusSchema = z.enum([
  'setup_in_progress',
  'active',
  'archived',
]);

export const orgFrameworkSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  frameworkId: z.string(),
  frameworkSlug: z.string(),
  frameworkName: z.string(),
  frameworkVersion: z.string(),
  status: orgFrameworkStatusSchema,
  activatedAt: z.string().nullable(),
  activatedBy: z.string().nullable(),
  archivedAt: z.string().nullable(),
  archivedBy: z.string().nullable(),
  scopeNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Requests ─────────────────────────────────────────────────────────────────

export const activateFrameworkRequestSchema = z.object({
  frameworkSlug: z.string().min(1),
  scopeNote: z.string().optional(),
});

export const removeFrameworkRequestSchema = z.object({
  /** Provide a reason for removing from active scope (optional) */
  reason: z.string().optional(),
});

// ─── Entitlement check response ───────────────────────────────────────────────

export const frameworkEntitlementSchema = z.object({
  frameworkSlug: z.string(),
  entitled: z.boolean(),
  planName: z.string().nullable(),
  validUntil: z.string().nullable(),
});

// ─── Requirement status ───────────────────────────────────────────────────────

export const requirementStatusSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  frameworkRequirementId: z.string(),
  code: z.string(),
  title: z.string(),
  domain: z.string().nullable(),
  applicabilityStatus: z.enum(['applicable', 'not_applicable']),
  justification: z.string().nullable(),
  reviewStatus: z.enum(['not_started', 'in_review', 'accepted']),
  ownerId: z.string().nullable(),
  dueDate: z.string().nullable(),
  updatedAt: z.string(),
});

export const updateOwnerRequestSchema = z.object({
  ownerId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const updateApplicabilityRequestSchema = z.object({
  applicabilityStatus: z.enum(['applicable', 'not_applicable']),
  justification: z.string().optional(),
});

// ─── Coverage snapshot ────────────────────────────────────────────────────────

export const coverageSnapshotSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  frameworkId: z.string(),
  totalRequirements: z.number(),
  totalMapped: z.number(),
  notApplicable: z.number(),
  applicable: z.number(),
  covered: z.number(),
  partiallyCovered: z.number(),
  notCovered: z.number(),
  controlCoveragePct: z.number(),
  testPassRatePct: z.number(),
  mappedTestCount: z.number(),
  passingTestCount: z.number(),
  openGaps: z.number(),
  calculatedAt: z.string(),
});

// ─── Billing entitlement sync ─────────────────────────────────────────────────

export const syncEntitlementRequestSchema = z.object({
  organizationId: z.string(),
  frameworkSlug: z.string(),
  planName: z.string(),
  isActive: z.boolean(),
  validFrom: z.string(),
  validUntil: z.string().nullable().optional(),
});

// ─── Billing entitlement list ─────────────────────────────────────────────────

export const billingEntitlementSchema = z.object({
  frameworkSlug: z.string(),
  planName: z.string().nullable(),
  isActive: z.boolean(),
  validFrom: z.string(),
  validUntil: z.string().nullable(),
  createdAt: z.string(),
});

// ─── Framework readiness summary ──────────────────────────────────────────────

export const frameworkReadinessSchema = z.object({
  slug: z.string(),
  name: z.string(),
  version: z.string(),
  controlCoveragePct: z.number().nullable(),
  testPassRatePct: z.number().nullable(),
  openGaps: z.number().nullable(),
  covered: z.number().nullable(),
  applicable: z.number().nullable(),
  totalRequirements: z.number().nullable(),
  calculatedAt: z.string().nullable(),
});

// ─── Coverage history ─────────────────────────────────────────────────────────

export const coverageHistoryQuerySchema = z.object({
  limit: z.string().optional().transform(v => (v ? parseInt(v, 10) : 24)),
});

// ─── Mappings ─────────────────────────────────────────────────────────────────

export const controlMappingSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  controlId: z.string(),
  frameworkRequirementId: z.string(),
  frameworkId: z.string(),
  mappingType: z.enum(['direct', 'inherited', 'suggested']),
  createdAt: z.string(),
  requirementCode: z.string(),
  requirementTitle: z.string(),
  requirementDomain: z.string().nullable(),
});

export const testMappingSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  testId: z.string(),
  frameworkRequirementId: z.string(),
  frameworkId: z.string(),
  createdAt: z.string(),
  requirementCode: z.string(),
  requirementTitle: z.string(),
  requirementDomain: z.string().nullable(),
});

export const policyMappingSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  policyId: z.string(),
  frameworkRequirementId: z.string(),
  frameworkId: z.string(),
  createdAt: z.string(),
  requirementCode: z.string(),
  requirementTitle: z.string(),
  requirementDomain: z.string().nullable(),
});

export const frameworkMappingsSchema = z.object({
  controls: z.array(controlMappingSchema),
  tests: z.array(testMappingSchema),
  policies: z.array(policyMappingSchema),
});

export const confirmMappingRequestSchema = z.object({
  mappingType: z.enum(['control', 'test', 'policy']),
  mappingId: z.string().min(1),
});

// ─── Activation summary ───────────────────────────────────────────────────────

export const activationSummarySchema = z.object({
  requirementsLoaded: z.number(),
  mappingsSuggested: z.number(),
  mappingsSkipped: z.number(),
  requirementsNeedingReview: z.number(),
  initialCoverageScore: z.number(),
  isReactivation: z.boolean(),
  warnings: z.array(z.string()),
});

export const activateFrameworkResponseSchema = z.object({
  orgFramework: orgFrameworkSchema,
  summary: activationSummarySchema,
});

// ─── Contracts map ────────────────────────────────────────────────────────────

export const frameworkContracts = {
  listCatalog: {
    method: 'GET' as const,
    path: '/api/frameworks',
    response: okEnvelope(z.array(frameworkSchema)),
  },
  getFramework: {
    method: 'GET' as const,
    path: '/api/frameworks/:slug',
    response: okEnvelope(frameworkSchema),
  },
  listRequirements: {
    method: 'GET' as const,
    path: '/api/frameworks/:slug/requirements',
    response: okEnvelope(z.array(frameworkRequirementSchema)),
  },
  listOrgFrameworks: {
    method: 'GET' as const,
    path: '/api/org/frameworks',
    response: okEnvelope(z.array(orgFrameworkSchema)),
  },
  activateFramework: {
    method: 'POST' as const,
    path: '/api/org/frameworks',
    body: activateFrameworkRequestSchema,
    response: okEnvelope(activateFrameworkResponseSchema),
  },
  removeFramework: {
    method: 'PATCH' as const,
    path: '/api/org/frameworks/:frameworkSlug/remove',
    body: removeFrameworkRequestSchema,
    response: okEnvelope(orgFrameworkSchema),
  },
  checkEntitlement: {
    method: 'GET' as const,
    path: '/api/org/frameworks/:frameworkSlug/entitlement',
    response: okEnvelope(frameworkEntitlementSchema),
  },
  // Phase 3 — requirement status per org
  listOrgRequirements: {
    method: 'GET' as const,
    path: '/api/org/frameworks/:frameworkSlug/requirements',
    response: okEnvelope(z.array(requirementStatusSchema)),
  },
  // Phase 4 — coverage snapshot
  getCoverage: {
    method: 'GET' as const,
    path: '/api/org/frameworks/:frameworkSlug/coverage',
    response: okEnvelope(coverageSnapshotSchema.nullable()),
  },
  // Phase 4 — owner assignment
  updateRequirementOwner: {
    method: 'PATCH' as const,
    path: '/api/org/requirements/:requirementId/owner',
    body: updateOwnerRequestSchema,
    response: okEnvelope(requirementStatusSchema),
  },
  // Phase 4 — applicability
  updateApplicability: {
    method: 'PATCH' as const,
    path: '/api/org/requirements/:requirementId/applicability',
    body: updateApplicabilityRequestSchema,
    response: okEnvelope(requirementStatusSchema),
  },
  // Phase 5 — billing entitlement sync
  syncEntitlement: {
    method: 'POST' as const,
    path: '/api/billing/entitlements/sync',
    body: syncEntitlementRequestSchema,
    response: okEnvelope(z.object({ synced: z.literal(true) })),
  },
  // Phase 5 — list org entitlements
  listEntitlements: {
    method: 'GET' as const,
    path: '/api/billing/entitlements',
    response: okEnvelope(z.array(billingEntitlementSchema)),
  },
  // Phase 4 — readiness summary (all active frameworks for org)
  getReadinessSummary: {
    method: 'GET' as const,
    path: '/api/org/frameworks/readiness',
    response: okEnvelope(z.array(frameworkReadinessSchema)),
  },
  // Phase 4 — coverage history
  getCoverageHistory: {
    method: 'GET' as const,
    path: '/api/org/frameworks/:frameworkSlug/coverage/history',
    response: okEnvelope(z.array(coverageSnapshotSchema)),
  },
  // Phase 3 — get all mappings for a framework
  getFrameworkMappings: {
    method: 'GET' as const,
    path: '/api/org/frameworks/:frameworkSlug/mappings',
    response: okEnvelope(frameworkMappingsSchema),
  },
  // Phase 3 — confirm a suggested mapping
  confirmMapping: {
    method: 'POST' as const,
    path: '/api/org/frameworks/:frameworkSlug/mappings/confirm',
    body: confirmMappingRequestSchema,
    response: okEnvelope(z.object({ confirmed: z.literal(true) })),
  },
} as const;

// ─── DTO types ────────────────────────────────────────────────────────────────

export type FrameworkDto = z.infer<typeof frameworkSchema>;
export type FrameworkRequirementDto = z.infer<typeof frameworkRequirementSchema>;
export type OrgFrameworkDto = z.infer<typeof orgFrameworkSchema>;
export type OrgFrameworkStatus = z.infer<typeof orgFrameworkStatusSchema>;
export type ActivateFrameworkRequestDto = z.infer<typeof activateFrameworkRequestSchema>;
export type RemoveFrameworkRequestDto = z.infer<typeof removeFrameworkRequestSchema>;
export type FrameworkEntitlementDto = z.infer<typeof frameworkEntitlementSchema>;
export type RequirementStatusDto = z.infer<typeof requirementStatusSchema>;
export type UpdateOwnerRequestDto = z.infer<typeof updateOwnerRequestSchema>;
export type UpdateApplicabilityRequestDto = z.infer<typeof updateApplicabilityRequestSchema>;
export type CoverageSnapshotDto = z.infer<typeof coverageSnapshotSchema>;
export type SyncEntitlementRequestDto = z.infer<typeof syncEntitlementRequestSchema>;
export type BillingEntitlementDto = z.infer<typeof billingEntitlementSchema>;
export type FrameworkReadinessDto = z.infer<typeof frameworkReadinessSchema>;
export type ControlMappingDto = z.infer<typeof controlMappingSchema>;
export type TestMappingDto = z.infer<typeof testMappingSchema>;
export type PolicyMappingDto = z.infer<typeof policyMappingSchema>;
export type FrameworkMappingsDto = z.infer<typeof frameworkMappingsSchema>;
export type ConfirmMappingRequestDto = z.infer<typeof confirmMappingRequestSchema>;
export type ActivationSummaryDto = z.infer<typeof activationSummarySchema>;
export type ActivateFrameworkResponseDto = z.infer<typeof activateFrameworkResponseSchema>;
