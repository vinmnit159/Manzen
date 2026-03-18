/**
 * FrameworkService
 *
 * All DB queries for the frameworks module. Uses raw pg via SqlExecutor —
 * no Prisma, same pattern as SqlRiskEngineRepository.
 *
 * Entitlement enforcement is gated by FRAMEWORK_ENTITLEMENTS_ENFORCED env var
 * (default false). When false, all orgs can activate any framework.
 */

import type { SqlExecutor } from '@/domain/risk-engine/persistence';
import { computeAndInsertCoverageSnapshot } from './coverageEngine';
import type {
  FrameworkDto,
  FrameworkRequirementDto,
  OrgFrameworkDto,
  FrameworkEntitlementDto,
  RequirementStatusDto,
  CoverageSnapshotDto,
  SyncEntitlementRequestDto,
  BillingEntitlementDto,
  FrameworkReadinessDto,
  ControlMappingDto,
  TestMappingDto,
  PolicyMappingDto,
  FrameworkMappingsDto,
  ActivationSummaryDto,
  ActivateFrameworkResponseDto,
} from './contracts';
import { NotificationEventType } from '@/domain/notifications/eventTypes';
import { getNotificationServiceOrNull } from '@/server/notifications/module';

// ── Row shapes returned by Postgres ──────────────────────────────────────────

interface FrameworkRow {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface RequirementRow {
  id: string;
  framework_id: string;
  code: string;
  title: string;
  description: string | null;
  domain: string | null;
  created_at: string;
}

interface OrgFrameworkRow {
  id: string;
  organization_id: string;
  framework_id: string;
  framework_slug: string;
  framework_name: string;
  framework_version: string;
  status: string;
  activated_at: string | null;
  activated_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
  scope_note: string | null;
  created_at: string;
  updated_at: string;
}

interface EntitlementRow {
  framework_slug: string;
  plan_name: string | null;
  is_active: boolean;
  valid_until: string | null;
}

interface RequirementStatusRow {
  id: string;
  organization_id: string;
  framework_requirement_id: string;
  code: string;
  title: string;
  domain: string | null;
  applicability_status: string;
  justification: string | null;
  review_status: string;
  owner_id: string | null;
  due_date: string | null;
  updated_at: string;
}

interface CoverageSnapshotRow {
  id: string;
  organization_id: string;
  framework_id: string;
  total_requirements: number;
  total_mapped: number;
  not_applicable: number;
  applicable: number;
  covered: number;
  partially_covered: number;
  not_covered: number;
  control_coverage_pct: number;
  test_pass_rate_pct: number;
  mapped_test_count: number;
  passing_test_count: number;
  open_gaps: number;
  calculated_at: string;
}

interface BillingEntitlementRow {
  framework_slug: string;
  plan_name: string | null;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

interface ControlMappingRow {
  id: string;
  organization_id: string;
  control_id: string;
  framework_requirement_id: string;
  framework_id: string;
  mapping_type: string;
  created_at: string;
  requirement_code: string;
  requirement_title: string;
  requirement_domain: string | null;
}

interface TestMappingRow {
  id: string;
  organization_id: string;
  test_id: string;
  framework_requirement_id: string;
  framework_id: string;
  created_at: string;
  requirement_code: string;
  requirement_title: string;
  requirement_domain: string | null;
}

interface PolicyMappingRow {
  id: string;
  organization_id: string;
  policy_id: string;
  framework_requirement_id: string;
  framework_id: string;
  created_at: string;
  requirement_code: string;
  requirement_title: string;
  requirement_domain: string | null;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function toFrameworkDto(row: FrameworkRow): FrameworkDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    version: row.version,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toRequirementDto(row: RequirementRow): FrameworkRequirementDto {
  return {
    id: row.id,
    frameworkId: row.framework_id,
    code: row.code,
    title: row.title,
    description: row.description,
    domain: row.domain,
    createdAt: row.created_at,
  };
}

function toRequirementStatusDto(
  row: RequirementStatusRow,
): RequirementStatusDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkRequirementId: row.framework_requirement_id,
    code: row.code,
    title: row.title,
    domain: row.domain,
    applicabilityStatus:
      row.applicability_status as RequirementStatusDto['applicabilityStatus'],
    justification: row.justification,
    reviewStatus: row.review_status as RequirementStatusDto['reviewStatus'],
    ownerId: row.owner_id,
    dueDate: row.due_date,
    updatedAt: row.updated_at,
  };
}

function toCoverageSnapshotDto(row: CoverageSnapshotRow): CoverageSnapshotDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkId: row.framework_id,
    totalRequirements: Number(row.total_requirements),
    totalMapped: Number(row.total_mapped),
    notApplicable: Number(row.not_applicable),
    applicable: Number(row.applicable),
    covered: Number(row.covered),
    partiallyCovered: Number(row.partially_covered),
    notCovered: Number(row.not_covered),
    controlCoveragePct: Number(row.control_coverage_pct),
    testPassRatePct: Number(row.test_pass_rate_pct),
    mappedTestCount: Number(row.mapped_test_count),
    passingTestCount: Number(row.passing_test_count),
    openGaps: Number(row.open_gaps),
    calculatedAt: row.calculated_at,
  };
}

