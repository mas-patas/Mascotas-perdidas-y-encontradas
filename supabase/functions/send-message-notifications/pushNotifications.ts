/**
 * Helper function to send push notifications using web-push
 * This allows notifications to work even when the app is closed
 */

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  link?: string;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // Import web-push dynamically (Deno compatible)
    // @deno-types="https://esm.sh/@types/web-push@3.6.7/index.d.ts"
    const webpush = await import('https://esm.sh/web-push@3.6.7');
    
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'noreply@maspatas.com';
    webpush.setVapidDetails(
      `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return true;
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    // If subscription is invalid (410 Gone), return false (caller should handle cleanup)
    if (error?.statusCode === 410) {
      console.log('Subscription expired (410), will be cleaned up');
    }
    return false;
  }
}

/**
 * Send push notifications to multiple users
 * Returns count of successful and failed sends
 */
export async function sendPushNotificationsToUsers(
  userIds: string[],
  payload: NotificationPayload,
  supabase: any,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ successful: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured. Push notifications will not be sent.');
    return { successful: 0, failed: userIds.length };
  }

  // Get push subscriptions for these users
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .in('user_id', userIds);

  if (error) {
    console.error('Error fetching push subscriptions:', error);
    return { successful: 0, failed: userIds.length };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { successful: 0, failed: 0 };
  }

  let successful = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  // Send to each subscription
  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
      payload,
      vapidPublicKey,
      vapidPrivateKey
    );

    if (success) {
      successful++;
    } else {
      failed++;
      invalidEndpoints.push(sub.endpoint);
    }
  }

  // Clean up invalid subscriptions
  if (invalidEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', invalidEndpoints);
    console.log(`Cleaned up ${invalidEndpoints.length} invalid push subscriptions`);
  }

  return { successful, failed };
}

