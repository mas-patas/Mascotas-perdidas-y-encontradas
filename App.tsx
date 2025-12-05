
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { PetList } from './components/PetList';
import { ReportPetForm } from './components/ReportPetForm';
import { PetDetailPage } from './components/PetDetailPage';
import type { Pet, PetStatus, User, UserRole, PotentialMatch, UserStatus, ReportType, ReportReason, ReportStatus as ReportStatusType, SupportTicketCategory } from './types';
import { PET_STATUS, USER_ROLES } from './constants';
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
import { TipsPage } from './components/TipsPage';
import TermsPage from './components/TermsPage'; 
import { supabase } from './services/supabaseClient';
import { generateUUID } from './utils/uuid';
import { WarningIcon } from './components/icons';
import { ErrorBoundary } from './components/ErrorBoundary';

import { usePetFilters } from './hooks/usePetFilters';
import { sendPageView, trackReportPet } from './services/analytics';
import { logActivity, POINTS_CONFIG } from './services/gamificationService';
import { OnboardingTour, TourStep } from './components/OnboardingTour';
import { useBannedIps } from './hooks/useAdmin';

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
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    // Analytics: Track Page Views
    useEffect(() => {
        sendPageView(location.pathname + location.search);
    }, [location]);

    // Global Filter State (Maintained here for layout context)
    const { filters, setFilters, resetFilters } = usePetFilters(EMPTY_PETS_ARRAY);
    
    // Security Check
    const { data: bannedIps } = useBannedIps();
    const [isIpBanned, setIsIpBanned] = useState(false);

    // Local UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    
    // Admin/Profile Modals State
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false); // Kept for admin convenience if accessed from global context, though admin page has its own
    
    const [selectedPetForModal, setSelectedPetForModal] = useState<Pet | null>(null);
    const [petToRenew, setPetToRenew] = useState<Pet | null>(null);
    const [petToStatusCheck, setPetToStatusCheck] = useState<Pet | null>(null);
    
    const [isPublicProfileModalOpen, setIsPublicProfileModalOpen] = useState(false);
    const [publicProfileUser, setPublicProfileUser] = useState<User | null>(null);
    
    const [reportStatus, setReportStatus] = useState<PetStatus>(PET_STATUS.PERDIDO);
    const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
    const [pendingPetToSubmit, setPendingPetToSubmit] = useState<Omit<Pet, 'id' | 'userEmail'> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [petToPrefill, setPetToPrefill] = useState<Partial<Pet> | null>(null);
    
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
        setIsSubmitting(true);
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
            
            if (petData.createAlert && petData.status === PET_STATUS.PERDIDO) {
                const locationParts = petData.location.split(',').map((s: string) => s.trim());
                const dept = locationParts[locationParts.length - 1] || 'Todos';
                const alertName = `Alerta: ${petData.breed} (${petData.color})`;
                
                await supabase.from('saved_searches').insert({
                    id: generateUUID(),
                    user_id: currentUser.id,
                    name: alertName,
                    filters: {
                        status: 'Todos', 
                        type: petData.animalType,
                        breed: petData.breed,
                        department: dept
                    },
                    created_at: now.toISOString()
                });
            }

            const locationParts = petData.location.split(',').map((s: string) => s.trim());
            const dept = locationParts[locationParts.length - 1] || 'Unknown';
            trackReportPet(petData.status, petData.animalType, dept);
            
            await logActivity(currentUser.id, 'report_pet', POINTS_CONFIG.REPORT_PET, { petId: newPetId, status: petData.status });

            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] });
            
            await supabase.from('notifications').insert({
                id: generateUUID(), user_id: currentUser.id, message: `Has publicado exitosamente el reporte de "${petData.name}".`, link: { type: 'pet', id: newPetId }, is_read: false, created_at: now.toISOString()
            });
            setIsReportModalOpen(false); setIsAdoptionModalOpen(false); setIsMatchModalOpen(false); setPendingPetToSubmit(null); setPetToPrefill(null);
        } catch (err: any) { 
            alert("Error al publicar: " + err.message); 
        } finally {
            setIsSubmitting(false);
        }
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
            if (currentUser) await logActivity(currentUser.id, 'pet_reunited', POINTS_CONFIG.PET_REUNITED, { petId: pet.id });
            queryClient.invalidateQueries({ queryKey: ['pets'] }); 
            if(currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] }); 
            setPetToRenew(null); setPetToStatusCheck(null); 
            alert("¡Felicidades!"); 
        } catch(e:any){ alert(e.message); }
    };
    const handleKeepLooking = () => { setPetToStatusCheck(null); };
    
    // Shared Handlers passed to components
    const handleStartChat = async (pet: Pet) => {
        if (!currentUser) return navigate('/login');
        // Check if chat exists by querying (Note: Ideally move this to ChatPage or hook, but kept here for modal access)
        const { data: existingChats } = await supabase.from('chats').select('*').eq('pet_id', pet.id).contains('participant_emails', [currentUser.email]);
        
        if (existingChats && existingChats.length > 0) {
             navigate(`/chat/${existingChats[0].id}`);
             return;
        }

        try {
            const chatId = generateUUID(); const now = new Date().toISOString();
            await supabase.from('chats').insert({ 
                id: chatId, 
                pet_id: pet.id, 
                participant_emails: [currentUser.email, pet.userEmail], 
                last_read_timestamps: { [currentUser.email]: now, [pet.userEmail]: new Date(0).toISOString() }, 
                created_at: now 
            });
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            navigate(`/chat/${chatId}`);
        } catch(e:any){ alert(e.message); }
    };

    const handleDeletePet = async (petId: string) => { 
        try { 
            await supabase.from('pets').delete().eq('id', petId); 
            queryClient.invalidateQueries({ queryKey: ['pets'] }); 
            if(currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] }); 
            navigate('/'); 
        } catch(e:any){ alert(e.message); } 
    };

    const handleUpdatePetStatus = async (petId: string, status: PetStatus) => { 
        try { 
            await supabase.from('pets').update({ status }).eq('id', petId); 
            if (status === PET_STATUS.REUNIDO && currentUser) await logActivity(currentUser.id, 'pet_reunited', POINTS_CONFIG.PET_REUNITED, { petId: petId });
            queryClient.invalidateQueries({ queryKey: ['pets'] }); 
            if(currentUser) queryClient.invalidateQueries({ queryKey: ['myPets', currentUser.id] }); 
        } catch(e:any){ alert(e.message); } 
    };

    const handleReport = async (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
        if (!currentUser) return;
        try {
            const reportId = generateUUID();
            await supabase.from('reports').insert({ id: reportId, reporter_email: currentUser.email, reported_email: '', type, target_id: targetId, reason, details, status: 'Pendiente', created_at: new Date().toISOString() });
            alert('Reporte enviado.');
        } catch(e:any){ alert(e.message); }
    };

    const handleRecordContactRequest = async (petId: string) => { 
        if(!currentUser) return;
        try {
            const { error } = await supabase.rpc('request_pet_contact', { pet_id: petId });
            if (error) throw error; // The RPC handles array appending
        } catch (e) { console.error("Error recording contact request:", e); }
    };

    const handleAddComment = async (petId: string, text: string, parentId?: string) => {
        if(!currentUser) return;
        try {
            const { error } = await supabase.from('comments').insert({ id: generateUUID(), pet_id: petId, user_id: currentUser.id, user_email: currentUser.email, user_name: currentUser.username || 'User', text, parent_id: parentId || null });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['pet_detail', petId] });
            await logActivity(currentUser.id, 'comment_added', POINTS_CONFIG.COMMENT_ADDED, { petId });
        } catch (error: any) { console.error("Error adding comment:", error); alert("Error al enviar el comentario: " + (error.message || "Error desconocido")); }
    };

    const handleLikeComment = async (petId: string, commentId: string) => {
        if(!currentUser) return;
        const exists = await supabase.from('comment_likes').select('*').eq('user_id', currentUser.id).eq('comment_id', commentId).single();
        if(exists.data) await supabase.from('comment_likes').delete().eq('user_id', currentUser.id).eq('comment_id', commentId);
        else await supabase.from('comment_likes').insert({ user_id: currentUser.id, comment_id: commentId });
        // Invalidate specific pet detail to refresh comments
        queryClient.invalidateQueries({ queryKey: ['pet_detail', petId] });
    };

    const handleViewPublicProfile = (user: User) => { setPublicProfileUser(user); setIsPublicProfileModalOpen(true); };

    const homeTourSteps: TourStep[] = [
        { target: '[data-tour="header-report-btn"]', title: '¡Reporta una Mascota!', content: 'Aquí puedes publicar rápidamente si perdiste a tu mascota, encontraste una o viste una deambulando.', position: 'bottom' },
        { target: '[data-tour="nav-map"]', title: 'Mapa de Mascotas', content: 'Explora un mapa interactivo para ver dónde se han perdido o encontrado mascotas cerca de tu ubicación.', position: 'right' },
        { target: '[data-tour="nav-campaigns"]', title: 'Campañas de Ayuda', content: 'Descubre eventos de esterilización y adopción organizados por la comunidad.', position: 'right' },
        { target: '[data-tour="nav-reunited"]', title: 'Finales Felices', content: 'Inspírate con historias de éxito de mascotas que regresaron a casa.', position: 'right' },
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
                <Route path="/" element={<Layout onReportPet={handleReportPet} onOpenAdoptionModal={() => setIsAdoptionModalOpen(true)} isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onCloseSidebar={() => setIsSidebarOpen(false)} filters={filters} setFilters={setFilters} onResetFilters={resetFilters} />}>
                    <Route index element={
                        <ErrorBoundary name="PetList">
                            {/* PetList now fetches its own users and handles loading internally via hooks */}
                            <PetList filters={filters} onViewUser={handleViewPublicProfile} onNavigate={(path) => navigate(path)} onSelectStatus={(status) => setFilters(prev => ({ ...prev, status }))} onReset={() => { resetFilters(); navigate('/'); }} />
                        </ErrorBoundary>
                    } />
                    
                    <Route path="perfil" element={<ProtectedRoute><ErrorBoundary name="Profile"><ProfilePage user={currentUser!} onBack={() => navigate('/')} onReportOwnedPetAsLost={(ownedPet) => {
                        setReportStatus(PET_STATUS.PERDIDO);
                        const prefill: Partial<Pet> = {
                            name: ownedPet.name,
                            animalType: ownedPet.animalType as any,
                            breed: ownedPet.breed,
                            color: ownedPet.colors.join(', '),
                            description: ownedPet.description || '',
                            imageUrls: ownedPet.imageUrls || [],
                            contact: currentUser?.phone || ''
                        };
                        setPetToPrefill(prefill);
                        setIsReportModalOpen(true);
                    }} onNavigate={(path) => navigate(path)} onViewUser={handleViewPublicProfile} onRenewPet={(pet) => setPetToRenew(pet)} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="setup-profile" element={<ProfileSetupPage />} />
                    <Route path="mensajes" element={<ProtectedRoute><ErrorBoundary name="Messages"><MessagesPage onSelectChat={(id) => navigate(`/chat/${id}`)} onBack={() => navigate('/')} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="admin" element={<ProtectedRoute roles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}><ErrorBoundary name="Admin"><AdminDashboard onBack={() => navigate('/')} onViewUser={handleViewPublicProfile} isAiSearchEnabled={isAiSearchEnabled} onToggleAiSearch={() => setIsAiSearchEnabled(!isAiSearchEnabled)} isLocationAlertsEnabled={isLocationAlertsEnabled} onToggleLocationAlerts={() => setIsLocationAlertsEnabled(!isLocationAlertsEnabled)} locationAlertRadius={locationAlertRadius} onSetLocationAlertRadius={setLocationAlertRadius} onNavigate={(path) => navigate(path)} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="soporte" element={<ProtectedRoute><ErrorBoundary name="Support"><SupportPage onBack={() => navigate('/')} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="campanas" element={<ErrorBoundary name="Campaigns"><CampaignsPage onNavigate={(path) => navigate(path)} /></ErrorBoundary>} />
                    <Route path="mapa" element={<ErrorBoundary name="Map"><MapPage onNavigate={(path) => navigate(path)} /></ErrorBoundary>} />
                    <Route path="servicios" element={<ErrorBoundary name="Services"><ServicesMapPage /></ErrorBoundary>} />
                    <Route path="nosotros" element={<AboutPage />} />
                    <Route path="reunidos" element={<ErrorBoundary name="Reunited"><ReunitedPetsPage /></ErrorBoundary>} />
                    <Route path="tips" element={<TipsPage />} />
                    <Route path="terminos" element={<TermsPage />} />

                    <Route path="mascota/:id" element={<ErrorBoundary name="PetDetail"><PetDetailPage onClose={() => navigate('/')} onStartChat={handleStartChat} onEdit={(pet) => { setReportStatus(pet.status); setSelectedPetForModal(pet); setIsReportModalOpen(true); }} onDelete={handleDeletePet} onGenerateFlyer={(pet) => { setSelectedPetForModal(pet); setIsFlyerModalOpen(true); }} onUpdateStatus={handleUpdatePetStatus} onViewUser={handleViewPublicProfile} onReport={handleReport} onRecordContactRequest={handleRecordContactRequest} onAddComment={handleAddComment} onLikeComment={handleLikeComment} /></ErrorBoundary>} />
                    <Route path="chat/:id" element={<ProtectedRoute><ErrorBoundary name="Chat"><ChatPage onSendMessage={async (chatId, text) => { try { await supabase.from('messages').insert({ id: generateUUID(), chat_id: chatId, sender_email: currentUser!.email, text, created_at: new Date().toISOString() }); } catch(e:any){ console.error(e); } }} onBack={() => navigate('/mensajes')} onMarkAsRead={async (chatId) => { await supabase.from('chats').update({ last_read_timestamps: { [currentUser!.email]: new Date().toISOString() } }).eq('id', chatId); queryClient.invalidateQueries({ queryKey: ['chats'] }); }} currentUser={currentUser!} users={[]} /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="campanas/:id" element={<ErrorBoundary name="CampaignDetail"><CampaignDetailPage onClose={() => navigate('/campanas')} /></ErrorBoundary>} />
                    <Route path="negocio/:id" element={<ErrorBoundary name="BusinessDetail"><BusinessDetailPage /></ErrorBoundary>} />
                </Route>
                <Route path="/login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {isReportModalOpen && <ReportPetForm onClose={() => { setIsReportModalOpen(false); setSelectedPetForModal(null); setPetToPrefill(null); }} onSubmit={handleSubmitPet} initialStatus={reportStatus} petToEdit={selectedPetForModal} dataToPrefill={petToPrefill} isSubmitting={isSubmitting} />}
            {isAdoptionModalOpen && <ReportAdoptionForm onClose={() => setIsAdoptionModalOpen(false)} onSubmit={(pet) => finalizePetSubmission(pet)} />}
            {isMatchModalOpen && pendingPetToSubmit && <PotentialMatchesModal matches={potentialMatches} onClose={() => { setIsMatchModalOpen(false); setPendingPetToSubmit(null); }} onConfirmPublication={() => finalizePetSubmission(pendingPetToSubmit)} onPetSelect={(pet) => { setIsMatchModalOpen(false); navigate(`/mascota/${pet.id}`); }} />}
            {isFlyerModalOpen && selectedPetForModal && <FlyerModal pet={selectedPetForModal} onClose={() => { setIsFlyerModalOpen(false); setSelectedPetForModal(null); }} />}
            
            {/* User Detail Modal mainly for Admin access via various lists - kept as standalone but can reuse Admin hook if needed */}
            {isUserDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded">Admin Modal Placeholder</div>
                </div>
            )}
            
            {petToRenew && <RenewModal pet={petToRenew} onClose={() => setPetToRenew(null)} onRenew={handleRenewPet} onMarkAsFound={handleMarkAsFound} />}
            {petToStatusCheck && <StatusCheckModal pet={petToStatusCheck} onClose={() => setPetToStatusCheck(null)} onConfirmFound={handleMarkAsFound} onKeepLooking={handleKeepLooking} />}
            {isPublicProfileModalOpen && publicProfileUser && <UserPublicProfileModal isOpen={isPublicProfileModalOpen} onClose={() => { setIsPublicProfileModalOpen(false); setPublicProfileUser(null); }} targetUser={publicProfileUser} onViewAdminProfile={() => {}} />}
        </ErrorBoundary>
    );
};

export default App;
