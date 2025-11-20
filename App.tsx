
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
    
    // Admin Settings - Disabled by default for simplicity
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
                    ownedPets: [],
                    savedPetIds: []
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
                    comments: [] // Comments are pending DB implementation
                }));
                setPets(mappedPets);
            }
             if (petsError) console.error("Error fetching pets:", petsError);
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

    const handleStartChat = (pet: Pet) => {
        if (!currentUser) return;
        
        // Check if chat exists
        const existingChat = chats.find(c => c.petId === pet.id && c.participantEmails.includes(currentUser.email));
        
        if (existingChat) {
            setSelectedChatId(existingChat.id);
            setCurrentView('chat');
        } else {
            const newChat: Chat = {
                id: Date.now().toString(),
                petId: pet.id,
                participantEmails: [currentUser.email, pet.userEmail],
                messages: [],
                lastReadTimestamps: {
                    [currentUser.email]: new Date().toISOString(),
                    [pet.userEmail]: new Date(0).toISOString() 
                }
            };
            setChats(prev => [...prev, newChat]);
            setSelectedChatId(newChat.id);
            setCurrentView('chat');
        }
    };

    const handleSendMessage = (chatId: string, text: string) => {
        if (!currentUser) return;
        const newMessage: Message = {
            senderEmail: currentUser.email,
            text,
            timestamp: new Date().toISOString()
        };
        
        setChats(prev => prev.map(chat => {
            if (chat.id === chatId) {
                const updatedChat = {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    lastReadTimestamps: {
                        ...chat.lastReadTimestamps,
                        [currentUser.email]: new Date().toISOString()
                    }
                };
                
                // Notify recipient
                const recipientEmail = chat.participantEmails.find(e => e !== currentUser.email);
                if (recipientEmail) {
                    const notification: Notification = {
                        id: Date.now().toString(),
                        userId: recipientEmail,
                        message: `Nuevo mensaje de ${currentUser.username || 'un usuario'}`,
                        link: 'messages',
                        timestamp: new Date().toISOString(),
                        isRead: false
                    };
                    setNotifications(n => [notification, ...n]);
                }

                return updatedChat;
            }
            return chat;
        }));
    };
    
    const handleMarkChatAsRead = (chatId: string) => {
        if (!currentUser) return;
        setChats(prev => prev.map(chat => {
             if (chat.id === chatId) {
                 return {
                     ...chat,
                     lastReadTimestamps: {
                         ...chat.lastReadTimestamps,
                         [currentUser.email]: new Date().toISOString()
                     }
                 };
             }
             return chat;
        }));
    };
    
    const handleReport = (type: ReportType, targetId: string, reason: ReportReason, details: string) => {
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
        setReports(prev => [...prev, newReport]);
        alert('Reporte enviado exitosamente. Gracias por ayudar a mantener segura la comunidad.');
    };

    const handleAddSupportTicket = (category: SupportTicketCategory, subject: string, description: string) => {
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
        setSupportTickets(prev => [...prev, newTicket]);
    };
    
    const handleUpdateSupportTicket = (updatedTicket: SupportTicket) => {
        setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        
        // Notify user if status changed or response added
        const originalTicket = supportTickets.find(t => t.id === updatedTicket.id);
        if (originalTicket && (originalTicket.status !== updatedTicket.status || (!originalTicket.response && updatedTicket.response))) {
             const notification: Notification = {
                id: Date.now().toString(),
                userId: updatedTicket.userEmail,
                message: `Tu ticket "${updatedTicket.subject}" ha sido actualizado a: ${updatedTicket.status}`,
                link: 'support',
                timestamp: new Date().toISOString(),
                isRead: false
            };
            setNotifications(n => [notification, ...n]);
        }
    };

    const handleSaveCampaign = (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => {
        if (!currentUser) return;
        if (idToUpdate) {
            setCampaigns(prev => prev.map(c => c.id === idToUpdate ? { ...c, ...campaignData } : c));
        } else {
            const newCampaign: Campaign = {
                ...campaignData,
                id: Date.now().toString(),
                userEmail: currentUser.email,
            };
            setCampaigns(prev => [newCampaign, ...prev]);
            
            // Notify all users about new campaign
            users.forEach(u => {
                if (u.email !== currentUser.email) {
                     const notification: Notification = {
                        id: Date.now().toString() + Math.random(),
                        userId: u.email,
                        message: `Nueva campaña: ${newCampaign.title}`,
                        link: { type: 'campaign', id: newCampaign.id },
                        timestamp: new Date().toISOString(),
                        isRead: false
                    };
                    setNotifications(n => [notification, ...n]);
                }
            });
        }
    };

    const handleDeleteCampaign = (id: string) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
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

    const handleMarkNotificationAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllNotificationsAsRead = () => {
        if (!currentUser) return;
        setNotifications(prev => prev.map(n => n.userId === currentUser.email ? { ...n, isRead: true } : n));
    };
    
    const handleRecordContactRequest = (petId: string) => {
        if (!currentUser) return;
        setPets(prev => prev.map(p => {
            if (p.id === petId) {
                const requests = p.contactRequests || [];
                if (!requests.includes(currentUser.email)) {
                     // Notify owner
                    const notification: Notification = {
                        id: Date.now().toString(),
                        userId: p.userEmail,
                        message: `${currentUser.username || 'Un usuario'} ha visto tu información de contacto para ${p.name}`,
                        link: { type: 'pet', id: p.id },
                        timestamp: new Date().toISOString(),
                        isRead: false
                    };
                    setNotifications(n => [notification, ...n]);
                    return { ...p, contactRequests: [...requests, currentUser.email] };
                }
            }
            return p;
        }));
    };

    const handleAddComment = (petId: string, text: string) => {
        if (!currentUser) return;
        setPets(prev => prev.map(p => {
            if (p.id === petId) {
                const newComment: Comment = {
                    id: Date.now().toString(),
                    userEmail: currentUser.email,
                    userName: currentUser.username || 'Usuario',
                    text,
                    timestamp: new Date().toISOString()
                };
                
                if (p.userEmail !== currentUser.email) {
                    const notification: Notification = {
                        id: Date.now().toString(),
                        userId: p.userEmail,
                        message: `${currentUser.username || 'Un usuario'} comentó en tu publicación de ${p.name}`,
                        link: { type: 'pet', id: p.id },
                        timestamp: new Date().toISOString(),
                        isRead: false
                    };
                    setNotifications(n => [notification, ...n]);
                }
                
                return { ...p, comments: [...(p.comments || []), newComment] };
            }
            return p;
        }));
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
                            onUpdateReportStatus={(id, status) => setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))}
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
