/**
 * coverageEngine.ts
 *
 * Computes coverage snapshots for org + framework pairs and writes them to
 * `framework_coverage_snapshots`. Snapshots are always INSERTed — never updated.
 * The dashboard reads the latest row (ORDER BY calculated_at DESC LIMIT 1).
 *
 * Four-layer coverage formula (per the implementation plan):
 *   Layer 1 — canonical baseline:   total_requirements (all rows in framework_requirements)
 *   Layer 2 — org adoption:         total_mapped (requirement_status rows for this org)
 *   Layer 3 — applicability:        applicable / not_applicable split
 *   Layer 4 — implementation:       covered / partially_covered / not_covered
 *     "covered" = applicable requirement with ≥1 control_framework_requirement_mapping
 *                 where the mapped control has status = IMPLEMENTED (from isms-backend)
 *
 * For now, "covered" uses the mapping count as a proxy (isms-backend control status
 * is not yet read in real-time). Phase 3 wires in real control status via API calls.
 *
 * Trigger points:
 *   - After activation (called from FrameworkService.activateFramework)
 *   - After applicability update
 *   - After each risk engine evaluation cycle
 *   - Periodic refresh (every 15 min via setInterval, started from runtime.ts)
 */

import type { SqlExecutor } from '@/domain/risk-engine/persistence';

function computePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/**
 * Computes and inserts an append-only coverage snapshot for a given org + framework.
 * Safe to call multiple times — each call produces a new immutable row.
 */
export async function computeAndInsertCoverageSnapshot(
  db: SqlExecutor,
  organizationId: string,
  frameworkId: string,
): Promise<void> {
  // ── Layer 1: canonical baseline ─────────────────────────────────────────────
  const totalResult = await db.query<{ count: string }>(
    `select count(*) as count from framework_requirements where framework_id = $1`,
    [frameworkId],
  );
  const totalRequirements = Number(totalResult.rows[0]?.count ?? 0);

  // ── Layer 2: org adoption (requirement_status rows for this org) ────────────
  const mappedResult = await db.query<{ count: string }>(
    `select count(*) as count
       from organization_framework_requirement_status s
       join framework_requirements r on r.id = s.framework_requirement_id
      where s.organization_id = $1
        and r.framework_id    = $2`,
    [organizationId, frameworkId],
  );
  const totalMapped = Number(mappedResult.rows[0]?.count ?? 0);

  // ── Layer 3: applicability split ────────────────────────────────────────────
  const applicabilityResult = await db.query<{
    applicability_status: string;
    count: string;
  }>(
    `select s.applicability_status, count(*) as count
       from organization_framework_requirement_status s
       join framework_requirements r on r.id = s.framework_requirement_id
      where s.organization_id = $1
        and r.framework_id    = $2
      group by s.applicability_status`,
    [organizationId, frameworkId],
  );

  let notApplicable = 0;
  let applicable = 0;
  for (const row of applicabilityResult.rows) {
    if (row.applicability_status === 'not_applicable') {
      notApplicable = Number(row.count);
    } else {
      applicable += Number(row.count);
    }
  }

  // ── Layer 4: implementation (of applicable requirements only) ───────────────
  // "covered" = applicable requirement with ≥1 mapping in control_framework_requirement_mappings
  // (Phase 3 will filter to mapping_type = 'direct' with IMPLEMENTED status via isms-backend API)
  const coveredResult = await db.query<{ count: string }>(
    `select count(distinct s.framework_requirement_id) as count
       from organization_framework_requirement_status s
       join control_framework_requirement_mappings m
         on m.framework_requirement_id = s.framework_requirement_id
        and m.organization_id          = s.organization_id
      where s.organization_id    = $1
        and s.applicability_status = 'applicable'
        and m.framework_id       = $2`,
    [organizationId, frameworkId],
  );
  const covered = Number(coveredResult.rows[0]?.count ?? 0);

  // Not covered = applicable with no mapping at all
  const notCovered = Math.max(0, applicable - covered);
  // Partially covered — placeholder: 0 until Phase 3 adds partial-status control reads
  const partiallyCovered = 0;

  // ── Test pass rate ──────────────────────────────────────────────────────────
  const testResult = await db
    .query<{ total: string; passing: string }>(
      `select
       count(*) as total,
       count(*) filter (where tr.status = 'Pass') as passing
       from test_framework_requirement_mappings m
       left join (
         select distinct on (test_id) test_id, status
           from control_test_versions
           order by test_id, created_at desc
       ) tr on tr.test_id = m.test_id
      where m.organization_id = $1
        and m.framework_id    = $2`,
      [organizationId, frameworkId],
    )
    .catch(() => ({ rows: [{ total: '0', passing: '0' }] })); // graceful degradation if table missing

  const mappedTestCount = Number(testResult.rows[0]?.total ?? 0);
  const passingTestCount = Number(testResult.rows[0]?.passing ?? 0);

  // ── Derived scores ──────────────────────────────────────────────────────────
  const controlCoveragePct = computePercentage(covered, applicable);
  const testPassRatePct = computePercentage(passingTestCount, mappedTestCount);

  // ── Open gaps = applicable + not covered + no owner ─────────────────────────
  const openGapsResult = await db.query<{ count: string }>(
    `select count(*) as count
       from organization_framework_requirement_status s
       join framework_requirements r on r.id = s.framework_requirement_id
      where s.organization_id    = $1
        and r.framework_id       = $2
        and s.applicability_status = 'applicable'
        and s.owner_id is null
        and not exists (
          select 1 from control_framework_requirement_mappings m
           where m.framework_requirement_id = s.framework_requirement_id
             and m.organization_id          = s.organization_id
        )`,
    [organizationId, frameworkId],
  );
  const openGaps = Number(openGapsResult.rows[0]?.count ?? 0);

  // ── Insert snapshot (APPEND-ONLY — never UPDATE) ────────────────────────────
  const snapshotId = crypto.randomUUID();
  await db.query(
    `insert into framework_coverage_snapshots
       (id, organization_id, framework_id,
        total_requirements, total_mapped,
        not_applicable, applicable,
        covered, partially_covered, not_covered,
        control_coverage_pct, test_pass_rate_pct,
        mapped_test_count, passing_test_count,
        open_gaps, calculated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())`,
    [
      snapshotId,
      organizationId,
      frameworkId,
      totalRequirements,
      totalMapped,
      notApplicable,
      applicable,
      covered,
      partiallyCovered,
      notCovered,
      controlCoveragePct,
      testPassRatePct,
      mappedTestCount,
      passingTestCount,
      openGaps,
    ],
  );
}

/**
 * Refreshes coverage snapshots for all active org + framework pairs.
 * Runs idempotently — safe to call on any schedule.
 */
export async function refreshAllCoverageSnapshots(
  db: SqlExecutor,
): Promise<void> {
  const activeResult = await db.query<{
    organization_id: string;
    framework_id: string;
  }>(
    `select organization_id, framework_id from organization_frameworks where status = 'active'`,
  );

  for (const row of activeResult.rows) {
    try {
      await computeAndInsertCoverageSnapshot(
        db,
        row.organization_id,
        row.framework_id,
      );
    } catch (err) {
      // Log and continue — one failure should not block others
      console.error(
        `[coverageEngine] Failed to refresh snapshot for org=${row.organization_id} fw=${row.framework_id}:`,
        err,
      );
    }
  }
}
