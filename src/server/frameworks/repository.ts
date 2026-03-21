/**
 * FrameworkRepository
 *
 * Raw database access layer for the frameworks module.
 * Uses pg via SqlExecutor — no Prisma, same pattern as SqlRiskEngineRepository.
 *
 * This module owns all SQL queries and row-to-DTO mappers. It has no knowledge
 * of business rules, notifications, or entitlement enforcement — those live in
 * FrameworkService (service.ts).
 */

import type { SqlExecutor } from '@/domain/risk-engine/persistence';
import type {
  FrameworkDto,
  FrameworkRequirementDto,
  OrgFrameworkDto,
  FrameworkEntitlementDto,
  RequirementStatusDto,
  CoverageSnapshotDto,
  BillingEntitlementDto,
  ControlMappingDto,
  TestMappingDto,
  PolicyMappingDto,
  SyncEntitlementRequestDto,
} from './contracts';

// ── Row shapes returned by Postgres ──────────────────────────────────────────

export interface FrameworkRow {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface RequirementRow {
  id: string;
  framework_id: string;
  code: string;
  title: string;
  description: string | null;
  domain: string | null;
  created_at: string;
}

export interface OrgFrameworkRow {
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

export interface EntitlementRow {
  framework_slug: string;
  plan_name: string | null;
  is_active: boolean;
  valid_until: string | null;
}

export interface RequirementStatusRow {
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

export interface CoverageSnapshotRow {
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

export interface BillingEntitlementRow {
  framework_slug: string;
  plan_name: string | null;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface ControlMappingRow {
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

export interface TestMappingRow {
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

export interface PolicyMappingRow {
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

export function toFrameworkDto(row: FrameworkRow): FrameworkDto {
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

export function toRequirementDto(row: RequirementRow): FrameworkRequirementDto {
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

export function toRequirementStatusDto(
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

export function toCoverageSnapshotDto(row: CoverageSnapshotRow): CoverageSnapshotDto {
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

export function toOrgFrameworkDto(row: OrgFrameworkRow): OrgFrameworkDto {
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

export function toBillingEntitlementDto(
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

export function toControlMappingDto(row: ControlMappingRow): ControlMappingDto {
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

export function toTestMappingDto(row: TestMappingRow): TestMappingDto {
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

export function toPolicyMappingDto(row: PolicyMappingRow): PolicyMappingDto {
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

// ── Repository ────────────────────────────────────────────────────────────────

export class FrameworkRepository {
  constructor(private readonly db: SqlExecutor) {}

  // ── Framework catalog ───────────────────────────────────────────────────────

  async listCatalog(): Promise<FrameworkDto[]> {
    const result = await this.db.query<FrameworkRow>(
      `select id, slug, name, version, description, status, created_at
         from frameworks
        where status = 'active'
        order by name asc`,
    );
    return result.rows.map(toFrameworkDto);
  }

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

  // ── Organization frameworks ─────────────────────────────────────────────────

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

  async getOrgFramework(
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

  async upsertOrgFramework(opts: {
    id: string;
    organizationId: string;
    frameworkId: string;
    activatedAt: string;
    activatedBy: string;
    scopeNote?: string | null;
  }): Promise<void> {
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
        opts.id,
        opts.organizationId,
        opts.frameworkId,
        opts.activatedAt,
        opts.activatedBy,
        opts.scopeNote ?? null,
      ],
    );
  }

  async archiveOrgFramework(opts: {
    organizationId: string;
    frameworkId: string;
    archivedAt: string;
    archivedBy: string;
    reason?: string | null;
  }): Promise<void> {
    await this.db.query(
      `update organization_frameworks
          set status      = 'archived',
              archived_at = $3,
              archived_by = $4,
              scope_note  = coalesce($5, scope_note),
              updated_at  = $3
        where organization_id = $1
          and framework_id    = $2`,
      [
        opts.organizationId,
        opts.frameworkId,
        opts.archivedAt,
        opts.archivedBy,
        opts.reason ?? null,
      ],
    );
  }

  async checkExistingOrgFramework(
    organizationId: string,
    frameworkId: string,
  ): Promise<{ status: string } | null> {
    const result = await this.db.query<{ status: string }>(
      `select status from organization_frameworks
        where organization_id = $1 and framework_id = $2 limit 1`,
      [organizationId, frameworkId],
    );
    return result.rows[0] ?? null;
  }

  // ── Requirement status ──────────────────────────────────────────────────────

  async seedRequirementStatuses(
    organizationId: string,
    frameworkId: string,
  ): Promise<number> {
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
      [organizationId, frameworkId],
    );
    let count = Number(seedResult.rows[0]?.count ?? 0);

    // Some DBs don't return rows from CTEs — fall back to total requirement count
    if (count === 0) {
      const totalResult = await this.db.query<{ count: string }>(
        `select count(*) as count from framework_requirements where framework_id = $1`,
        [frameworkId],
      );
      count = Number(totalResult.rows[0]?.count ?? 0);
    }
    return count;
  }

  async countRequirementStatuses(
    organizationId: string,
    frameworkId: string,
  ): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `select count(*) as count
         from organization_framework_requirement_status s
         join framework_requirements r on r.id = s.framework_requirement_id
        where s.organization_id = $1 and r.framework_id = $2`,
      [organizationId, frameworkId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

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

  async getRequirementStatus(
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

  async updateRequirementOwner(opts: {
    requirementId: string;
    organizationId: string;
    ownerId?: string | null;
    dueDate?: string | null;
    updatedAt: string;
  }): Promise<void> {
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
        opts.updatedAt,
      ],
    );
  }

  async updateApplicability(opts: {
    requirementId: string;
    organizationId: string;
    applicabilityStatus: 'applicable' | 'not_applicable';
    justification?: string | null;
    updatedAt: string;
  }): Promise<void> {
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
        opts.updatedAt,
      ],
    );
  }

  async getFrameworkIdForRequirement(
    requirementId: string,
  ): Promise<string | null> {
    const result = await this.db.query<{ framework_id: string }>(
      `select r.framework_id from framework_requirements r
       join organization_framework_requirement_status s on s.framework_requirement_id = r.id
      where s.id = $1 limit 1`,
      [requirementId],
    );
    return result.rows[0]?.framework_id ?? null;
  }

  async countNotStartedRequirements(
    organizationId: string,
    frameworkId: string,
  ): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `select count(*) as count
         from organization_framework_requirement_status s
         join framework_requirements r on r.id = s.framework_requirement_id
        where s.organization_id = $1
          and r.framework_id = $2
          and s.review_status = 'not_started'`,
      [organizationId, frameworkId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  // ── Coverage snapshots ──────────────────────────────────────────────────────

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

  async getCoverageHistory(
    organizationId: string,
    frameworkSlug: string,
    days: number,
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

  // ── Mappings ────────────────────────────────────────────────────────────────

  async getMappings(
    organizationId: string,
    frameworkId: string,
  ): Promise<{
    controls: ControlMappingDto[];
    tests: TestMappingDto[];
    policies: PolicyMappingDto[];
  }> {
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
        [organizationId, frameworkId],
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
        [organizationId, frameworkId],
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
        [organizationId, frameworkId],
      ),
    ]);

    return {
      controls: controlsResult.rows.map(toControlMappingDto),
      tests: testsResult.rows.map(toTestMappingDto),
      policies: policiesResult.rows.map(toPolicyMappingDto),
    };
  }

  async countMappings(
    organizationId: string,
    frameworkId: string,
  ): Promise<number> {
    const [controlResult, testResult, policyResult] = await Promise.all([
      this.db.query<{ count: string }>(
        `select count(*) as count
           from control_framework_requirement_mappings
          where organization_id = $1 and framework_id = $2`,
        [organizationId, frameworkId],
      ),
      this.db.query<{ count: string }>(
        `select count(*) as count
           from test_framework_requirement_mappings
          where organization_id = $1 and framework_id = $2`,
        [organizationId, frameworkId],
      ),
      this.db.query<{ count: string }>(
        `select count(*) as count
           from policy_framework_requirement_mappings
          where organization_id = $1 and framework_id = $2`,
        [organizationId, frameworkId],
      ),
    ]);
    return (
      Number(controlResult.rows[0]?.count ?? 0) +
      Number(testResult.rows[0]?.count ?? 0) +
      Number(policyResult.rows[0]?.count ?? 0)
    );
  }

  async promoteControlMappingToDirect(
    mappingId: string,
    organizationId: string,
  ): Promise<void> {
    await this.db.query(
      `update control_framework_requirement_mappings
          set mapping_type = 'direct'
        where id = $1
          and organization_id = $2
          and mapping_type = 'suggested'`,
      [mappingId, organizationId],
    );
  }

  // ── Entitlements ────────────────────────────────────────────────────────────

  async checkEntitlementRow(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<EntitlementRow | null> {
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
    return result.rows[0] ?? null;
  }

  async listEntitlements(organizationId: string): Promise<BillingEntitlementDto[]> {
    const result = await this.db.query<BillingEntitlementRow>(
      `select framework_slug, plan_name, is_active, valid_from, valid_until, created_at
         from subscription_entitlements
        where organization_id = $1
        order by framework_slug asc, created_at desc`,
      [organizationId],
    );
    return result.rows.map(toBillingEntitlementDto);
  }

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
}
