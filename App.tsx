import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { PetList } from './components/PetList';
import { ReportPetForm } from './components/ReportPetForm';
import { PetDetailPage } from './components/PetDetailPage';
import type { Pet, PetStatus, AnimalType, PetSize, Chat, Message, User, UserRole, PotentialMatch, UserStatus, OwnedPet, Report, ReportReason, ReportType, ReportStatus as ReportStatusType, ReportPostSnapshot, SupportTicket, SupportTicketStatus, SupportTicketCategory, Notification, Campaign, Comment } from './types';
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, CAMPAIGN_TYPES } from './constants';
import { useAuth } from './contexts/AuthContext';
import ProfilePage from './components/ProfilePage';
import { FilterControls } from './components/FilterControls';
import MessagesPage from './components/MessagesPage';
import ChatPage from './components/ChatPage';
import AdminDashboard from './components/AdminDashboard';
import { findMatchingPets } from './services/geminiService';
import { PotentialMatchesModal } from './components/PotentialMatchesModal';
import { FlyerModal } from './components/FlyerModal';
import { ReportAdoptionForm } from './components/ReportAdoptionForm';
import AdminUserDetailModal from './components/AdminUserDetailModal';
import SupportPage from './components/SupportPage';
import CampaignsPage from './components/CampaignsPage';
import CampaignDetailPage from './components/CampaignDetailPage';
import MapPage from './components/MapPage';
import { supabase } from './services/supabaseClient';
import { generateUUID } from './utils/uuid';

