import { createServerApp } from './app';
import { startNotificationWorker } from '@/workers/notificationWorker';
import { startDigestWorker } from '@/workers/digestWorker';
import { startScheduler } from '@/workers/scheduler';

let infrastructureStarted = false;

async function startBackgroundInfrastructure() {
  if (infrastructureStarted || !process.env.REDIS_URL) return;
  infrastructureStarted = true;
  await startScheduler();
  startNotificationWorker();
  startDigestWorker();
  console.info('[server] in-process workers started');
}

async function start() {
  const app = await createServerApp();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';
  if (process.env.WORKER_ROLE === 'all') {
    await startBackgroundInfrastructure();
  }
  await app.listen({ port, host });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
