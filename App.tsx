
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { PetList } from './components/PetList';
import { ReportPetForm } from './components/ReportPetForm';
import { PetDetailPage } from './components/PetDetailPage';
import type { Pet, PetStatus, Chat, User, UserRole, PotentialMatch, UserStatus, Report, ReportReason, ReportType, ReportStatus as ReportStatusType, SupportTicket, SupportTicketCategory, Campaign, Comment } from './types';
import { PET_STATUS, USER_ROLES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES } from './constants';
import { useAuth } from './contexts/AuthContext';
import ProfilePage from './components/ProfilePage';
import AuthPage from './components/AuthPage';
import ProfileSetupPage from './components/ProfileSetupPage';
import MessagesPage from './components/MessagesPage';
import { ChatPage } from './components/ChatPage';
import AdminDashboard from './components/AdminDashboard';
import { findMatchingPets, generatePetEmbedding } from './services/geminiService';
import { PotentialMatchesModal } from './components/PotentialMatchesModal';
import { FlyerModal } from './components/FlyerModal';
import { ReportAdoptionForm } from './components/ReportAdoptionForm';
import AdminUserDetailModal from './components/AdminUserDetailModal';
import SupportPage from './components/SupportPage';
import CampaignsPage from './components/CampaignsPage';
import CampaignDetailPage from './components/CampaignDetailPage';
import MapPage from './components/MapPage';
import ServicesMapPage from './components/ServicesMapPage';
import BusinessDetailPage from './components/BusinessDetailPage';
import { RenewModal } from './components/RenewModal';
import { StatusCheckModal } from './components/StatusCheckModal';
import UserPublicProfileModal from './components/UserPublicProfileModal';
import AboutPage from './components/AboutPage';
import ReunitedPetsPage from './components/ReunitedPetsPage';
import { supabase } from './services/supabaseClient';
import { generateUUID } from './utils/uuid';
import { WarningIcon } from './components/icons';

import { useAppData } from './hooks/useAppData';
import { usePetFilters } from './hooks/usePetFilters';
import { usePets } from './hooks/usePets';
import { sendPageView, trackPetReunited, trackReportPet } from './services/analytics';
import { logActivity, POINTS_CONFIG } from './services/gamificationService';
import { OnboardingTour, TourStep } from './components/OnboardingTour';

