
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Chat, Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Helper to send System Notification
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

export const useChats = () => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel('chats-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => queryClient.invalidateQueries({ queryKey: ['chats'] }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => queryClient.invalidateQueries({ queryKey: ['chats'] }))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, queryClient]);

    return useQuery({
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
                } as Chat;
            });
        },
        refetchInterval: 10000 
    });
};

export const useNotifications = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel('notifications-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    if (payload.new.user_id === currentUser.id) {
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
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, queryClient, showToast]);

    return useQuery({
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
            })) as Notification[];
        }
    });
};
