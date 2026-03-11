import type { SqlExecutor } from '@/domain/risk-engine/persistence';
import { NOTIFICATION_EVENT_DEFINITIONS, type NotificationEventType } from '@/domain/notifications/eventTypes';
import type {
  NotificationDeliveryLogDto,
  NotificationDigestMode,
  NotificationDto,
  NotificationPreferenceDto,
  NotificationSeverity,
  UpdateNotificationPreferenceDto,
} from './contracts';
import { EmailService } from './emailService';
import { getNotificationQueue, getQueueJobOptions } from '@/server/queue/client';
import type { NotificationDeliveryJob } from '@/server/queue/jobs';
import { sendSlackNotification } from '@/server/tests/workflowIntegrations';

interface NotificationRow {
  id: string;
  organization_id: string;
  recipient_user_id: string;
  event_type: NotificationEventType;
  title: string;
  body: string;
  resource_type: string | null;
  resource_id: string | null;
  severity: NotificationSeverity;
  read_at: string | null;
  digested_at: string | null;
  actioned_at: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationPreferenceRow {
  id: string;
  organization_id: string;
  user_id: string;
  event_type: NotificationEventType;
  user_email: string | null;
  in_app_enabled: boolean;
  email_enabled: boolean;
  slack_enabled: boolean;
  digest_mode: NotificationDigestMode;
  created_at: string;
  updated_at: string;
}

interface NotificationDeliveryLogRow {
  id: string;
  notification_id: string;
  organization_id: string;
  channel: 'in_app' | 'email' | 'slack';
  status: 'sent' | 'failed' | 'skipped';
  destination: string | null;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
}

function toNotificationDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    recipientUserId: row.recipient_user_id,
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    severity: row.severity,
    readAt: row.read_at,
    actionedAt: row.actioned_at,
    metadata: row.metadata_json ?? {},
    createdAt: row.created_at,
  };
}

