import type { NotificationDigestMode, NotificationSeverity } from '@/server/notifications/contracts';

export type NotificationDeliveryChannel = 'email' | 'slack';

export interface NotificationDeliveryJob {
  notificationId: string;
  organizationId: string;
  recipientUserId: string;
  recipientEmail?: string;
  channel: NotificationDeliveryChannel;
  eventType: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  resourceType?: string;
  resourceId?: string;
  resourceUrl?: string;
  organizationName?: string;
  testId?: string;
}

export interface DigestJob {
  period: Exclude<NotificationDigestMode, 'immediate'>;
}
