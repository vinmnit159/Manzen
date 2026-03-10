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
} from './contracts';

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

function toRequirementStatusDto(row: RequirementStatusRow): RequirementStatusDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkRequirementId: row.framework_requirement_id,
    code: row.code,
    title: row.title,
    domain: row.domain,
    applicabilityStatus: row.applicability_status as RequirementStatusDto['applicabilityStatus'],
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
  }): Promise<OrgFrameworkDto> {
    const fw = await this.getFrameworkBySlug(opts.frameworkSlug);
    if (!fw) {
      throw Object.assign(new Error(`Framework not found: ${opts.frameworkSlug}`), { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 });
    }

    // Check entitlement when enforcement is enabled
    await this.assertEntitled(opts.organizationId, opts.frameworkSlug);

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
      [orgFwId, opts.organizationId, fw.id, now, opts.activatedBy, opts.scopeNote ?? null],
    );

    // Seed default requirement status rows (idempotent)
    await this.db.query(
      `insert into organization_framework_requirement_status
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
       on conflict (organization_id, framework_requirement_id) do nothing`,
      [opts.organizationId, fw.id],
    );

    const orgFw = await this.getOrgFramework(opts.organizationId, fw.id);

    // Phase 4: compute initial coverage snapshot (append-only INSERT)
    try {
      await computeAndInsertCoverageSnapshot(this.db, opts.organizationId, fw.id);
    } catch (err) {
      console.error('[FrameworkService] Coverage snapshot failed after activation:', err);
      // Non-fatal — return org framework record regardless
    }

    return orgFw!;
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
      throw Object.assign(new Error(`Framework not found: ${opts.frameworkSlug}`), { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 });
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
      throw Object.assign(new Error('Framework activation record not found'), { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 });
    }
    return orgFw;
  }

  /** Returns entitlement info for a framework + org pair. */
  async checkEntitlement(organizationId: string, frameworkSlug: string): Promise<FrameworkEntitlementDto> {
    if (process.env.FRAMEWORK_ENTITLEMENTS_ENFORCED !== 'true') {
      return { frameworkSlug, entitled: true, planName: null, validUntil: null };
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
      return { frameworkSlug, entitled: false, planName: null, validUntil: null };
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
  async listOrgRequirements(organizationId: string, frameworkSlug: string): Promise<RequirementStatusDto[]> {
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
  async getCoverage(organizationId: string, frameworkSlug: string): Promise<CoverageSnapshotDto | null> {
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
      [opts.requirementId, opts.organizationId, opts.ownerId ?? null, opts.dueDate ?? null, now],
    );
    return this.getRequirementStatus(opts.requirementId, opts.organizationId);
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
      [opts.requirementId, opts.organizationId, opts.applicabilityStatus, opts.justification ?? null, now],
    );
    const updated = await this.getRequirementStatus(opts.requirementId, opts.organizationId);

    // Trigger a fresh coverage snapshot (applicability change affects coverage formula)
    this.db.query<{ framework_id: string }>(
      `select r.framework_id from framework_requirements r
         join organization_framework_requirement_status s on s.framework_requirement_id = r.id
        where s.id = $1 limit 1`,
      [opts.requirementId],
    ).then(res => {
      if (res.rows[0]) {
        computeAndInsertCoverageSnapshot(this.db, opts.organizationId, res.rows[0].framework_id)
          .catch(err => console.error('[FrameworkService] Coverage snapshot after applicability change failed:', err));
      }
    }).catch(() => {});

    return updated;
  }

  // ── Phase 5: Billing entitlements ──────────────────────────────────────────

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
      [id, data.organizationId, data.frameworkSlug, data.planName, data.isActive, data.validFrom, data.validUntil ?? null, now],
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async getOrgFramework(organizationId: string, frameworkId: string): Promise<OrgFrameworkDto | null> {
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

  private async getRequirementStatus(requirementId: string, organizationId: string): Promise<RequirementStatusDto> {
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
      throw Object.assign(new Error('Requirement status not found'), { code: 'NOT_FOUND', statusCode: 404 });
    }
    return toRequirementStatusDto(result.rows[0]);
  }

  private async assertEntitled(organizationId: string, frameworkSlug: string): Promise<void> {
    if (process.env.FRAMEWORK_ENTITLEMENTS_ENFORCED !== 'true') return;
    const entitlement = await this.checkEntitlement(organizationId, frameworkSlug);
    if (!entitlement.entitled) {
      throw Object.assign(
        new Error(`Organization is not entitled to framework: ${frameworkSlug}`),
        { code: 'FRAMEWORK_NOT_ENTITLED', statusCode: 403 },
      );
    }
  }
}
