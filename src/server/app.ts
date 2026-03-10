import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRiskEngineModule } from '@/server/risk-engine/module';
import { registerTestsModule } from '@/server/tests/module';
import { registerGenericIntegrationModules } from '@/server/integrations/genericIntegrationModule';
import { registerGithubIntegrationModule } from '@/server/integrations/github/module';
import { registerFrameworksModule } from '@/server/frameworks/module';
import { authenticate } from '@/server/middleware/authenticate';

export async function createServerApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  // ── Global JWT authentication hook ────────────────────────────────────────
  // Every route registered through this server requires a valid Bearer JWT.
  // The token is issued by the external backend (ismsbackend.bitcoingames1346.com)
  // and carries: sub/id, email, role, organizationId.
  app.addHook('preHandler', authenticate);

  // ── Route modules ──────────────────────────────────────────────────────────

  registerRiskEngineModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        schema: definition.schema,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
          user: (request as any).user,
        }),
      });
    },
  });

  registerTestsModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        schema: definition.schema,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
          user: (request as any).user,
        }),
      });
    },
  });

  registerGithubIntegrationModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
          user: (request as any).user,
        }),
      });
    },
  });

  registerGenericIntegrationModules({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
          user: (request as any).user,
        }),
      });
    },
  });

  registerFrameworksModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        schema: definition.schema,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
          user: (request as any).user,
        }),
      });
    },
  });

  return app;
}
