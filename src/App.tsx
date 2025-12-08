
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
// Features
import { 
  PetList, 
  ReportPetForm, 
  PetDetailPage, 
  PotentialMatchesModal,
  ReportAdoptionForm,
  RenewModal,
  StatusCheckModal,
  ReunitedPetsPage
} from '@/features/pets';
import { AuthPage, ProfileSetupPage } from '@/features/auth';
import { ProfilePage, UserPublicProfileModal } from '@/features/profile';
import { AdminDashboard, AdminUserDetailModal } from '@/features/admin';
import { CampaignsPage, CampaignDetailPage } from '@/features/campaigns';
import { ChatPage, MessagesPage } from '@/features/chat';
import { SupportPage } from '@/features/support';
import { MapPage } from '@/features/maps';
import { ServicesMapPage } from '@/features/maps';
import { BusinessDetailPage } from '@/features/businesses';

// Shared
import { Layout, FlyerModal, ErrorBoundary, WarningIcon, OnboardingTour } from '@/shared';
import type { TourStep } from '@/shared';

// Pages
import { AboutPage, TipsPage, TermsPage } from '@/pages';

// Types & Constants
import type { PetRow, PetStatus, ChatRow, User, UserRole, PotentialMatch, UserStatus, ReportRow, ReportReason, ReportType, ReportStatus as ReportStatusType, SupportTicketRow, SupportTicketCategory, CampaignRow, CommentRow } from './types';
import { PET_STATUS, USER_ROLES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES } from './constants';

// Services & Utils
import { useAuth } from './contexts/auth';
import { findMatchingPets } from './services/geminiService';
import { generateUUID } from './utils/uuid';
import { useAppData } from './hooks/useAppData';
import { usePetFilters } from './hooks/usePetFilters';
import { usePets as usePetsHook } from './hooks/usePets';
import { sendPageView, trackPetReunited } from './services/analytics';

// API Hooks
import {
  useCreatePet,
  useUpdatePet,
  useDeletePet,
  useRenewPet,
  useUpdatePetStatus,
  useRecordContactRequest,
  useCreateSavedSearch,
  useCreateNotification,
  useCreateChat,
  useSendMessage,
  useMarkChatAsRead,
  useCreateReport,
  useUpdateReportStatus,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useCreateSupportTicket,
  useUpdateSupportTicket,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useCreateComment,
  useToggleCommentLike,
  useDeleteComment,
  useUpdateUserStatus,
  useUpdateUserRole,
  usePetsByUserId
} from '@/api';

