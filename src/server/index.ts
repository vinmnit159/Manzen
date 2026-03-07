import { createServerApp } from './app';

async function start() {
  const app = await createServerApp();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen({ port, host });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
