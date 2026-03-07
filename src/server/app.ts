import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRiskEngineModule } from '@/server/risk-engine/module';
import { registerGenericIntegrationModules } from '@/server/integrations/genericIntegrationModule';
import { registerGithubIntegrationModule } from '@/server/integrations/github/module';

export async function createServerApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  registerRiskEngineModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        schema: definition.schema,
        handler: async (request) => definition.handler({ body: (request as { body?: unknown }).body }),
      });
    },
  });

  registerGithubIntegrationModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({ body: (request as { body?: unknown }).body, params: (request as { params?: Record<string, string> }).params }),
      });
    },
  });

  registerGenericIntegrationModules({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({ body: (request as { body?: unknown }).body, params: (request as { params?: Record<string, string> }).params }),
      });
    },
  });

  return app;
}
