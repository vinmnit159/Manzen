import Fastify from 'fastify';
import { fastifyCors } from '@fastify/cors';
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

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
    credentials: true,
  });

  // Force CORS headers on every response so reverse proxies cannot strip them.
  app.addHook('onSend', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
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

  registerNotificationsModule({
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
