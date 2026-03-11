import { notificationsContracts } from './contracts';
import type { NotificationHandlers } from './handlers';

export interface NotificationRouteDefinition {
  method: 'GET' | 'POST' | 'PUT';
  url: string;
  handlerName: keyof NotificationHandlers;
  schema: {
    body?: unknown;
    response: unknown;
  };
}

export const notificationRoutes: NotificationRouteDefinition[] = [
  {
    method: 'GET',
    url: notificationsContracts.listInbox.path,
    handlerName: 'listInbox',
    schema: { response: notificationsContracts.listInbox.response },
  },
  {
    method: 'GET',
    url: notificationsContracts.getUnreadCount.path,
    handlerName: 'getUnreadCount',
    schema: { response: notificationsContracts.getUnreadCount.response },
  },
  {
    method: 'POST',
    url: notificationsContracts.markRead.path,
    handlerName: 'markRead',
    schema: { response: notificationsContracts.markRead.response },
  },
  {
    method: 'POST',
    url: notificationsContracts.markAllRead.path,
    handlerName: 'markAllRead',
    schema: { response: notificationsContracts.markAllRead.response },
  },
  {
    method: 'GET',
    url: notificationsContracts.getPreferences.path,
    handlerName: 'getPreferences',
    schema: { response: notificationsContracts.getPreferences.response },
  },
  {
    method: 'PUT',
    url: notificationsContracts.updatePreference.path,
    handlerName: 'updatePreference',
    schema: {
      body: notificationsContracts.updatePreference.body,
      response: notificationsContracts.updatePreference.response,
    },
  },
];
