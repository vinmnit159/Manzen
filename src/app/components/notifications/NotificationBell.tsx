import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { cn } from '@/app/components/ui/utils';
import { notificationsService } from '@/services/api/notifications';
import { QK } from '@/lib/queryKeys';
import { NotificationPanel } from './NotificationPanel';
import { useUnreadNotifications } from '@/app/features/notifications/useNotifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [previousCount, setPreviousCount] = useState<number | undefined>(undefined);
  const unreadQuery = useUnreadNotifications();
  const inboxQuery = useQuery({
    queryKey: QK.notificationsInbox({ limit: 20, offset: 0 }),
    queryFn: () => notificationsService.listInbox({ limit: 20, offset: 0 }),
    enabled: open,
  });

  const count = unreadQuery.data?.count ?? 0;
  const latestCriticalTitle = useMemo(
    () => inboxQuery.data?.notifications.find((item) => !item.readAt && item.severity === 'critical')?.title,
    [inboxQuery.data],
  );

  useEffect(() => {
    if (previousCount !== undefined && count > previousCount) {
      notificationsService.listInbox({ limit: 5, offset: 0 }).then((result) => {
        const latestCritical = result.notifications.find((item) => !item.readAt && item.severity === 'critical');
        if (latestCritical) {
          toast.error('New critical notification', { description: latestCritical.title });
        }
      }).catch(() => {});
    }
    setPreviousCount(count);
  }, [count, previousCount, latestCriticalTitle]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Notifications">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <Badge className={cn('absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white text-[10px]')}>
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-4">
        <NotificationPanel notifications={inboxQuery.data?.notifications ?? []} isLoading={inboxQuery.isLoading} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
