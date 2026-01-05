import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateDistance } from './utils.ts';
import { sendPushNotificationsToUsers } from './pushNotifications.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PetRow {
  id: string;
  lat: number | null;
  lng: number | null;
  status: string;
  name: string | null;
  animal_type: string;
  breed: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Validate environment variables
    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'SUPABASE_URL environment variable is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse pet data from request body
    const pet: PetRow = await req.json();

    // Validate pet has location
    if (!pet.lat || !pet.lng) {
      return new Response(
        JSON.stringify({ error: 'Pet must have lat/lng coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get configuration from platform_settings
    const { data: enabledSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'location_alerts_enabled')
      .single();

    const enabled = enabledSetting?.value?.enabled ?? false;
    if (!enabled) {
      return new Response(
        JSON.stringify({ message: 'Location alerts are disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: radiusSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'location_alert_radius')
      .single();

    const radiusKm = radiusSetting?.value?.radius ?? 3;

    // Get rate limit configuration (in minutes, default 60 minutes = 1 hour)
    const { data: rateLimitSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'location_alert_rate_limit_minutes')
      .single();

    const rateLimitMinutes = rateLimitSetting?.value?.minutes ?? 60; // Default: 60 minutes (1 hour)

    // Get all users with location data
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with location data found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter users within radius
    const nearbyUsers = users.filter((user: any) => {
      if (!user.lat || !user.lng) return false;
      const distance = calculateDistance(pet.lat!, pet.lng!, user.lat, user.lng);
      return distance <= radiusKm;
    });

    if (nearbyUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users within radius' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user IDs of nearby users
    const userIds = nearbyUsers.map((u: any) => u.id);

    // Check rate limiting (configurable minutes, default 60 minutes = 1 hour)
    const rateLimitMs = rateLimitMinutes * 60 * 1000;
    const rateLimitAgo = new Date(Date.now() - rateLimitMs).toISOString();
    
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('user_id, created_at')
      .in('user_id', userIds)
      .like('message', '¡Alerta de Proximidad!%')
      .gte('created_at', rateLimitAgo);

    const notifiedUserIds = new Set(recentNotifications?.map((n: any) => n.user_id) || []);

    // Filter users to exclude recently notified users (rate limiting)
    const eligibleUsers = nearbyUsers.filter(
      (u: any) => !notifiedUserIds.has(u.id)
    );

    if (eligibleUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All nearby users were recently notified (rate limited)' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification message
    const petName = pet.name || `${pet.animal_type} ${pet.status.toLowerCase()}`;
    const notificationBody = `Se reportó ${petName} cerca de tu ubicación.`;

    // Create notifications in database for ALL eligible users (not just those with push subscriptions)
    // The existing realtime subscription system will handle push notifications for users who have them
    const notificationInserts = eligibleUsers.map((user: any) => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      message: `¡Alerta de Proximidad! ${notificationBody}`,
      link: { type: 'pet', id: pet.id },
      is_read: false,
    }));

    // Insert all notifications in batch
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationInserts);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      throw notifError;
    }

    // Send push notifications to users with push subscriptions
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    let pushSuccessful = 0;
    let pushFailed = 0;
    
    if (vapidPublicKey && vapidPrivateKey) {
      const userIds = eligibleUsers.map((u: any) => u.id);
      const pushResult = await sendPushNotificationsToUsers(
        userIds,
        {
          title: 'Más Patas: Alerta de Proximidad',
          body: notificationBody,
          link: `#/mascota/${pet.id}`,
        },
        supabase,
        vapidPublicKey,
        vapidPrivateKey
      );
      pushSuccessful = pushResult.successful;
      pushFailed = pushResult.failed;
    } else {
      console.warn('VAPID keys not configured. Push notifications will not be sent from backend.');
      console.warn('Users will only receive notifications if they have the app open (realtime).');
    }

    // Notifications are created in database
    // The existing realtime subscription system (useNotificationsRealtime) will handle
    // sending push notifications to users who have the app open
    const successful = notificationInserts.length;
    const failed = 0;

    return new Response(
      JSON.stringify({
        message: 'Proximity alerts processed',
        sent: successful,
        failed,
        pushNotificationsSent: pushSuccessful,
        pushNotificationsFailed: pushFailed,
        totalNearbyUsers: nearbyUsers.length,
        eligibleUsers: eligibleUsers.length,
        rateLimitedUsers: notifiedUserIds.size,
        vapidConfigured: !!(vapidPublicKey && vapidPrivateKey),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-proximity-alerts:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : JSON.stringify(error);
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

