
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { USER_ROLES, USER_STATUS, SUPPORT_TICKET_STATUS } from '../constants';
import type { User, Chat, Report, SupportTicket, Campaign, Notification, BannedIP } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Helper to send System Notification
const sendSystemNotification = (title: string, body: string, link?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // If service worker is ready, use it (better for PWA), else fallback to new Notification()
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

export const useAppData = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    // 1. USERS QUERY
    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*');
            if (!data) return [];
            return data.map((p: any) => ({
                id: p.id,
                email: p.email,
                role: p.role || USER_ROLES.USER,
                status: p.status || USER_STATUS.ACTIVE,
                username: p.username,
                firstName: p.first_name,
                lastName: p.last_name,
                phone: p.phone,
                dni: p.dni,
                avatarUrl: p.avatar_url,
                ownedPets: p.owned_pets || [],
                savedPetIds: p.saved_pet_ids || []
            }));
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    // 2. CAMPAIGNS QUERY
    const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
        queryKey: ['campaigns'],
        queryFn: async () => {
            // Fetch ALL campaigns (history included) for Admin purposes.
            // Public views will filter based on date locally.
            const { data } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (!data) return [];
            return data.map((c: any) => ({
                id: c.id,
                userEmail: c.user_email,
                type: c.type,
                title: c.title,
                description: c.description,
                location: c.location,
                date: c.date,
                imageUrls: c.image_urls || [],
                contactPhone: c.contact_phone,
                lat: c.lat,
                lng: c.lng
            }));
        }
    });

    // 3. CHATS QUERY (Only if logged in)
    const { data: chats = [], isLoading: chatsLoading } = useQuery({
        queryKey: ['chats', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            const { data: rawChats } = await supabase.from('chats').select('*').contains('participant_emails', [currentUser!.email]);
            if (!rawChats) return [];

            const chatIds = rawChats.map((c: any) => c.id);
            let rawMessages: any[] = [];
            
            if (chatIds.length > 0) {
                const { data: msgs } = await supabase
                    .from('messages')
                    .select('*')
                    .in('chat_id', chatIds)
                    .order('created_at', { ascending: true });
                rawMessages = msgs || [];
            }

            return rawChats.map((c: any) => {
                const chatMessages = rawMessages
                    .filter((m: any) => m.chat_id === c.id)
                    .map((m: any) => ({
                        senderEmail: m.sender_email,
                        text: m.text,
                        timestamp: m.created_at
                    }));
                
                return {
                    id: c.id,
                    petId: c.pet_id,
                    participantEmails: c.participant_emails,
                    messages: chatMessages,
                    lastReadTimestamps: c.last_read_timestamps || {}
                };
            });
        },
        refetchInterval: 5000 // Polling as fallback/supplement to realtime
    });

    // 4. NOTIFICATIONS QUERY
    const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
        queryKey: ['notifications', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            const { data } = await supabase.from('notifications').select('*').eq('user_id', currentUser!.id).order('created_at', { ascending: false });
            if (!data) return [];
            return data.map((n: any) => ({
                id: n.id,
                userId: n.user_id,
                message: n.message,
                link: n.link,
                isRead: n.is_read,
                timestamp: n.created_at
            }));
        }
    });

    // 5. ADMIN DATA (Reports & Tickets & BannedIPs)
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    
    const { data: reports = [] } = useQuery({
        queryKey: ['reports', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
            if (!isAdmin) {
                query = query.eq('reporter_email', currentUser!.email);
            }
            const { data } = await query;
            if (!data) return [];
            return data.map((r: any) => ({
                id: r.id,
                reporterEmail: r.reporter_email,
                reportedEmail: r.reported_email,
                type: r.type,
                targetId: r.target_id,
                reason: r.reason,
                details: r.details,
                status: r.status,
                timestamp: r.created_at,
                postSnapshot: r.post_snapshot
            }));
        }
    });

    const { data: supportTickets = [] } = useQuery({
        queryKey: ['supportTickets', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
            if (!isAdmin) {
                query = query.eq('user_email', currentUser!.email);
            }
            const { data } = await query;
            if (!data) return [];
            return data.map((t: any) => ({
                id: t.id,
                userEmail: t.user_email,
                category: t.category,
                subject: t.subject,
                description: t.description,
                status: t.status,
                assignedTo: t.assigned_to,
                response: t.response,
                assignmentHistory: t.assignment_history || [],
                timestamp: t.created_at,
                relatedReportId: t.related_report_id 
            }));
        }
    });

    const { data: bannedIps = [] } = useQuery({
        queryKey: ['bannedIps'],
        // Always fetch banned IPs to check against current user, but write actions are protected by RLS
        queryFn: async () => {
            const { data } = await supabase.from('banned_ips').select('*').order('created_at', { ascending: false });
            if (!data) return [];
            return data.map((b: any) => ({
                id: b.id,
                ipAddress: b.ip_address,
                reason: b.reason,
                createdAt: b.created_at
            })) as BannedIP[];
        }
    });

    // REALTIME SUBSCRIPTIONS
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase.channel('global-app-changes-rq')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => queryClient.invalidateQueries({ queryKey: ['chats'] })
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'chats' },
                () => queryClient.invalidateQueries({ queryKey: ['chats'] })
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    if (payload.new.user_id === currentUser.id) {
                        queryClient.setQueryData(['notifications', currentUser.id], (old: any) => {
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
                        
                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
                (payload) => {
                    if (payload.new.user_email === currentUser.email) {
                        queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
                        
                        let msg = '';
                        if (payload.new.status === SUPPORT_TICKET_STATUS.RESOLVED && payload.old.status !== SUPPORT_TICKET_STATUS.RESOLVED) {
                            msg = `Tu ticket "${payload.new.subject}" ha sido resuelto.`;
                            showToast(msg, 'success');
                        } else if (payload.new.status !== payload.old.status) {
                            msg = `El estado de tu ticket "${payload.new.subject}" ha cambiado a ${payload.new.status}.`;
                            showToast(msg, 'info');
                        }
                        
                        if (msg) sendSystemNotification('Actualización de Soporte', msg, '#/soporte');
                    }
                    if (isAdmin) {
                        queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                () => queryClient.invalidateQueries({ queryKey: ['reports'] })
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'banned_ips' },
                () => queryClient.invalidateQueries({ queryKey: ['bannedIps'] })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, queryClient, showToast, isAdmin]);

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
