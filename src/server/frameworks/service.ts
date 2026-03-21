/**
 * FrameworkService
 *
 * Business logic layer for the frameworks module. Delegates all DB access to
 * FrameworkRepository (repository.ts). This file owns orchestration concerns:
 * entitlement enforcement, notification dispatch, and coverage snapshot
 * coordination.
 *
 * Entitlement enforcement is gated by FRAMEWORK_ENTITLEMENTS_ENFORCED env var
 * (default false). When false, all orgs can activate any framework.
 */

import type { SqlExecutor } from '@/domain/risk-engine/persistence';
import { FrameworkRepository } from './repository';
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
  FrameworkMappingsDto,
  ActivationSummaryDto,
  ActivateFrameworkResponseDto,
} from './contracts';
import { NotificationEventType } from '@/domain/notifications/eventTypes';
import { getNotificationServiceOrNull } from '@/server/notifications/module';

// ── Helper ─────────────────────────────────────────────────────────────────────

function guessUserEmail(userId?: string | null) {
  if (!userId) return undefined;
  if (userId.includes('@')) return userId;
  return `${userId}@manzen.dev`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class FrameworkService {
  private readonly repo: FrameworkRepository;

  constructor(private readonly db: SqlExecutor) {
    this.repo = new FrameworkRepository(db);
  }

  /** Returns the global framework catalog (all active frameworks). */
  async listCatalog(): Promise<FrameworkDto[]> {
    return this.repo.listCatalog();
  }

  /** Returns a single framework by slug, or null if not found. */
  async getFrameworkBySlug(slug: string): Promise<FrameworkDto | null> {
    return this.repo.getFrameworkBySlug(slug);
  }

  /** Returns all requirements for a framework identified by slug. */
  async listRequirements(slug: string): Promise<FrameworkRequirementDto[]> {
    return this.repo.listRequirements(slug);
  }

  /** Returns all frameworks activated by an organization (excluding archived). */
  async listOrgFrameworks(organizationId: string): Promise<OrgFrameworkDto[]> {
    return this.repo.listOrgFrameworks(organizationId);
  }

  /**
   * Activates a framework for an organization.
   * - Upserts a row in organization_frameworks (status = active).
   * - Seeds default requirement status rows for all requirements.
   * - ON CONFLICT DO NOTHING so re-activation is idempotent.
   * Returns the org framework record after insert.
   */
  async activateFramework(opts: {
    organizationId: string;
    frameworkSlug: string;
    activatedBy: string;
    scopeNote?: string;
  }): Promise<ActivateFrameworkResponseDto> {
    const fw = await this.repo.getFrameworkBySlug(opts.frameworkSlug);
    if (!fw) {
      throw Object.assign(
        new Error(`Framework not found: ${opts.frameworkSlug}`),
        { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 },
      );
    }

    // Check entitlement when enforcement is enabled
    await this.assertEntitled(opts.organizationId, opts.frameworkSlug);

    // Check if this is a re-activation (already had a record)
    const existing = await this.repo.checkExistingOrgFramework(
      opts.organizationId,
      fw.id,
    );
    const isReactivation = existing !== null;

    const orgFwId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.repo.upsertOrgFramework({
      id: orgFwId,
      organizationId: opts.organizationId,
      frameworkId: fw.id,
      activatedAt: now,
      activatedBy: opts.activatedBy,
      scopeNote: opts.scopeNote ?? null,
    });

    let requirementsLoaded = 0;
    const mappingsSkipped = 0;

    if (!isReactivation) {
      requirementsLoaded = await this.repo.seedRequirementStatuses(
        opts.organizationId,
        fw.id,
      );
    } else {
      requirementsLoaded = await this.repo.countRequirementStatuses(
        opts.organizationId,
        fw.id,
      );
    }

    const mappingsSuggested = await this.repo.countMappings(
      opts.organizationId,
      fw.id,
    );

    const requirementsNeedingReview = await this.repo.countNotStartedRequirements(
      opts.organizationId,
      fw.id,
    );

    const orgFw = await this.repo.getOrgFramework(opts.organizationId, fw.id);

    // Phase 4: compute initial coverage snapshot (append-only INSERT)
    let initialCoverageScore = 0;
    try {
      await computeAndInsertCoverageSnapshot(
        this.db,
        opts.organizationId,
        fw.id,
      );
      const snap = await this.repo.getCoverage(
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
    const fw = await this.repo.getFrameworkBySlug(opts.frameworkSlug);
    if (!fw) {
      throw Object.assign(
        new Error(`Framework not found: ${opts.frameworkSlug}`),
        { code: 'FRAMEWORK_NOT_FOUND', statusCode: 404 },
      );
    }

    const now = new Date().toISOString();
    await this.repo.archiveOrgFramework({
      organizationId: opts.organizationId,
      frameworkId: fw.id,
      archivedAt: now,
      archivedBy: opts.removedBy,
      reason: opts.reason ?? null,
    });

    const orgFw = await this.repo.getOrgFramework(opts.organizationId, fw.id);
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

    const row = await this.repo.checkEntitlementRow(organizationId, frameworkSlug);

    if (!row) {
      return {
        frameworkSlug,
        entitled: false,
        planName: null,
        validUntil: null,
      };
    }

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
    return this.repo.listOrgRequirements(organizationId, frameworkSlug);
  }

  // ── Phase 4: Coverage snapshots (append-only) ───────────────────────────────

  /** Returns the latest coverage snapshot for this org + framework. */
  async getCoverage(
    organizationId: string,
    frameworkSlug: string,
  ): Promise<CoverageSnapshotDto | null> {
    return this.repo.getCoverage(organizationId, frameworkSlug);
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
    await this.repo.updateRequirementOwner({
      requirementId: opts.requirementId,
      organizationId: opts.organizationId,
      ownerId: opts.ownerId,
      dueDate: opts.dueDate,
      updatedAt: now,
    });
    const updated = await this.repo.getRequirementStatus(
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
    await this.repo.updateApplicability({
      requirementId: opts.requirementId,
      organizationId: opts.organizationId,
      applicabilityStatus: opts.applicabilityStatus,
      justification: opts.justification ?? null,
      updatedAt: now,
    });
    const updated = await this.repo.getRequirementStatus(
      opts.requirementId,
      opts.organizationId,
    );

    // Trigger a fresh coverage snapshot (applicability change affects coverage formula)
    this.repo
      .getFrameworkIdForRequirement(opts.requirementId)
      .then((frameworkId) => {
        if (frameworkId) {
          computeAndInsertCoverageSnapshot(
            this.db,
            opts.organizationId,
            frameworkId,
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
    return this.repo.getCoverageHistory(organizationId, frameworkSlug, days);
  }

  // ── Phase 4: Readiness summary ──────────────────────────────────────────────

  /** Returns a readiness summary for all active frameworks for the org. */
  async getReadinessSummary(
    organizationId: string,
  ): Promise<FrameworkReadinessDto[]> {
    const activeFrameworks = await this.repo.listOrgFrameworks(organizationId);
    if (activeFrameworks.length === 0) return [];

    const results: FrameworkReadinessDto[] = [];
    for (const fw of activeFrameworks) {
      const snap = await this.repo.getCoverage(organizationId, fw.frameworkSlug);
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
    const fw = await this.repo.getFrameworkBySlug(frameworkSlug);
    if (!fw) {
      throw Object.assign(new Error(`Framework not found: ${frameworkSlug}`), {
        code: 'FRAMEWORK_NOT_FOUND',
        statusCode: 404,
      });
    }

    return this.repo.getMappings(organizationId, fw.id);
  }

  /** Promotes a suggested mapping to direct (human-confirmed). */
  async confirmMapping(opts: {
    organizationId: string;
    frameworkSlug: string;
    mappingType: 'control' | 'test' | 'policy';
    mappingId: string;
  }): Promise<void> {
    // Only control mappings have a mapping_type column; test and policy do not
    if (opts.mappingType === 'control') {
      await this.repo.promoteControlMappingToDirect(
        opts.mappingId,
        opts.organizationId,
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
    return this.repo.listEntitlements(organizationId);
  }

  /** Upserts a subscription entitlement record (called from billing webhook sync). */
  async syncEntitlement(data: SyncEntitlementRequestDto): Promise<void> {
    return this.repo.syncEntitlement(data);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

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
