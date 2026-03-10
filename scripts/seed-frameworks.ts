/**
 * One-off script: create framework tables (IF NOT EXISTS) and seed the catalog.
 * Run: DATABASE_URL=... npx tsx scripts/seed-frameworks.ts
 */
import { seedFrameworkCatalog } from '../src/domain/risk-engine/frameworkSeeds';
import { applyRiskEngineSchema } from '../src/domain/risk-engine/migrations';
import pg from 'pg';
import { createHash } from 'crypto';

function toUuid(str: string): string {
  const hash = createHash('md5').update(str).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const executor = {
    query: async (sql: string, params?: any[]) => {
      const fixed = params?.map((p: any) => {
        if (typeof p === 'string' && /^(fw-|req-)/.test(p)) return toUuid(p);
        return p;
      });
      return pool.query(sql, fixed ?? params);
    },
  };

  try {
    console.log('Applying framework schema (IF NOT EXISTS)...');
    await applyRiskEngineSchema(executor);
    console.log('Schema OK.');

    console.log('Seeding framework catalog...');
    await seedFrameworkCatalog(executor);
    console.log('Seed complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
