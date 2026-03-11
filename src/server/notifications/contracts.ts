import { z } from 'zod';
import { NOTIFICATION_EVENT_TYPES } from '@/domain/notifications/eventTypes';

const notificationEventTypeSchema = z.enum(NOTIFICATION_EVENT_TYPES as [string, ...string[]]);
const deliveryChannelSchema = z.enum(['in_app', 'email', 'slack']);
const deliveryStatusSchema = z.enum(['sent', 'failed', 'skipped']);
const digestModeSchema = z.enum(['immediate', 'hourly', 'daily', 'weekly']);
const severitySchema = z.enum(['info', 'warning', 'critical']);

const okEnvelope = <T extends z.ZodTypeAny>(schema: T) => z.object({ success: z.literal(true), data: schema });

export const notificationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  recipientUserId: z.string(),
  eventType: notificationEventTypeSchema,
  title: z.string(),
  body: z.string(),
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
  severity: severitySchema,
  readAt: z.string().nullable(),
  actionedAt: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const notificationPreferenceSchema = z.object({
  id: z.string().nullable(),
  organizationId: z.string(),
  userId: z.string(),
  eventType: notificationEventTypeSchema,
  userEmail: z.string().nullable(),
  inAppEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  slackEnabled: z.boolean(),
  digestMode: digestModeSchema,
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const notificationDeliveryLogSchema = z.object({
  id: z.string(),
  notificationId: z.string(),
  organizationId: z.string(),
  channel: deliveryChannelSchema,
  status: deliveryStatusSchema,
  destination: z.string().nullable(),
  errorMessage: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  createdAt: z.string(),
});

export const listNotificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  total: z.number(),
});

export const unreadCountResponseSchema = z.object({ count: z.number() });

export const updatePreferenceRequestSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  slackEnabled: z.boolean().optional(),
  digestMode: digestModeSchema.optional(),
});

export const notificationsContracts = {
  listInbox: {
    method: 'GET' as const,
    path: '/api/notifications',
    response: okEnvelope(listNotificationsResponseSchema),
  },
  getUnreadCount: {
    method: 'GET' as const,
    path: '/api/notifications/unread-count',
    response: okEnvelope(unreadCountResponseSchema),
  },
  markRead: {
    method: 'POST' as const,
    path: '/api/notifications/:id/read',
    response: okEnvelope(z.object({ marked: z.literal(true) })),
  },
  markAllRead: {
    method: 'POST' as const,
    path: '/api/notifications/read-all',
    response: okEnvelope(z.object({ marked: z.literal(true) })),
  },
  getPreferences: {
    method: 'GET' as const,
    path: '/api/notifications/preferences',
    response: okEnvelope(z.array(notificationPreferenceSchema)),
  },
  updatePreference: {
    method: 'PUT' as const,
    path: '/api/notifications/preferences/:eventType',
    body: updatePreferenceRequestSchema,
    response: okEnvelope(notificationPreferenceSchema),
  },
} as const;

export type NotificationDto = z.infer<typeof notificationSchema>;
export type NotificationPreferenceDto = z.infer<typeof notificationPreferenceSchema>;
export type NotificationDeliveryLogDto = z.infer<typeof notificationDeliveryLogSchema>;
export type NotificationSeverity = z.infer<typeof severitySchema>;
export type NotificationDigestMode = z.infer<typeof digestModeSchema>;
export type UpdateNotificationPreferenceDto = z.infer<typeof updatePreferenceRequestSchema>;
