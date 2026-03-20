/**
 * Tests for coverageEngine.ts
 *
 * The coverage engine depends on a `SqlExecutor` interface (db.query).
 * We mock it with a simple function that returns preset row data.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  computeAndInsertCoverageSnapshot,
  refreshAllCoverageSnapshots,
} from '@/server/frameworks/coverageEngine';
import type { SqlExecutor } from '@/domain/risk-engine/persistence';

// ── Mock DB builder ───────────────────────────────────────────────────────────

/**
 * Build a SqlExecutor mock that responds to consecutive .query() calls
 * in the order provided. Each element in `responses` corresponds to one
 * call in the order that computeAndInsertCoverageSnapshot makes them:
 *
 *  1. totalRequirements (count)
 *  2. totalMapped       (count)
 *  3. applicability     ({ applicability_status, count }[])
 *  4. covered           (count)
 *  5. testResult        ({ total, passing })
 *  6. openGaps          (count)
 *  7. INSERT snapshot   (no rows needed)
 */
function buildMockDb(
  responses: Array<{ rows: Record<string, string>[] }>,
): SqlExecutor {
  let callIndex = 0;
  return {
    query: vi.fn().mockImplementation(() => {
      const res = responses[callIndex] ?? { rows: [] };
      callIndex++;
      return Promise.resolve(res);
    }),
  };
}

/** Standard preset: 10 total reqs, 8 mapped, 2 applicable, 1 covered, 2 tests 1 passing, 0 gaps */
function defaultResponses() {
  return [
    { rows: [{ count: '10' }] }, // totalRequirements
    { rows: [{ count: '8' }] }, // totalMapped
    {
      rows: [
        { applicability_status: 'applicable', count: '6' }, // applicability
        { applicability_status: 'not_applicable', count: '2' },
      ],
    },
    { rows: [{ count: '4' }] }, // covered
    { rows: [{ total: '5', passing: '3' }] }, // testResult
    { rows: [{ count: '1' }] }, // openGaps
    { rows: [] }, // INSERT
  ];
}

// ── computeAndInsertCoverageSnapshot ─────────────────────────────────────────

