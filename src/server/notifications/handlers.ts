import type { AuthUser } from '@/server/middleware/authenticate';
import { notificationsContracts } from './contracts';
import { NotificationService } from './service';

interface HandlerRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: unknown;
  user?: AuthUser;
}

export interface NotificationHandlerDeps {
  service?: NotificationService;
}

function ok<T>(data: T) {
  return { success: true as const, data };
}

function requireUser(user?: AuthUser) {
  if (!user?.id || !user.organizationId) {
    throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
  }
  return user;
}

export function createNotificationHandlers(deps: NotificationHandlerDeps = {}) {
  function getService() {
    if (!deps.service) {
      throw new Error('NotificationService not provided to handler');
    }
    return deps.service;
  }

  return {
    async listInbox(request?: HandlerRequest) {
      const service = getService();
      const user = requireUser(request?.user);
      const query = (request?.query as Record<string, string> | undefined) ?? {};
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;
      const offset = query.offset ? parseInt(query.offset, 10) : undefined;
      const unreadOnly = query.unreadOnly === 'true';
      const eventType = query.eventType || undefined;
      const severity = (query.severity as 'info' | 'warning' | 'critical' | undefined) ?? undefined;
      const data = await service.listInbox(user.id, user.organizationId, { limit, offset, unreadOnly, eventType, severity });
      return notificationsContracts.listInbox.response.parse(ok(data));
    },

    async getUnreadCount(request?: HandlerRequest) {
      const service = getService();
      const user = requireUser(request?.user);
      const count = await service.getUnreadCount(user.id, user.organizationId);
      return notificationsContracts.getUnreadCount.response.parse(ok({ count }));
    },

    async markRead(request?: HandlerRequest) {
      const service = getService();
      const user = requireUser(request?.user);
      await service.markRead(request?.params?.id ?? '', user.id, user.organizationId);
      return notificationsContracts.markRead.response.parse(ok({ marked: true as const }));
    },

    async markAllRead(request?: HandlerRequest) {
      const service = getService();
      const user = requireUser(request?.user);
      await service.markAllRead(user.id, user.organizationId);
      return notificationsContracts.markAllRead.response.parse(ok({ marked: true as const }));
    },

    async getPreferences(request?: HandlerRequest) {
      const service = getService();
      const user = requireUser(request?.user);
      const data = await service.getPreferences(user.id, user.organizationId);
      return notificationsContracts.getPreferences.response.parse(ok(data));
    },

    async updatePreference(request?: HandlerRequest) {
      const service = getService();
      const user = requireUser(request?.user);
      const body = notificationsContracts.updatePreference.body.parse(request?.body ?? {});
      const eventType = request?.params?.eventType as any;
      const data = await service.upsertPreference({
        userId: user.id,
        organizationId: user.organizationId,
        eventType,
        ...body,
      });
      return notificationsContracts.updatePreference.response.parse(ok(data));
    },
  };
}

export type NotificationHandlers = ReturnType<typeof createNotificationHandlers>;
