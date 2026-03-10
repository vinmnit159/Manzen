import { applyRiskEngineSchema } from '@/domain/risk-engine/migrations';
import { seedRiskEngineFoundation } from '@/domain/risk-engine/seeds';
import { seedFrameworkCatalog } from '@/domain/risk-engine/frameworkSeeds';
import { SqlRiskEngineRepository } from '@/domain/risk-engine/sqlRepository';
import { RiskEngineFoundationService, createInMemoryRiskEngineFoundationService } from '@/domain/risk-engine/service';
import { createPgExecutor, getPostgresPool, readPostgresRuntimeConfig } from '@/server/db/postgres';
import { refreshAllCoverageSnapshots } from '@/server/frameworks/coverageEngine';

let runtimeService: RiskEngineFoundationService | null = null;
let schemaReady: Promise<void> | null = null;
let seedReady: Promise<void> | null = null;

async function createDbBackedService() {
  const config = readPostgresRuntimeConfig();
  if (!config) return null;

  const pool = getPostgresPool(config);
  const executor = createPgExecutor(pool);
  if (!schemaReady) {
    schemaReady = applyRiskEngineSchema(executor).then(() => undefined);
  }
  await schemaReady;

  if (typeof process !== 'undefined' && process.env.RISK_ENGINE_AUTO_SEED === 'true') {
    if (!seedReady) {
      seedReady = seedRiskEngineFoundation(executor)
        .then(() => seedFrameworkCatalog(executor))
        .then(() => undefined);
    }
    await seedReady;
  }

  // Phase 4: start periodic coverage snapshot refresh (every 15 minutes)
  if (typeof process !== 'undefined' && process.env.RISK_ENGINE_AUTO_SEED === 'true') {
    const COVERAGE_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
    setInterval(() => {
      refreshAllCoverageSnapshots(executor).catch(err =>
        console.error('[runtime] Periodic coverage refresh failed:', err),
      );
    }, COVERAGE_REFRESH_INTERVAL_MS);
  }

  return new RiskEngineFoundationService(new SqlRiskEngineRepository(executor));
}

export async function getRiskEngineRuntimeService() {
  if (runtimeService) return runtimeService;
  runtimeService = (await createDbBackedService()) ?? createInMemoryRiskEngineFoundationService();
  return runtimeService;
}

export async function resetRiskEngineRuntimeForTests() {
  runtimeService = null;
  schemaReady = null;
  seedReady = null;
}
