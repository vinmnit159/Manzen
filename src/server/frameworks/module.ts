/**
 * Frameworks module registration.
 *
 * Follows the same RouteRegistrar pattern used by registerRiskEngineModule.
 * Re-uses the shared singleton Postgres pool (getPostgresPool) — no new
 * connection is created; frameworks piggyback the existing pool.
 */

import { createPgExecutor, getPostgresPool, readPostgresRuntimeConfig } from '@/server/db/postgres';
import type { RouteRegistrar } from '@/server/risk-engine/module';
import { createFrameworkHandlers, type FrameworkHandlerDeps } from './handlers';
import { frameworkRoutes } from './routes';
import { FrameworkService } from './service';

let frameworkService: FrameworkService | null = null;

function getFrameworkService(): FrameworkService {
  if (frameworkService) return frameworkService;
  const config = readPostgresRuntimeConfig();
  if (!config) {
    throw new Error('Postgres config not available — cannot initialize FrameworkService');
  }
  const pool = getPostgresPool(config);
  const executor = createPgExecutor(pool);
  frameworkService = new FrameworkService(executor);
  return frameworkService;
}

export function registerFrameworksModule(registrar: RouteRegistrar, deps: FrameworkHandlerDeps = {}) {
  const handlers = createFrameworkHandlers(deps);

  for (const route of frameworkRoutes) {
    registrar.route({
      method: route.method,
      url: route.url,
      schema: route.schema,
      handler: async (request) => {
        // Inject runtime service if no test stub was provided
        const effectiveDeps: FrameworkHandlerDeps = deps.service
          ? deps
          : { service: getFrameworkService() };
        const runtimeHandlers = createFrameworkHandlers(effectiveDeps);
        const handler = runtimeHandlers[route.handlerName];
        return handler(request as any);
      },
    });
  }

  return { routes: frameworkRoutes, handlers };
}

/** Allows tests to reset the singleton. */
export function resetFrameworkServiceForTests() {
  frameworkService = null;
}