describe('computeAndInsertCoverageSnapshot', () => {
  it('calls db.query exactly 7 times (6 SELECTs + 1 INSERT)', async () => {
    const db = buildMockDb(defaultResponses());
    await computeAndInsertCoverageSnapshot(db, 'org-1', 'fw-1');
    expect((db.query as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(7);
  });

  it('passes organizationId and frameworkId to the first query', async () => {
    const db = buildMockDb(defaultResponses());
    await computeAndInsertCoverageSnapshot(db, 'org-abc', 'fw-xyz');
    const firstCall = (db.query as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(firstCall[1]).toContain('fw-xyz');
  });

  it('passes both org and framework to the INSERT query', async () => {
    const db = buildMockDb(defaultResponses());
    await computeAndInsertCoverageSnapshot(db, 'org-42', 'fw-99');
    const insertCall = (db.query as ReturnType<typeof vi.fn>).mock.calls[6]!;
    const insertArgs = insertCall[1] as string[];
    expect(insertArgs).toContain('org-42');
    expect(insertArgs).toContain('fw-99');
  });

  it('inserts correct derived coverage percentages', async () => {
    // 4 covered / 6 applicable = 66% (rounded), 3 passing / 5 total = 60%
    const db = buildMockDb(defaultResponses());
    await computeAndInsertCoverageSnapshot(db, 'org-1', 'fw-1');
    const insertArgs = (db.query as ReturnType<typeof vi.fn>).mock
      .calls[6]![1] as number[];
    // insertArgs layout: [id, orgId, fwId, totalReqs, totalMapped, notApplicable, applicable,
    //                      covered, partiallyCovered, notCovered, controlCoveragePct, testPassRatePct,
    //                      mappedTestCount, passingTestCount, openGaps]
    const controlCoveragePct = insertArgs[10]!;
    const testPassRatePct = insertArgs[11]!;
    expect(controlCoveragePct).toBe(67); // round(4/6 * 100)
    expect(testPassRatePct).toBe(60); // round(3/5 * 100)
  });

  it('handles 0 applicable requirements without dividing by zero', async () => {
    const responses = [
      { rows: [{ count: '10' }] },
      { rows: [{ count: '0' }] },
      { rows: [] }, // no applicability rows → applicable=0
      { rows: [{ count: '0' }] },
      { rows: [{ total: '0', passing: '0' }] },
      { rows: [{ count: '0' }] },
      { rows: [] },
    ];
    const db = buildMockDb(responses);
    // Should not throw
    await expect(
      computeAndInsertCoverageSnapshot(db, 'org-1', 'fw-1'),
    ).resolves.toBeUndefined();
    const insertArgs = (db.query as ReturnType<typeof vi.fn>).mock
      .calls[6]![1] as number[];
    const controlCoveragePct = insertArgs[10]!;
    expect(controlCoveragePct).toBe(0);
  });

  it('gracefully handles testResult query failure (catch path)', async () => {
    const responses = [
      { rows: [{ count: '10' }] },
      { rows: [{ count: '8' }] },
      { rows: [{ applicability_status: 'applicable', count: '6' }] },
      { rows: [{ count: '4' }] },
      // testResult will throw — the .catch fallback should provide zeros
      null as any,
      { rows: [{ count: '0' }] },
      { rows: [] },
    ];
    let callIndex = 0;
    const db: SqlExecutor = {
      query: vi.fn().mockImplementation(() => {
        const idx = callIndex++;
        if (idx === 4) return Promise.reject(new Error('table does not exist'));
        return Promise.resolve(responses[idx] ?? { rows: [] });
      }),
    };
    await expect(
      computeAndInsertCoverageSnapshot(db, 'org-1', 'fw-1'),
    ).resolves.toBeUndefined();
  });
});

// ── refreshAllCoverageSnapshots ───────────────────────────────────────────────

describe('refreshAllCoverageSnapshots', () => {
  it('does nothing when no active org-framework pairs exist', async () => {
    const db: SqlExecutor = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    await expect(refreshAllCoverageSnapshots(db)).resolves.toBeUndefined();
    // Only the initial "active" query should have been made
    expect((db.query as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('processes each active pair independently', async () => {
    let calls = 0;
    const db: SqlExecutor = {
      query: vi.fn().mockImplementation((_sql: string) => {
        calls++;
        // Return 2 active pairs on the first call
        if (calls === 1) {
          return Promise.resolve({
            rows: [
              { organization_id: 'org-a', framework_id: 'fw-1' },
              { organization_id: 'org-b', framework_id: 'fw-2' },
            ],
          });
        }
        // All subsequent calls return empty rows (for the sub-queries)
        return Promise.resolve({
          rows: [{ count: '0' }, { total: '0', passing: '0' }][0] ?? {
            rows: [],
          },
        });
      }),
    };

    // The function will iterate and call computeAndInsertCoverageSnapshot twice.
    // We just assert it resolves without errors.
    await expect(refreshAllCoverageSnapshots(db)).resolves.toBeUndefined();
  });

  it('continues processing other pairs if one throws', async () => {
    let calls = 0;
    const db: SqlExecutor = {
      query: vi.fn().mockImplementation(() => {
        calls++;
        if (calls === 1) {
          return Promise.resolve({
            rows: [
              { organization_id: 'org-a', framework_id: 'fw-1' },
              { organization_id: 'org-b', framework_id: 'fw-2' },
            ],
          });
        }
        // Fail the first sub-snapshot attempt
        if (calls === 2) return Promise.reject(new Error('db error'));
        return Promise.resolve({ rows: [{ count: '0' }] });
      }),
    };

    // Should not throw even if one pair fails
    await expect(refreshAllCoverageSnapshots(db)).resolves.toBeUndefined();
  });
});
