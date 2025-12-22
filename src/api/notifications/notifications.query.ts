import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './notifications.keys';
import * as notificationsApi from './notifications.api';
import { transformNotificationRows, transformNotificationRow } from './notifications.transform';
import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../contexts/toast';

/**
 * Helper to send System Notification
 */
const sendSystemNotification = (title: string, body: string, link?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: body,
        icon: 'https://placehold.co/192x192/1D4ED8/ffffff?text=Mas+Patas',
        data: { link }
      });
    });
  } else {
    const n = new Notification(title, {
      body: body,
      icon: 'https://placehold.co/192x192/1D4ED8/ffffff?text=Pets'
    });
    if (link) {
      n.onclick = () => {
        window.focus();
        window.location.href = link;
      };
    }
  }
};

/**
 * Query hook to fetch all notifications for a user
 * Returns transformed notifications with camelCase fields
 */
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.notifications(userId!),
    queryFn: async () => {
      const rows = await notificationsApi.getNotifications(userId!);
      return transformNotificationRows(rows);
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 5000, // Polling cada 5 segundos como fallback/supplement a Realtime
  });
};

/**
 * Query hook to fetch unread notifications count
 */
export const useUnreadNotificationsCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: [...queryKeys.notifications(userId!), 'unread-count'],
    queryFn: () => notificationsApi.getUnreadNotificationsCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Query hook to fetch a single notification by ID
 */
export const useNotification = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.notification(id!),
    queryFn: () => notificationsApi.getNotificationById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to set up realtime subscriptions for notifications
 */
export const useNotificationsRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Use a unique channel name per user to avoid conflicts
    const channelName = `notifications-realtime-${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications'
          // Removed filter - checking user_id in the handler instead
          // filter: `user_id=eq.${userId}` // This filter might not work if Realtime is not properly configured
        },
        (payload) => {
          // With the filter, we can be confident this notification is for this user
          if (payload.new.user_id === userId) {
            queryClient.setQueryData(queryKeys.notifications(userId), (old: any) => {
              const newNotif = transformNotificationRow(payload.new as any);
              return [newNotif, ...(old || [])];
            });
            
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
            showToast(payload.new.message, 'info');
            
            let link = '/';
            if (typeof payload.new.link === 'object') {
              if (payload.new.link.type === 'pet') link = `#/mascota/${payload.new.link.id}`;
              else if (payload.new.link.type === 'campaign') link = `#/campanas/${payload.new.link.id}`;
            } else if (payload.new.link === 'support') {
              link = '#/soporte';
            } else if (payload.new.link === 'messages') {
              link = '#/mensajes';
            }
            
            sendSystemNotification('Más Patas: Nueva Notificación', payload.new.message, link);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ [useNotificationsRealtime] Channel error - check Realtime is enabled in Supabase');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, showToast]);
};
