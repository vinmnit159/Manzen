import { Pool, type PoolConfig } from 'pg';
import type { SqlExecutor } from '@/domain/risk-engine/persistence';

declare global {
  var __manzenRiskEnginePool: Pool | undefined;
}

export interface PostgresRuntimeConfig {
  connectionString: string;
  ssl?: PoolConfig['ssl'];
  max?: number;
}

export function createPostgresPool(config: PostgresRuntimeConfig) {
  return new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl,
    max: config.max ?? 10,
  });
}

export function getPostgresPool(config?: PostgresRuntimeConfig) {
  if (!config)
    throw new Error('Postgres config is required to initialize the pool.');
  if (!globalThis.__manzenRiskEnginePool) {
    globalThis.__manzenRiskEnginePool = createPostgresPool(config);
  }
  return globalThis.__manzenRiskEnginePool;
}

export function createPgExecutor(pool: Pool): SqlExecutor {
  return {
    async query<T = Record<string, unknown>>(sql: string, params?: unknown[]) {
      const result = await pool.query(sql, params);
      return { rows: result.rows as T[] };
    },
  };
}

export function readPostgresRuntimeConfig(): PostgresRuntimeConfig | null {
  const connectionString =
    typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
  if (!connectionString) return null;
  return {
    connectionString,
    ssl:
      typeof process !== 'undefined' && process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : undefined,
    max:
      typeof process !== 'undefined' && process.env.PGPOOL_MAX
        ? Number(process.env.PGPOOL_MAX)
        : undefined,
  };
}
