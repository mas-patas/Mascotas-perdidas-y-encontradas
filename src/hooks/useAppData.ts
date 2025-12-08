
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { USER_ROLES, SUPPORT_TICKET_STATUS } from '../constants';
import type { User, Chat, Report, SupportTicket, Campaign, Notification, BannedIP } from '../types';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/ToastContext';
import {
  useUsers,
  useCampaigns,
  useChats,
  useNotifications,
  useReports,
  useSupportTickets,
  useBannedIps,
  useChatsRealtime,
  useNotificationsRealtime,
  useSupportTicketsRealtime,
  useReportsRealtime,
  useBannedIpsRealtime
} from '@/api';

// Helper to send System Notification
const sendSystemNotification = (title: string, body: string, link?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // If service worker is ready, use it (better for PWA), else fallback to new Notification()
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

export const useAppData = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    // 1. USERS QUERY
    const { data: users = [], isLoading: usersLoading } = useUsers();

    // 2. CAMPAIGNS QUERY
    const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();

    // 3. CHATS QUERY (Only if logged in)
    const { data: chats = [], isLoading: chatsLoading } = useChats(currentUser?.email);

    // 4. NOTIFICATIONS QUERY
    const { data: notifications = [], isLoading: notificationsLoading } = useNotifications(currentUser?.id);

    // 5. ADMIN DATA (Reports & Tickets & BannedIPs)
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    
    const { data: reports = [] } = useReports(isAdmin ? undefined : currentUser?.email);
    const { data: supportTickets = [] } = useSupportTickets(isAdmin ? undefined : currentUser?.email);
    const { data: bannedIps = [] } = useBannedIps();

    // REALTIME SUBSCRIPTIONS - Using dedicated hooks
    useChatsRealtime();
    useNotificationsRealtime(currentUser?.id);
    useSupportTicketsRealtime(currentUser?.email, isAdmin);
    useReportsRealtime();
    useBannedIpsRealtime();

    const loading = usersLoading || campaignsLoading || (!!currentUser && (chatsLoading || notificationsLoading));

    // Helper Setters
    const createSetter = (key: string) => (val: any) => {
        const isGlobal = ['users', 'campaigns', 'bannedIps'].includes(key);
        const queryKey = isGlobal ? [key] : [key, currentUser?.id];

        queryClient.setQueryData(queryKey, (old: any) => {
            const current = old || [];
            if (typeof val === 'function') {
                return val(current);
            }
            return val;
        });
        
        queryClient.invalidateQueries({ queryKey: [key] });
    };

    return {
        users, setUsers: createSetter('users'),
        chats, setChats: createSetter('chats'),
        reports, setReports: createSetter('reports'),
        supportTickets, setSupportTickets: createSetter('supportTickets'),
        campaigns, setCampaigns: createSetter('campaigns'),
        notifications, setNotifications: createSetter('notifications'),
        bannedIps, setBannedIps: createSetter('bannedIps'),
        loading
    };
};
