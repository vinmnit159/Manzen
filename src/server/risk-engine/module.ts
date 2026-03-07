import { createRiskEngineHandlers, type RiskEngineHandlerDeps } from './handlers';
import { riskEngineRoutes } from './routes';

export interface RouteRegistrar {
  route(definition: {
    method: 'GET' | 'POST';
    url: string;
    schema: { body?: unknown; response: unknown };
    handler: (request?: { body?: unknown }) => Promise<unknown>;
  }): void;
}

export function registerRiskEngineModule(registrar: RouteRegistrar, deps: RiskEngineHandlerDeps = {}) {
  const handlers = createRiskEngineHandlers(deps);

  for (const route of riskEngineRoutes) {
    registrar.route({
      method: route.method,
      url: route.url,
      schema: route.schema,
      handler: async (request) => {
        const handler = handlers[route.handlerName];
        if (route.method === 'POST') {
          return handler(request?.body);
        }
        return handler();
      },
    });
  }

  return { routes: riskEngineRoutes, handlers };
}
