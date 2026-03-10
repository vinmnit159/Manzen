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
    response: okEnvelope(orgFrameworkSchema),
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
