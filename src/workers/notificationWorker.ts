import { Worker } from 'bullmq';
import { createPgExecutor, getPostgresPool, readPostgresRuntimeConfig } from '@/server/db/postgres';
import { getRedisConnection, QUEUES } from '@/server/queue/client';
import type { NotificationDeliveryJob } from '@/server/queue/jobs';
import { EmailService } from '@/server/notifications/emailService';
import { sendSlackNotification } from '@/server/tests/workflowIntegrations';

const emailService = new EmailService();

function getExecutor() {
  const config = readPostgresRuntimeConfig();
  if (!config) {
    throw new Error('DATABASE_URL is required for notification worker');
  }
  return createPgExecutor(getPostgresPool(config));
}

async function logDeliveryAttempt(job: NotificationDeliveryJob, status: 'sent' | 'failed' | 'skipped', destination?: string | null, errorMessage?: string | null) {
  const db = getExecutor();
  await db.query(
    `insert into notification_delivery_log
       (id, notification_id, organization_id, channel, status, destination, error_message, delivered_at, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      crypto.randomUUID(),
      job.notificationId,
      job.organizationId,
      job.channel,
      status,
      destination ?? null,
      errorMessage ?? null,
      status === 'sent' ? new Date().toISOString() : null,
      new Date().toISOString(),
    ],
  );
}

export function startNotificationWorker() {
  const worker = new Worker(
    QUEUES.NOTIFICATION_DELIVERY,
    async (job) => {
      const payload = job.data as NotificationDeliveryJob;

      if (payload.channel === 'email') {
        if (!payload.recipientEmail) {
          await logDeliveryAttempt(payload, 'skipped', null, 'Recipient email not available');
          return;
        }

        const result = await emailService.sendNotificationEmail({
          to: payload.recipientEmail,
          eventType: payload.eventType,
          title: payload.title,
          body: payload.body,
          severity: payload.severity,
          resourceUrl: payload.resourceUrl,
          organizationName: payload.organizationName,
        });

        await logDeliveryAttempt(payload, result.sent ? 'sent' : result.skipped ? 'skipped' : 'failed', payload.recipientEmail, result.error ?? null);
        if (!result.sent && !result.skipped) {
          throw new Error(result.error ?? 'Email delivery failed');
        }
        return;
      }

      const slackResult = await sendSlackNotification({
        testId: payload.testId ?? payload.resourceId ?? payload.notificationId,
        title: payload.title,
        body: payload.body,
        severity: payload.severity,
        organizationId: payload.organizationId,
      });
      await logDeliveryAttempt(payload, slackResult.status, slackResult.destination, (slackResult.details?.error as string | undefined) ?? null);
      if (slackResult.status === 'failed') {
        throw new Error(((slackResult.details?.error as string | undefined) ?? 'Slack delivery failed'));
      }
    },
    { connection: getRedisConnection(), concurrency: 5 },
  );

  worker.on('failed', (job, error) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, error);
  });

  return worker;
}

if (process.env.WORKER_ROLE === 'notifications') {
  startNotificationWorker();
  console.log('[worker-notifications] started');
}
