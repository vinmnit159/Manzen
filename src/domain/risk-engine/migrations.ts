import { frameworkSchemaSql, notificationSchemaSql, riskEngineSchemaSql } from './schema';
import type { SqlExecutor } from './persistence';

export async function applyRiskEngineSchema(db: SqlExecutor) {
  await db.query(riskEngineSchemaSql);
  await db.query(notificationSchemaSql);
  await db.query(frameworkSchemaSql);
  await db.query(`alter table notifications add column if not exists digested_at timestamp with time zone`);
  await db.query(`alter table notification_preferences add column if not exists user_email varchar(255)`);
}

export const riskEngineMigration = {
  name: '20260308_risk_engine_foundation_with_events',
  sql: riskEngineSchemaSql,
};
