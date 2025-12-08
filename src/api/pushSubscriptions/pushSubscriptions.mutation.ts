import { useMutation } from '@tanstack/react-query';
import * as pushSubscriptionsApi from './pushSubscriptions.api';
import { useAuth } from '@/contexts/auth';

/**
 * Mutation hook to upsert push subscription
 */
export const useUpsertPushSubscription = () => {
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<pushSubscriptionsApi.PushSubscriptionData, 'userId'>) => {
      if (!currentUser) throw new Error('User must be logged in');

      await pushSubscriptionsApi.upsertPushSubscription({
        ...data,
        userId: currentUser.id
      });
    }
  });
};
