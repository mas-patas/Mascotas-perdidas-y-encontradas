
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { USER_ROLES, USER_STATUS } from '../constants';
import type { User, Chat, Report, SupportTicket, Campaign, Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useAppData = () => {
    const { currentUser } = useAuth();
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
            const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
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

    // 5. ADMIN DATA (Reports & Tickets)
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
                timestamp: t.created_at
            }));
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
                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                () => queryClient.invalidateQueries({ queryKey: ['reports'] })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, queryClient]);

    const loading = usersLoading || campaignsLoading || (!!currentUser && (chatsLoading || notificationsLoading));

    // Helper Setters
    // This setter manually updates the cache to allow for immediate UI updates (optimistic),
    // solving race conditions where navigation happens before refetch completes.
    const createSetter = (key: string) => (val: any) => {
        const isGlobal = ['users', 'campaigns'].includes(key);
        const queryKey = isGlobal ? [key] : [key, currentUser?.id];

        queryClient.setQueryData(queryKey, (old: any) => {
            // Safety check for old data being undefined/null
            const current = old || [];
            if (typeof val === 'function') {
                return val(current);
            }
            return val;
        });
        
        // Invalidate to ensure consistency with server in background
        queryClient.invalidateQueries({ queryKey: [key] });
    };

    return {
        users, setUsers: createSetter('users'),
        chats, setChats: createSetter('chats'),
        reports, setReports: createSetter('reports'),
        supportTickets, setSupportTickets: createSetter('supportTickets'),
        campaigns, setCampaigns: createSetter('campaigns'),
        notifications, setNotifications: createSetter('notifications'),
        loading
    };
};
