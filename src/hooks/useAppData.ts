
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { USER_ROLES, USER_STATUS } from '../constants';
import type { User, Chat, Report, SupportTicket, Campaign, Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useAppData = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. FETCH REAL DATA FROM SUPABASE
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // 1. Datos Públicos / Generales
                const { data: profilesData } = await supabase.from('profiles').select('*');
                const { data: campaignsData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });

                // Procesar Usuarios
                let loadedUsers: User[] = [];
                if (profilesData) {
                    loadedUsers = profilesData.map((p: any) => ({
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
                }

                // Procesar Campañas
                let loadedCampaigns: Campaign[] = [];
                if (campaignsData) {
                    loadedCampaigns = campaignsData.map((c: any) => ({
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

                if (!isMounted) return;
                setUsers(loadedUsers);
                setCampaigns(loadedCampaigns);

                // 2. Datos Privados (Solo si hay usuario)
                if (currentUser) {
                    // A. Cargar Chats y Notificaciones
                    const [chatsResponse, notificationsResponse] = await Promise.all([
                        supabase.from('chats').select('*').contains('participant_emails', [currentUser.email]),
                        supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
                    ]);

                    const rawChats = chatsResponse.data || [];
                    const chatIds = rawChats.map((c: any) => c.id);

                    // B. Cargar Mensajes SOLO de los chats encontrados (Optimización Crítica)
                    let rawMessages: any[] = [];
                    if (chatIds.length > 0) {
                        // Dividir en chunks si son muchos chats para evitar error de URL too long (aunque con POST de supabase suele aguantar)
                        const { data: msgs } = await supabase
                            .from('messages')
                            .select('*')
                            .in('chat_id', chatIds)
                            .order('created_at', { ascending: true });
                        rawMessages = msgs || [];
                    }

                    // Procesar Chats con sus mensajes
                    const mappedChats: Chat[] = rawChats.map((c: any) => {
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

                    // Procesar Notificaciones
                    const mappedNotifications: Notification[] = (notificationsResponse.data || []).map((n: any) => ({
                        id: n.id,
                        userId: n.user_id,
                        message: n.message,
                        link: n.link,
                        isRead: n.is_read,
                        timestamp: n.created_at
                    }));

                    if (isMounted) {
                        setChats(mappedChats);
                        setNotifications(mappedNotifications);
                    }

                    // C. Datos Admin (Carga diferida si es necesario, pero aqui lo hacemos directo por simplicidad)
                    if (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.SUPERADMIN) {
                        const [reportsRes, ticketsRes] = await Promise.all([
                            supabase.from('reports').select('*').order('created_at', { ascending: false }),
                            supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
                        ]);
                        
                        if (isMounted) {
                            setReports((reportsRes.data || []).map((r: any) => ({
                                id: r.id,
                                reporterEmail: r.reporter_email,
                                reportedEmail: r.reported_email,
                                type: r.type as any,
                                targetId: r.target_id,
                                reason: r.reason,
                                details: r.details,
                                status: r.status,
                                timestamp: r.created_at,
                                postSnapshot: r.post_snapshot
                            })));
                            
                            setSupportTickets((ticketsRes.data || []).map((t: any) => ({
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
                            })));
                        }
                    } else {
                        // Usuario normal: solo sus reportes/tickets
                        const [reportsRes, ticketsRes] = await Promise.all([
                            supabase.from('reports').select('*').eq('reporter_email', currentUser.email).order('created_at', { ascending: false }),
                            supabase.from('support_tickets').select('*').eq('user_email', currentUser.email).order('created_at', { ascending: false })
                        ]);
                        
                        if (isMounted) {
                            setReports((reportsRes.data || []).map((r: any) => ({
                                id: r.id,
                                reporterEmail: r.reporter_email,
                                reportedEmail: r.reported_email,
                                type: r.type as any,
                                targetId: r.target_id,
                                reason: r.reason,
                                details: r.details,
                                status: r.status,
                                timestamp: r.created_at,
                                postSnapshot: r.post_snapshot
                            })));
                            
                            setSupportTickets((ticketsRes.data || []).map((t: any) => ({
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
                            })));
                        }
                    }
                }

            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [currentUser]); 

    // 2. REALTIME SUBSCRIPTIONS
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase.channel('global-app-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as any;
                    // Optimización: Solo actualizar si el mensaje pertenece a un chat que tenemos cargado
                    // Esto evita procesar mensajes de otros usuarios si el filtro de supabase fallara
                    setChats(prev => {
                        const chatExists = prev.some(c => c.id === newMsg.chat_id);
                        if (!chatExists) return prev;

                        return prev.map(chat => {
                            if (chat.id === newMsg.chat_id) {
                                // Evitar duplicados
                                if (chat.messages.some(m => m.timestamp === newMsg.created_at && m.senderEmail === newMsg.sender_email && m.text === newMsg.text)) {
                                    return chat;
                                }
                                return {
                                    ...chat,
                                    messages: [...chat.messages, {
                                        senderEmail: newMsg.sender_email,
                                        text: newMsg.text,
                                        timestamp: newMsg.created_at
                                    }]
                                };
                            }
                            return chat;
                        });
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'chats' }, // Escuchar UPDATE también para last_read
                (payload) => {
                    const newChat = payload.new as any;
                    
                    if (payload.eventType === 'INSERT') {
                        if (newChat.participant_emails && newChat.participant_emails.includes(currentUser.email)) {
                            setChats(prev => {
                                if(prev.find(c => c.id === newChat.id)) return prev;
                                return [...prev, {
                                    id: newChat.id,
                                    petId: newChat.pet_id,
                                    participantEmails: newChat.participant_emails,
                                    messages: [],
                                    lastReadTimestamps: newChat.last_read_timestamps || {}
                                }];
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                         setChats(prev => prev.map(c => {
                             if (c.id === newChat.id) {
                                 return { ...c, lastReadTimestamps: newChat.last_read_timestamps || {} };
                             }
                             return c;
                         }));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as any;
                    if (newNotif.user_id === currentUser.id) {
                        setNotifications(prev => {
                            if(prev.find(n => n.id === newNotif.id)) return prev;
                            const mappedNotif: Notification = {
                                id: newNotif.id,
                                userId: newNotif.user_id,
                                message: newNotif.message,
                                link: newNotif.link,
                                isRead: newNotif.is_read,
                                timestamp: newNotif.created_at
                            };
                            return [mappedNotif, ...prev];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    return {
        users, setUsers,
        chats, setChats,
        reports, setReports,
        supportTickets, setSupportTickets,
        campaigns, setCampaigns,
        notifications, setNotifications,
        loading
    };
};