const App: React.FC = () => {
    const { currentUser, isGhosting, stopGhosting, ghostLogin } = useAuth();
    const [pets, setPets] = useState<Pet[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [currentView, setCurrentView] = useState('list');
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    
    const [filters, setFilters] = useState<{
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        color1: string;
        color2: string;
        size: PetSize | 'Todos';
    }>({
        status: 'Todos',
        type: 'Todos',
        breed: 'Todos',
        color1: 'Todos',
        color2: 'Todos',
        size: 'Todos'
    });

    const [reportStatus, setReportStatus] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
    const [pendingPetToSubmit, setPendingPetToSubmit] = useState<Omit<Pet, 'id' | 'userEmail'> | null>(null);
    
    // Admin Settings
    const [isAiSearchEnabled, setIsAiSearchEnabled] = useState(true);

    // 1. FETCH REAL DATA FROM SUPABASE
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel
                const [
                    profilesRes,
                    petsRes,
                    chatsRes,
                    messagesRes,
                    reportsRes,
                    ticketsRes,
                    campaignsRes,
                    notificationsRes,
                    commentsRes
                ] = await Promise.all([
                    supabase.from('profiles').select('*'),
                    supabase.from('pets').select('*').order('created_at', { ascending: false }),
                    supabase.from('chats').select('*'),
                    supabase.from('messages').select('*').order('created_at', { ascending: true }),
                    supabase.from('reports').select('*').order('created_at', { ascending: false }),
                    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
                    supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
                    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
                    supabase.from('comments').select('*').order('created_at', { ascending: true })
                ]);

                // A. Process Profiles
                let loadedUsers: User[] = [];
                if (profilesRes.data) {
                    loadedUsers = profilesRes.data.map(p => ({
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
                    setUsers(loadedUsers);
                }

                // B. Process Pets & Comments
                if (petsRes.data) {
                    const loadedComments = commentsRes.data || [];
                    const mappedPets: Pet[] = petsRes.data.map(p => {
                        // Manual Join for User Email using profiles loaded above
                        const owner = loadedUsers.find(u => u.id === p.user_id);
                        // Manual Join for Comments
                        const petComments = loadedComments
                            .filter(c => c.pet_id === p.id)
                            .map(c => ({
                                id: c.id,
                                userEmail: c.user_email,
                                userName: c.user_name,
                                text: c.text,
                                timestamp: c.created_at
                            }));

                        return {
                            id: p.id,
                            userEmail: owner?.email || 'unknown',
                            status: p.status,
                            name: p.name,
                            animalType: p.animal_type,
                            breed: p.breed,
                            color: p.color,
                            size: p.size,
                            location: p.location,
                            date: p.date,
                            contact: p.contact,
                            description: p.description,
                            imageUrls: p.image_urls || [],
                            adoptionRequirements: p.adoption_requirements,
                            shareContactInfo: p.share_contact_info,
                            contactRequests: p.contact_requests || [],
                            lat: p.lat,
                            lng: p.lng,
                            comments: petComments
                        };
                    });
                    setPets(mappedPets);
                }

                // C. Process Chats & Messages
                if (chatsRes.data) {
                    const loadedMessages = messagesRes.data || [];
                    const mappedChats: Chat[] = chatsRes.data.map(c => {
                        const chatMessages = loadedMessages
                            .filter(m => m.chat_id === c.id)
                            .map(m => ({
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
                    setChats(mappedChats);
                }

                // D. Process Other Tables
                if (reportsRes.data) {
                    setReports(reportsRes.data.map(r => ({
                        id: r.id,
                        reporterEmail: r.reporter_email,
                        reportedEmail: r.reported_email,
                        type: r.type as ReportType,
                        targetId: r.target_id,
                        reason: r.reason,
                        details: r.details,
                        status: r.status,
                        timestamp: r.created_at,
                        postSnapshot: r.post_snapshot
                    })));
                }

                if (ticketsRes.data) {
                    setSupportTickets(ticketsRes.data.map(t => ({
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

                if (campaignsRes.data) {
                    setCampaigns(campaignsRes.data.map(c => ({
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
                    })));
                }

                if (notificationsRes.data) {
                    setNotifications(notificationsRes.data.map(n => ({
                        id: n.id,
                        userId: n.user_id,
                        message: n.message,
                        link: n.link,
                        isRead: n.is_read,
                        timestamp: n.created_at
                    })));
                }

            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchData();
    }, []);


    // Routing Logic
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            if (hash.startsWith('/mascota/')) {
                const petId = hash.split('/')[2];
                const pet = pets.find(p => p.id === petId);
                if (pet) {
                    setSelectedPet(pet);
                    setCurrentView('detail');
                } else {
                    window.location.hash = '/';
                }
            } else if (hash.startsWith('/campanas/')) {
                const campId = hash.split('/')[2];
                const camp = campaigns.find(c => c.id === campId);
                if (camp) {
                    setSelectedCampaign(camp);
                    setCurrentView('campaign_detail');
                } else {
                     window.location.hash = '/campanas';
                }
            } else if (hash === '/perfil') {
                setCurrentView('profile');
            } else if (hash === '/mensajes') {
                setCurrentView('messages');
            } else if (hash === '/admin') {
                setCurrentView('admin');
            } else if (hash === '/soporte') {
                setCurrentView('support');
            } else if (hash === '/campanas') {
                setCurrentView('campaigns');
            } else if (hash === '/mapa') {
                setCurrentView('map');
            } else {
                setCurrentView('list');
                setSelectedPet(null);
                setSelectedCampaign(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial check

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [pets, campaigns]);

    const handleNavigate = (path: string) => {
        window.location.hash = path;
    };

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            if (filters.status !== 'Todos' && pet.status !== filters.status) return false;
            if (filters.type !== 'Todos' && pet.animalType !== filters.type) return false;
            if (filters.breed !== 'Todos' && pet.breed !== filters.breed) return false;
            if (filters.size !== 'Todos' && pet.size !== filters.size) return false;
            if (filters.color1 !== 'Todos' && !pet.color.includes(filters.color1)) return false;
            if (filters.color2 !== 'Todos' && !pet.color.includes(filters.color2)) return false;
            return true;
        });
    }, [pets, filters]);

    const handleReportPet = (status: PetStatus) => {
        if (!currentUser) {
            handleNavigate('/login');
            return;
        }
        setReportStatus(status);
        setIsReportModalOpen(true);
    };

    const handleSubmitPet = async (petData: Omit<Pet, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (idToUpdate) {
             // Update in Supabase
             try {
                const { error } = await supabase.from('pets').update({
                    status: petData.status,
                    name: petData.name,
                    animal_type: petData.animalType,
                    breed: petData.breed,
                    color: petData.color,
                    size: petData.size,
                    location: petData.location,
                    date: petData.date,
                    contact: petData.contact,
                    description: petData.description,
                    image_urls: petData.imageUrls,
                    adoption_requirements: petData.adoptionRequirements,
                    share_contact_info: petData.shareContactInfo,
                    lat: petData.lat,
                    lng: petData.lng
                }).eq('id', idToUpdate);

                if (error) throw error;

                setPets(prev => prev.map(p => p.id === idToUpdate ? { ...p, ...petData } : p));
                setIsReportModalOpen(false);
             } catch (err: any) {
                 alert('Error al actualizar: ' + err.message);
             }
            return;
        }

        if (isAiSearchEnabled && petData.status === PET_STATUS.PERDIDO) {
            const candidates = pets.filter(p => p.status === PET_STATUS.ENCONTRADO || p.status === PET_STATUS.AVISTADO);
            if (candidates.length > 0) {
                 const matches = await findMatchingPets(petData, candidates);
                 if (matches.length > 0) {
                     setPotentialMatches(matches);
                     setPendingPetToSubmit(petData);
                     setIsReportModalOpen(false);
                     setIsMatchModalOpen(true);
                     return;
                 }
            }
        }
        
        finalizePetSubmission(petData);
    };

    const finalizePetSubmission = async (petData: Omit<Pet, 'id' | 'userEmail'>) => {
        if (!currentUser) return;

        try {
            const newPetId = generateUUID();
            const now = new Date().toISOString();

            // Insert into Supabase with explicit ID and timestamp
            const { error } = await supabase.from('pets').insert({
                id: newPetId,
                user_id: currentUser.id,
                status: petData.status,
                name: petData.name,
                animal_type: petData.animalType,
                breed: petData.breed,
                color: petData.color,
                size: petData.size,
                location: petData.location,
                date: petData.date,
                contact: petData.contact,
                description: petData.description,
                image_urls: petData.imageUrls,
                adoption_requirements: petData.adoptionRequirements,
                share_contact_info: petData.shareContactInfo,
                contact_requests: [],
                lat: petData.lat,
                lng: petData.lng,
                created_at: now
            });

            if (error) throw error;

            const newPet: Pet = {
                id: newPetId,
                userEmail: currentUser.email,
                status: petData.status,
                name: petData.name,
                animalType: petData.animalType,
                breed: petData.breed,
                color: petData.color,
                size: petData.size,
                location: petData.location,
                date: petData.date,
                contact: petData.contact,
                description: petData.description,
                imageUrls: petData.imageUrls || [],
                adoptionRequirements: petData.adoptionRequirements,
                shareContactInfo: petData.shareContactInfo,
                contactRequests: [],
                lat: petData.lat,
                lng: petData.lng,
                comments: []
            };
            setPets(prev => [newPet, ...prev]);

            setIsReportModalOpen(false);
            setIsAdoptionModalOpen(false);
            setIsMatchModalOpen(false);
            setPendingPetToSubmit(null);

        } catch (err: any) {
            console.error("Error creating pet:", err);
            const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos: La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en el SQL Editor de Supabase.");
            } else {
                alert("Error al publicar la mascota: " + msg);
            }
        }
    };

    const handleDeletePet = async (petId: string) => {
        try {
            const { error } = await supabase.from('pets').delete().eq('id', petId);
            if (error) throw error;
            
            setPets(prev => prev.filter(p => p.id !== petId));
            if (selectedPet?.id === petId) {
                handleNavigate('/');
            }
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };
    
    const handleUpdatePetStatus = async (petId: string, status: PetStatus) => {
        try {
            const { error } = await supabase.from('pets').update({ status }).eq('id', petId);
            if (error) throw error;
            setPets(prev => prev.map(p => p.id === petId ? { ...p, status } : p));
        } catch (err: any) {
            alert("Error al actualizar estado: " + err.message);
        }
    };

    // Admin: Update User Status in DB
    const handleUpdateUserStatus = async (email: string, status: UserStatus) => {
        try {
            const { error } = await supabase.from('profiles').update({ status }).eq('email', email);
            if (error) throw error;
            
            setUsers(prev => prev.map(u => u.email === email ? { ...u, status } : u));
        } catch (err: any) {
            console.error("Error updating status:", err);
            alert("Error al actualizar estado. Asegúrate de tener permisos de Superadmin. " + err.message);
        }
    };

    // Admin: Update User Role in DB
    const handleUpdateUserRole = async (email: string, role: UserRole) => {
        try {
            const { error } = await supabase.from('profiles').update({ role }).eq('email', email);
            if (error) throw error;

            setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u));
        } catch (err: any) {
            console.error("Error updating role:", err);
            alert("Error al actualizar rol. Asegúrate de tener permisos de Superadmin. " + err.message);
        }
    };

    const handleStartChat = async (pet: Pet) => {
        if (!currentUser) {
            handleNavigate('/login');
            return;
        }
        
        if (!pet.userEmail || pet.userEmail === 'unknown') {
            alert("No se puede contactar al dueño de esta mascota porque su información no está disponible.");
            return;
        }

        // Check if chat exists in local state
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        
        if (existingChat) {
            setSelectedChatId(existingChat.id);
            setCurrentView('chat');
        } else {
            // Create new chat in DB
            try {
                const participants = [currentUser.email, pet.userEmail];
                const newChatId = generateUUID();
                const now = new Date().toISOString();
                const timestamps = {
                    [currentUser.email]: now,
                    [pet.userEmail]: new Date(0).toISOString() 
                };
                
                const { error } = await supabase.from('chats').insert({
                    id: newChatId,
                    pet_id: pet.id,
                    participant_emails: participants,
                    last_read_timestamps: timestamps,
                    created_at: now
                });

                if (error) throw error;

                const newChat: Chat = {
                    id: newChatId,
                    petId: pet.id,
                    participantEmails: participants,
                    messages: [],
                    lastReadTimestamps: timestamps
                };
                setChats(prev => [...prev, newChat]);
                setSelectedChatId(newChatId);
                setCurrentView('chat');
                
            } catch (err: any) {
                console.error("Error starting chat:", err);
                const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
                if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                    alert("Error de base de datos: La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en el SQL Editor de Supabase.");
                } else {
                    alert("Error al iniciar el chat: " + msg);
                }
            }
        }
    };

    const handleSendMessage = async (chatId: string, text: string) => {
        if (!currentUser) return;
        
        try {
            const newMessageId = generateUUID();
            const now = new Date().toISOString();

            // Insert Message with manual ID and timestamp
            const { error: msgError } = await supabase.from('messages').insert({
                id: newMessageId,
                chat_id: chatId,
                sender_email: currentUser.email,
                text: text,
                created_at: now
            });

            if (msgError) throw msgError;

            // Update Chat Last Read
            const chat = chats.find(c => c.id === chatId);
            const newTimestamps = { ...chat?.lastReadTimestamps, [currentUser.email]: now };

            await supabase.from('chats').update({
                last_read_timestamps: newTimestamps
            }).eq('id', chatId);

            const newMessage: Message = {
                senderEmail: currentUser.email,
                text: text,
                timestamp: now
            };
            
            setChats(prev => prev.map(c => {
                if (c.id === chatId) {
                    return {
                        ...c,
                        messages: [...c.messages, newMessage],
                        lastReadTimestamps: newTimestamps
                    };
                }
                return c;
            }));
            
            // Notify recipient
            if (chat) {
                const recipientEmail = chat.participantEmails.find(e => e !== currentUser.email);
                if (recipientEmail) {
                    const newNotifId = generateUUID();
                    supabase.from('notifications').insert({
                        id: newNotifId,
                        user_id: recipientEmail,
                        message: `Nuevo mensaje de ${currentUser.username || 'un usuario'}`,
                        link: 'messages',
                        is_read: false,
                        created_at: now
                    }).then(() => {}); // fire and forget
                }
            }

        } catch (err: any) {
            console.error("Error sending message:", err);
            const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos: La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en el SQL Editor de Supabase.");
            } else {
                alert("Error al enviar el mensaje: " + msg);
            }
        }
    };
    
    const handleMarkChatAsRead = async (chatId: string) => {
        if (!currentUser) return;
        
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const newTimestamps = {
            ...chat.lastReadTimestamps,
            [currentUser.email]: new Date().toISOString()
        };

        try {
            await supabase.from('chats').update({
                last_read_timestamps: newTimestamps
            }).eq('id', chatId);

            setChats(prev => prev.map(c => {
                 if (c.id === chatId) {
                     return { ...c, lastReadTimestamps: newTimestamps };
                 }
                 return c;
            }));
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };
    
    const handleReport = async (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
        
        try {
            const reportedEmail = type === 'user' ? targetId : (pets.find(p => p.id === targetId)?.userEmail || '');
            const postSnapshot = type === 'post' ? pets.find(p => p.id === targetId) : undefined;
            
            const newReportId = generateUUID();
            const now = new Date().toISOString();

            const { error } = await supabase.from('reports').insert({
                id: newReportId,
                reporter_email: currentUser.email,
                reported_email: reportedEmail,
                type,
                target_id: targetId,
                reason,
                details,
                status: REPORT_STATUS.PENDING,
                post_snapshot: postSnapshot,
                created_at: now
            });

            if (error) throw error;

            const newReport: Report = {
                id: newReportId,
                reporterEmail: currentUser.email,
                reportedEmail: reportedEmail,
                type: type as ReportType,
                targetId: targetId,
                reason: reason,
                details: details,
                timestamp: now,
                status: REPORT_STATUS.PENDING,
                postSnapshot: postSnapshot
            };
            setReports(prev => [newReport, ...prev]);
            alert('Reporte enviado exitosamente.');
        } catch (err: any) {
            console.error("Error sending report:", err);
            const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos: La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en el SQL Editor de Supabase.");
            } else {
                alert("Error al enviar reporte: " + msg);
            }
        }
    };

    const handleUpdateReportStatus = async (reportId: string, status: ReportStatusType) => {
        try {
            const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
            if (error) throw error;
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
        } catch (err: any) {
            alert("Error actualizando reporte: " + err.message);
        }
    };

    const handleAddSupportTicket = async (category: SupportTicketCategory, subject: string, description: string) => {
        if (!currentUser) return;
        try {
            const newTicketId = generateUUID();
            const now = new Date().toISOString();
            
            const { error } = await supabase.from('support_tickets').insert({
                id: newTicketId,
                user_email: currentUser.email,
                category,
                subject,
                description,
                status: SUPPORT_TICKET_STATUS.PENDING,
                created_at: now
            });

            if (error) throw error;

            const newTicket: SupportTicket = {
                id: newTicketId,
                userEmail: currentUser.email,
                category: category,
                subject: subject,
                description: description,
                timestamp: now,
                status: SUPPORT_TICKET_STATUS.PENDING,
            };
            setSupportTickets(prev => [newTicket, ...prev]);
        } catch (err: any) {
            console.error("Error adding ticket:", err);
            const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos: La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en el SQL Editor de Supabase.");
            } else {
                alert("Error al crear ticket: " + msg);
            }
        }
    };
    
    const handleUpdateSupportTicket = async (updatedTicket: SupportTicket) => {
        try {
            const { error } = await supabase.from('support_tickets').update({
                status: updatedTicket.status,
                response: updatedTicket.response,
                assigned_to: updatedTicket.assignedTo,
                assignment_history: updatedTicket.assignmentHistory
            }).eq('id', updatedTicket.id);

            if (error) throw error;

            setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
            
            // Notify user
            const originalTicket = supportTickets.find(t => t.id === updatedTicket.id);
            if (originalTicket && (originalTicket.status !== updatedTicket.status || (!originalTicket.response && updatedTicket.response))) {
                 const newNotifId = generateUUID();
                 await supabase.from('notifications').insert({
                    id: newNotifId,
                    user_id: updatedTicket.userEmail,
                    message: `Tu ticket "${updatedTicket.subject}" ha sido actualizado a: ${updatedTicket.status}`,
                    link: 'support',
                    is_read: false,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err: any) {
            alert("Error actualizando ticket: " + err.message);
        }
    };

    const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (!currentUser) return;
        
        try {
            if (idToUpdate) {
                const { error } = await supabase.from('campaigns').update({
                    title: campaignData.title,
                    description: campaignData.description,
                    type: campaignData.type,
                    location: campaignData.location,
                    date: campaignData.date,
                    image_urls: campaignData.imageUrls,
                    contact_phone: campaignData.contactPhone,
                    lat: campaignData.lat,
                    lng: campaignData.lng
                }).eq('id', idToUpdate);

                if (error) throw error;
                setCampaigns(prev => prev.map(c => c.id === idToUpdate ? { ...c, ...campaignData } : c));
            } else {
                const newCampaignId = generateUUID();
                const now = new Date().toISOString();
                
                const { error } = await supabase.from('campaigns').insert({
                    id: newCampaignId,
                    user_email: currentUser.email,
                    title: campaignData.title,
                    description: campaignData.description,
                    type: campaignData.type,
                    location: campaignData.location,
                    date: campaignData.date,
                    image_urls: campaignData.imageUrls,
                    contact_phone: campaignData.contactPhone,
                    lat: campaignData.lat,
                    lng: campaignData.lng,
                    created_at: now
                });

                if (error) throw error;

                const newCampaign: Campaign = {
                    id: newCampaignId,
                    userEmail: currentUser.email,
                    type: campaignData.type,
                    title: campaignData.title,
                    description: campaignData.description,
                    location: campaignData.location,
                    date: campaignData.date,
                    imageUrls: campaignData.imageUrls || [],
                    contactPhone: campaignData.contactPhone,
                    lat: campaignData.lat,
                    lng: campaignData.lng
                };
                setCampaigns(prev => [newCampaign, ...prev]);
            }
        } catch (err: any) {
            console.error("Error saving campaign:", err);
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos: La estructura de la tabla ha cambiado. Por favor, ejecuta 'NOTIFY pgrst, \"reload schema\";' en el Editor SQL de Supabase.");
            } else {
                alert("Error al guardar campaña: " + (err.message || JSON.stringify(err)));
            }
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        try {
            const { error } = await supabase.from('campaigns').delete().eq('id', id);
            if (error) throw error;
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert("Error al eliminar campaña: " + err.message);
        }
    };

    const handleViewUser = (user: User) => {
        setSelectedUserProfile(user);
        setIsUserDetailModalOpen(true);
    };

    // Notifications Logic
    const myNotifications = useMemo(() => {
        if (!currentUser) return [];
        return notifications.filter(n => n.userId === currentUser.email);
    }, [notifications, currentUser]);

    const handleMarkNotificationAsRead = async (id: string) => {
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Error reading notification:", err);
        }
    };

    const handleMarkAllNotificationsAsRead = async () => {
        if (!currentUser) return;
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.email);
            setNotifications(prev => prev.map(n => n.userId === currentUser.email ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Error reading all notifications:", err);
        }
    };
    
    const handleRecordContactRequest = async (petId: string) => {
        if (!currentUser) return;
        
        const pet = pets.find(p => p.id === petId);
        if (!pet) return;
        
        const currentRequests = pet.contactRequests || [];
        if (currentRequests.includes(currentUser.email)) return;

        const updatedRequests = [...currentRequests, currentUser.email];

        try {
            const { error } = await supabase.from('pets').update({
                contact_requests: updatedRequests
            }).eq('id', petId);

            if (error) throw error;

            setPets(prev => prev.map(p => p.id === petId ? { ...p, contactRequests: updatedRequests } : p));

            // Notify owner
            const newNotifId = generateUUID();
            await supabase.from('notifications').insert({
                id: newNotifId,
                user_id: pet.userEmail,
                message: `${currentUser.username || 'Un usuario'} ha visto tu información de contacto para ${pet.name}`,
                link: { type: 'pet', id: pet.id },
                is_read: false,
                created_at: new Date().toISOString()
            });

        } catch (err: any) {
            console.error("Error recording contact request:", err);
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos (Contacto): La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en Supabase.");
            }
        }
    };

    const handleAddComment = async (petId: string, text: string) => {
        if (!currentUser) return;
        
        try {
            const newCommentId = generateUUID();
            const now = new Date().toISOString();
            
            const { error } = await supabase.from('comments').insert({
                id: newCommentId,
                pet_id: petId,
                user_email: currentUser.email,
                user_name: currentUser.username || 'Usuario',
                text: text,
                created_at: now
            });

            if (error) throw error;

            const newComment: Comment = {
                id: newCommentId,
                userEmail: currentUser.email,
                userName: currentUser.username || 'Usuario',
                text: text,
                timestamp: now
            };

            setPets(prev => prev.map(p => {
                if (p.id === petId) {
                    return { ...p, comments: [...(p.comments || []), newComment] };
                }
                return p;
            }));
            
            const pet = pets.find(p => p.id === petId);
            if (pet && pet.userEmail !== currentUser.email) {
                 const newNotifId = generateUUID();
                 await supabase.from('notifications').insert({
                    id: newNotifId,
                    user_id: pet.userEmail,
                    message: `${currentUser.username || 'Un usuario'} comentó en tu publicación de ${pet.name}`,
                    link: { type: 'pet', id: pet.id },
                    is_read: false,
                    created_at: now
                });
            }

        } catch (err: any) {
            console.error("Error adding comment:", err);
            const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            if (err.code === 'PGRST204' || (err.message && err.message.includes('schema cache'))) {
                alert("Error de base de datos: La estructura de la tabla ha cambiado. Ejecuta 'NOTIFY pgrst, \"reload schema\";' en el SQL Editor de Supabase.");
            } else {
                alert("Error al agregar comentario: " + msg);
            }
        }
    };

    const activeChat = chats.find(c => c.id === selectedChatId);
    const activeChatPet = activeChat ? pets.find(p => p.id === activeChat.petId) : undefined;
    const hasUnreadMessages = currentUser ? chats.some(c => {
        if (!c.participantEmails.includes(currentUser.email)) return false;
        const lastMsg = c.messages[c.messages.length - 1];
        if (!lastMsg || lastMsg.senderEmail === currentUser.email) return false;
        const lastRead = c.lastReadTimestamps[currentUser.email] || new Date(0).toISOString();
        return new Date(lastMsg.timestamp) > new Date(lastRead);
    }) : false;

    return (
        <div className="min-h-screen bg-brand-light flex flex-col font-sans">
            {isGhosting && (
                 <div className="bg-yellow-400 text-yellow-900 text-center py-1 px-4 text-sm font-bold flex justify-between items-center">
                    <span>Modo Fantasma: Actuando como {currentUser?.email}</span>
                    <button onClick={stopGhosting} className="bg-white bg-opacity-50 hover:bg-opacity-75 rounded px-2 py-0.5 text-xs">Salir</button>
                </div>
            )}
            
            <Header 
                currentPage={currentView as any}
                onReportPet={handleReportPet} 
                onOpenAdoptionModal={() => setIsAdoptionModalOpen(true)}
                onNavigate={handleNavigate}
                onHome={() => { handleNavigate('/'); setFilters({ status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos' }); }}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                hasUnreadMessages={hasUnreadMessages}
                notifications={myNotifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                <FilterControls 
                    filters={filters} 
                    setFilters={setFilters} 
                    isSidebarOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)}
                    currentPage={currentView as any}
                    onNavigateToHome={() => handleNavigate('/')}
                    onNavigateToProfile={() => handleNavigate('/perfil')}
                    onNavigateToMessages={() => handleNavigate('/mensajes')}
                    onNavigateToAdmin={() => handleNavigate('/admin')}
                    onNavigateToCampaigns={() => handleNavigate('/campanas')}
                    onNavigateToMap={() => handleNavigate('/mapa')}
                    onClearFilters={() => setFilters({ status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos' })}
                />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                    {currentView === 'list' && (
                        <PetList 
                            pets={filteredPets} 
                            users={users} 
                            onViewUser={handleViewUser} 
                            filters={filters}
                            onNavigate={handleNavigate}
                            onSelectStatus={(status) => setFilters(prev => ({ ...prev, status }))}
                            onReset={() => { setFilters({ status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos' }); handleNavigate('/'); }}
                        />
                    )}
                    
                    {currentView === 'detail' && selectedPet && (
                        <PetDetailPage 
                            pet={selectedPet} 
                            onClose={() => handleNavigate('/')}
                            onStartChat={handleStartChat}
                            onEdit={(pet) => { setReportStatus(pet.status); setIsReportModalOpen(true); }}
                            onDelete={handleDeletePet}
                            onGenerateFlyer={(pet) => setIsFlyerModalOpen(true)}
                            onUpdateStatus={(petId, status) => setPets(prev => prev.map(p => p.id === petId ? { ...p, status } : p))}
                            users={users}
                            onViewUser={handleViewUser}
                            onReport={handleReport}
                            onRecordContactRequest={handleRecordContactRequest}
                            onAddComment={handleAddComment}
                        />
                    )}

                    {currentView === 'profile' && currentUser && (
                        <ProfilePage 
                            user={currentUser} 
                            reportedPets={pets.filter(p => p.userEmail === currentUser.email)}
                            allPets={pets}
                            users={users}
                            onBack={() => handleNavigate('/')}
                            onReportOwnedPetAsLost={(ownedPet) => {
                                setReportStatus(PET_STATUS.PERDIDO);
                                setIsReportModalOpen(true);
                            }}
                            onNavigate={handleNavigate}
                            onViewUser={handleViewUser}
                        />
                    )}
                    
                    {currentView === 'messages' && currentUser && (
                        <MessagesPage
                            chats={chats
                                .filter(c => c.participantEmails.includes(currentUser.email))
                                .map(c => {
                                    const lastMsg = c.messages[c.messages.length - 1];
                                    const isUnread = lastMsg && lastMsg.senderEmail !== currentUser.email && new Date(lastMsg.timestamp) > new Date(c.lastReadTimestamps[currentUser.email] || 0);
                                    return { ...c, isUnread };
                                })
                                .sort((a, b) => {
                                    const timeA = a.messages.length ? new Date(a.messages[a.messages.length-1].timestamp).getTime() : 0;
                                    const timeB = b.messages.length ? new Date(b.messages[b.messages.length-1].timestamp).getTime() : 0;
                                    return timeB - timeA;
                                })
                            }
                            pets={pets}
                            users={users}
                            currentUser={currentUser}
                            onSelectChat={(id) => { setSelectedChatId(id); setCurrentView('chat'); }}
                            onBack={() => handleNavigate('/')}
                        />
                    )}

                    {currentView === 'chat' && activeChat && currentUser && (
                        <ChatPage
                            chat={activeChat}
                            pet={activeChatPet}
                            users={users}
                            currentUser={currentUser}
                            onSendMessage={handleSendMessage}
                            onBack={() => handleNavigate('/mensajes')}
                            onMarkAsRead={handleMarkChatAsRead}
                        />
                    )}

                    {currentView === 'admin' && currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.SUPERADMIN) && (
                        <AdminDashboard
                            onBack={() => handleNavigate('/')}
                            users={users}
                            onViewUser={handleViewUser}
                            pets={pets}
                            chats={chats}
                            reports={reports}
                            supportTickets={supportTickets}
                            onUpdateReportStatus={handleUpdateReportStatus}
                            onDeletePet={handleDeletePet}
                            onUpdateSupportTicket={handleUpdateSupportTicket}
                            isAiSearchEnabled={isAiSearchEnabled}
                            onToggleAiSearch={() => setIsAiSearchEnabled(!isAiSearchEnabled)}
                            campaigns={campaigns}
                            onSaveCampaign={handleSaveCampaign}
                            onDeleteCampaign={handleDeleteCampaign}
                            onNavigate={handleNavigate}
                        />
                    )}

                    {currentView === 'support' && currentUser && (
                         <SupportPage
                            currentUser={currentUser}
                            userTickets={supportTickets.filter(t => t.userEmail === currentUser.email)}
                            onAddTicket={handleAddSupportTicket}
                            onBack={() => handleNavigate('/')}
                         />
                    )}

                    {currentView === 'campaigns' && (
                        <CampaignsPage 
                            campaigns={campaigns} 
                            onNavigate={handleNavigate} 
                        />
                    )}

                    {currentView === 'campaign_detail' && selectedCampaign && (
                        <CampaignDetailPage 
                            campaign={selectedCampaign} 
                            onClose={() => handleNavigate('/campanas')} 
                        />
                    )}

                    {currentView === 'map' && (
                        <MapPage 
                            pets={pets} 
                            onNavigate={handleNavigate}
                        />
                    )}
                </main>
            </div>

            {isReportModalOpen && (
                <ReportPetForm 
                    onClose={() => setIsReportModalOpen(false)} 
                    onSubmit={handleSubmitPet}
                    initialStatus={reportStatus}
                    petToEdit={selectedPet?.userEmail === currentUser?.email ? selectedPet : undefined}
                />
            )}

            {isAdoptionModalOpen && (
                <ReportAdoptionForm 
                    onClose={() => setIsAdoptionModalOpen(false)}
                    onSubmit={(pet) => finalizePetSubmission(pet)}
                />
            )}

            {isMatchModalOpen && pendingPetToSubmit && (
                <PotentialMatchesModal
                    matches={potentialMatches}
                    onClose={() => { setIsMatchModalOpen(false); setPendingPetToSubmit(null); }}
                    onConfirmPublication={() => finalizePetSubmission(pendingPetToSubmit)}
                    onPetSelect={(pet) => {
                        setIsMatchModalOpen(false);
                        setSelectedPet(pet);
                        handleNavigate(`/mascota/${pet.id}`);
                    }}
                />
            )}

            {isFlyerModalOpen && selectedPet && (
                <FlyerModal 
                    pet={selectedPet} 
                    onClose={() => setIsFlyerModalOpen(false)} 
                />
            )}

            {isUserDetailModalOpen && selectedUserProfile && (
                <AdminUserDetailModal
                    user={selectedUserProfile}
                    allPets={pets}
                    allChats={chats}
                    allUsers={users}
                    onClose={() => setIsUserDetailModalOpen(false)}
                    onUpdateStatus={handleUpdateUserStatus}
                    onUpdateRole={handleUpdateUserRole}
                    onStartChat={(recipientEmail) => {
                         if (!currentUser) return;
                         const existingChat = chats.find(c => !c.petId && c.participantEmails.includes(currentUser.email) && c.participantEmails.includes(recipientEmail));
                         if (existingChat) {
                             setSelectedChatId(existingChat.id);
                             setCurrentView('chat');
                             setIsUserDetailModalOpen(false);
                         } else {
                             // Client-side ID and Timestamp generation for robustness
                             const newChatId = generateUUID();
                             const now = new Date().toISOString();
                             const timestamps = {
                                [currentUser.email]: now,
                                [recipientEmail]: new Date(0).toISOString() 
                             };

                             supabase.from('chats').insert({
                                id: newChatId,
                                participant_emails: [currentUser.email, recipientEmail],
                                last_read_timestamps: timestamps,
                                created_at: now
                             }).then(({ error }) => {
                                if (!error) {
                                    const createdChat = { 
                                        id: newChatId,
                                        participantEmails: [currentUser.email, recipientEmail],
                                        messages: [],
                                        lastReadTimestamps: timestamps
                                    };
                                    setChats(prev => [...prev, createdChat]);
                                    setSelectedChatId(newChatId);
                                    setCurrentView('chat');
                                    setIsUserDetailModalOpen(false);
                                } else {
                                    console.error("Error creating admin chat:", error);
                                    const msg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
                                    alert("Error al iniciar chat: " + msg);
                                }
                             });
                         }
                    }}
                    onGhostLogin={ghostLogin}
                    onViewUser={handleViewUser}
                />
            )}
        </div>
    );
};

export default App;