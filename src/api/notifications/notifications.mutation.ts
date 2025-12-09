import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './notifications.keys';
import * as notificationsApi from './notifications.api';
import { useAuth } from '@/contexts/auth';

/**
 * Mutation hook to mark a notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markNotificationAsRead(id);
    },
    onMutate: async (id: string) => {
      if (!currentUser?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications(currentUser.id) });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications(currentUser.id));

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.notifications(currentUser.id), (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((notification: any) => 
          notification.id === id ? { ...notification, isRead: true } : notification
        );
      });

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotifications && currentUser?.id) {
        queryClient.setQueryData(queryKeys.notifications(currentUser.id), context.previousNotifications);
      }
    },
    onSuccess: () => {
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error('User must be logged in');
      await notificationsApi.markAllNotificationsAsRead(currentUser.id);
    },
    onMutate: async () => {
      if (!currentUser?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications(currentUser.id) });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications(currentUser.id));

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.notifications(currentUser.id), (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((notification: any) => ({ ...notification, isRead: true }));
      });

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotifications && currentUser?.id) {
        queryClient.setQueryData(queryKeys.notifications(currentUser.id), context.previousNotifications);
      }
    },
    onSuccess: () => {
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to create a notification
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      userId: string;
      message: string;
      link?: { type: string; id?: string } | string;
    }) => {
      await notificationsApi.createNotification(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(variables.userId) });
    }
  });
};
