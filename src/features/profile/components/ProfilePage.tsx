
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { User, Pet, OwnedPet, UserRating, Business, SavedSearch, PetStatus } from '@/types';
import { PetCard } from '@/features/pets';
import { useAuth } from '@/contexts/AuthContext';
import { EditIcon, PlusIcon, TrashIcon, SparklesIcon, TrophyIcon, StoreIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@/shared/components/icons';
import { AddPetModal } from '@/features/pets';
import { OwnedPetDetailModal } from '@/shared';
import { ConfirmationModal } from '@/shared';
import { uploadImage } from '@/utils/imageUtils';
import { supabase } from '@/services/supabaseClient';
import { StarRating } from '@/shared';
import { GamificationBadge } from '@/features/gamification';
import { GamificationDashboard } from '@/features/gamification';
import { BusinessManagementModal } from '@/features/businesses';
import { businessService } from '@/services/businessService';
import { OnboardingTour, TourStep } from '@/shared';
import { useGamification } from '@/hooks/useGamification';
import { mapPetFromDb } from '@/utils/mappers';
import { PET_STATUS } from '@/constants';
import { PullToRefresh } from '@/shared';
import { LazyImage } from '@/shared';

const countries = [
    "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", "México", "Paraguay", "Uruguay", "Venezuela", "Estados Unidos", "España", "Otro"
];

const REPORT_PAGE_SIZE = 6;

interface ProfilePageProps {
    user: User;
    reportedPets: Pet[]; // Keep prop for initial data or fallback
    allPets: Pet[];
    users: User[];
    onBack: () => void;
    onReportOwnedPetAsLost: (pet: OwnedPet) => void;
    onNavigate: (path: string) => void;
    onViewUser: (user: User) => void;
    onRenewPet?: (pet: Pet) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, reportedPets: propReportedPets, allPets, users, onBack, onReportOwnedPetAsLost, onNavigate, onViewUser, onRenewPet }) => {
    const { updateUserProfile, addOwnedPet, updateOwnedPet, deleteOwnedPet } = useAuth();
    const queryClient = useQueryClient();
    const { points: gamificationPoints } = useGamification(user.id);
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
    const [editingOwnedPet, setEditingOwnedPet] = useState<OwnedPet | null>(null);
    const [viewingOwnedPet, setViewingOwnedPet] = useState<OwnedPet | null>(null);
    const [petToDelete, setPetToDelete] = useState<OwnedPet | null>(null);
    const [reportPage, setReportPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    
    const filterRef = useRef<HTMLDivElement>(null);

    // Click outside to close filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const [editableUser, setEditableUser] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        country: user.country || 'Perú',
        avatarUrl: user.avatarUrl || '',
    });
    const [error, setError] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [myBusiness, setMyBusiness] = useState<Business | null>(null);

    useEffect(() => {
        const checkBusiness = async () => {
            if (!user.id) return;
            const business = await businessService.getBusinessByOwnerId(user.id);
            setMyBusiness(business);
        };
        checkBusiness();
    }, [user.id]);

    // Function to handle Pull-to-Refresh
    const handleRefresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['myPets'] }),
            queryClient.invalidateQueries({ queryKey: ['savedSearches'] }),
            queryClient.invalidateQueries({ queryKey: ['ratings'] }),
            queryClient.invalidateQueries({ queryKey: ['gamificationStats'] }),
            // Refresh user profile if needed
            supabase.auth.getUser().then(({ data }) => {
                if (data.user?.id) {
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                }
            })
        ]);
    };

    // PAGINATED QUERY for Reports with Filtering
    const { data: reportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ['myPets', user.id, reportPage, filterStatus],
        enabled: !!user.id,
        queryFn: async () => {
            const from = (reportPage - 1) * REPORT_PAGE_SIZE;
            const to = from + REPORT_PAGE_SIZE - 1;

            let query = supabase
                .from('pets')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id);

            // Apply filter if not ALL
            if (filterStatus !== 'ALL') {
                query = query.eq('status', filterStatus);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            
            const pets = (data || []).map(p => mapPetFromDb(p));
            return { pets, count: count || 0 };
        },
        placeholderData: keepPreviousData
    });

    // Reset page when filter changes
    useEffect(() => {
        setReportPage(1);
    }, [filterStatus]);

    const myReportedPets = reportsData?.pets || [];
    const totalReports = reportsData?.count || 0;
    const totalReportPages = Math.ceil(totalReports / REPORT_PAGE_SIZE);

    const { data: savedSearches = [] } = useQuery<SavedSearch[]>({
        queryKey: ['savedSearches', user.id],
        enabled: !!user.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('saved_searches')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) return [];
            return (data || []).map((s: any) => ({
                id: s.id,
                userId: s.user_id,
                name: s.name,
                filters: s.filters,
                createdAt: s.created_at
            })) as SavedSearch[];
        }
    });

    const handleDeleteSavedSearch = async (id: string) => {
        if(!confirm('¿Eliminar esta alerta?')) return;
        try {
            await supabase.from('saved_searches').delete().eq('id', id);
            queryClient.invalidateQueries({ queryKey: ['savedSearches', user.id] });
        } catch(e) {
            console.error(e);
        }
    };

    const { data: myRatings = [], isLoading: isLoadingRatings } = useQuery<UserRating[]>({
        queryKey: ['ratings', user.id],
        enabled: !!user.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_ratings')
                .select(`*, profiles:rater_id (username, avatar_url)`)
                .eq('rated_user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((r: any) => ({
                id: r.id,
                raterId: r.rater_id,
                ratedUserId: r.rated_user_id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at,
                raterName: r.profiles?.username || 'Usuario',
                raterAvatar: r.profiles?.avatar_url
            })) as UserRating[];
        }
    });

    const savedPets = useMemo(() => allPets.filter(p => p && user.savedPetIds?.includes(p.id)), [allPets, user.savedPetIds]);
    
    const isPetExpired = (pet: Pet) => {
        if (!pet.expiresAt) return false; 
        return new Date(pet.expiresAt) < new Date();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             try {
                setLoadingProfile(true);
                const publicUrl = await uploadImage(file);
                setEditableUser(prev => ({ ...prev, avatarUrl: publicUrl }));
            } catch (err) {
                 console.error("Error uploading avatar:", err);
                setError("Error al procesar la imagen de perfil.");
            } finally {
                setLoadingProfile(false);
            }
        }
    };

    const handleSaveProfile = async () => {
        if (!editableUser.firstName || !editableUser.lastName) {
            setError('Nombres y Apellidos son obligatorios.');
            return;
        }
        setLoadingProfile(true);
        setError('');
        try {
            await updateUserProfile(editableUser);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el perfil.');
        } finally {
            setLoadingProfile(false);
        }
    };
    
    const handleAddPet = async (pet: Omit<OwnedPet, 'id'>) => {
        try {
            await addOwnedPet(pet);
            setIsAddPetModalOpen(false);
        } catch (err: any) {
             console.error(err);
             alert(err.message || 'Error al agregar la mascota.');
        }
    };

    const handleUpdatePet = async (pet: OwnedPet) => {
        try {
            await updateOwnedPet(pet);
            setIsAddPetModalOpen(false);
            setEditingOwnedPet(null);
            if (viewingOwnedPet?.id === pet.id) setViewingOwnedPet(pet);
        } catch(err: any) {
            alert(err.message || 'Error al actualizar la mascota.');
        }
    };

    const handleConfirmDelete = async () => {
        if (petToDelete) {
            try {
                await deleteOwnedPet(petToDelete.id);
                setPetToDelete(null);
            } catch (err: any) {
                alert(err.message || 'Error al eliminar la mascota.');
                setPetToDelete(null);
            }
        }
    };
    
    const profileTourSteps: TourStep[] = [
        { target: '[data-tour="gamification-card"]', title: 'Tu Progreso', content: 'Aquí verás tu nivel como héroe de mascotas.', position: 'left' },
        { target: '[data-tour="gamification-dashboard-btn"]', title: 'Doggy Dashboard', content: 'Haz clic aquí para ver misiones diarias y el ranking.', position: 'bottom' },
        { target: '[data-tour="my-pets-section"]', title: 'Mis Mascotas', content: 'Agrega a tus mascotas aquí para reportarlas rápido si se pierden.', position: 'top' },
        { target: '[data-tour="saved-pets-section"]', title: 'Publicaciones Guardadas', content: 'Aquí aparecerán los reportes que marques.', position: 'top' },
        { target: '[data-tour="ratings-section"]', title: 'Mis Calificaciones', content: 'Construye tu reputación con feedback de otros usuarios.', position: 'top' }
    ];

    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    const filterOptions = [
        { label: 'Todos', value: 'ALL' },
        { label: 'Perdidos', value: PET_STATUS.PERDIDO },
        { label: 'Encontrados', value: PET_STATUS.ENCONTRADO },
        { label: 'En Adopción', value: PET_STATUS.EN_ADOPCION },
        { label: 'Avistados', value: PET_STATUS.AVISTADO },
        { label: 'Reunidos', value: PET_STATUS.REUNIDO },
    ];

    const Pagination = () => {
        if (totalReportPages <= 1) return null;
        return (
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setReportPage(p => Math.max(1, p - 1))}
                    disabled={reportPage === 1}
                    className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                    {reportPage} / {totalReportPages}
                </span>
                <button 
                    onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))}
                    disabled={reportPage === totalReportPages}
                    className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>
        );
    };

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="space-y-8 pb-20">
                <OnboardingTour steps={profileTourSteps} tourId="profile_v1" />

                {/* HEADER PERFIL */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6 gap-4">
                        <h2 className="text-3xl font-bold text-brand-dark text-center md:text-left">Mi Perfil</h2>
                        <div className="flex gap-2">
                            {myBusiness && (
                                <button 
                                    onClick={() => setIsBusinessModalOpen(true)}
                                    className="flex items-center gap-2 text-sm py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-bold"
                                >
                                    <StoreIcon /> Gestionar mi Negocio
                                </button>
                            )}
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="hidden md:flex items-center gap-2 text-sm py-2 px-3 bg-blue-100 text-brand-primary rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                    <EditIcon /> Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">{error}</div>}
                    
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="flex-shrink-0">
                                    {editableUser.avatarUrl ? (
                                        <LazyImage src={editableUser.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-brand-primary text-white flex items-center justify-center text-4xl font-bold">
                                            {(editableUser.firstName || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <label htmlFor="avatar-upload" className="mt-2 block text-sm text-center text-brand-primary hover:underline cursor-pointer">
                                        Cambiar foto
                                    </label>
                                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={loadingProfile} />
                                </div>
                                <div className="flex-grow space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Nombres</label>
                                            <input type="text" name="firstName" value={editableUser.firstName} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Apellidos</label>
                                            <input type="text" name="lastName" value={editableUser.lastName} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Teléfono</label>
                                            <input type="tel" name="phone" value={editableUser.phone} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Fecha de Nacimiento</label>
                                            <input 
                                                type="date" 
                                                name="birthDate" 
                                                value={editableUser.birthDate} 
                                                onChange={handleInputChange} 
                                                className={inputClass} 
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900">País</label>
                                        <select name="country" value={editableUser.country} onChange={handleInputChange} className={inputClass}>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => { setIsEditing(false); setError(''); }} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg" disabled={loadingProfile}>Cancelar</button>
                                <button onClick={handleSaveProfile} disabled={loadingProfile} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark">{loadingProfile ? 'Guardando...' : 'Guardar Cambios'}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 flex flex-col items-center md:flex-row md:items-start gap-6 w-full">
                                <div className="relative">
                                    {user.avatarUrl ? (
                                        <div className="w-32 h-32 rounded-full overflow-hidden shadow-md">
                                            <LazyImage src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-brand-primary text-white flex items-center justify-center text-5xl font-bold shadow-md">
                                            {(user.firstName || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center md:text-left space-y-3 text-gray-600 w-full flex flex-col items-center md:items-start">
                                    <p className="w-full"><span className="font-semibold text-gray-800">Nombre Completo:</span> {user.firstName} {user.lastName}</p>
                                    <p className="w-full"><span className="font-semibold text-gray-800">Usuario:</span> @{user.username}</p>
                                    <p className="w-full"><span className="font-semibold text-gray-800">Email:</span> {user.email}</p>
                                    {user.phone && <p className="w-full"><span className="font-semibold text-gray-800">Teléfono:</span> {user.phone}</p>}
                                    {user.birthDate && <p className="w-full"><span className="font-semibold text-gray-800">Fecha de Nacimiento:</span> {new Date(user.birthDate + 'T00:00:00').toLocaleDateString()}</p>}
                                    {user.country && <p className="w-full"><span className="font-semibold text-gray-800">País:</span> {user.country}</p>}
                                    
                                    {/* Mobile Edit Button */}
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="md:hidden mt-2 flex items-center justify-center gap-2 text-sm py-2.5 px-6 bg-blue-100 text-brand-primary rounded-xl hover:bg-blue-200 transition-colors font-bold w-full max-w-xs mx-auto"
                                    >
                                        <EditIcon /> Editar Perfil
                                    </button>
                                </div>
                            </div>

                            <div className="w-full lg:w-auto flex-shrink-0 bg-gradient-to-br from-gray-50 to-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center min-w-[220px] shadow-sm" data-tour="gamification-card">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Insignia de Comunidad</h4>
                                <GamificationBadge points={gamificationPoints} size="lg" showProgress={true} />
                                <button 
                                    onClick={() => setIsDashboardOpen(true)}
                                    className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wide py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    data-tour="gamification-dashboard-btn"
                                >
                                    <TrophyIcon className="h-4 w-4" /> Ver Doggy Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* SAVED SEARCHES SECTION */}
                {savedSearches.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2"><BellIcon className="text-brand-secondary h-6 w-6"/> Mis Alertas de Búsqueda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {savedSearches.map(search => (
                                <div key={search.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 relative group hover:border-brand-secondary transition-colors">
                                    <h4 className="font-bold text-gray-800">{search.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Creada el {new Date(search.createdAt).toLocaleDateString()}</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {Object.entries(search.filters).map(([key, val]) => (
                                            val !== 'Todos' && <span key={key} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600">{val as string}</span>
                                        ))}
                                    </div>
                                    <button onClick={() => handleDeleteSavedSearch(search.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* OWNED PETS */}
                <div className="space-y-4" data-tour="my-pets-section">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-semibold text-gray-700">Mis Mascotas</h3>
                        <button onClick={() => { setEditingOwnedPet(null); setIsAddPetModalOpen(true); }} className="flex items-center gap-2 bg-brand-secondary hover:bg-amber-400 text-brand-dark font-bold py-2 px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105">
                            <PlusIcon /> Agregar Mascota
                        </button>
                    </div>
                     {user.ownedPets && user.ownedPets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {user.ownedPets.map(pet => (
                               <div key={pet.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col relative transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                                    <button onClick={(e) => { e.stopPropagation(); setPetToDelete(pet); }} className="absolute top-2 right-2 z-10 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"><TrashIcon /></button>
                                   <div className="cursor-pointer" onClick={() => setViewingOwnedPet(pet)}>
                                       <div className="w-full h-40">
                                            <LazyImage src={pet.imageUrls?.[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'} alt={pet.name} className="w-full h-full object-cover" />
                                       </div>
                                       <div className="p-5 flex-grow flex flex-col">
                                           <h4 className="text-xl font-bold text-brand-dark">{pet.name}</h4>
                                           <p className="text-gray-600 text-sm">{pet.animalType} - {pet.breed}</p>
                                       </div>
                                   </div>
                               </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-gray-500">Aún no has agregado ninguna de tus mascotas.</p>
                        </div>
                    )}
                </div>

                {/* SAVED PETS */}
                <div className="space-y-4" data-tour="saved-pets-section">
                    <h3 className="text-2xl font-semibold text-gray-700">Publicaciones guardadas</h3>
                    {savedPets.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {savedPets.map(pet => {
                                const petOwner = users.find(u => u.email === pet.userEmail);
                                return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-gray-500">No has guardado ninguna publicación.</p>
                        </div>
                    )}
                </div>

                {/* MY REPORTS (PAGINATED & FILTERABLE) */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                        <div className="flex items-center gap-4 relative">
                            <h3 className="text-2xl font-semibold text-gray-700 whitespace-nowrap">Mis reportes</h3>
                            
                            {/* Dropdown Filter */}
                            <div className="relative" ref={filterRef}>
                                <button
                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                                >
                                    <span>{filterOptions.find(o => o.value === filterStatus)?.label || 'Filtrar'}</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isFilterDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-fade-in-up">
                                        {filterOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setFilterStatus(option.value);
                                                    setIsFilterDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                                    filterStatus === option.value ? 'font-bold text-brand-primary bg-blue-50' : 'text-gray-600'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="hidden md:block">
                            <Pagination />
                        </div>
                    </div>

                    {isLoadingReports ? (
                        <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
                    ) : myReportedPets.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                {myReportedPets.filter(p => p).map(pet => {
                                    const expired = isPetExpired(pet);
                                    return (
                                        <div key={pet.id} className="relative">
                                            {expired && (
                                                <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex flex-col items-center justify-center rounded-xl border-2 border-red-200 backdrop-blur-sm">
                                                    <p className="text-red-600 font-bold mb-2 text-lg uppercase">Expirado</p>
                                                    {onRenewPet && <button onClick={() => onRenewPet(pet)} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors shadow-md animate-pulse"><SparklesIcon /> Renovar</button>}
                                                </div>
                                            )}
                                            <PetCard pet={pet} owner={user} onViewUser={onViewUser} onNavigate={onNavigate} />
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Mobile Pagination (Bottom) */}
                            <div className="flex justify-center mt-6 md:hidden">
                                <Pagination />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                            <p className="text-xl text-gray-500">No hay publicaciones en esta categoría.</p>
                            <p className="text-gray-400 mt-2">Intenta cambiar el filtro o crea un nuevo reporte.</p>
                        </div>
                    )}
                </div>

                {/* RATINGS */}
                <div className="space-y-4" data-tour="ratings-section">
                    <h3 className="text-2xl font-semibold text-gray-700">Mis Calificaciones</h3>
                    {isLoadingRatings ? (
                        <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
                    ) : myRatings.length > 0 ? (
                        <div className="space-y-4">
                            {myRatings.map(rating => (
                                <div key={rating.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {rating.raterAvatar ? <img src={rating.raterAvatar} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">{rating.raterName.charAt(0).toUpperCase()}</div>}
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">@{rating.raterName}</p>
                                                <p className="text-xs text-gray-500">{new Date(rating.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <StarRating rating={rating.rating} size="sm" />
                                    </div>
                                    <p className="text-sm text-gray-600">{rating.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-gray-500">Aún no tienes calificaciones.</p>
                        </div>
                    )}
                </div>

                {/* Modals... */}
                {isAddPetModalOpen && <AddPetModal onClose={() => setIsAddPetModalOpen(false)} onSubmit={handleAddPet} onUpdate={handleUpdatePet} petToEdit={editingOwnedPet} />}
                {viewingOwnedPet && <OwnedPetDetailModal pet={viewingOwnedPet} onClose={() => setViewingOwnedPet(null)} onEdit={(pet) => { setViewingOwnedPet(null); setEditingOwnedPet(pet); setIsAddPetModalOpen(true); }} onReportLost={(pet) => { setViewingOwnedPet(null); onReportOwnedPetAsLost(pet); }} />}
                {petToDelete && <ConfirmationModal isOpen={!!petToDelete} onClose={() => setPetToDelete(null)} onConfirm={handleConfirmDelete} title="Eliminar Mascota" message={`¿Estás seguro de que quieres eliminar a ${petToDelete.name}?`} confirmText="Eliminar" cancelText="Cancelar" />}
                {isDashboardOpen && <GamificationDashboard user={user} currentPoints={gamificationPoints} userReportedPets={myReportedPets} onClose={() => setIsDashboardOpen(false)} />}
                {isBusinessModalOpen && myBusiness && <BusinessManagementModal isOpen={isBusinessModalOpen} onClose={() => setIsBusinessModalOpen(false)} businessId={myBusiness.id} />}
            </div>
        </PullToRefresh>
    );
};

export default ProfilePage;