function toOrgFrameworkDto(row: OrgFrameworkRow): OrgFrameworkDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkId: row.framework_id,
    frameworkSlug: row.framework_slug,
    frameworkName: row.framework_name,
    frameworkVersion: row.framework_version,
    status: row.status as OrgFrameworkDto['status'],
    activatedAt: row.activated_at,
    activatedBy: row.activated_by,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
    scopeNote: row.scope_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBillingEntitlementDto(
  row: BillingEntitlementRow,
): BillingEntitlementDto {
  return {
    frameworkSlug: row.framework_slug,
    planName: row.plan_name,
    isActive: row.is_active,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    createdAt: row.created_at,
  };
}

function toControlMappingDto(row: ControlMappingRow): ControlMappingDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    controlId: row.control_id,
    frameworkRequirementId: row.framework_requirement_id,
    frameworkId: row.framework_id,
    mappingType: row.mapping_type as ControlMappingDto['mappingType'],
    createdAt: row.created_at,
    requirementCode: row.requirement_code,
    requirementTitle: row.requirement_title,
    requirementDomain: row.requirement_domain,
  };
}

function toTestMappingDto(row: TestMappingRow): TestMappingDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    testId: row.test_id,
    frameworkRequirementId: row.framework_requirement_id,
    frameworkId: row.framework_id,
    createdAt: row.created_at,
    requirementCode: row.requirement_code,
    requirementTitle: row.requirement_title,
    requirementDomain: row.requirement_domain,
  };
}

function toPolicyMappingDto(row: PolicyMappingRow): PolicyMappingDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    policyId: row.policy_id,
    frameworkRequirementId: row.framework_requirement_id,
    frameworkId: row.framework_id,
    createdAt: row.created_at,
    requirementCode: row.requirement_code,
    requirementTitle: row.requirement_title,
    requirementDomain: row.requirement_domain,
  };
}

