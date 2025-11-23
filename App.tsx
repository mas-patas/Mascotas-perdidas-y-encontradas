
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { PetList } from './components/PetList';
import { ReportPetForm } from './components/ReportPetForm';
import { PetDetailPage } from './components/PetDetailPage';
import type { Pet, PetStatus, Chat, User, UserRole, PotentialMatch, UserStatus, Report, ReportReason, ReportType, ReportStatus as ReportStatusType, SupportTicket, SupportTicketCategory, Campaign, Comment } from './types';
import { PET_STATUS, USER_ROLES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS } from './constants';
import { useAuth } from './contexts/AuthContext';
import ProfilePage from './components/ProfilePage';
import AuthPage from './components/AuthPage';
import ProfileSetupPage from './components/ProfileSetupPage';
import MessagesPage from './components/MessagesPage';
import { ChatPage } from './components/ChatPage';
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
import { RenewModal } from './components/RenewModal';
import { StatusCheckModal } from './components/StatusCheckModal';
import { supabase } from './services/supabaseClient';
import { generateUUID } from './utils/uuid';

import { useAppData } from './hooks/useAppData';
import { usePetFilters } from './hooks/usePetFilters';
import { usePets } from './hooks/usePets';

// Protected Route Wrapper
const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: UserRole[] }) => {
    const { currentUser, loading } = useAuth();
    
    if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(currentUser.role)) {
        return <Navigate to="/" replace />;
    }

    if (!currentUser.username) {
        return <Navigate to="/setup-profile" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    const { currentUser, ghostLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    // State from Hooks
    const { filters, setFilters, resetFilters } = usePetFilters([]);
    const { pets, loading: petsLoading, loadMore, hasMore, isError: petsError, refetch: refetchPets } = usePets({ filters });
    const { 
        users, setUsers, 
        chats, setChats, 
        reports, setReports, 
        supportTickets, setSupportTickets, 
        campaigns, setCampaigns, 
        notifications, setNotifications,
        loading: appDataLoading
    } = useAppData();
    
    // Local UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
    const [selectedPetForModal, setSelectedPetForModal] = useState<Pet | null>(null);
    const [petToRenew, setPetToRenew] = useState<Pet | null>(null);
    const [petToStatusCheck, setPetToStatusCheck] = useState<Pet | null>(null);
    
    const [reportStatus, setReportStatus] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
    const [pendingPetToSubmit, setPendingPetToSubmit] = useState<Omit<Pet, 'id' | 'userEmail'> | null>(null);
    const [isAiSearchEnabled, setIsAiSearchEnabled] = useState(true);

    // Auto-close sidebar on Map view
    useEffect(() => {
        if (location.pathname === '/mapa') {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Check for expired pets and 30-day status check
    useEffect(() => {
        if (!currentUser) return;

        const checkStatuses = async () => {
            const now = new Date();
            // Fetch user's pets
            const { data: userPets } = await supabase
                .from('pets')
                .select('id, name, expires_at, created_at, status')
                .eq('user_id', currentUser.id);

            if (!userPets) return;

            userPets.forEach(async (pet) => {
                let expirationDate;
                let createdDate = new Date(pet.created_at);

                if (pet.expires_at) {
                    expirationDate = new Date(pet.expires_at);
                } else {
                    expirationDate = new Date(createdDate.getTime() + (60 * 24 * 60 * 60 * 1000));
                }

                const isExpired = now > expirationDate;
                const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));

                // 1. Expiration Check (60 Days)
                if (isExpired) {
                    const alreadyNotified = notifications.some(n => 
                        (typeof n.link === 'object' && n.link.type === 'pet-renew' && n.link.id === pet.id)
                    );

                    if (!alreadyNotified) {
                        const newNotifId = generateUUID();
                        await supabase.from('notifications').insert({
                            id: newNotifId,
                            user_id: currentUser.id,
                            message: `Tu publicación de "${pet.name}" ha expirado. Haz clic para renovarla.`,
                            link: { type: 'pet-renew', id: pet.id }, 
                            is_read: false,
                            created_at: now.toISOString()
                        });
                    }
                }

                // 2. 30-Day Status Check (Only for Lost Pets)
                // Trigger if it's roughly 30 days old (between 29 and 32 to ensure we catch it)
                // and hasn't expired yet.
                if (pet.status === PET_STATUS.PERDIDO && daysSinceCreation >= 30 && daysSinceCreation < 60 && !isExpired) {
                     const alreadyChecked = notifications.some(n => 
                        (typeof n.link === 'object' && n.link.type === 'pet-status-check' && n.link.id === pet.id)
                    );

                    if (!alreadyChecked) {
                        const newNotifId = generateUUID();
                        await supabase.from('notifications').insert({
                            id: newNotifId,
                            user_id: currentUser.id,
                            message: `¿Has encontrado a ${pet.name}? Han pasado 30 días.`,
                            link: { type: 'pet-status-check', id: pet.id },
                            is_read: false,
                            created_at: now.toISOString()
                        });
                    }
                }
            });
        };

        checkStatuses();
    }, [currentUser?.id, notifications]); 

    const getUserIdByEmail = (email: string): string | undefined => {
        const user = users.find(u => u.email === email);
        return user?.id;
    };

    const handleReportPet = (status: PetStatus) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setReportStatus(status);
        setIsReportModalOpen(true);
    };

    const handleSubmitPet = async (petData: Omit<Pet, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (idToUpdate) {
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

                queryClient.invalidateQueries({ queryKey: ['pets'] });
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
            const now = new Date();
            // Explicitly calculate expiration date for the DB column
            const expirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

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
                created_at: now.toISOString(),
                expires_at: expirationDate.toISOString() // REQUIRED: Set expiration
            });

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['pets'] });

            const newNotifId = generateUUID();
            await supabase.from('notifications').insert({
                id: newNotifId,
                user_id: currentUser.id,
                message: `Has publicado exitosamente el reporte de "${petData.name}". Estará activo por 60 días.`,
                link: { type: 'pet', id: newPetId },
                is_read: false,
                created_at: now.toISOString()
            });

            setIsReportModalOpen(false);
            setIsAdoptionModalOpen(false);
            setIsMatchModalOpen(false);
            setPendingPetToSubmit(null);

        } catch (err: any) {
            console.error("Error creating pet:", err);
            alert("Error al publicar la mascota: " + err.message);
        }
    };

    const handleRenewPet = async (pet: Pet) => {
        if (!currentUser) return;
        try {
            const now = new Date();
            const newExpirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)); // +60 days from now

            const { error } = await supabase.from('pets').update({
                expires_at: newExpirationDate.toISOString(),
                created_at: now.toISOString() // Also update created_at to bump to top of lists
            }).eq('id', pet.id);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['pets'] });
            setPetToRenew(null); // Close modal
            alert(`La publicación de ${pet.name} ha sido renovada por 60 días más.`);
            
        } catch (err: any) {
            console.error("Error renewing pet:", err);
            alert("Error al renovar la publicación: " + err.message);
        }
    };

    const handleMarkAsFound = async (pet: Pet) => {
        try {
            const { error } = await supabase.from('pets').update({ 
                status: PET_STATUS.REUNIDO 
                // We intentionally don't update expires_at here, or we could extend it slightly to show off the success
            }).eq('id', pet.id);

            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            setPetToRenew(null);
            setPetToStatusCheck(null);
            alert("¡Qué alegría! Tu mascota ha sido marcada como reunida.");
        } catch (err: any) {
            alert("Error al actualizar estado: " + err.message);
        }
    };

    const handleKeepLooking = () => {
        setPetToStatusCheck(null);
        alert("Lamentamos mucho que aún no te hayas reunido con tu mascota. Seguiremos difundiendo tu publicación.");
    };

    const handleDeletePet = async (petId: string) => {
        try {
            const { error } = await supabase.from('pets').delete().eq('id', petId);
            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            navigate('/');
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };
    
    const handleUpdatePetStatus = async (petId: string, status: PetStatus) => {
        try {
            const { error } = await supabase.from('pets').update({ status }).eq('id', petId);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['pets'] });
        } catch (err: any) {
            alert("Error al actualizar estado: " + err.message);
        }
    };

    // ... [Keep existing User/Role/Chat handlers unchanged] ...
    const handleUpdateUserStatus = async (email: string, status: UserStatus) => {
        try {
            const { error } = await supabase.from('profiles').update({ status }).eq('email', email);
            if (error) throw error;
            setUsers(prev => prev.map(u => u.email === email ? { ...u, status } : u));
        } catch (err: any) {
            alert("Error al actualizar estado: " + err.message);
        }
    };

    const handleUpdateUserRole = async (email: string, role: UserRole) => {
        try {
            const { error } = await supabase.from('profiles').update({ role }).eq('email', email);
            if (error) throw error;
            setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u));
        } catch (err: any) {
            alert("Error al actualizar rol: " + err.message);
        }
    };

    const handleStartChat = async (pet: Pet) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (!pet.userEmail || pet.userEmail === 'unknown') {
            alert("No se puede contactar al dueño de esta mascota porque su información no está disponible.");
            return;
        }
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        if (existingChat) {
            navigate(`/chat/${existingChat.id}`);
        } else {
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
                navigate(`/chat/${newChatId}`);
            } catch (err: any) { 
                console.error("Error starting chat:", err);
                alert("Error al iniciar el chat: " + (err.message || JSON.stringify(err)));
            }
        }
    };

    const handleSendMessage = useCallback(async (chatId: string, text: string) => {
        if (!currentUser) return;
        try {
            const newMessageId = generateUUID();
            const now = new Date().toISOString();
            const { error: msgError } = await supabase.from('messages').insert({
                id: newMessageId,
                chat_id: chatId,
                sender_email: currentUser.email,
                text: text,
                created_at: now
            });
            if (msgError) throw msgError;
        } catch (err: any) {
            console.error("Error sending message:", err);
            alert("Error al enviar el mensaje: " + err.message);
        }
    }, [currentUser]);
    
    const handleMarkChatAsRead = useCallback(async (chatId: string) => {
        if (!currentUser) return;
        setChats(prev => {
            const chat = prev.find(c => c.id === chatId);
            if (!chat) return prev;
            const lastMsg = chat.messages[chat.messages.length - 1];
            const lastMsgTime = lastMsg ? new Date(lastMsg.timestamp).getTime() : 0;
            const nowTime = Date.now();
            const safeReadTime = new Date(Math.max(nowTime, lastMsgTime + 1)).toISOString();
            const currentReadTime = chat.lastReadTimestamps[currentUser.email];
            if (currentReadTime && new Date(currentReadTime).getTime() >= new Date(safeReadTime).getTime()) {
                return prev;
            }
            const newTimestamps = { ...chat.lastReadTimestamps, [currentUser.email]: safeReadTime };
            supabase.from('chats').update({ last_read_timestamps: newTimestamps }).eq('id', chatId).then();
            return prev.map(c => c.id === chatId ? { ...c, lastReadTimestamps: newTimestamps } : c);
        });
    }, [currentUser]);
    
    const handleReport = async (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
        try {
            let reportedEmail = '';
            if (type === 'user') {
                reportedEmail = targetId;
            } else {
                const pet = pets.find(p => p.id === targetId);
                reportedEmail = pet?.userEmail || '';
            }
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
                type,
                targetId,
                reason,
                details,
                timestamp: now,
                status: REPORT_STATUS.PENDING,
                postSnapshot
            };
            setReports(prev => [newReport, ...prev]);
            const newNotifId = generateUUID();
            await supabase.from('notifications').insert({
                id: newNotifId,
                user_id: currentUser.id,
                message: `Hemos recibido tu reporte. Gracias por ayudar a la comunidad.`,
                link: 'support',
                is_read: false,
                created_at: now
            });
            alert('Reporte enviado exitosamente.');
        } catch (err: any) {
            console.error("Error sending report:", err);
            alert("Error al enviar reporte: " + err.message);
        }
    };

    // ... [Keep existing handlers: handleUpdateReportStatus, handleAddSupportTicket, etc.] ...
    const handleUpdateReportStatus = async (reportId: string, status: ReportStatusType) => {
        try {
            const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
            if (error) throw error;
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
            const report = reports.find(r => r.id === reportId);
            if (report) {
                const reporterId = getUserIdByEmail(report.reporterEmail);
                if (reporterId) {
                    const newNotifId = generateUUID();
                    await supabase.from('notifications').insert({
                        id: newNotifId,
                        user_id: reporterId,
                        message: `El estado de tu reporte ha cambiado a: ${status}`,
                        link: 'support',
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                }
            }
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
                category,
                subject,
                description,
                timestamp: now,
                status: SUPPORT_TICKET_STATUS.PENDING,
            };
            setSupportTickets(prev => [newTicket, ...prev]);
            const newNotifId = generateUUID();
            await supabase.from('notifications').insert({
                id: newNotifId,
                user_id: currentUser.id,
                message: `Ticket de soporte "${subject}" creado.`,
                link: 'support',
                is_read: false,
                created_at: now
            });
        } catch (err: any) {
            console.error("Error adding ticket:", err);
            alert("Error al crear ticket: " + err.message);
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
            const originalTicket = supportTickets.find(t => t.id === updatedTicket.id);
            if (originalTicket && (originalTicket.status !== updatedTicket.status || (!originalTicket.response && updatedTicket.response))) {
                 const ticketUserId = getUserIdByEmail(updatedTicket.userEmail);
                 if (ticketUserId) {
                     const newNotifId = generateUUID();
                     await supabase.from('notifications').insert({
                        id: newNotifId,
                        user_id: ticketUserId,
                        message: `Tu ticket "${updatedTicket.subject}" ha sido actualizado a: ${updatedTicket.status}`,
                        link: 'support',
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                 }
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
                const newNotifId = generateUUID();
                await supabase.from('notifications').insert({
                    id: newNotifId,
                    user_id: currentUser.id,
                    message: `Campaña "${campaignData.title}" creada exitosamente.`,
                    link: { type: 'campaign', id: newCampaignId },
                    is_read: false,
                    created_at: now
                });
            }
        } catch (err: any) {
            console.error("Error saving campaign:", err);
            alert("Error al guardar campaña: " + (err.message || JSON.stringify(err)));
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
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Error reading all notifications:", err);
        }
    };
    
    const handleRecordContactRequest = async (petId: string): Promise<void> => {
        if (!currentUser) return;

        try {
            // 1. Get current state from DB to ensure we are atomic-ish and handle missing local state
            const { data: petData, error: fetchError } = await supabase
                .from('pets')
                .select('id, contact_requests, user_id, name')
                .eq('id', petId)
                .single();
            
            if (fetchError || !petData) {
                console.error("Pet not found for contact request", fetchError);
                return;
            }

            const currentRequests: string[] = petData.contact_requests || [];
            
            // If already requested, do nothing
            if (currentRequests.includes(currentUser.email)) return;

            const updatedRequests = [...currentRequests, currentUser.email];

            // 2. Update DB
            const { error: updateError } = await supabase
                .from('pets')
                .update({ contact_requests: updatedRequests })
                .eq('id', petId);

            if (updateError) throw updateError;

            // 3. Invalidate queries to refresh UI
            await queryClient.invalidateQueries({ queryKey: ['pets'] });

            // 4. Send Notification
            const ownerId = petData.user_id;
            if (ownerId && ownerId !== currentUser.id) { // Don't notify self
                const newNotifId = generateUUID();
                await supabase.from('notifications').insert({
                    id: newNotifId,
                    user_id: ownerId,
                    message: `${currentUser.username || 'Un usuario'} ha visto tu información de contacto para ${petData.name}`,
                    link: { type: 'pet', id: petId },
                    is_read: false,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err: any) {
            console.error("Error recording contact request:", err);
            // alert("No se pudo registrar la solicitud de contacto."); // Optional
        }
    };

    const handleAddComment = async (petId: string, text: string, parentId?: string) => {
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
                parent_id: parentId || null,
                created_at: now
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            const pet = pets.find(p => p.id === petId);
            if (pet && pet.userEmail !== currentUser.email) {
                 const ownerId = getUserIdByEmail(pet.userEmail);
                 if (ownerId) {
                     const newNotifId = generateUUID();
                     await supabase.from('notifications').insert({
                        id: newNotifId,
                        user_id: ownerId,
                        message: `${currentUser.username || 'Un usuario'} comentó en tu publicación de ${pet.name}`,
                        link: { type: 'pet', id: pet.id },
                        is_read: false,
                        created_at: now
                    });
                 }
            }
            if (parentId) {
                const parentComment = pet?.comments?.find(c => c.id === parentId);
                if (parentComment && parentComment.userEmail !== currentUser.email) {
                    const parentAuthorId = getUserIdByEmail(parentComment.userEmail);
                    if (parentAuthorId) {
                        const newNotifId = generateUUID();
                        await supabase.from('notifications').insert({
                            id: newNotifId,
                            user_id: parentAuthorId,
                            message: `${currentUser.username || 'Un usuario'} respondió a tu comentario en ${pet?.name}`,
                            link: { type: 'pet', id: petId },
                            is_read: false,
                            created_at: now
                        });
                    }
                }
            }
        } catch (err: any) {
            console.error("Error adding comment:", err);
            alert("Error al agregar comentario: " + err.message);
        }
    };

    const handleLikeComment = async (petId: string, commentId: string) => {
        if (!currentUser) return;
        const pet = pets.find(p => p.id === petId);
        const comment = pet?.comments?.find(c => c.id === commentId);
        if (!comment) return;
        const isLiked = comment.likes?.includes(currentUser.id || '');
        try {
            if (isLiked) {
                await supabase.from('comment_likes').delete().eq('user_id', currentUser.id).eq('comment_id', commentId);
                queryClient.invalidateQueries({ queryKey: ['pets'] });
            } else {
                await supabase.from('comment_likes').insert({ user_id: currentUser.id, comment_id: commentId });
                queryClient.invalidateQueries({ queryKey: ['pets'] });
            }
        } catch (err) {
            console.error("Error toggling like:", err);
        }
    };

    // Centralized Notification Click Handler
    const onNotificationClick = (notification: any) => {
        const link = notification.link;
        if (typeof link === 'object' && link.type === 'pet-renew') {
            const pet = pets.find(p => p.id === link.id);
            if (pet) {
                setPetToRenew(pet);
            } else {
                // Fallback fetch if not in current list
                supabase.from('pets').select('*').eq('id', link.id).single().then(({ data }) => {
                    if (data) {
                        const mappedPet: Pet = { 
                            ...data, 
                            imageUrls: data.image_urls || [], 
                            animalType: data.animal_type,
                            adoptionRequirements: data.adoption_requirements,
                            shareContactInfo: data.share_contact_info,
                            userEmail: '...', // Dummy for modal logic
                            comments: []
                        };
                        setPetToRenew(mappedPet);
                    }
                });
            }
        } else if (typeof link === 'object' && link.type === 'pet-status-check') {
            const pet = pets.find(p => p.id === link.id);
            if (pet) {
                setPetToStatusCheck(pet);
            } else {
                 supabase.from('pets').select('*').eq('id', link.id).single().then(({ data }) => {
                    if (data) {
                        const mappedPet: Pet = { 
                            ...data, 
                            imageUrls: data.image_urls || [], 
                            animalType: data.animal_type,
                            adoptionRequirements: data.adoption_requirements,
                            shareContactInfo: data.share_contact_info,
                            userEmail: '...', 
                            comments: []
                        };
                        setPetToStatusCheck(mappedPet);
                    }
                });
            }
        } else if (link === 'support') navigate('/soporte');
        else if (link === 'messages') navigate('/mensajes');
        else if (typeof link === 'object') {
            if (link.type === 'campaign') navigate(`/campanas/${link.id}`);
            else if (link.type === 'pet') navigate(`/mascota/${link.id}`);
        }
    };

    const hasUnreadMessages = currentUser ? chats.some(c => {
        if (!c.participantEmails.includes(currentUser.email)) return false;
        const lastMsg = c.messages[c.messages.length - 1];
        if (!lastMsg || lastMsg.senderEmail === currentUser.email) return false;
        const lastRead = c.lastReadTimestamps[currentUser.email] || new Date(0).toISOString();
        return new Date(lastMsg.timestamp) > new Date(lastRead);
    }) : false;

    return (
        <>
            <Routes>
                <Route path="/" element={
                    <Layout
                        onReportPet={handleReportPet}
                        onOpenAdoptionModal={() => setIsAdoptionModalOpen(true)}
                        isSidebarOpen={isSidebarOpen}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        onCloseSidebar={() => setIsSidebarOpen(false)}
                        hasUnreadMessages={hasUnreadMessages}
                        notifications={notifications}
                        onMarkNotificationAsRead={handleMarkNotificationAsRead}
                        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                        filters={filters}
                        setFilters={setFilters}
                        onResetFilters={resetFilters}
                    />
                }>
                    <Route index element={
                        <PetList
                            pets={pets}
                            users={users}
                            onViewUser={handleViewUser}
                            filters={filters}
                            onNavigate={(path) => navigate(path)} 
                            onSelectStatus={(status) => setFilters(prev => ({ ...prev, status }))}
                            onReset={() => { resetFilters(); navigate('/'); }}
                            loadMore={loadMore}
                            hasMore={hasMore}
                            isLoading={petsLoading}
                            isError={petsError}
                            onRetry={() => refetchPets()}
                        />
                    } />
                    
                    {/* Routes similar to previous App.tsx */}
                    <Route path="mascota/:id" element={
                        <PetDetailPage
                            pet={undefined} 
                            onClose={() => navigate('/')}
                            onStartChat={handleStartChat}
                            onEdit={(pet) => { setReportStatus(pet.status); setSelectedPetForModal(pet); setIsReportModalOpen(true); }}
                            onDelete={handleDeletePet}
                            onGenerateFlyer={(pet) => { setSelectedPetForModal(pet); setIsFlyerModalOpen(true); }}
                            onUpdateStatus={handleUpdatePetStatus}
                            users={users}
                            onViewUser={handleViewUser}
                            onReport={handleReport}
                            onRecordContactRequest={handleRecordContactRequest}
                            onAddComment={handleAddComment}
                            onLikeComment={handleLikeComment}
                        />
                    } />

                    <Route path="perfil" element={
                        <ProtectedRoute>
                            <ProfilePage
                                user={currentUser!}
                                reportedPets={pets.filter(p => p.userEmail === currentUser?.email)}
                                allPets={pets}
                                users={users}
                                onBack={() => navigate('/')}
                                onReportOwnedPetAsLost={(ownedPet) => {
                                    setReportStatus(PET_STATUS.PERDIDO);
                                    setIsReportModalOpen(true);
                                }}
                                onNavigate={(path) => navigate(path)}
                                onViewUser={handleViewUser}
                                onRenewPet={(pet) => setPetToRenew(pet)}
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="setup-profile" element={<ProfileSetupPage />} />

                    <Route path="mensajes" element={
                        <ProtectedRoute>
                            <MessagesPage
                                chats={chats
                                    .filter(c => c.participantEmails.includes(currentUser!.email))
                                    .map(c => {
                                        const lastMsg = c.messages[c.messages.length - 1];
                                        const isUnread = lastMsg && lastMsg.senderEmail !== currentUser!.email && new Date(lastMsg.timestamp) > new Date(c.lastReadTimestamps[currentUser!.email] || 0);
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
                                currentUser={currentUser!}
                                onSelectChat={(id) => navigate(`/chat/${id}`)}
                                onBack={() => navigate('/')}
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="chat/:id" element={
                        <ProtectedRoute>
                            <ChatPage
                                chat={undefined} 
                                pet={undefined}
                                users={users}
                                currentUser={currentUser!}
                                onSendMessage={handleSendMessage}
                                onBack={() => navigate('/mensajes')}
                                onMarkAsRead={handleMarkChatAsRead}
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="admin" element={
                        <ProtectedRoute roles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
                            <AdminDashboard
                                onBack={() => navigate('/')}
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
                                onNavigate={(path) => navigate(path)}
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="soporte" element={
                        <ProtectedRoute>
                            <SupportPage
                                currentUser={currentUser!}
                                userTickets={supportTickets.filter(t => t.userEmail === currentUser?.email)}
                                onAddTicket={handleAddSupportTicket}
                                onBack={() => navigate('/')}
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="campanas" element={
                        <CampaignsPage
                            campaigns={campaigns}
                            onNavigate={(path) => navigate(path)}
                        />
                    } />

                    <Route path="campanas/:id" element={
                        <CampaignDetailPage
                            campaign={undefined}
                            onClose={() => navigate('/campanas')}
                        />
                    } />

                    <Route path="mapa" element={
                        <MapPage
                            pets={pets}
                            onNavigate={(path) => navigate(path)}
                        />
                    } />
                </Route>

                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Modals */}
            {isReportModalOpen && (
                <ReportPetForm 
                    onClose={() => { setIsReportModalOpen(false); setSelectedPetForModal(null); }} 
                    onSubmit={handleSubmitPet}
                    initialStatus={reportStatus}
                    petToEdit={selectedPetForModal}
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
                        navigate(`/mascota/${pet.id}`);
                    }}
                />
            )}

            {isFlyerModalOpen && selectedPetForModal && (
                <FlyerModal 
                    pet={selectedPetForModal} 
                    onClose={() => { setIsFlyerModalOpen(false); setSelectedPetForModal(null); }} 
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
                             navigate(`/chat/${existingChat.id}`);
                             setIsUserDetailModalOpen(false);
                         } else {
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
                                    const createdChat: Chat = { 
                                        id: newChatId,
                                        participantEmails: [currentUser.email, recipientEmail],
                                        messages: [],
                                        lastReadTimestamps: timestamps
                                    };
                                    setChats(prev => [...prev, createdChat]);
                                    navigate(`/chat/${newChatId}`);
                                    setIsUserDetailModalOpen(false);
                                }
                             });
                         }
                    }}
                    onGhostLogin={ghostLogin}
                    onViewUser={handleViewUser}
                />
            )}

            {/* Expiration / Renewal Modal */}
            {petToRenew && (
                <RenewModal
                    pet={petToRenew}
                    onClose={() => setPetToRenew(null)}
                    onRenew={handleRenewPet}
                    onMarkAsFound={handleMarkAsFound}
                />
            )}

            {/* 30-Day Status Check Modal */}
            {petToStatusCheck && (
                <StatusCheckModal
                    pet={petToStatusCheck}
                    onClose={() => setPetToStatusCheck(null)}
                    onConfirmFound={handleMarkAsFound}
                    onKeepLooking={handleKeepLooking}
                />
            )}
        </>
    );
};

export default App;
