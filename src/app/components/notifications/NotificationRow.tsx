import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/app/components/ui/utils';
import type { NotificationDto } from '@/services/api/notifications';
import { getNotificationEventLabel, getNotificationSeverityMeta } from '@/app/features/notifications/notificationHelpers';

interface NotificationRowProps {
  notification: NotificationDto;
  onClick?: (notification: NotificationDto) => void;
  compact?: boolean;
}

export function NotificationRow({ notification, onClick, compact = false }: NotificationRowProps) {
  const { icon: Icon, className } = getNotificationSeverityMeta(notification.severity);
  const unread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={cn(
        'w-full rounded-2xl border px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40',
        unread ? 'border-blue-100 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/70',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border', className)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{notification.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{getNotificationEventLabel(notification.eventType)}</p>
            </div>
            <span className="whitespace-nowrap text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className={cn('mt-2 text-sm text-gray-600', compact && 'line-clamp-2')}>
            {notification.body}
          </p>
        </div>
      </div>
    </button>
  );
}
