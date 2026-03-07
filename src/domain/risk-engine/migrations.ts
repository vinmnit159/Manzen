import { riskEngineSchemaSql } from './schema';
import type { SqlExecutor } from './persistence';

export async function applyRiskEngineSchema(db: SqlExecutor) {
  await db.query(riskEngineSchemaSql);
}

export const riskEngineMigration = {
  name: '20260308_risk_engine_foundation_with_events',
  sql: riskEngineSchemaSql,
};