// Stable empty array to prevent hook dependency loops
const EMPTY_PETS_ARRAY: PetRow[] = [];

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
    
    // Analytics: Track Page Views
    useEffect(() => {
        sendPageView(location.pathname + location.search);
    }, [location]);

    // State from Hooks
    const { filters, setFilters, resetFilters } = usePetFilters(EMPTY_PETS_ARRAY);
    const { pets, loading: petsLoading, loadMore, hasMore, isError: petsError, refetch: refetchPets } = usePetsHook({ filters });
    const { 
        users, setUsers, 
        chats, setChats, 
        reports, setReports, 
        supportTickets, setSupportTickets, 
        campaigns, setCampaigns, 
        notifications, setNotifications,
        bannedIps, 
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
    const [selectedPetForModal, setSelectedPetForModal] = useState<PetRow | null>(null);
    const [petToRenew, setPetToRenew] = useState<PetRow | null>(null);
    const [petToStatusCheck, setPetToStatusCheck] = useState<PetRow | null>(null);
    const [isPublicProfileModalOpen, setIsPublicProfileModalOpen] = useState(false);
    const [publicProfileUser, setPublicProfileUser] = useState<User | null>(null);
    const [reportStatus, setReportStatus] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
    const [pendingPetToSubmit, setPendingPetToSubmit] = useState<Omit<PetRow, 'id' | 'user_id'> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [petToPrefill, setPetToPrefill] = useState<Partial<PetRow> | null>(null);
    
    // IP Ban State
    const [isIpBanned, setIsIpBanned] = useState(false);
    const [checkingIp, setCheckingIp] = useState(true);

    // --- Platform Settings State ---
    const [isAiSearchEnabled, setIsAiSearchEnabled] = useState(() => {
        const stored = localStorage.getItem('platform_aiSearchEnabled');
        return stored !== null ? JSON.parse(stored) : true;
    });
    const [isLocationAlertsEnabled, setIsLocationAlertsEnabled] = useState(() => {
        const stored = localStorage.getItem('platform_locationAlertsEnabled');
        return stored !== null ? JSON.parse(stored) : false;
    });
    const [locationAlertRadius, setLocationAlertRadius] = useState(() => {
        const stored = localStorage.getItem('platform_locationAlertRadius');
        return stored !== null ? JSON.parse(stored) : 3;
    });

    useEffect(() => localStorage.setItem('platform_aiSearchEnabled', JSON.stringify(isAiSearchEnabled)), [isAiSearchEnabled]);
    useEffect(() => localStorage.setItem('platform_locationAlertsEnabled', JSON.stringify(isLocationAlertsEnabled)), [isLocationAlertsEnabled]);
    useEffect(() => localStorage.setItem('platform_locationAlertRadius', JSON.stringify(locationAlertRadius)), [locationAlertRadius]);

    // --- IP Check Effect ---
    useEffect(() => {
        const checkIp = async () => {
            try {
                if (bannedIps && bannedIps.length > 0) {
                    const response = await fetch('https://api.ipify.org?format=json');
                    if (response.ok) {
                        const data = await response.json();
                        const userIp = data.ip;
                        const isBanned = bannedIps.some(b => b.ipAddress === userIp);
                        if (isBanned) {
                            setIsIpBanned(true);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to check IP", e);
            } finally {
                setCheckingIp(false);
            }
        };
        
        checkIp();
    }, [bannedIps]);

    // Auto-close sidebar
    useEffect(() => {
        if (['/mapa', '/nosotros', '/servicios', '/reunidos', '/tips', '/terminos'].includes(location.pathname)) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Status check logic - using notifications query hook
    const hasCheckedStatusRef = useRef<string | null>(null);
    const { data: userPetsData } = usePetsByUserId(currentUser?.id);
    const createNotificationForStatus = useCreateNotification();
    
    useEffect(() => {
        if (!currentUser || !userPetsData || !notifications) return;
        if (hasCheckedStatusRef.current === currentUser.id) return;
        const checkStatuses = async () => {
            hasCheckedStatusRef.current = currentUser.id || '';
            const now = new Date();
            if (!userPetsData || userPetsData.length === 0) return;
            const existingNotifs = notifications || [];
            let newNotificationAdded = false;
            for (const pet of userPetsData) {
                let expirationDate = pet.expires_at ? new Date(pet.expires_at) : new Date(new Date(pet.created_at || 0).getTime() + (60 * 24 * 60 * 60 * 1000));
                const isExpired = now > expirationDate;
                if (isExpired) {
                    const alreadyNotified = existingNotifs.some((n: any) => (typeof n.link === 'object' && n.link?.type === 'pet-renew' && n.link?.id === pet.id));
                    if (!alreadyNotified) {
                        if (currentUser.id) {
                            await createNotificationForStatus.mutateAsync({
                                id: generateUUID(),
                                userId: currentUser.id,
                                message: `Tu publicación de "${pet.name}" ha expirado.`,
                                link: { type: 'pet-renew', id: pet.id }
                            });
                        }
                        newNotificationAdded = true;
                    }
                }
            }
            if (newNotificationAdded) queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };
        checkStatuses();
    }, [currentUser?.id, userPetsData, notifications, createNotificationForStatus, queryClient]);

    const getUserIdByEmail = (email: string) => users.find(u => u.email === email)?.id;
    
    const handleReportPet = (status: PetStatus) => {
        if (!currentUser) return navigate('/login');
        setReportStatus(status);
        setIsReportModalOpen(true);
    };

    const updatePet = useUpdatePet();
    const createPet = useCreatePet();
    const createSavedSearch = useCreateSavedSearch();
    const createNotification = useCreateNotification();

    const handleSubmitPet = async (petData: any, idToUpdate?: string) => {
        if (idToUpdate) {
             try {
                await updatePet.mutateAsync({
                    id: idToUpdate,
                    data: {
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
                        imageUrls: petData.imageUrls,
                        adoptionRequirements: petData.adoptionRequirements,
                        shareContactInfo: petData.shareContactInfo,
                        reward: petData.reward,
                        currency: petData.currency,
                        lat: petData.lat,
                        lng: petData.lng
                    }
                });
                setIsReportModalOpen(false);
             } catch (err: any) { alert('Error al actualizar: ' + err.message); }
            return;
        }
        
        // AI Search Logic (Gated by Feature Toggle)
        if (isAiSearchEnabled && (petData.status === PET_STATUS.PERDIDO || petData.status === PET_STATUS.ENCONTRADO || petData.status === PET_STATUS.AVISTADO)) {
             try {
                 const matches = await findMatchingPets(petData);
                 if (matches.length > 0) {
                     setPotentialMatches(matches); 
                     setPendingPetToSubmit(petData); 
                     setIsReportModalOpen(false); 
                     setIsMatchModalOpen(true); 
                     return;
                 }
             } catch (e) {
                 console.error("Error during AI search:", e);
             }
        }
        
        finalizePetSubmission(petData);
    };

    const finalizePetSubmission = async (petData: any) => {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            const newPetId = await createPet.mutateAsync({
                ...petData,
                userId: currentUser.id,
                isAiSearchEnabled
            });
            
            if (petData.createAlert && petData.status === PET_STATUS.PERDIDO) {
                const alertName = `Alerta: ${petData.breed} (${petData.color})`;
                const dept = petData.location.split(',').map((s: string) => s.trim()).pop() || 'Todos';
                
                await createSavedSearch.mutateAsync({
                    name: alertName,
                    filters: {
                        status: 'Todos', 
                        type: petData.animalType,
                        breed: petData.breed,
                        department: dept
                    }
                });
            }

            await createNotification.mutateAsync({
                id: generateUUID(),
                userId: currentUser.id || '',
                message: `Has publicado exitosamente el reporte de "${petData.name}".`,
                link: { type: 'pet', id: newPetId }
            });
            
            setIsReportModalOpen(false); setIsAdoptionModalOpen(false); setIsMatchModalOpen(false); setPendingPetToSubmit(null); setPetToPrefill(null);
        } catch (err: any) { 
            alert("Error al publicar: " + err.message); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const renewPet = useRenewPet();
    const updatePetStatus = useUpdatePetStatus();
    const deletePet = useDeletePet();

    const handleRenewPet = async (pet: PetRow) => {
        if (!currentUser) return;
        try {
            await renewPet.mutateAsync(pet.id);
            setPetToRenew(null);
            alert(`Publicación renovada.`);
        } catch (err: any) { alert("Error al renovar: " + err.message); }
    };

    const handleMarkAsFound = async (pet: PetRow) => {
        try { 
            await updatePetStatus.mutateAsync({ id: pet.id, status: PET_STATUS.REUNIDO });
            trackPetReunited(pet.id);
            setPetToRenew(null); setPetToStatusCheck(null); 
            alert("¡Felicidades!"); 
        } catch(e:any){ alert(e.message); }
    };
    const handleKeepLooking = () => { setPetToStatusCheck(null); };
    const handleDeletePet = async (petId: string) => { 
        try { 
            await deletePet.mutateAsync(petId);
            navigate('/'); 
        } catch(e:any){ alert(e.message); } 
    };
    const handleUpdatePetStatus = async (petId: string, status: PetStatus) => { 
        try { 
            await updatePetStatus.mutateAsync({ id: petId, status }); 
        } catch(e:any){ alert(e.message); } 
    };
    
    const updateUserStatus = useUpdateUserStatus();
    const updateUserRole = useUpdateUserRole();

    const handleUpdateUserStatus = async (email: string, status: UserStatus) => { 
        try { 
            await updateUserStatus.mutateAsync({ email, status });
            setUsers((prev: User[]) => prev.map((u: User) => u.email === email ? { ...u, status } : u)); 
        } catch(e:any){ alert(e.message); } 
    };
    const handleUpdateUserRole = async (email: string, role: UserRole) => { 
        try { 
            await updateUserRole.mutateAsync({ email, role });
            setUsers((prev: User[]) => prev.map((u: User) => u.email === email ? { ...u, role } : u)); 
        } catch(e:any){ alert(e.message); } 
    };
    
    const createChat = useCreateChat();
    const sendMessage = useSendMessage();
    const markChatAsRead = useMarkChatAsRead();

    const handleStartChat = async (pet: PetRow) => {
        if (!currentUser) return navigate('/login');
        const existingChat = chats.find(c => c.pet_id === pet.id && c.participant_emails?.includes(currentUser.email));
        if (existingChat) { navigate(`/chat/${existingChat.id}`); return; }
        try {
            // Try multiple methods to get owner email
            let petOwnerEmail = '';
            let petOwner: User | null = null;
            
            // Method 1: Check if pet has userEmail property (from mapped Pet type)
            const petWithEmail = pet as any;
            if (petWithEmail.userEmail) {
                petOwnerEmail = petWithEmail.userEmail;
                petOwner = users.find(u => u.email === petOwnerEmail) || null;
            }
            
            // Method 2: Find by user_id in users list
            if (!petOwnerEmail && pet.user_id) {
                petOwner = users.find(u => u.id === pet.user_id) || null;
                petOwnerEmail = petOwner?.email || '';
            }
            
            // Method 3: If still not found, fetch from database
            if (!petOwnerEmail && pet.user_id) {
                try {
                    const { getUserById } = await import('@/api/users/users.api');
                    const ownerProfile = await getUserById(pet.user_id);
                    if (ownerProfile) {
                        petOwnerEmail = ownerProfile.email;
                        petOwner = ownerProfile;
                        // Add to users list for future use
                        setUsers((prev: User[]) => {
                            if (!prev.find(u => u.id === pet.user_id)) {
                                return [...prev, ownerProfile];
                            }
                            return prev;
                        });
                    }
                } catch (fetchError) {
                    // Silently fail and continue
                }
            }
            
            if (!petOwnerEmail) {
                alert('No se pudo encontrar el dueño de la mascota. Por favor, intenta nuevamente.');
                return;
            }
            
            // Normalize emails (lowercase, trim)
            const normalizeEmail = (email: string) => email?.toLowerCase().trim() || '';
            const normalizedCurrentUserEmail = normalizeEmail(currentUser.email);
            const normalizedPetOwnerEmail = normalizeEmail(petOwnerEmail);
            
            const chatId = await createChat.mutateAsync({
                petId: pet.id,
                participantEmails: [normalizedCurrentUserEmail, normalizedPetOwnerEmail]
            });
            const now = new Date().toISOString();
            setChats((prev: ChatRow[]) => [...prev, { 
                id: chatId, 
                pet_id: pet.id, 
                participant_emails: [normalizedCurrentUserEmail, normalizedPetOwnerEmail], 
                messages: null, 
                last_read_timestamps: {}, 
                created_at: now 
            } as ChatRow]);
            navigate(`/chat/${chatId}`);
        } catch(e:any){ 
            alert(e.message); 
        }
    };

    const handleStartUserChat = async (email: string) => {
        if (!currentUser) return navigate('/login');
        
        // Normalize emails for comparison
        const normalizeEmail = (email: string) => email?.toLowerCase().trim() || '';
        const normalizedCurrentEmail = normalizeEmail(currentUser.email);
        const normalizedOtherEmail = normalizeEmail(email);
        
        const existingChat = chats.find(c => {
            const emails = c.participant_emails || [];
            return emails.some(e => normalizeEmail(e) === normalizedCurrentEmail) && 
                   emails.some(e => normalizeEmail(e) === normalizedOtherEmail) && 
                   !c.pet_id;
        });
        if (existingChat) { navigate(`/chat/${existingChat.id}`); return; }
        try {
            const chatId = await createChat.mutateAsync({
                participantEmails: [normalizedCurrentEmail, normalizedOtherEmail]
            });
            const now = new Date().toISOString();
            setChats((prev: ChatRow[]) => [...prev, { 
                id: chatId, 
                pet_id: null, 
                participant_emails: [normalizedCurrentEmail, normalizedOtherEmail], 
                messages: null, 
                last_read_timestamps: {}, 
                created_at: now 
            } as ChatRow]);
            navigate(`/chat/${chatId}`);
        } catch(e:any){ 
            alert('Error starting chat'); 
        }
    };
    
    const handleSendMessage = useCallback(async (chatId: string, text: string) => {
        if (!currentUser) return;
        try { 
            await sendMessage.mutateAsync({ chatId, text }); 
        } catch(e:any){ console.error(e); }
    }, [currentUser, sendMessage]);

    const handleMarkChatAsRead = useCallback(async (chatId: string) => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        setChats((prev: ChatRow[]) => prev.map((c: ChatRow) => {
            if (c.id === chatId) {
                const timestamps = (c.last_read_timestamps as Record<string, string>) || {};
                return { ...c, last_read_timestamps: { ...timestamps, [currentUser.email]: now } };
            }
            return c;
        }));
        await markChatAsRead.mutateAsync(chatId); 
    }, [currentUser, markChatAsRead]);

    const createReport = useCreateReport();
    const updateReportStatus = useUpdateReportStatus();
    const createSupportTicket = useCreateSupportTicket();
    const updateSupportTicket = useUpdateSupportTicket();

    const handleReport = async (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
        try {
            await createReport.mutateAsync({ type, targetId, reason, details, reportedEmail: '' });
            alert('Reporte enviado.');
        } catch(e:any){ alert(e.message); }
    };

    const handleUpdateReportStatus = async (reportId: string, status: ReportStatusType) => { 
        try { 
            await updateReportStatus.mutateAsync({ id: reportId, status });
            setReports((prev: ReportRow[]) => prev.map((r: ReportRow) => r.id === reportId ? { ...r, status } : r)); 
        } catch(e:any){ alert(e.message); } 
    };
    const handleAddSupportTicket = async (category: SupportTicketCategory, subject: string, description: string) => { 
        if(currentUser) { 
            await createSupportTicket.mutateAsync({ category, subject, description }); 
        } 
    };
    const handleUpdateSupportTicket = async (ticket: SupportTicketRow) => { 
        await updateSupportTicket.mutateAsync({ 
            id: ticket.id, 
            data: { 
                status: ticket.status || undefined, 
                response: ticket.response || undefined, 
                assignedTo: ticket.assigned_to || undefined 
            } 
        }); 
    };
    
    const createCampaign = useCreateCampaign();
    const updateCampaign = useUpdateCampaign();
    const deleteCampaign = useDeleteCampaign();

    const handleSaveCampaign = async (data: any, id?: string) => {
        try {
            if(id) {
                await updateCampaign.mutateAsync({
                    id,
                    data: {
                        title: data.title,
                        description: data.description,
                        type: data.type,
                        location: data.location,
                        date: data.date,
                        contactPhone: data.contactPhone,
                        imageUrls: data.imageUrls,
                        lat: data.lat,
                        lng: data.lng
                    }
                });
            } else if(currentUser) {
                await createCampaign.mutateAsync({
                    title: data.title,
                    description: data.description,
                    type: data.type,
                    location: data.location,
                    date: data.date,
                    contactPhone: data.contactPhone,
                    imageUrls: data.imageUrls,
                    lat: data.lat,
                    lng: data.lng
                });
            }
        } catch (err: any) { console.error("Error saving campaign:", err); alert("Error al guardar la campaña: " + err.message); }
    };

    const handleDeleteCampaign = async (id: string) => { 
        await deleteCampaign.mutateAsync(id); 
    };
    const handleViewAdminUser = (user: User) => { setSelectedUserProfile(user); setIsUserDetailModalOpen(true); };
    const handleViewPublicProfile = (user: User) => { setPublicProfileUser(user); setIsPublicProfileModalOpen(true); };
    
    const markNotificationAsRead = useMarkNotificationAsRead();
    const markAllNotificationsAsRead = useMarkAllNotificationsAsRead();

    const handleMarkNotificationAsRead = async (id: string) => { 
        await markNotificationAsRead.mutateAsync(id);
        setNotifications((prev: NotificationRow[]) => prev.map((n: NotificationRow) => n.id === id ? { ...n, is_read: true } : n)); 
    };
    const handleMarkAllNotificationsAsRead = async () => {
        if (!currentUser) return;
        setNotifications((prev: NotificationRow[]) => prev.map((n: NotificationRow) => ({ ...n, is_read: true })));
        await markAllNotificationsAsRead.mutateAsync();
    };
    
    const recordContactRequest = useRecordContactRequest();
    const createComment = useCreateComment();
    const toggleCommentLike = useToggleCommentLike();
    const deleteComment = useDeleteComment();

    const handleRecordContactRequest = async (petId: string) => { 
        if(!currentUser) return;
        try {
            const pet = pets.find(p => p.id === petId);
            await recordContactRequest.mutateAsync({
                petId,
                userEmail: currentUser.email,
                existingRequests: pet?.contactRequests
            });
        } catch (e) { console.error("Error recording contact request:", e); }
    };
    const handleAddComment = async (petId: string, text: string, parentId?: string) => {
        if(!currentUser) return;
        try {
            await createComment.mutateAsync({ petId, text, parentId });
        } catch (error: any) { console.error("Error adding comment:", error); alert("Error al enviar el comentario: " + (error.message || "Error desconocido")); }
    };
    const handleLikeComment = async (petId: string, commentId: string) => {
        if(!currentUser) return;
        await toggleCommentLike.mutateAsync({ commentId, petId });
    };
    const handleDeleteComment = async (id: string, petId?: string) => { 
        // petId is required for cache invalidation
        if (!petId) {
            console.warn('handleDeleteComment called without petId');
            return;
        }
        await deleteComment.mutateAsync({ id, petId }); 
    };

    const hasUnreadMessages = currentUser ? chats.some(c => {
        if (!c.participant_emails?.includes(currentUser.email)) return false;
        const lastMsg = c.messages?.[c.messages.length - 1];
        if (!lastMsg || lastMsg.sender_email === currentUser.email) return false;
        const timestamps = (c.last_read_timestamps as Record<string, string>) || {};
        const lastRead = timestamps[currentUser.email] || new Date(0).toISOString();
        return lastMsg.timestamp ? new Date(lastMsg.timestamp) > new Date(lastRead) : false;
    }) : false;

    const homeTourSteps: TourStep[] = [
        { target: '[data-tour="header-report-btn"]', title: '¡Reporta una Mascota!', content: 'Aquí puedes publicar rápidamente si perdiste a tu mascota, encontraste una o viste una deambulando.', position: 'bottom' },
        { target: '[data-tour="nav-map"]', title: 'Mapa de Mascotas', content: 'Explora un mapa interactivo para ver dónde se han perdido o encontrado mascotas cerca de tu ubicación.', position: 'right' },
        { target: '[data-tour="nav-campaigns"]', title: 'Campañas de Ayuda', content: 'Descubre eventos de esterilización y adopción organizados por la comunidad.', position: 'right' },
        { target: '[data-tour="nav-reunited"]', title: 'Reencuentros', content: 'Inspírate con historias de éxito de mascotas que regresaron a casa.', position: 'right' },
        { target: '[data-tour="sidebar-filters"]', title: 'Filtra tu Búsqueda', content: 'Usa estos filtros para encontrar mascotas específicas por estado (perdido/encontrado), tipo, raza o ubicación.', position: 'right' },
        { target: '[data-tour="header-account-btn"]', title: 'Tu Perfil', content: 'Accede a tu perfil para ver tus publicaciones, mensajes y tu progreso en el sistema de puntos.', position: 'bottom' }
    ];

    if (isIpBanned) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md border-t-8 border-red-600">
                    <div className="flex justify-center mb-6"><div className="p-4 bg-red-100 rounded-full"><WarningIcon className="h-16 w-16 text-red-600" /></div></div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
                    <p className="text-gray-600 mb-6">Tu dirección IP ha sido bloqueada temporal o permanentemente debido a una violación de nuestros términos de servicio o actividad sospechosa.</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary name="Root">
            {currentUser && location.pathname === '/' && (
                <OnboardingTour 
                    steps={homeTourSteps} 
                    tourId="home_v1" 
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    onCloseSidebar={() => setIsSidebarOpen(false)}
                />
            )}

            <Routes>
                <Route path="/" element={<Layout onReportPet={handleReportPet} onOpenAdoptionModal={() => setIsAdoptionModalOpen(true)} isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onCloseSidebar={() => setIsSidebarOpen(false)} hasUnreadMessages={hasUnreadMessages} notifications={notifications} onMarkNotificationAsRead={handleMarkNotificationAsRead} onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead} filters={filters} setFilters={setFilters} onResetFilters={resetFilters} />}>
                    <Route index element={
                        <ErrorBoundary name="PetList">
                            <PetList pets={pets} users={users} onViewUser={handleViewPublicProfile} filters={filters} setFilters={setFilters} onNavigate={(path) => navigate(path)} onSelectStatus={(status) => setFilters(prev => ({ ...prev, status }))} onReset={() => { resetFilters(); navigate('/'); }} loadMore={loadMore} hasMore={hasMore} isLoading={petsLoading} isError={petsError} onRetry={() => refetchPets()} />
                        </ErrorBoundary>
                    } />
                    
                    <Route path="perfil" element={<ProtectedRoute><ErrorBoundary name="Profile"><ProfilePage user={currentUser!} reportedPets={pets.filter(p => {
                        const petOwner = users.find(u => u.id === p.user_id);
                        return petOwner?.email === currentUser?.email;
                    })} allPets={pets} users={users} onBack={() => navigate('/')} onReportOwnedPetAsLost={(ownedPet) => {
                        setReportStatus(PET_STATUS.PERDIDO);
                        const prefill: Partial<PetRow> = {
                            name: ownedPet.name,
                            animal_type: ownedPet.animalType as any,
                            breed: ownedPet.breed,
                            color: ownedPet.colors.join(', '),
                            description: ownedPet.description || '',
                            image_urls: ownedPet.imageUrls || [],
                            contact: currentUser?.phone || ''
                        };
                        setPetToPrefill(prefill);
                        setIsReportModalOpen(true);
                    }} onNavigate={(path) => navigate(path)} onViewUser={handleViewPublicProfile} onRenewPet={(pet) => setPetToRenew(pet)} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="setup-profile" element={<ProfileSetupPage />} />
                    <Route path="mensajes" element={<ProtectedRoute><ErrorBoundary name="Messages"><MessagesPage chats={chats.filter(c => c.participant_emails?.includes(currentUser!.email)).map(c => ({ ...c, isUnread: false })).sort((a, b) => {
                        const aMessages = (a.messages as any) || [];
                        const bMessages = (b.messages as any) || [];
                        const aMsg = aMessages.length > 0 ? aMessages[aMessages.length - 1] : null;
                        const bMsg = bMessages.length > 0 ? bMessages[bMessages.length - 1] : null;
                        const aTime = aMsg?.created_at ? new Date(aMsg.created_at).getTime() : 0;
                        const bTime = bMsg?.created_at ? new Date(bMsg.created_at).getTime() : 0;
                        return bTime - aTime;
                    })} pets={pets} users={users} currentUser={currentUser!} onSelectChat={(id) => navigate(`/chat/${id}`)} onBack={() => navigate('/')} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="admin" element={<ProtectedRoute roles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}><ErrorBoundary name="Admin"><AdminDashboard onBack={() => navigate('/')} users={users} onViewUser={handleViewAdminUser} pets={pets} chats={chats} reports={reports} supportTickets={supportTickets} onUpdateReportStatus={handleUpdateReportStatus} onDeletePet={handleDeletePet} onUpdateSupportTicket={handleUpdateSupportTicket} isAiSearchEnabled={isAiSearchEnabled} onToggleAiSearch={() => setIsAiSearchEnabled(!isAiSearchEnabled)} isLocationAlertsEnabled={isLocationAlertsEnabled} onToggleLocationAlerts={() => setIsLocationAlertsEnabled(!isLocationAlertsEnabled)} locationAlertRadius={locationAlertRadius} onSetLocationAlertRadius={setLocationAlertRadius} campaigns={campaigns} onSaveCampaign={handleSaveCampaign} onDeleteCampaign={handleDeleteCampaign} onNavigate={(path) => navigate(path)} onDeleteComment={handleDeleteComment} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="soporte" element={<ProtectedRoute><ErrorBoundary name="Support"><SupportPage currentUser={currentUser!} userTickets={supportTickets.filter(t => t.user_email === currentUser?.email)} userReports={reports.filter(r => r.reporter_email === currentUser?.email)} onAddTicket={handleAddSupportTicket} onBack={() => navigate('/')} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="campanas" element={<ErrorBoundary name="Campaigns"><CampaignsPage campaigns={campaigns} onNavigate={(path) => navigate(path)} /></ErrorBoundary>} />
                    <Route path="mapa" element={<ErrorBoundary name="Map"><MapPage onNavigate={(path) => navigate(path)} /></ErrorBoundary>} />
                    <Route path="servicios" element={<ErrorBoundary name="Services"><ServicesMapPage /></ErrorBoundary>} />
                    <Route path="nosotros" element={<AboutPage />} />
                    <Route path="reunidos" element={<ErrorBoundary name="Reunited"><ReunitedPetsPage /></ErrorBoundary>} />
                    <Route path="tips" element={<TipsPage />} />
                    <Route path="terminos" element={<TermsPage />} />

                    <Route path="mascota/:id" element={<ErrorBoundary name="PetDetail"><PetDetailPage pet={undefined} onClose={() => navigate('/')} onStartChat={handleStartChat} onEdit={(pet) => { setReportStatus(pet.status); setSelectedPetForModal(pet); setIsReportModalOpen(true); }} onDelete={handleDeletePet} onGenerateFlyer={(pet) => { setSelectedPetForModal(pet); setIsFlyerModalOpen(true); }} onUpdateStatus={handleUpdatePetStatus} users={users} onViewUser={handleViewPublicProfile} onReport={handleReport} onRecordContactRequest={handleRecordContactRequest} onAddComment={handleAddComment} onLikeComment={handleLikeComment} /></ErrorBoundary>} />
                    <Route path="chat/:id" element={<ProtectedRoute><ErrorBoundary name="Chat"><ChatPage chat={undefined} pet={undefined} users={users} currentUser={currentUser!} onSendMessage={handleSendMessage} onBack={() => navigate('/mensajes')} onMarkAsRead={handleMarkChatAsRead} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="campanas/:id" element={<ErrorBoundary name="CampaignDetail"><CampaignDetailPage campaign={undefined} onClose={() => navigate('/campanas')} /></ErrorBoundary>} />
                    <Route path="negocio/:id" element={<ErrorBoundary name="BusinessDetail"><BusinessDetailPage /></ErrorBoundary>} />
                </Route>
                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {isReportModalOpen && <ReportPetForm onClose={() => { setIsReportModalOpen(false); setSelectedPetForModal(null); setPetToPrefill(null); }} onSubmit={handleSubmitPet} initialStatus={reportStatus} petToEdit={selectedPetForModal} dataToPrefill={petToPrefill} isSubmitting={isSubmitting} />}
            {isAdoptionModalOpen && <ReportAdoptionForm onClose={() => setIsAdoptionModalOpen(false)} onSubmit={(pet) => finalizePetSubmission(pet)} />}
            {isMatchModalOpen && pendingPetToSubmit && <PotentialMatchesModal matches={potentialMatches} onClose={() => { setIsMatchModalOpen(false); setPendingPetToSubmit(null); }} onConfirmPublication={() => finalizePetSubmission(pendingPetToSubmit)} onPetSelect={(pet) => { setIsMatchModalOpen(false); navigate(`/mascota/${pet.id}`); }} />}
            {isFlyerModalOpen && selectedPetForModal && <FlyerModal pet={selectedPetForModal} onClose={() => { setIsFlyerModalOpen(false); setSelectedPetForModal(null); }} />}
            {isUserDetailModalOpen && selectedUserProfile && <AdminUserDetailModal user={selectedUserProfile} allPets={pets} allChats={chats} allUsers={users} onClose={() => { setIsUserDetailModalOpen(false); setSelectedUserProfile(null); }} onUpdateStatus={handleUpdateUserStatus} onUpdateRole={handleUpdateUserRole} onStartChat={handleStartUserChat} onGhostLogin={ghostLogin} onViewUser={handleViewAdminUser} />}
            {petToRenew && <RenewModal pet={petToRenew} onClose={() => setPetToRenew(null)} onRenew={handleRenewPet} onMarkAsFound={handleMarkAsFound} />}
            {petToStatusCheck && <StatusCheckModal pet={petToStatusCheck} onClose={() => setPetToStatusCheck(null)} onConfirmFound={handleMarkAsFound} onKeepLooking={handleKeepLooking} />}
            {isPublicProfileModalOpen && publicProfileUser && <UserPublicProfileModal isOpen={isPublicProfileModalOpen} onClose={() => { setIsPublicProfileModalOpen(false); setPublicProfileUser(null); }} targetUser={publicProfileUser} onViewAdminProfile={handleViewAdminUser} />}
        </ErrorBoundary>
    );
};

export default App;
