import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRiskEngineModule } from '@/server/risk-engine/module';

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

  return app;
}
