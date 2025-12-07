import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as notificationsApi from './notifications.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

/**
 * Helper to send System Notification
 */
const sendSystemNotification = (title: string, body: string, link?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: body,
        icon: 'https://placehold.co/192x192/1D4ED8/ffffff?text=Pets',
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
 */
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.notifications(userId!),
    queryFn: () => notificationsApi.getNotifications(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
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
    if (!userId) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new.user_id === userId) {
            queryClient.setQueryData(queryKeys.notifications(userId), (old: any) => {
              const newNotif = {
                id: payload.new.id,
                userId: payload.new.user_id,
                message: payload.new.message,
                link: payload.new.link,
                isRead: payload.new.is_read,
                timestamp: payload.new.created_at
              };
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
            
            sendSystemNotification('Mascotas: Nueva Notificación', payload.new.message, link);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, showToast]);
};
