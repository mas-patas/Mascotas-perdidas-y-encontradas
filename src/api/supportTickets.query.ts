import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as supportTicketsApi from './supportTickets.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { SUPPORT_TICKET_STATUS } from '../constants';
import { useToast } from '../contexts/ToastContext';

// Helper function
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
 * Query hook to fetch all support tickets (admin) or tickets by user
 */
export const useSupportTickets = (userEmail?: string) => {
  return useQuery({
    queryKey: queryKeys.supportTickets(userEmail),
    queryFn: () => supportTicketsApi.getSupportTickets(userEmail),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single support ticket by ID
 */
export const useSupportTicket = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.supportTicket(id!),
    queryFn: () => supportTicketsApi.getSupportTicketById(id!),
    enabled: !!id,
  });
};

/**
 * Query hook to fetch pending support tickets count (admin)
 */
export const usePendingSupportTicketsCount = () => {
  return useQuery({
    queryKey: [...queryKeys.supportTickets(), 'pending-count'],
    queryFn: supportTicketsApi.getPendingSupportTicketsCount,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to set up realtime subscriptions for support tickets
 */
export const useSupportTicketsRealtime = (userEmail: string | undefined, isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!userEmail) return;

    const channel = supabase
      .channel('support-tickets-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
        (payload) => {
          if (payload.new.user_email === userEmail) {
            queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets(userEmail) });
            
            let msg = '';
            if (payload.new.status === SUPPORT_TICKET_STATUS.RESOLVED && payload.old.status !== SUPPORT_TICKET_STATUS.RESOLVED) {
              msg = `Tu ticket "${payload.new.subject}" ha sido resuelto.`;
              showToast(msg, 'success');
            } else if (payload.new.status !== payload.old.status) {
              msg = `El estado de tu ticket "${payload.new.subject}" ha cambiado a ${payload.new.status}.`;
              showToast(msg, 'info');
            }
            
            if (msg) {
              sendSystemNotification('Actualización de Soporte', msg, '#/soporte');
            }
          }
          if (isAdmin) {
            queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets() });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, isAdmin, queryClient, showToast]);
};
