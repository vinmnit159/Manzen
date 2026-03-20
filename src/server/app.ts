import Fastify from 'fastify';
import { registerRiskEngineModule } from '@/server/risk-engine/module';
import { registerTestsModule } from '@/server/tests/module';
import { registerGenericIntegrationModules } from '@/server/integrations/genericIntegrationModule';
import { registerGithubIntegrationModule } from '@/server/integrations/github/module';
import { registerFrameworksModule } from '@/server/frameworks/module';
import { authenticate } from '@/server/middleware/authenticate';
import { registerNotificationsModule } from '@/server/notifications/module';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL ?? 'https://app.cloudanzen.com',
  'https://app.cloudanzen.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

export async function createServerApp() {
  const app = Fastify({ logger: true });

  // Handle CORS manually via hooks so headers survive Cloudflare proxy.
  // @fastify/cors is skipped in favour of explicit header injection.
  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,authorization');
    }
    // Respond to preflight immediately — no auth needed.
    if (request.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  // ── Global JWT authentication hook ────────────────────────────────────────
  // Every route registered through this server requires a valid Bearer JWT.
  // The token is issued by the external backend (api.cloudanzen.com)
  // and carries: sub/id, email, role, organizationId.
  app.addHook('preHandler', authenticate);

  // ── Route modules ──────────────────────────────────────────────────────────

  registerRiskEngineModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
        }),
      });
    },
  });

  registerTestsModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
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
          user: (request as { user?: { id: string; organizationId: string; role: string } }).user,
        }),
      });
    },
  });

  registerFrameworksModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
        }),
      });
    },
  });

  registerNotificationsModule({
    route(definition) {
      app.route({
        method: definition.method,
        url: definition.url,
        handler: async (request) => definition.handler({
          body: (request as { body?: unknown }).body,
          params: (request as { params?: Record<string, string> }).params,
          query: (request as { query?: unknown }).query,
        }),
      });
    },
  });

  return app;
}