function guessUserEmail(userId?: string | null) {
  if (!userId) return undefined;
  if (userId.includes('@')) return userId;
  return `${userId}@manzen.dev`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class FrameworkService {
  constructor(private readonly db: SqlExecutor) {}

  /** Returns the global framework catalog (all active frameworks). */
  async listCatalog(): Promise<FrameworkDto[]> {
    const result = await this.db.query<FrameworkRow>(
      `select id, slug, name, version, description, status, created_at
         from frameworks
        where status = 'active'
        order by name asc`,
    );
    return result.rows.map(toFrameworkDto);
  }

  /** Returns a single framework by slug, or null if not found. */
  async getFrameworkBySlug(slug: string): Promise<FrameworkDto | null> {
    const result = await this.db.query<FrameworkRow>(
      `select id, slug, name, version, description, status, created_at
         from frameworks
        where slug = $1
          and status = 'active'
        limit 1`,
      [slug],
    );
    return result.rows[0] ? toFrameworkDto(result.rows[0]) : null;
  }

  /** Returns all requirements for a framework identified by slug. */
  async listRequirements(slug: string): Promise<FrameworkRequirementDto[]> {
    const result = await this.db.query<RequirementRow>(
      `select r.id, r.framework_id, r.code, r.title, r.description, r.domain, r.created_at
         from framework_requirements r
         join frameworks f on f.id = r.framework_id
        where f.slug = $1
        order by r.code asc`,
      [slug],
    );
    return result.rows.map(toRequirementDto);
  }

  /** Returns all frameworks activated by an organization (excluding archived). */
  async listOrgFrameworks(organizationId: string): Promise<OrgFrameworkDto[]> {
    const result = await this.db.query<OrgFrameworkRow>(
      `select
         of.id,
         of.organization_id,
         of.framework_id,
         f.slug      as framework_slug,
         f.name      as framework_name,
         f.version   as framework_version,
         of.status,
         of.activated_at,
         of.activated_by,
         of.archived_at,
         of.archived_by,
         of.scope_note,
         of.created_at,
         of.updated_at
         from organization_frameworks of
         join frameworks f on f.id = of.framework_id
        where of.organization_id = $1
          and of.status != 'archived'
        order by f.name asc`,
      [organizationId],
    );
    return result.rows.map(toOrgFrameworkDto);
  }

  /**
   * Activates a framework for an organization.
   * - Inserts a row in organization_frameworks (status = active).
   * - Inserts default requirement status rows for all requirements (applicable, not_started).
   * - ON CONFLICT DO NOTHING so re-activation is idempotent.
   * Returns the org framework record after insert.
   */
  async activateFramework(opts: {
    organizationId: string;
    frameworkSlug: string;
    activatedBy: string;
    scopeNote?: string;
  }): Promise<ActivateFrameworkResponseDto> {
    const fw = await this.getFrameworkBySlug(opts.frameworkSlug);
    if (!fw) {
      throw Object.assign(
        new Error(`Framework not found: ${opts.frameworkSlug}`),
        { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 },
      );
    }

    // Check entitlement when enforcement is enabled
    await this.assertEntitled(opts.organizationId, opts.frameworkSlug);

    // Check if this is a re-activation (already had a record)
    const existingResult = await this.db.query<{ status: string }>(
      `select status from organization_frameworks
        where organization_id = $1 and framework_id = $2 limit 1`,
      [opts.organizationId, fw.id],
    );
    const isReactivation = existingResult.rows.length > 0;

    const orgFwId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.query(
      `insert into organization_frameworks
         (id, organization_id, framework_id, status, activated_at, activated_by, scope_note, created_at, updated_at)
       values ($1, $2, $3, 'active', $4, $5, $6, $4, $4)
       on conflict (organization_id, framework_id) do update
         set status       = 'active',
             activated_at = excluded.activated_at,
             activated_by = excluded.activated_by,
             scope_note   = coalesce(excluded.scope_note, organization_frameworks.scope_note),
             archived_at  = null,
             archived_by  = null,
             updated_at   = excluded.updated_at`,
      [
        orgFwId,
        opts.organizationId,
        fw.id,
        now,
        opts.activatedBy,
        opts.scopeNote ?? null,
      ],
    );

    let requirementsLoaded = 0;
    let mappingsSuggested = 0;
    let mappingsSkipped = 0;

    if (!isReactivation) {
      // Seed default requirement status rows (idempotent)
      const seedResult = await this.db.query<{ count: string }>(
        `with inserted as (
           insert into organization_framework_requirement_status
             (id, organization_id, framework_requirement_id, applicability_status, review_status, updated_at)
           select
             gen_random_uuid(),
             $1,
             r.id,
             'applicable',
             'not_started',
             now()
           from framework_requirements r
           where r.framework_id = $2
           on conflict (organization_id, framework_requirement_id) do nothing
           returning id
         )
         select count(*) as count from inserted`,
        [opts.organizationId, fw.id],
      );
      requirementsLoaded = Number(seedResult.rows[0]?.count ?? 0);

      // If no rows returned from CTE (some DBs), fall back to counting total requirements
      if (requirementsLoaded === 0) {
        const totalResult = await this.db.query<{ count: string }>(
          `select count(*) as count from framework_requirements where framework_id = $1`,
          [fw.id],
        );
        requirementsLoaded = Number(totalResult.rows[0]?.count ?? 0);
      }
    } else {
      // Re-activation: count existing requirement rows
      const countResult = await this.db.query<{ count: string }>(
        `select count(*) as count
           from organization_framework_requirement_status s
           join framework_requirements r on r.id = s.framework_requirement_id
          where s.organization_id = $1 and r.framework_id = $2`,
        [opts.organizationId, fw.id],
      );
      requirementsLoaded = Number(countResult.rows[0]?.count ?? 0);
    }

    // Count existing mappings for summary (suggestd mappings seeding is Phase 3 activation;
    // here we count what already exists so the summary is accurate)
    const mappingCountResult = await this.db.query<{ count: string }>(
      `select count(*) as count
         from control_framework_requirement_mappings
        where organization_id = $1 and framework_id = $2`,
      [opts.organizationId, fw.id],
    );
    mappingsSuggested = Number(mappingCountResult.rows[0]?.count ?? 0);

    const testMappingCountResult = await this.db.query<{ count: string }>(
      `select count(*) as count
         from test_framework_requirement_mappings
        where organization_id = $1 and framework_id = $2`,
      [opts.organizationId, fw.id],
    );
    mappingsSuggested += Number(testMappingCountResult.rows[0]?.count ?? 0);

    const policyMappingCountResult = await this.db.query<{ count: string }>(
      `select count(*) as count
         from policy_framework_requirement_mappings
        where organization_id = $1 and framework_id = $2`,
      [opts.organizationId, fw.id],
    );
    mappingsSuggested += Number(policyMappingCountResult.rows[0]?.count ?? 0);

    // Count requirements needing review (not_started)
    const needingReviewResult = await this.db.query<{ count: string }>(
      `select count(*) as count
         from organization_framework_requirement_status s
         join framework_requirements r on r.id = s.framework_requirement_id
        where s.organization_id = $1
          and r.framework_id = $2
          and s.review_status = 'not_started'`,
      [opts.organizationId, fw.id],
    );
    const requirementsNeedingReview = Number(
      needingReviewResult.rows[0]?.count ?? 0,
    );

    const orgFw = await this.getOrgFramework(opts.organizationId, fw.id);

    // Phase 4: compute initial coverage snapshot (append-only INSERT)
    let initialCoverageScore = 0;
    try {
      await computeAndInsertCoverageSnapshot(
        this.db,
        opts.organizationId,
        fw.id,
      );
      const snap = await this.getCoverage(
        opts.organizationId,
        opts.frameworkSlug,
      );
      initialCoverageScore = snap?.controlCoveragePct ?? 0;
    } catch (err) {
      console.error(
        '[FrameworkService] Coverage snapshot failed after activation:',
        err,
      );
      // Non-fatal — return org framework record regardless
    }

    const summary: ActivationSummaryDto = {
      requirementsLoaded,
      mappingsSuggested,
      mappingsSkipped,
      requirementsNeedingReview,
      initialCoverageScore,
      isReactivation,
      warnings: [],
    };

    const notificationService = getNotificationServiceOrNull();
    if (notificationService) {
      notificationService
        .emit({
          organizationId: opts.organizationId,
          recipientUserIds: [opts.activatedBy],
          eventType: NotificationEventType.FRAMEWORK_ACTIVATED,
          title: `${fw.name} activated`,
          body: `${fw.name} is now active for your organization and ready for coverage review.`,
          severity: 'info',
          resourceType: 'framework',
          resourceId: fw.id,
          metadata: { frameworkSlug: fw.slug },
          recipientEmails: {
            [opts.activatedBy]: guessUserEmail(opts.activatedBy),
          },
          resourceUrl: '/compliance/frameworks',
        })
        .catch((error) => {
          console.error(
            '[NotificationService] framework activation emit failed:',
            error,
          );
        });
    }

    return { orgFramework: orgFw!, summary };
  }

  /**
   * Removes a framework from active scope.
   * Sets status = 'archived'. The row is not deleted — historical data is preserved.
   */
  async removeFramework(opts: {
    organizationId: string;
    frameworkSlug: string;
    removedBy: string;
    reason?: string;
  }): Promise<OrgFrameworkDto> {
    const fw = await this.getFrameworkBySlug(opts.frameworkSlug);
    if (!fw) {
      throw Object.assign(
        new Error(`Framework not found: ${opts.frameworkSlug}`),
        { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 },
      );
    }

    const now = new Date().toISOString();
    await this.db.query(
      `update organization_frameworks
          set status      = 'archived',
              archived_at = $3,
              archived_by = $4,
              scope_note  = coalesce($5, scope_note),
              updated_at  = $3
        where organization_id = $1
          and framework_id    = $2`,
      [opts.organizationId, fw.id, now, opts.removedBy, opts.reason ?? null],
    );

    const orgFw = await this.getOrgFramework(opts.organizationId, fw.id);
    if (!orgFw) {
      throw Object.assign(new Error('Framework activation record not found'), {
        code: 'FRAMEWORK_NOT_FOUND',
        statusCode: 404,
      });
    }
    return orgFw;
  }

  /** Returns entitlement info for a framework + org pair. */
  async checkEntitlement(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<FrameworkEntitlementDto> {
    if (process.env.FRAMEWORK_ENTITLEMENTS_ENFORCED !== 'true') {
      return {
        frameworkSlug,
        entitled: true,
        planName: null,
        validUntil: null,
      };
    }

    const result = await this.db.query<EntitlementRow>(
      `select framework_slug, plan_name, is_active, valid_until
         from subscription_entitlements
        where organization_id = $1
          and framework_slug  = $2
          and is_active       = true
          and (valid_until is null or valid_until > now())
        limit 1`,
      [organizationId, frameworkSlug],
    );

    if (result.rows.length === 0) {
      return {
        frameworkSlug,
        entitled: false,
        planName: null,
        validUntil: null,
      };
    }

    const row = result.rows[0];
    return {
      frameworkSlug: row.framework_slug,
      entitled: row.is_active,
      planName: row.plan_name,
      validUntil: row.valid_until,
    };
  }

  // ── Phase 3: Requirement status ────────────────────────────────────────────

  /** Returns per-org applicability and review state for all requirements of a framework. */
  async listOrgRequirements(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<RequirementStatusDto[]> {
    const result = await this.db.query<RequirementStatusRow>(
      `select
         s.id,
         s.organization_id,
         s.framework_requirement_id,
         r.code,
         r.title,
         r.domain,
         s.applicability_status,
         s.justification,
         s.review_status,
         s.owner_id,
         s.due_date,
         s.updated_at
       from organization_framework_requirement_status s
       join framework_requirements r on r.id = s.framework_requirement_id
       join frameworks f on f.id = r.framework_id
       where s.organization_id = $1
         and f.slug = $2
       order by r.code asc`,
      [organizationId, frameworkSlug],
    );
    return result.rows.map(toRequirementStatusDto);
  }

  // ── Phase 4: Coverage snapshots (append-only) ───────────────────────────────

  /** Returns the latest coverage snapshot for this org + framework. */
  async getCoverage(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<CoverageSnapshotDto | null> {
    const result = await this.db.query<CoverageSnapshotRow>(
      `select
         cs.id, cs.organization_id, cs.framework_id,
         cs.total_requirements, cs.total_mapped,
         cs.not_applicable, cs.applicable,
         cs.covered, cs.partially_covered, cs.not_covered,
         cs.control_coverage_pct, cs.test_pass_rate_pct,
         cs.mapped_test_count, cs.passing_test_count,
         cs.open_gaps, cs.calculated_at
       from framework_coverage_snapshots cs
       join frameworks f on f.id = cs.framework_id
       where cs.organization_id = $1
         and f.slug = $2
       order by cs.calculated_at desc
       limit 1`,
      [organizationId, frameworkSlug],
    );
    return result.rows[0] ? toCoverageSnapshotDto(result.rows[0]) : null;
  }

  // ── Phase 4: Owner assignment ───────────────────────────────────────────────

  /** Sets owner_id and/or due_date on a requirement status row. */
  async updateRequirementOwner(opts: {
    requirementId: string;
    organizationId: string;
    ownerId?: string | null;
    dueDate?: string | null;
  }): Promise<RequirementStatusDto> {
    const now = new Date().toISOString();
    await this.db.query(
      `update organization_framework_requirement_status
          set owner_id   = coalesce($3, owner_id),
              due_date   = $4,
              updated_at = $5
        where id = $1
          and organization_id = $2`,
      [
        opts.requirementId,
        opts.organizationId,
        opts.ownerId ?? null,
        opts.dueDate ?? null,
        now,
      ],
    );
    const updated = await this.getRequirementStatus(
      opts.requirementId,
      opts.organizationId,
    );
    if (opts.ownerId) {
      const notificationService = getNotificationServiceOrNull();
      if (notificationService) {
        notificationService
          .emit({
            organizationId: opts.organizationId,
            recipientUserIds: [opts.ownerId],
            eventType: NotificationEventType.GAP_OWNER_ASSIGNED,
            title: `Framework gap assigned: ${updated.code}`,
            body: `You are now the owner for requirement ${updated.code} — ${updated.title}.`,
            severity: 'warning',
            resourceType: 'framework',
            resourceId: updated.frameworkRequirementId,
            recipientEmails: { [opts.ownerId]: guessUserEmail(opts.ownerId) },
            resourceUrl: '/compliance/frameworks',
          })
          .catch((error) => {
            console.error(
              '[NotificationService] framework owner assignment emit failed:',
              error,
            );
          });
      }
    }
    return updated;
  }

  /** Sets applicability status on a requirement status row. */
  async updateApplicability(opts: {
    requirementId: string;
    organizationId: string;
    applicabilityStatus: 'applicable' | 'not_applicable';
    justification?: string;
  }): Promise<RequirementStatusDto> {
    const now = new Date().toISOString();
    await this.db.query(
      `update organization_framework_requirement_status
          set applicability_status = $3,
              justification        = $4,
              updated_at           = $5
        where id = $1
          and organization_id = $2`,
      [
        opts.requirementId,
        opts.organizationId,
        opts.applicabilityStatus,
        opts.justification ?? null,
        now,
      ],
    );
    const updated = await this.getRequirementStatus(
      opts.requirementId,
      opts.organizationId,
    );

    // Trigger a fresh coverage snapshot (applicability change affects coverage formula)
    this.db
      .query<{ framework_id: string }>(
        `select r.framework_id from framework_requirements r
         join organization_framework_requirement_status s on s.framework_requirement_id = r.id
        where s.id = $1 limit 1`,
        [opts.requirementId],
      )
      .then((res) => {
        if (res.rows[0]) {
          computeAndInsertCoverageSnapshot(
            this.db,
            opts.organizationId,
            res.rows[0].framework_id,
          ).catch((err) =>
            console.error(
              '[FrameworkService] Coverage snapshot after applicability change failed:',
              err,
            ),
          );
        }
      })
      .catch(() => {});

    return updated;
  }

  // ── Phase 4: Coverage history ───────────────────────────────────────────────

  /** Returns recent coverage snapshots for this org + framework (ordered newest-first). */
  async getCoverageHistory(
    organizationId: string,
    frameworkSlug: string,
    days = 90,
  ): Promise<CoverageSnapshotDto[]> {
    const result = await this.db.query<CoverageSnapshotRow>(
      `select
         cs.id, cs.organization_id, cs.framework_id,
         cs.total_requirements, cs.total_mapped,
         cs.not_applicable, cs.applicable,
         cs.covered, cs.partially_covered, cs.not_covered,
         cs.control_coverage_pct, cs.test_pass_rate_pct,
         cs.mapped_test_count, cs.passing_test_count,
         cs.open_gaps, cs.calculated_at
        from framework_coverage_snapshots cs
        join frameworks f on f.id = cs.framework_id
        where cs.organization_id = $1
          and f.slug = $2
          and cs.calculated_at >= now() - ($3::int * interval '1 day')
        order by cs.calculated_at asc
      `,
      [organizationId, frameworkSlug, days],
    );
    return result.rows.map(toCoverageSnapshotDto);
  }

  // ── Phase 4: Readiness summary ──────────────────────────────────────────────

  /** Returns a readiness summary for all active frameworks for the org. */
  async getReadinessSummary(
    organizationId: string,
  ): Promise<FrameworkReadinessDto[]> {
    // Get all active frameworks for the org
    const activeFrameworks = await this.listOrgFrameworks(organizationId);
    if (activeFrameworks.length === 0) return [];

    // For each, fetch the latest coverage snapshot
    const results: FrameworkReadinessDto[] = [];
    for (const fw of activeFrameworks) {
      const snap = await this.getCoverage(organizationId, fw.frameworkSlug);
      results.push({
        slug: fw.frameworkSlug,
        name: fw.frameworkName,
        version: fw.frameworkVersion,
        controlCoveragePct: snap?.controlCoveragePct ?? null,
        testPassRatePct: snap?.testPassRatePct ?? null,
        openGaps: snap?.openGaps ?? null,
        covered: snap?.covered ?? null,
        applicable: snap?.applicable ?? null,
        totalRequirements: snap?.totalRequirements ?? null,
        calculatedAt: snap?.calculatedAt ?? null,
      });
    }
    return results;
  }

  // ── Phase 3: Mappings ───────────────────────────────────────────────────────

  /** Returns all control, test, and policy mappings for a framework + org. */
  async getFrameworkMappings(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<FrameworkMappingsDto> {
    const fw = await this.getFrameworkBySlug(frameworkSlug);
    if (!fw) {
      throw Object.assign(new Error(`Framework not found: ${frameworkSlug}`), {
        code: 'FRAMEWORK_NOT_FOUND',
        statusCode: 404,
      });
    }

    const [controlsResult, testsResult, policiesResult] = await Promise.all([
      this.db.query<ControlMappingRow>(
        `select
           m.id, m.organization_id, m.control_id,
           m.framework_requirement_id, m.framework_id,
           m.mapping_type, m.created_at,
           r.code as requirement_code,
           r.title as requirement_title,
           r.domain as requirement_domain
         from control_framework_requirement_mappings m
         join framework_requirements r on r.id = m.framework_requirement_id
         where m.organization_id = $1
           and m.framework_id = $2
         order by r.code asc`,
        [organizationId, fw.id],
      ),
      this.db.query<TestMappingRow>(
        `select
           m.id, m.organization_id, m.test_id,
           m.framework_requirement_id, m.framework_id,
           m.created_at,
           r.code as requirement_code,
           r.title as requirement_title,
           r.domain as requirement_domain
         from test_framework_requirement_mappings m
         join framework_requirements r on r.id = m.framework_requirement_id
         where m.organization_id = $1
           and m.framework_id = $2
         order by r.code asc`,
        [organizationId, fw.id],
      ),
      this.db.query<PolicyMappingRow>(
        `select
           m.id, m.organization_id, m.policy_id,
           m.framework_requirement_id, m.framework_id,
           m.created_at,
           r.code as requirement_code,
           r.title as requirement_title,
           r.domain as requirement_domain
         from policy_framework_requirement_mappings m
         join framework_requirements r on r.id = m.framework_requirement_id
         where m.organization_id = $1
           and m.framework_id = $2
         order by r.code asc`,
        [organizationId, fw.id],
      ),
    ]);

    return {
      controls: controlsResult.rows.map(toControlMappingDto),
      tests: testsResult.rows.map(toTestMappingDto),
      policies: policiesResult.rows.map(toPolicyMappingDto),
    };
  }

  /** Promotes a suggested mapping to direct (human-confirmed). */
  async confirmMapping(opts: {
    organizationId: string;
    frameworkSlug: string;
    mappingType: 'control' | 'test' | 'policy';
    mappingId: string;
  }): Promise<void> {
    const tableMap = {
      control: 'control_framework_requirement_mappings',
      test: 'test_framework_requirement_mappings',
      policy: 'policy_framework_requirement_mappings',
    };
    const table = tableMap[opts.mappingType];

    // Only control mappings have a mapping_type column; test and policy do not
    if (opts.mappingType === 'control') {
      await this.db.query(
        `update ${table}
            set mapping_type = 'direct'
          where id = $1
            and organization_id = $2
            and mapping_type = 'suggested'`,
        [opts.mappingId, opts.organizationId],
      );
    }
    // For test/policy mappings there is no mapping_type — confirming is a no-op
    // (they are considered confirmed once explicitly created)
  }

  // ── Phase 5: Billing entitlements ──────────────────────────────────────────

  /** Lists all subscription entitlements for the organization. */
  async listEntitlements(
    organizationId: string,
  ): Promise<BillingEntitlementDto[]> {
    const result = await this.db.query<BillingEntitlementRow>(
      `select framework_slug, plan_name, is_active, valid_from, valid_until, created_at
         from subscription_entitlements
        where organization_id = $1
        order by framework_slug asc, created_at desc`,
      [organizationId],
    );
    return result.rows.map(toBillingEntitlementDto);
  }

  /** Upserts a subscription entitlement record (called from billing webhook sync). */
  async syncEntitlement(data: SyncEntitlementRequestDto): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.query(
      `insert into subscription_entitlements
         (id, organization_id, framework_slug, plan_name, is_active, valid_from, valid_until, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       on conflict (organization_id, framework_slug, plan_name) do update
         set is_active   = excluded.is_active,
             valid_from  = excluded.valid_from,
             valid_until = excluded.valid_until,
             updated_at  = excluded.updated_at`,
      [
        id,
        data.organizationId,
        data.frameworkSlug,
        data.planName,
        data.isActive,
        data.validFrom,
        data.validUntil ?? null,
        now,
      ],
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async getOrgFramework(
    organizationId: string,
    frameworkId: string,
  ): Promise<OrgFrameworkDto | null> {
    const result = await this.db.query<OrgFrameworkRow>(
      `select
         of.id,
         of.organization_id,
         of.framework_id,
         f.slug      as framework_slug,
         f.name      as framework_name,
         f.version   as framework_version,
         of.status,
         of.activated_at,
         of.activated_by,
         of.archived_at,
         of.archived_by,
         of.scope_note,
         of.created_at,
         of.updated_at
         from organization_frameworks of
         join frameworks f on f.id = of.framework_id
        where of.organization_id = $1
          and of.framework_id    = $2
        limit 1`,
      [organizationId, frameworkId],
    );
    return result.rows[0] ? toOrgFrameworkDto(result.rows[0]) : null;
  }

  private async getRequirementStatus(
    requirementId: string,
    organizationId: string,
  ): Promise<RequirementStatusDto> {
    const result = await this.db.query<RequirementStatusRow>(
      `select
         s.id, s.organization_id, s.framework_requirement_id,
         r.code, r.title, r.domain,
         s.applicability_status, s.justification,
         s.review_status, s.owner_id, s.due_date, s.updated_at
       from organization_framework_requirement_status s
       join framework_requirements r on r.id = s.framework_requirement_id
       where s.id = $1
         and s.organization_id = $2
       limit 1`,
      [requirementId, organizationId],
    );
    if (!result.rows[0]) {
      throw Object.assign(new Error('Requirement status not found'), {
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    }
    return toRequirementStatusDto(result.rows[0]);
  }

  private async assertEntitled(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<void> {
    if (process.env.FRAMEWORK_ENTITLEMENTS_ENFORCED !== 'true') return;
    const entitlement = await this.checkEntitlement(
      organizationId,
      frameworkSlug,
    );
    if (!entitlement.entitled) {
      throw Object.assign(
        new Error(
          `Organization is not entitled to framework: ${frameworkSlug}`,
        ),
        { code: 'FRAMEWORK_NOT_ENTITLED', statusCode: 403 },
      );
    }
  }
}