function toPreferenceDto(row: NotificationPreferenceRow): NotificationPreferenceDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    eventType: row.event_type,
    userEmail: row.user_email,
    inAppEnabled: row.in_app_enabled,
    emailEnabled: row.email_enabled,
    slackEnabled: row.slack_enabled,
    digestMode: row.digest_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDeliveryLogDto(row: NotificationDeliveryLogRow): NotificationDeliveryLogDto {
  return {
    id: row.id,
    notificationId: row.notification_id,
    organizationId: row.organization_id,
    channel: row.channel,
    status: row.status,
    destination: row.destination,
    errorMessage: row.error_message,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

export class NotificationService {
  private readonly emailService = new EmailService();

  constructor(private readonly db: SqlExecutor) {}

  async emit(opts: {
    organizationId: string;
    recipientUserIds: string[];
    eventType: NotificationEventType;
    title: string;
    body: string;
    severity: NotificationSeverity;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    recipientEmails?: Record<string, string | undefined>;
    resourceUrl?: string;
    organizationName?: string;
  }): Promise<void> {
    const recipientUserIds = Array.from(new Set(opts.recipientUserIds.filter(Boolean)));
    for (const recipientUserId of recipientUserIds) {
      const preference = await this.getPreferenceForEvent(recipientUserId, opts.organizationId, opts.eventType);
      const inAppEnabled = preference?.inAppEnabled ?? true;
      if (!inAppEnabled) continue;

      const notificationId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await this.db.query(
        `insert into notifications
           (id, organization_id, recipient_user_id, event_type, title, body, resource_type, resource_id, severity, metadata_json, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)`,
        [
          notificationId,
          opts.organizationId,
          recipientUserId,
          opts.eventType,
          opts.title,
          opts.body,
          opts.resourceType ?? null,
          opts.resourceId ?? null,
          opts.severity,
          JSON.stringify(opts.metadata ?? {}),
          createdAt,
        ],
      );

      await this.logDelivery({
        notificationId,
        organizationId: opts.organizationId,
        channel: 'in_app',
        status: 'sent',
        destination: 'in_app',
        deliveredAt: createdAt,
      });

      const emailEnabled = preference?.emailEnabled ?? false;
      const slackEnabled = preference?.slackEnabled ?? false;
      const digestMode = preference?.digestMode ?? 'immediate';
      const recipientEmail = opts.recipientEmails?.[recipientUserId] ?? preference?.userEmail ?? undefined;
      const deliveryJobBase: Omit<NotificationDeliveryJob, 'channel'> = {
        notificationId,
        organizationId: opts.organizationId,
        recipientUserId,
        recipientEmail,
        eventType: opts.eventType,
        title: opts.title,
        body: opts.body,
        severity: opts.severity,
        resourceType: opts.resourceType,
        resourceId: opts.resourceId,
        resourceUrl: opts.resourceUrl,
        organizationName: opts.organizationName,
        testId: opts.resourceType === 'test' ? opts.resourceId : notificationId,
      };

      const queueAvailable = Boolean(process.env.REDIS_URL);

      if (emailEnabled) {
        if (digestMode !== 'immediate') {
          await this.logDelivery({
            notificationId,
            organizationId: opts.organizationId,
            channel: 'email',
            status: 'skipped',
            destination: recipientEmail ?? null,
            errorMessage: `Email held for ${digestMode} digest delivery`,
          });
        } else if (!recipientEmail) {
          await this.logDelivery({
            notificationId,
            organizationId: opts.organizationId,
            channel: 'email',
            status: 'skipped',
            errorMessage: 'Recipient email not available',
          });
        } else if (queueAvailable) {
          await getNotificationQueue().add('deliver-email', { ...deliveryJobBase, channel: 'email' }, getQueueJobOptions());
        } else {
          const emailResult = await this.emailService.sendNotificationEmail({
            to: recipientEmail,
            eventType: opts.eventType,
            title: opts.title,
            body: opts.body,
            severity: opts.severity,
            resourceUrl: opts.resourceUrl,
            organizationName: opts.organizationName,
          });

          await this.logDelivery({
            notificationId,
            organizationId: opts.organizationId,
            channel: 'email',
            status: emailResult.sent ? 'sent' : emailResult.skipped ? 'skipped' : 'failed',
            destination: recipientEmail,
            errorMessage: emailResult.error ?? null,
            deliveredAt: emailResult.sent ? new Date().toISOString() : null,
          });
        }
      }

      if (slackEnabled) {
        if (queueAvailable) {
          await getNotificationQueue().add('deliver-slack', { ...deliveryJobBase, channel: 'slack' }, getQueueJobOptions());
        } else {
          const result = await sendSlackNotification({
            testId: deliveryJobBase.testId ?? notificationId,
            title: opts.title,
            body: opts.body,
            severity: opts.severity,
            organizationId: opts.organizationId,
          });
          await this.logDelivery({
            notificationId,
            organizationId: opts.organizationId,
            channel: 'slack',
            status: result.status,
            destination: result.destination,
            errorMessage: (result.details?.error as string | undefined) ?? null,
            deliveredAt: result.status === 'sent' ? new Date().toISOString() : null,
          });
        }
      }
    }
  }

  async getUnreadCount(userId: string, organizationId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `select count(*) as count
         from notifications
        where organization_id = $1
          and recipient_user_id = $2
          and read_at is null`,
      [organizationId, userId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async listInbox(
    userId: string,
    organizationId: string,
    opts: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      eventType?: string;
      severity?: NotificationSeverity;
    } = {},
  ): Promise<{ notifications: NotificationDto[]; total: number }> {
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    const offset = Math.max(opts.offset ?? 0, 0);
    const params: unknown[] = [organizationId, userId];
    const filters = ['organization_id = $1', 'recipient_user_id = $2'];

    if (opts.unreadOnly) {
      filters.push('read_at is null');
    }
    if (opts.eventType) {
      params.push(opts.eventType);
      filters.push(`event_type = $${params.length}`);
    }
    if (opts.severity) {
      params.push(opts.severity);
      filters.push(`severity = $${params.length}`);
    }

    const whereSql = filters.join(' and ');
    const totalResult = await this.db.query<{ count: string }>(
      `select count(*) as count from notifications where ${whereSql}`,
      params,
    );

    const listParams = [...params, limit, offset];
    const listResult = await this.db.query<NotificationRow>(
      `select id, organization_id, recipient_user_id, event_type, title, body, resource_type, resource_id, severity, read_at, digested_at, actioned_at, metadata_json, created_at
         from notifications
        where ${whereSql}
        order by case when read_at is null then 0 else 1 end asc, created_at desc
        limit $${listParams.length - 1}
       offset $${listParams.length}`,
      listParams,
    );

    return {
      notifications: listResult.rows.map(toNotificationDto),
      total: Number(totalResult.rows[0]?.count ?? 0),
    };
  }

  async markRead(notificationId: string, userId: string, organizationId: string): Promise<void> {
    await this.db.query(
      `update notifications
          set read_at = coalesce(read_at, now()),
              actioned_at = now()
        where id = $1
          and recipient_user_id = $2
          and organization_id = $3`,
      [notificationId, userId, organizationId],
    );
  }

  async markAllRead(userId: string, organizationId: string): Promise<void> {
    await this.db.query(
      `update notifications
          set read_at = coalesce(read_at, now())
        where recipient_user_id = $1
          and organization_id = $2
          and read_at is null`,
      [userId, organizationId],
    );
  }

  async getPreferences(userId: string, organizationId: string): Promise<NotificationPreferenceDto[]> {
    await this.ensureDefaultPreferences(userId, organizationId);
    const result = await this.db.query<NotificationPreferenceRow>(
      `select id, organization_id, user_id, event_type, user_email, in_app_enabled, email_enabled, slack_enabled, digest_mode, created_at, updated_at
         from notification_preferences
        where organization_id = $1
          and user_id = $2
        order by event_type asc`,
      [organizationId, userId],
    );

    const byEvent = new Map(result.rows.map((row) => [row.event_type, toPreferenceDto(row)]));
    return NOTIFICATION_EVENT_DEFINITIONS.map((definition) => byEvent.get(definition.eventType) ?? {
      id: null,
      organizationId,
      userId,
      eventType: definition.eventType,
      userEmail: null,
      inAppEnabled: true,
      emailEnabled: false,
      slackEnabled: false,
      digestMode: 'immediate',
      createdAt: null,
      updatedAt: null,
    });
  }

  async upsertPreference(opts: {
    userId: string;
    organizationId: string;
    eventType: NotificationEventType;
    inAppEnabled?: boolean;
    emailEnabled?: boolean;
    slackEnabled?: boolean;
    digestMode?: NotificationDigestMode;
    userEmail?: string;
  }): Promise<NotificationPreferenceDto> {
    const current = await this.getPreferenceForEvent(opts.userId, opts.organizationId, opts.eventType);
    const next: NotificationPreferenceDto = {
      id: current?.id ?? crypto.randomUUID(),
      organizationId: opts.organizationId,
      userId: opts.userId,
      eventType: opts.eventType,
      userEmail: opts.userEmail ?? current?.userEmail ?? null,
      inAppEnabled: opts.inAppEnabled ?? current?.inAppEnabled ?? true,
      emailEnabled: opts.emailEnabled ?? current?.emailEnabled ?? false,
      slackEnabled: opts.slackEnabled ?? current?.slackEnabled ?? false,
      digestMode: opts.digestMode ?? current?.digestMode ?? 'immediate',
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.query(
      `insert into notification_preferences
         (id, organization_id, user_id, event_type, user_email, in_app_enabled, email_enabled, slack_enabled, digest_mode, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (organization_id, user_id, event_type) do update
         set user_email = coalesce(excluded.user_email, notification_preferences.user_email),
             in_app_enabled = excluded.in_app_enabled,
             email_enabled = excluded.email_enabled,
             slack_enabled = excluded.slack_enabled,
             digest_mode = excluded.digest_mode,
             updated_at = excluded.updated_at`,
      [
        next.id,
        next.organizationId,
        next.userId,
        next.eventType,
        next.userEmail,
        next.inAppEnabled,
        next.emailEnabled,
        next.slackEnabled,
        next.digestMode,
        next.createdAt,
        next.updatedAt,
      ],
    );

    return next;
  }

  async ensureDefaultPreferences(userId: string, organizationId: string, userEmail?: string): Promise<void> {
    const rows = NOTIFICATION_EVENT_DEFINITIONS;
    if (rows.length === 0) return;

    const params: unknown[] = [];
    const values = rows.map((definition, index) => {
      const base = index * 11;
      params.push(
        crypto.randomUUID(),
        organizationId,
        userId,
        definition.eventType,
        userEmail ?? null,
        true,
        false,
        false,
        'immediate',
        new Date().toISOString(),
        new Date().toISOString(),
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`;
    }).join(', ');

    await this.db.query(
      `insert into notification_preferences
         (id, organization_id, user_id, event_type, user_email, in_app_enabled, email_enabled, slack_enabled, digest_mode, created_at, updated_at)
       values ${values}
       on conflict (organization_id, user_id, event_type) do update
         set user_email = coalesce(excluded.user_email, notification_preferences.user_email)`,
      params,
    );
  }

  private async getPreferenceForEvent(userId: string, organizationId: string, eventType: NotificationEventType): Promise<NotificationPreferenceDto | null> {
    const result = await this.db.query<NotificationPreferenceRow>(
      `select id, organization_id, user_id, event_type, user_email, in_app_enabled, email_enabled, slack_enabled, digest_mode, created_at, updated_at
         from notification_preferences
        where organization_id = $1
          and user_id = $2
          and event_type = $3
        limit 1`,
      [organizationId, userId, eventType],
    );
    return result.rows[0] ? toPreferenceDto(result.rows[0]) : null;
  }

  private async logDelivery(opts: {
    notificationId: string;
    organizationId: string;
    channel: 'in_app' | 'email' | 'slack';
    status: 'sent' | 'failed' | 'skipped';
    destination?: string | null;
    errorMessage?: string | null;
    deliveredAt?: string | null;
  }): Promise<NotificationDeliveryLogDto> {
    const row: NotificationDeliveryLogRow = {
      id: crypto.randomUUID(),
      notification_id: opts.notificationId,
      organization_id: opts.organizationId,
      channel: opts.channel,
      status: opts.status,
      destination: opts.destination ?? null,
      error_message: opts.errorMessage ?? null,
      delivered_at: opts.deliveredAt ?? null,
      created_at: new Date().toISOString(),
    };

    await this.db.query(
      `insert into notification_delivery_log
         (id, notification_id, organization_id, channel, status, destination, error_message, delivered_at, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        row.id,
        row.notification_id,
        row.organization_id,
        row.channel,
        row.status,
        row.destination,
        row.error_message,
        row.delivered_at,
        row.created_at,
      ],
    );

    return toDeliveryLogDto(row);
  }
}

export type NotificationServiceUpdateInput = UpdateNotificationPreferenceDto;
