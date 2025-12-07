import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './notifications.keys';
import * as notificationsApi from './notifications.api';
import { useAuth } from '@/contexts/AuthContext';

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
    onSuccess: () => {
      if (currentUser) {
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
      if (!currentUser) throw new Error('User must be logged in');
      await notificationsApi.markAllNotificationsAsRead(currentUser.id);
    },
    onSuccess: () => {
      if (currentUser) {
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
