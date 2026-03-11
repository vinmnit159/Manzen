import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService, type PreferenceUpdateDto } from '@/services/api/notifications';
import { QK } from '@/lib/queryKeys';

export function useUnreadNotifications() {
  return useQuery({
    queryKey: QK.notificationsUnreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30_000,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: QK.notificationsPreferences(),
    queryFn: () => notificationsService.getPreferences(),
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventType, body }: { eventType: string; body: PreferenceUpdateDto }) => notificationsService.updatePreference(eventType, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.notificationsRoot() });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.notificationsRoot() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.notificationsRoot() });
    },
  });
}
