/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { Worker } from 'bullmq';
import {
  createPgExecutor,
  getPostgresPool,
  readPostgresRuntimeConfig,
} from '@/server/db/postgres';
import { NotificationEventType } from '@/domain/notifications/eventTypes';
import { refreshAllCoverageSnapshots } from '@/server/frameworks/coverageEngine';
import { NotificationService } from '@/server/notifications/service';
import { EmailService } from '@/server/notifications/emailService';
import { getRedisConnection, QUEUES } from '@/server/queue/client';
import {
  getTestsRuntimeService,
  type TestRecordDto,
} from '@/server/tests/runtime';
import { startScheduler } from './scheduler';

const emailService = new EmailService();

function getExecutor() {
  const config = readPostgresRuntimeConfig();
  if (!config) {
    throw new Error('DATABASE_URL is required for digest worker');
  }
  return createPgExecutor(getPostgresPool(config));
}

async function processDigest(period: 'hourly' | 'daily' | 'weekly') {
  const db = getExecutor();
  const windowSql =
    period === 'hourly'
      ? "interval '1 hour'"
      : period === 'daily'
        ? "interval '1 day'"
        : "interval '7 days'";

  const preferenceRows = await db.query<{
    organization_id: string;
    user_id: string;
    user_email: string | null;
  }>(
    `select distinct organization_id, user_id, user_email
       from notification_preferences
      where email_enabled = true
        and digest_mode = $1
        and user_email is not null`,
    [period],
  );

  for (const preference of preferenceRows.rows) {
    const notifications = await db.query<{
      id: string;
      organization_id: string;
      recipient_user_id: string;
      event_type: string;
      title: string;
      body: string;
      resource_type: string | null;
      resource_id: string | null;
      severity: 'info' | 'warning' | 'critical';
      read_at: string | null;
      actioned_at: string | null;
      metadata_json: Record<string, unknown> | null;
      created_at: string;
    }>(
      `select id, organization_id, recipient_user_id, event_type, title, body, resource_type, resource_id, severity, read_at, actioned_at, metadata_json, created_at
         from notifications
        where organization_id = $1
          and recipient_user_id = $2
          and read_at is null
          and digested_at is null
          and created_at >= now() - ${windowSql}
        order by created_at desc`,
      [preference.organization_id, preference.user_id],
    );

    if (notifications.rows.length === 0) continue;

    const digestResult = await emailService.sendDigestEmail({
      to: preference.user_email!,
      organizationName: 'Manzen',
      notifications: notifications.rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        recipientUserId: row.recipient_user_id,
        eventType: row.event_type as any,
        title: row.title,
        body: row.body,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        severity: row.severity,
        readAt: row.read_at,
        actionedAt: row.actioned_at,
        metadata: row.metadata_json ?? {},
        createdAt: row.created_at,
      })),
      period,
    });

    const status = digestResult.sent
      ? 'sent'
      : digestResult.skipped
        ? 'skipped'
        : 'failed';
    for (const notification of notifications.rows) {
      await db.query(
        `insert into notification_delivery_log
           (id, notification_id, organization_id, channel, status, destination, error_message, delivered_at, created_at)
         values ($1, $2, $3, 'email', $4, $5, $6, $7, $8)`,
        [
          crypto.randomUUID(),
          notification.id,
          notification.organization_id,
          status,
          preference.user_email,
          digestResult.error ?? `${period} digest`,
          digestResult.sent ? new Date().toISOString() : null,
          new Date().toISOString(),
        ],
      );
    }

    if (digestResult.sent) {
      await db.query(
        `update notifications
            set digested_at = now()
          where organization_id = $1
            and recipient_user_id = $2
            and read_at is null
            and digested_at is null
            and created_at >= now() - ${windowSql}`,
        [preference.organization_id, preference.user_id],
      );
    }
  }
}

