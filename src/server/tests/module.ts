import { createTestsHandlers } from './handlers';
import { testsRoutes } from './routes';

export function registerTestsModule(registrar: {
  route(definition: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    schema: { body?: unknown; response: unknown };
    handler: (request?: { body?: unknown; params?: Record<string, string>; query?: unknown }) => Promise<unknown>;
  }): void;
}) {
  const handlers = createTestsHandlers();

  for (const route of testsRoutes) {
    registrar.route({
      method: route.method,
      url: route.url,
      schema: route.schema,
      handler: async (request) => handlers[route.handlerName](request),
    });
  }

  return { routes: testsRoutes, handlers };
}
