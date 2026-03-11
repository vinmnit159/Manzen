import { createPgExecutor, getPostgresPool, readPostgresRuntimeConfig } from '@/server/db/postgres';
import type { RouteRegistrar } from '@/server/risk-engine/module';
import { createNotificationHandlers, type NotificationHandlerDeps } from './handlers';
import { notificationRoutes } from './routes';
import { NotificationService } from './service';

let notificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (notificationService) return notificationService;
  const config = readPostgresRuntimeConfig();
  if (!config) {
    throw new Error('Postgres config not available — cannot initialize NotificationService');
  }
  const pool = getPostgresPool(config);
  notificationService = new NotificationService(createPgExecutor(pool));
  return notificationService;
}

export function getNotificationServiceOrNull(): NotificationService | null {
  try {
    return getNotificationService();
  } catch {
    return null;
  }
}

export function registerNotificationsModule(registrar: RouteRegistrar, deps: NotificationHandlerDeps = {}) {
  const handlers = createNotificationHandlers(deps);

  for (const route of notificationRoutes) {
    registrar.route({
      method: route.method,
      url: route.url,
      schema: route.schema,
      handler: async (request) => {
        const effectiveDeps = deps.service ? deps : { service: getNotificationService() };
        const runtimeHandlers = createNotificationHandlers(effectiveDeps);
        const handler = runtimeHandlers[route.handlerName];
        return handler(request as any);
      },
    });
  }

  return { routes: notificationRoutes, handlers };
}

export function resetNotificationServiceForTests() {
  notificationService = null;
}
