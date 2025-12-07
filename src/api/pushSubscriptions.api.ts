import { supabase } from '../services/supabaseClient';

export interface PushSubscriptionData {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Upsert push subscription for a user
 */
export const upsertPushSubscription = async (data: PushSubscriptionData): Promise<void> => {
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: data.userId,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
  }, { onConflict: 'endpoint' });

  if (error) throw error;
};
