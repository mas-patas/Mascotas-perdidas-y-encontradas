
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
    const [isAiSearchEnabled, setIsAiSearchEnabled] = useState(false);

    // 1. FETCH REAL DATA FROM SUPABASE
    useEffect(() => {
        const fetchData = async () => {
            // A. Fetch Profiles (Users)
            const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
            if (profiles) {
                const mappedUsers: User[] = profiles.map(p => ({
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
                setUsers(mappedUsers);
            }
            if (profilesError) console.error("Error fetching profiles:", profilesError);

            // B. Fetch Pets
            const { data: petsData, error: petsError } = await supabase
                .from('pets')
                .select('*, profiles(email)')
                .order('created_at', { ascending: false });

            if (petsData) {
                const mappedPets: Pet[] = petsData.map(p => ({
                    id: p.id,
                    userEmail: p.profiles?.email || 'unknown', // Joined email
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
                    comments: p.comments || []
                }));
                setPets(mappedPets);
            }
             if (petsError) console.error("Error fetching pets:", petsError);
             
            // C. Chats
            const { data: chatsData } = await supabase.from('chats').select('*');
            if (chatsData) {
                setChats(chatsData.map(c => ({
                    id: c.id,
                    petId: c.pet_id,
                    participantEmails: c.participant_emails || [],
                    messages: c.messages || [],
                    lastReadTimestamps: c.last_read_timestamps || {}
                })));
            }
            
            // D. Reports
            const { data: reportsData } = await supabase.from('reports').select('*');
            if (reportsData) {
                setReports(reportsData.map(r => ({
                    id: r.id,
                    reporterEmail: r.reporter_email,
                    reportedEmail: r.reported_email,
                    type: r.type,
                    targetId: r.target_id,
                    reason: r.reason,
                    details: r.details,
                    timestamp: r.timestamp,
                    status: r.status,
                    postSnapshot: r.post_snapshot
                })));
            }
            
            // E. Support Tickets
            const { data: ticketsData } = await supabase.from('support_tickets').select('*');
            if (ticketsData) {
                setSupportTickets(ticketsData.map(t => ({
                    id: t.id,
                    userEmail: t.user_email,
                    category: t.category,
                    subject: t.subject,
                    description: t.description,
                    timestamp: t.timestamp,
                    status: t.status,
                    assignedTo: t.assigned_to,
                    assignmentHistory: t.assignment_history || [],
                    response: t.response
                })));
            }
            
            // F. Campaigns
            const { data: campaignsData } = await supabase.from('campaigns').select('*').order('date', { ascending: false });
            if (campaignsData) {
                setCampaigns(campaignsData.map(c => ({
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
            
            // G. Notifications
            const { data: notifsData } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
            if (notifsData) {
                setNotifications(notifsData.map(n => ({
                    id: n.id,
                    userId: n.user_id,
                    message: n.message,
                    link: n.link,
                    timestamp: n.timestamp,
                    isRead: n.is_read
                })));
            }
        };

        fetchData();
    }, [currentUser]); // Reload if user changes login state (though RLS handles security)


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
            // Insert into Supabase
            const { data, error } = await supabase.from('pets').insert({
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
                lng: petData.lng
            }).select('*, profiles(email)').single();

            if (error) throw error;

            if (data) {
                const newPet: Pet = {
                    id: data.id,
                    userEmail: data.profiles?.email || currentUser.email,
                    status: data.status,
                    name: data.name,
                    animalType: data.animal_type,
                    breed: data.breed,
                    color: data.color,
                    size: data.size,
                    location: data.location,
                    date: data.date,
                    contact: data.contact,
                    description: data.description,
                    imageUrls: data.image_urls || [],
                    adoptionRequirements: data.adoption_requirements,
                    shareContactInfo: data.share_contact_info,
                    contactRequests: data.contact_requests || [],
                    lat: data.lat,
                    lng: data.lng,
                    comments: []
                };
                setPets(prev => [newPet, ...prev]);
            }

            setIsReportModalOpen(false);
            setIsAdoptionModalOpen(false);
            setIsMatchModalOpen(false);
            setPendingPetToSubmit(null);

        } catch (err: any) {
            console.error("Error creating pet:", err);
            alert("Error al publicar la mascota: " + err.message);
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
        if (!currentUser) return;
        
        // Check locally first
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        if (existingChat) {
            setSelectedChatId(existingChat.id);
            setCurrentView('chat');
            return;
        }

        // Create new chat
        const chatID = Date.now().toString();
        const newChat: Chat = {
            id: chatID,
            petId: pet.id,
            participantEmails: [currentUser.email, pet.userEmail],
            messages: [],
            lastReadTimestamps: {
                [currentUser.email]: new Date().toISOString(),
                [pet.userEmail]: new Date(0).toISOString() 
            }
        };

        try {
            const { error } = await supabase.from('chats').insert({
                id: chatID,
                pet_id: pet.id,
                participant_emails: newChat.participantEmails,
                messages: [],
                last_read_timestamps: newChat.lastReadTimestamps
            });
            
            if (error) throw error;
            
            setChats(prev => [...prev, newChat]);
            setSelectedChatId(chatID);
            setCurrentView('chat');
        } catch (err: any) {
            console.error("Error starting chat:", err);
            alert("No se pudo iniciar el chat.");
        }
    };

    const handleSendMessage = async (chatId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: Message = {
            senderEmail: currentUser.email,
            text,
            timestamp: new Date().toISOString()
        };
        
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) return;
        
        const currentChat = chats[chatIndex];
        const updatedMessages = [...currentChat.messages, newMessage];
        const updatedTimestamps = {
            ...currentChat.lastReadTimestamps,
            [currentUser.email]: new Date().toISOString()
        };

        try {
            const { error } = await supabase.from('chats').update({
                messages: updatedMessages,
                last_read_timestamps: updatedTimestamps
            }).eq('id', chatId);

            if (error) throw error;
            
            // Optimistic update
            setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: updatedMessages, lastReadTimestamps: updatedTimestamps } : c));

            // Notify recipient
            const recipientEmail = currentChat.participantEmails.find(e => e !== currentUser.email);
            if (recipientEmail) {
                const newNotification = {
                    id: Date.now().toString(),
                    user_id: recipientEmail,
                    message: `Nuevo mensaje de ${currentUser.username || 'un usuario'}`,
                    link: 'messages',
                    timestamp: new Date().toISOString(),
                    is_read: false
                };
                // Assuming insert works
                await supabase.from('notifications').insert(newNotification);
                
                // For local optimistic update if we were tracking recipient notifications (we aren't in this view)
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };
    
    const handleMarkChatAsRead = async (chatId: string) => {
        if (!currentUser) return;
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const updatedTimestamps = {
            ...chat.lastReadTimestamps,
            [currentUser.email]: new Date().toISOString()
        };

        try {
            await supabase.from('chats').update({
                last_read_timestamps: updatedTimestamps
            }).eq('id', chatId);
            
             setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastReadTimestamps: updatedTimestamps } : c));
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };
    
    const handleReport = async (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
        const newReport: Report = {
            id: Date.now().toString(),
            reporterEmail: currentUser.email,
            reportedEmail: type === 'user' ? targetId : (pets.find(p => p.id === targetId)?.userEmail || ''),
            type,
            targetId,
            reason,
            details,
            timestamp: new Date().toISOString(),
            status: REPORT_STATUS.PENDING,
            postSnapshot: type === 'post' ? pets.find(p => p.id === targetId) : undefined
        };

        try {
            const { error } = await supabase.from('reports').insert({
                id: newReport.id,
                reporter_email: newReport.reporterEmail,
                reported_email: newReport.reportedEmail,
                type: newReport.type,
                target_id: newReport.targetId,
                reason: newReport.reason,
                details: newReport.details,
                timestamp: newReport.timestamp,
                status: newReport.status,
                post_snapshot: newReport.postSnapshot
            });

            if (error) throw error;
            setReports(prev => [...prev, newReport]);
            alert('Reporte enviado exitosamente.');
        } catch (err) {
             console.error("Error sending report:", err);
             alert('Error al enviar el reporte.');
        }
    };

    const onUpdateReportStatus = async (id: string, status: ReportStatusType) => {
        try {
            await supabase.from('reports').update({ status }).eq('id', id);
            setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (err) {
            console.error("Error updating report:", err);
        }
    };

    const handleAddSupportTicket = async (category: SupportTicketCategory, subject: string, description: string) => {
        if (!currentUser) return;
        const newTicket: SupportTicket = {
            id: Date.now().toString(),
            userEmail: currentUser.email,
            category,
            subject,
            description,
            timestamp: new Date().toISOString(),
            status: SUPPORT_TICKET_STATUS.PENDING,
        };
        
        try {
            const { error } = await supabase.from('support_tickets').insert({
                id: newTicket.id,
                user_email: newTicket.userEmail,
                category: newTicket.category,
                subject: newTicket.subject,
                description: newTicket.description,
                timestamp: newTicket.timestamp,
                status: newTicket.status
            });
            if (error) throw error;
            setSupportTickets(prev => [...prev, newTicket]);
        } catch(err) {
             console.error("Error creating ticket:", err);
        }
    };
    
    const handleUpdateSupportTicket = async (updatedTicket: SupportTicket) => {
        try {
            const { error } = await supabase.from('support_tickets').update({
                status: updatedTicket.status,
                assigned_to: updatedTicket.assignedTo,
                assignment_history: updatedTicket.assignmentHistory,
                response: updatedTicket.response
            }).eq('id', updatedTicket.id);

            if (error) throw error;

            setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
            
            // Notify user
            if (updatedTicket.response) {
                const notif = {
                    id: Date.now().toString(),
                    user_id: updatedTicket.userEmail,
                    message: `Tu ticket "${updatedTicket.subject}" ha sido actualizado.`,
                    link: 'support',
                    timestamp: new Date().toISOString(),
                    is_read: false
                };
                await supabase.from('notifications').insert(notif);
            }
        } catch(err) {
            console.error("Error updating ticket:", err);
        }
    };

    const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (!currentUser) return;
        
        const campaignId = idToUpdate || Date.now().toString();
        const dbPayload = {
            id: campaignId,
            user_email: currentUser.email,
            type: campaignData.type,
            title: campaignData.title,
            description: campaignData.description,
            location: campaignData.location,
            date: campaignData.date,
            image_urls: campaignData.imageUrls,
            contact_phone: campaignData.contactPhone,
            lat: campaignData.lat,
            lng: campaignData.lng
        };

        try {
            const { error } = await supabase.from('campaigns').upsert(dbPayload);
            if (error) throw error;

            const newCampaign = { ...campaignData, id: campaignId, userEmail: currentUser.email };
            if (idToUpdate) {
                 setCampaigns(prev => prev.map(c => c.id === idToUpdate ? { ...c, ...campaignData } : c));
            } else {
                setCampaigns(prev => [newCampaign, ...prev]);
                // Notify all users
                users.forEach(async u => {
                    if (u.email !== currentUser.email) {
                        await supabase.from('notifications').insert({
                            id: Date.now().toString() + Math.random(),
                            user_id: u.email,
                            message: `Nueva campaña: ${campaignData.title}`,
                            link: { type: 'campaign', id: campaignId },
                            timestamp: new Date().toISOString(),
                            is_read: false
                        });
                    }
                });
            }
        } catch(err) {
            console.error("Error saving campaign:", err);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        try {
            await supabase.from('campaigns').delete().eq('id', id);
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch(err) {
            console.error("Error deleting campaign:", err);
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
        } catch(err) {
            console.error("Error reading notification:", err);
        }
    };

    const handleMarkAllNotificationsAsRead = async () => {
        if (!currentUser) return;
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.email);
            setNotifications(prev => prev.map(n => n.userId === currentUser.email ? { ...n, isRead: true } : n));
        } catch(err) {
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
            await supabase.from('pets').update({ contact_requests: updatedRequests }).eq('id', petId);
            setPets(prev => prev.map(p => p.id === petId ? { ...p, contactRequests: updatedRequests } : p));

            // Notify Owner
             await supabase.from('notifications').insert({
                id: Date.now().toString(),
                user_id: pet.userEmail,
                message: `${currentUser.username || 'Un usuario'} ha visto tu información de contacto para ${pet.name}`,
                link: { type: 'pet', id: pet.id },
                timestamp: new Date().toISOString(),
                is_read: false
            });

        } catch(err) {
            console.error("Error recording contact request:", err);
        }
    };

    const handleAddComment = async (petId: string, text: string) => {
        if (!currentUser) return;
        
        const newComment: Comment = {
            id: Date.now().toString(),
            userEmail: currentUser.email,
            userName: currentUser.username || 'Usuario',
            text,
            timestamp: new Date().toISOString()
        };

        const pet = pets.find(p => p.id === petId);
        if (!pet) return;

        const updatedComments = [...(pet.comments || []), newComment];

        try {
            const { error } = await supabase
                .from('pets')
                .update({ comments: updatedComments })
                .eq('id', petId);

            if (error) throw error;
            
            // Optimistic update
            setPets(prev => prev.map(p => p.id === petId ? { ...p, comments: updatedComments } : p));
            
             if (pet.userEmail !== currentUser.email) {
                 await supabase.from('notifications').insert({
                    id: Date.now().toString(),
                    user_id: pet.userEmail,
                    message: `${currentUser.username || 'Un usuario'} comentó en tu publicación de ${pet.name}`,
                    link: { type: 'pet', id: pet.id },
                    timestamp: new Date().toISOString(),
                    is_read: false
                });
            }
        } catch (err: any) {
            console.error("Error saving comment:", err);
            alert("Error al guardar el comentario. Por favor intenta de nuevo.");
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
                />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                    {currentView === 'list' && (
                        <PetList 
                            pets={filteredPets} 
                            users={users} 
                            onViewUser={handleViewUser} 
                            filters={filters}
                            onNavigate={handleNavigate}
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
                            onUpdateReportStatus={(id, status) => onUpdateReportStatus(id, status)}
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
                             const newChat: Chat = {
                                 id: Date.now().toString(),
                                 participantEmails: [currentUser.email, recipientEmail],
                                 messages: [],
                                 lastReadTimestamps: { [currentUser.email]: new Date().toISOString(), [recipientEmail]: new Date(0).toISOString() }
                             };
                             setChats(prev => [...prev, newChat]);
                             setSelectedChatId(newChat.id);
                             setCurrentView('chat');
                             setIsUserDetailModalOpen(false);
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