// Stable empty array to prevent hook dependency loops
const EMPTY_PETS_ARRAY: Pet[] = [];

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
    const { pets, loading: petsLoading, loadMore, hasMore, isError: petsError, refetch: refetchPets } = usePets({ filters });
    const { 
        users, setUsers, 
        chats, setChats, 
        reports, setReports, 
        supportTickets, setSupportTickets, 
        campaigns, setCampaigns, 
        notifications, setNotifications,
        bannedIps, // Import banned IPs
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
    const [isPublicProfileModalOpen, setIsPublicProfileModalOpen] = useState(false);
    const [publicProfileUser, setPublicProfileUser] = useState<User | null>(null);
    const [reportStatus, setReportStatus] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
    const [pendingPetToSubmit, setPendingPetToSubmit] = useState<Omit<Pet, 'id' | 'userEmail'> | null>(null);
    
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
        if (location.pathname === '/mapa' || location.pathname === '/nosotros' || location.pathname === '/servicios' || location.pathname === '/reunidos') {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    // Status check logic
    const hasCheckedStatusRef = useRef<string | null>(null);
    useEffect(() => {
        if (!currentUser) return;
        if (hasCheckedStatusRef.current === currentUser.id) return;
        const checkStatuses = async () => {
            hasCheckedStatusRef.current = currentUser.id;
            const now = new Date();
            const { data: userPets } = await supabase.from('pets').select('id, name, expires_at, created_at, status').eq('user_id', currentUser.id);
            if (!userPets || userPets.length === 0) return;
            const { data: existingNotifs } = await supabase.from('notifications').select('link').eq('user_id', currentUser.id);
            let newNotificationAdded = false;
            for (const pet of userPets) {
                let expirationDate = pet.expires_at ? new Date(pet.expires_at) : new Date(new Date(pet.created_at).getTime() + (60 * 24 * 60 * 60 * 1000));
                const isExpired = now > expirationDate;
                if (isExpired) {
                    const alreadyNotified = existingNotifs?.some(n => (typeof n.link === 'object' && n.link?.type === 'pet-renew' && n.link?.id === pet.id));
                    if (!alreadyNotified) {
                        await supabase.from('notifications').insert({
                            id: generateUUID(), user_id: currentUser.id, message: `Tu publicación de "${pet.name}" ha expirado.`, link: { type: 'pet-renew', id: pet.id }, is_read: false, created_at: now.toISOString()
                        });
                        newNotificationAdded = true;
                    }
                }
            }
            if (newNotificationAdded) queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };
        checkStatuses();
    }, [currentUser?.id]);

    const getUserIdByEmail = (email: string) => users.find(u => u.email === email)?.id;
    
    const handleReportPet = (status: PetStatus) => {
        if (!currentUser) return navigate('/login');
        setReportStatus(status);
        setIsReportModalOpen(true);
    };

    const handleSubmitPet = async (petData: any, idToUpdate?: string) => {
        if (idToUpdate) {
             try {
                const { error } = await supabase.from('pets').update({
                    status: petData.status, name: petData.name, animal_type: petData.animalType, breed: petData.breed, color: petData.color, size: petData.size, location: petData.location, date: petData.date, contact: petData.contact, description: petData.description, image_urls: petData.imageUrls, adoption_requirements: petData.adoptionRequirements, share_contact_info: petData.shareContactInfo, reward: petData.reward, currency: petData.currency, lat: petData.lat, lng: petData.lng
                }).eq('id', idToUpdate);
                if (error) throw error;
                queryClient.invalidateQueries({ queryKey: ['pets'] });
                if (currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] });
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
        try {
            const newPetId = generateUUID();
            const now = new Date();
            const expirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
            
            let embedding = null;
            if (isAiSearchEnabled) {
                const contentToEmbed = `${petData.animalType} ${petData.breed} ${petData.color} ${petData.description}`;
                embedding = await generatePetEmbedding(contentToEmbed);
            }

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
                reward: petData.reward, 
                currency: petData.currency, 
                contact_requests: [], 
                lat: petData.lat, 
                lng: petData.lng, 
                created_at: now.toISOString(), 
                expires_at: expirationDate.toISOString(),
                embedding: embedding 
            });
            if (error) throw error;
            
            // --- AUTOMATIC ALERT CREATION ---
            if (petData.createAlert && petData.status === PET_STATUS.PERDIDO) {
                const alertName = `Alerta: ${petData.breed} (${petData.color})`;
                const dept = petData.location.split(',').map((s: string) => s.trim()).pop() || 'Todos';
                
                await supabase.from('saved_searches').insert({
                    id: generateUUID(),
                    user_id: currentUser.id,
                    name: alertName,
                    filters: {
                        status: 'Todos', // Match found/sighted
                        type: petData.animalType,
                        breed: petData.breed,
                        department: dept
                    },
                    created_at: now.toISOString()
                });
            }

            // Analytics & Gamification
            const locationParts = petData.location.split(',').map((s: string) => s.trim());
            const dept = locationParts[locationParts.length - 1] || 'Unknown';
            trackReportPet(petData.status, petData.animalType, dept);
            
            await logActivity(currentUser.id, 'report_pet', POINTS_CONFIG.REPORT_PET, { petId: newPetId, status: petData.status });

            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] });
            
            await supabase.from('notifications').insert({
                id: generateUUID(), user_id: currentUser.id, message: `Has publicado exitosamente el reporte de "${petData.name}".`, link: { type: 'pet', id: newPetId }, is_read: false, created_at: now.toISOString()
            });
            setIsReportModalOpen(false); setIsAdoptionModalOpen(false); setIsMatchModalOpen(false); setPendingPetToSubmit(null);
        } catch (err: any) { alert("Error al publicar: " + err.message); }
    };

    const handleRenewPet = async (pet: Pet) => {
        if (!currentUser) return;
        try {
            const now = new Date();
            const newExpirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
            await supabase.from('pets').update({ expires_at: newExpirationDate.toISOString(), created_at: now.toISOString() }).eq('id', pet.id);
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] });
            setPetToRenew(null);
            alert(`Publicación renovada.`);
        } catch (err: any) { alert("Error al renovar: " + err.message); }
    };

    const handleMarkAsFound = async (pet: Pet) => {
        try { 
            await supabase.from('pets').update({ status: PET_STATUS.REUNIDO }).eq('id', pet.id);
            trackPetReunited(pet.id);
            if (currentUser) await logActivity(currentUser.id, 'pet_reunited', POINTS_CONFIG.PET_REUNITED, { petId: pet.id });
            queryClient.invalidateQueries({ queryKey: ['pets'] }); 
            if(currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] }); 
            setPetToRenew(null); setPetToStatusCheck(null); 
            alert("¡Felicidades!"); 
        } catch(e:any){ alert(e.message); }
    };
    const handleKeepLooking = () => { setPetToStatusCheck(null); };
    const handleDeletePet = async (petId: string) => { try { await supabase.from('pets').delete().eq('id', petId); queryClient.invalidateQueries({ queryKey: ['pets'] }); if(currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] }); navigate('/'); } catch(e:any){ alert(e.message); } };
    const handleUpdatePetStatus = async (petId: string, status: PetStatus) => { 
        try { 
            await supabase.from('pets').update({ status }).eq('id', petId); 
            if (status === PET_STATUS.REUNIDO && currentUser) await logActivity(currentUser.id, 'pet_reunited', POINTS_CONFIG.PET_REUNITED, { petId: petId });
            queryClient.invalidateQueries({ queryKey: ['pets'] }); 
            if(currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] }); 
        } catch(e:any){ alert(e.message); } 
    };
    
    // ... (Other handlers like user status, chat, reports remain same)
    const handleUpdateUserStatus = async (email: string, status: UserStatus) => { try { await supabase.from('profiles').update({ status }).eq('email', email); setUsers(prev => prev.map(u => u.email === email ? { ...u, status } : u)); } catch(e:any){ alert(e.message); } };
    const handleUpdateUserRole = async (email: string, role: UserRole) => { try { await supabase.from('profiles').update({ role }).eq('email', email); setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u)); } catch(e:any){ alert(e.message); } };
    
    const handleStartChat = async (pet: Pet) => {
        if (!currentUser) return navigate('/login');
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        if (existingChat) { navigate(`/chat/${existingChat.id}`); return; }
        try {
            const chatId = generateUUID(); const now = new Date().toISOString();
            await supabase.from('chats').insert({ id: chatId, pet_id: pet.id, participant_emails: [currentUser.email, pet.userEmail], last_read_timestamps: { [currentUser.email]: now, [pet.userEmail]: new Date(0).toISOString() }, created_at: now });
            setChats(prev => [...prev, { id: chatId, petId: pet.id, participantEmails: [currentUser.email, pet.userEmail], messages: [], lastReadTimestamps: {} }]);
            navigate(`/chat/${chatId}`);
        } catch(e:any){ alert(e.message); }
    };

    const handleStartUserChat = async (email: string) => {
        if (!currentUser) return navigate('/login');
        
        const existingChat = chats.find(c => c.participantEmails.includes(currentUser.email) && c.participantEmails.includes(email) && !c.petId);
        
        if (existingChat) {
             navigate(`/chat/${existingChat.id}`);
             return;
        }
        
        const chatId = generateUUID();
        const now = new Date().toISOString();
        
        const { error } = await supabase.from('chats').insert({
            id: chatId,
            pet_id: null,
            participant_emails: [currentUser.email, email],
            last_read_timestamps: { [currentUser.email]: now, [email]: new Date(0).toISOString() },
            created_at: now
        });
        
        if (!error) {
             setChats(prev => [...prev, { id: chatId, petId: undefined, participantEmails: [currentUser.email, email], messages: [], lastReadTimestamps: {} }]);
             navigate(`/chat/${chatId}`);
        } else {
            alert('Error starting chat');
        }
    };
    
    const handleSendMessage = useCallback(async (chatId: string, text: string) => {
        if (!currentUser) return;
        try { await supabase.from('messages').insert({ id: generateUUID(), chat_id: chatId, sender_email: currentUser.email, text, created_at: new Date().toISOString() }); } catch(e:any){ console.error(e); }
    }, [currentUser]);

    const handleMarkChatAsRead = useCallback(async (chatId: string) => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        // Optimistic update
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastReadTimestamps: { ...c.lastReadTimestamps, [currentUser.email]: now } } : c));
        await supabase.from('chats').update({ last_read_timestamps: { [currentUser.email]: now } }).eq('id', chatId); 
    }, [currentUser]);

    const handleReport = async (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
        try {
            const reportId = generateUUID();
            await supabase.from('reports').insert({ id: reportId, reporter_email: currentUser.email, reported_email: '', type, target_id: targetId, reason, details, status: REPORT_STATUS.PENDING, created_at: new Date().toISOString() });
            alert('Reporte enviado.');
        } catch(e:any){ alert(e.message); }
    };

    const handleUpdateReportStatus = async (reportId: string, status: ReportStatusType) => { try { await supabase.from('reports').update({ status }).eq('id', reportId); setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r)); } catch(e:any){ alert(e.message); } };
    
    const handleAddSupportTicket = async (category: SupportTicketCategory, subject: string, description: string) => { if(currentUser) { await supabase.from('support_tickets').insert({ id: generateUUID(), user_email: currentUser.email, category, subject, description, status: SUPPORT_TICKET_STATUS.PENDING }); } };
    const handleUpdateSupportTicket = async (ticket: SupportTicket) => { await supabase.from('support_tickets').update({ status: ticket.status, response: ticket.response, assigned_to: ticket.assignedTo }).eq('id', ticket.id); };
    
    const handleSaveCampaign = async (data: any, id?: string) => {
        // Map camelCase to snake_case for DB
        const dbData = {
            title: data.title,
            description: data.description,
            type: data.type,
            location: data.location,
            date: data.date,
            contact_phone: data.contactPhone,
            image_urls: data.imageUrls,
            lat: data.lat,
            lng: data.lng
        };

        try {
            if(id) {
                const { error } = await supabase.from('campaigns').update(dbData).eq('id', id);
                if (error) throw error;
            } else if(currentUser) {
                const { error } = await supabase.from('campaigns').insert({ 
                    ...dbData, 
                    id: generateUUID(), 
                    user_email: currentUser.email 
                });
                if (error) throw error;
            }
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        } catch (err: any) {
            console.error("Error saving campaign:", err);
            alert("Error al guardar la campaña: " + err.message);
        }
    };

    const handleDeleteCampaign = async (id: string) => { 
        await supabase.from('campaigns').delete().eq('id', id); 
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    };
    
    const handleViewAdminUser = (user: User) => { setSelectedUserProfile(user); setIsUserDetailModalOpen(true); };
    const handleViewPublicProfile = (user: User) => { setPublicProfileUser(user); setIsPublicProfileModalOpen(true); };
    
    const handleMarkNotificationAsRead = async (id: string) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); };
    const handleMarkAllNotificationsAsRead = async () => { if(currentUser) await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id); };
    
    const handleRecordContactRequest = async (petId: string) => { 
        if(!currentUser) return;
        try {
            const { error } = await supabase.rpc('request_pet_contact', { pet_id: petId });
            if (error) {
                console.warn("RPC failed, falling back to manual update", error);
                const pet = pets.find(p => p.id === petId);
                if (pet) {
                    const reqs = [...(pet.contactRequests || []), currentUser.email];
                    const uniqueReqs = [...new Set(reqs)];
                    await supabase.from('pets').update({ contact_requests: uniqueReqs }).eq('id', petId);
                }
            }
        } catch (e) {
            console.error("Error recording contact request:", e);
        }
    };
    const handleAddComment = async (petId: string, text: string, parentId?: string) => {
        if(!currentUser) return;
        try {
            const { error } = await supabase.from('comments').insert({ 
                id: generateUUID(), 
                pet_id: petId, 
                user_id: currentUser.id, 
                user_email: currentUser.email, 
                user_name: currentUser.username || 'User', 
                text, 
                parent_id: parentId || null 
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            await logActivity(currentUser.id, 'comment_added', POINTS_CONFIG.COMMENT_ADDED, { petId });
        } catch (error: any) {
            console.error("Error adding comment:", error);
            alert("Error al enviar el comentario: " + (error.message || "Error desconocido"));
        }
    };
    const handleLikeComment = async (petId: string, commentId: string) => {
        if(!currentUser) return;
        const exists = await supabase.from('comment_likes').select('*').eq('user_id', currentUser.id).eq('comment_id', commentId).single();
        if(exists.data) await supabase.from('comment_likes').delete().eq('user_id', currentUser.id).eq('comment_id', commentId);
        else await supabase.from('comment_likes').insert({ user_id: currentUser.id, comment_id: commentId });
    };
    const handleDeleteComment = async (id: string) => { await supabase.from('comments').delete().eq('id', id); };

    const hasUnreadMessages = currentUser ? chats.some(c => {
        if (!c.participantEmails.includes(currentUser.email)) return false;
        const lastMsg = c.messages[c.messages.length - 1];
        if (!lastMsg || lastMsg.senderEmail === currentUser.email) return false;
        const lastRead = c.lastReadTimestamps[currentUser.email] || new Date(0).toISOString();
        return new Date(lastMsg.timestamp) > new Date(lastRead);
    }) : false;

    // --- ONBOARDING TOUR CONFIGURATION ---
    const homeTourSteps: TourStep[] = [
        {
            target: '[data-tour="header-report-btn"]',
            title: '¡Reporta una Mascota!',
            content: 'Aquí puedes publicar rápidamente si perdiste a tu mascota, encontraste una o viste una deambulando.',
            position: 'bottom'
        },
        {
            target: '[data-tour="nav-map"]',
            title: 'Mapa de Mascotas',
            content: 'Explora un mapa interactivo para ver dónde se han perdido o encontrado mascotas cerca de tu ubicación.',
            position: 'right'
        },
        {
            target: '[data-tour="nav-campaigns"]',
            title: 'Campañas de Ayuda',
            content: 'Descubre eventos de esterilización y adopción organizados por la comunidad.',
            position: 'right'
        },
        {
            target: '[data-tour="nav-reunited"]',
            title: 'Finales Felices',
            content: 'Inspírate con historias de éxito de mascotas que regresaron a casa.',
            position: 'right'
        },
        {
            target: '[data-tour="sidebar-filters"]',
            title: 'Filtra tu Búsqueda',
            content: 'Usa estos filtros para encontrar mascotas específicas por estado (perdido/encontrado), tipo, raza o ubicación.',
            position: 'right'
        },
        {
            target: '[data-tour="header-account-btn"]',
            title: 'Tu Perfil',
            content: 'Accede a tu perfil para ver tus publicaciones, mensajes y tu progreso en el sistema de puntos.',
            position: 'bottom'
        }
    ];

    if (isIpBanned) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md border-t-8 border-red-600">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-100 rounded-full">
                            <WarningIcon className="h-16 w-16 text-red-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
                    <p className="text-gray-600 mb-6">
                        Tu dirección IP ha sido bloqueada temporal o permanentemente debido a una violación de nuestros términos de servicio o actividad sospechosa.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {currentUser && location.pathname === '/' && (
                <OnboardingTour steps={homeTourSteps} tourId="home_v1" />
            )}

            <Routes>
                <Route path="/" element={<Layout onReportPet={handleReportPet} onOpenAdoptionModal={() => setIsAdoptionModalOpen(true)} isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onCloseSidebar={() => setIsSidebarOpen(false)} hasUnreadMessages={hasUnreadMessages} notifications={notifications} onMarkNotificationAsRead={handleMarkNotificationAsRead} onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead} filters={filters} setFilters={setFilters} onResetFilters={resetFilters} />}>
                    <Route index element={<PetList pets={pets} users={users} onViewUser={handleViewPublicProfile} filters={filters} onNavigate={(path) => navigate(path)} onSelectStatus={(status) => setFilters(prev => ({ ...prev, status }))} onReset={() => { resetFilters(); navigate('/'); }} loadMore={loadMore} hasMore={hasMore} isLoading={petsLoading} isError={petsError} onRetry={() => refetchPets()} />} />
                    
                    {/* Static Routes FIRST to take precedence */}
                    <Route path="perfil" element={<ProtectedRoute><ProfilePage user={currentUser!} reportedPets={pets.filter(p => p.userEmail === currentUser?.email)} allPets={pets} users={users} onBack={() => navigate('/')} onReportOwnedPetAsLost={(ownedPet) => { setReportStatus(PET_STATUS.PERDIDO); setIsReportModalOpen(true); }} onNavigate={(path) => navigate(path)} onViewUser={handleViewPublicProfile} onRenewPet={(pet) => setPetToRenew(pet)} /></ProtectedRoute>} />
                    <Route path="setup-profile" element={<ProfileSetupPage />} />
                    <Route path="mensajes" element={<ProtectedRoute><MessagesPage chats={chats.filter(c => c.participantEmails.includes(currentUser!.email)).map(c => ({ ...c, isUnread: false })).sort((a, b) => new Date(b.messages[b.messages.length-1]?.timestamp || 0).getTime() - new Date(a.messages[a.messages.length-1]?.timestamp || 0).getTime())} pets={pets} users={users} currentUser={currentUser!} onSelectChat={(id) => navigate(`/chat/${id}`)} onBack={() => navigate('/')} /></ProtectedRoute>} />
                    <Route path="admin" element={<ProtectedRoute roles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}><AdminDashboard onBack={() => navigate('/')} users={users} onViewUser={handleViewAdminUser} pets={pets} chats={chats} reports={reports} supportTickets={supportTickets} onUpdateReportStatus={handleUpdateReportStatus} onDeletePet={handleDeletePet} onUpdateSupportTicket={handleUpdateSupportTicket} isAiSearchEnabled={isAiSearchEnabled} onToggleAiSearch={() => setIsAiSearchEnabled(!isAiSearchEnabled)} isLocationAlertsEnabled={isLocationAlertsEnabled} onToggleLocationAlerts={() => setIsLocationAlertsEnabled(!isLocationAlertsEnabled)} locationAlertRadius={locationAlertRadius} onSetLocationAlertRadius={setLocationAlertRadius} campaigns={campaigns} onSaveCampaign={handleSaveCampaign} onDeleteCampaign={handleDeleteCampaign} onNavigate={(path) => navigate(path)} onDeleteComment={handleDeleteComment} /></ProtectedRoute>} />
                    <Route path="soporte" element={<ProtectedRoute><SupportPage currentUser={currentUser!} userTickets={supportTickets.filter(t => t.userEmail === currentUser?.email)} userReports={reports.filter(r => r.reporterEmail === currentUser?.email)} onAddTicket={handleAddSupportTicket} onBack={() => navigate('/')} /></ProtectedRoute>} />
                    <Route path="campanas" element={<CampaignsPage campaigns={campaigns} onNavigate={(path) => navigate(path)} />} />
                    <Route path="mapa" element={<MapPage pets={pets} onNavigate={(path) => navigate(path)} />} />
                    <Route path="servicios" element={<ServicesMapPage />} />
                    <Route path="nosotros" element={<AboutPage />} />
                    <Route path="reunidos" element={<ReunitedPetsPage />} />

                    {/* Dynamic Routes LAST */}
                    <Route path="mascota/:id" element={<PetDetailPage pet={undefined} onClose={() => navigate('/')} onStartChat={handleStartChat} onEdit={(pet) => { setReportStatus(pet.status); setSelectedPetForModal(pet); setIsReportModalOpen(true); }} onDelete={handleDeletePet} onGenerateFlyer={(pet) => { setSelectedPetForModal(pet); setIsFlyerModalOpen(true); }} onUpdateStatus={handleUpdatePetStatus} users={users} onViewUser={handleViewPublicProfile} onReport={handleReport} onRecordContactRequest={handleRecordContactRequest} onAddComment={handleAddComment} onLikeComment={handleLikeComment} />} />
                    <Route path="chat/:id" element={<ProtectedRoute><ChatPage chat={undefined} pet={undefined} users={users} currentUser={currentUser!} onSendMessage={handleSendMessage} onBack={() => navigate('/mensajes')} onMarkAsRead={handleMarkChatAsRead} /></ProtectedRoute>} />
                    <Route path="campanas/:id" element={<CampaignDetailPage campaign={undefined} onClose={() => navigate('/campanas')} />} />
                    <Route path="negocio/:id" element={<BusinessDetailPage />} />
                </Route>
                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {isReportModalOpen && <ReportPetForm onClose={() => { setIsReportModalOpen(false); setSelectedPetForModal(null); }} onSubmit={handleSubmitPet} initialStatus={reportStatus} petToEdit={selectedPetForModal} />}
            {isAdoptionModalOpen && <ReportAdoptionForm onClose={() => setIsAdoptionModalOpen(false)} onSubmit={(pet) => finalizePetSubmission(pet)} />}
            {isMatchModalOpen && pendingPetToSubmit && <PotentialMatchesModal matches={potentialMatches} onClose={() => { setIsMatchModalOpen(false); setPendingPetToSubmit(null); }} onConfirmPublication={() => finalizePetSubmission(pendingPetToSubmit)} onPetSelect={(pet) => { setIsMatchModalOpen(false); navigate(`/mascota/${pet.id}`); }} />}
            {isFlyerModalOpen && selectedPetForModal && <FlyerModal pet={selectedPetForModal} onClose={() => { setIsFlyerModalOpen(false); setSelectedPetForModal(null); }} />}
            {isUserDetailModalOpen && selectedUserProfile && <AdminUserDetailModal user={selectedUserProfile} allPets={pets} allChats={chats} allUsers={users} onClose={() => setIsUserDetailModalOpen(false)} onUpdateStatus={handleUpdateUserStatus} onUpdateRole={handleUpdateUserRole} onStartChat={handleStartUserChat} onGhostLogin={ghostLogin} onViewUser={handleViewAdminUser} />}
            {petToRenew && <RenewModal pet={petToRenew} onClose={() => setPetToRenew(null)} onRenew={handleRenewPet} onMarkAsFound={handleMarkAsFound} />}
            {petToStatusCheck && <StatusCheckModal pet={petToStatusCheck} onClose={() => setPetToStatusCheck(null)} onConfirmFound={handleMarkAsFound} onKeepLooking={handleKeepLooking} />}
            {isPublicProfileModalOpen && publicProfileUser && <UserPublicProfileModal isOpen={isPublicProfileModalOpen} onClose={() => { setIsPublicProfileModalOpen(false); setPublicProfileUser(null); }} targetUser={publicProfileUser} onViewAdminProfile={handleViewAdminUser} />}
        </>
    );
};

export default App;