async function processRiskReminders() {
  const db = getExecutor();
  const service = new NotificationService(db);
  const rows = await db.query<{
    id: string;
    organization_id: string;
    owner_id: string;
  }>(
    `select id, organization_id, owner_id
       from organization_framework_requirement_status
      where owner_id is not null
        and due_date is not null
        and due_date <= now() + interval '48 hours'
        and due_date >= now()`,
  );
  for (const row of rows.rows) {
    await service.emit({
      organizationId: row.organization_id,
      recipientUserIds: [row.owner_id],
      eventType: NotificationEventType.RISK_DUE,
      title: 'Upcoming due date reminder',
      body: 'A framework or remediation item assigned to you is due within 48 hours.',
      severity: 'warning',
      resourceType: 'framework',
      resourceId: row.id,
      resourceUrl: '/compliance/frameworks',
    });
  }
}

async function processAuditReminders() {
  const service = await getTestsRuntimeService();
  const tests = service.listTests({ page: 1, limit: 500 }) as TestRecordDto[];
  const now = Date.now();
  const horizon = now + 7 * 24 * 60 * 60 * 1000;

  for (const test of tests) {
    const dueAt = new Date(test.dueDate).getTime();
    if (test.audits.length === 0 || dueAt < now || dueAt > horizon) continue;

    await new NotificationService(getExecutor()).emit({
      organizationId: test.organizationId,
      recipientUserIds: [test.ownerId],
      eventType: NotificationEventType.AUDIT_REMINDER,
      title: `Audit evidence due soon: ${test.name}`,
      body: `An audit-linked test is due soon for ${test.audits.map((item) => item.audit.id).join(', ')}.`,
      severity: 'warning',
      resourceType: 'audit',
      resourceId: test.audits[0]?.auditId,
      recipientEmails: {
        [test.ownerId]: test.owner?.email ?? `${test.ownerId}@manzen.dev`,
      },
      resourceUrl: '/compliance/audits',
    });
  }
}

async function processAccessReviewReminders() {
  const service = await getTestsRuntimeService();
  const tests = service.listTests({ page: 1, limit: 500 }) as TestRecordDto[];
  const now = Date.now();
  const horizon = now + 7 * 24 * 60 * 60 * 1000;

  for (const test of tests) {
    const label = `${test.name} ${test.category}`.toLowerCase();
    const isAccessReview =
      label.includes('access review') ||
      label.includes('privilege recertification');
    const dueAt = new Date(test.dueDate).getTime();
    if (!isAccessReview || dueAt < now || dueAt > horizon) continue;

    await new NotificationService(getExecutor()).emit({
      organizationId: test.organizationId,
      recipientUserIds: [test.ownerId],
      eventType: NotificationEventType.ACCESS_REVIEW_DUE,
      title: `Access review due soon: ${test.name}`,
      body: `The access review task "${test.name}" is due within the next 7 days.`,
      severity: 'warning',
      resourceType: 'test',
      resourceId: test.id,
      recipientEmails: {
        [test.ownerId]: test.owner?.email ?? `${test.ownerId}@manzen.dev`,
      },
      resourceUrl: `/tests/${test.id}`,
    });
  }
}

export function startDigestWorker() {
  return new Worker(
    QUEUES.DIGEST,
    async (job) => {
      switch (job.name) {
        case 'hourly-digest':
          return processDigest('hourly');
        case 'daily-digest':
          return processDigest('daily');
        case 'weekly-digest':
          return processDigest('weekly');
        case 'risk-overdue-reminder':
          return processRiskReminders();
        case 'audit-reminder':
          return processAuditReminders();
        case 'access-review-reminder':
          return processAccessReviewReminders();
        case 'coverage-refresh':
          return refreshAllCoverageSnapshots(getExecutor());
        default:
          return undefined;
      }
    },
    { connection: getRedisConnection(), concurrency: 2 },
  );
}

if (process.env.WORKER_ROLE === 'digests') {
  startScheduler()
    .then(() => {
      startDigestWorker();
      console.info('[worker-digests] started');
    })
    .catch((error) => {
      console.error('[worker-digests] failed to start', error);
      process.exit(1);
    });
}
