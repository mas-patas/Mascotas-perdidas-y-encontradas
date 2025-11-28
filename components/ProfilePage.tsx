
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, Pet, OwnedPet, UserRating, Business, SavedSearch } from '../types';
import { PetCard } from './PetCard';
import { useAuth } from '../contexts/AuthContext';
import { EditIcon, PlusIcon, TrashIcon, SparklesIcon, TrophyIcon, StoreIcon, BellIcon } from './icons';
import AddPetModal from './AddPetModal';
import OwnedPetDetailModal from './OwnedPetDetailModal';
import ConfirmationModal from './ConfirmationModal';
import { uploadImage } from '../utils/imageUtils';
import { supabase } from '../services/supabaseClient';
import StarRating from './StarRating';
import GamificationBadge from './GamificationBadge';
import GamificationDashboard from './GamificationDashboard';
import BusinessManagementModal from './BusinessManagementModal';
import { businessService } from '../services/businessService';
import { OnboardingTour, TourStep } from './OnboardingTour';

const countries = [
    "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", "México", "Paraguay", "Uruguay", "Venezuela", "Estados Unidos", "España", "Otro"
];

interface ProfilePageProps {
    user: User;
    reportedPets: Pet[];
    allPets: Pet[];
    users: User[];
    onBack: () => void;
    onReportOwnedPetAsLost: (pet: OwnedPet) => void;
    onNavigate: (path: string) => void;
    onViewUser: (user: User) => void;
    onRenewPet?: (pet: Pet) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, reportedPets: propReportedPets, allPets, users, onBack, onReportOwnedPetAsLost, onNavigate, onViewUser, onRenewPet }) => {
    const { updateUserProfile, addOwnedPet, updateOwnedPet, deleteOwnedPet, currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
    const [editingOwnedPet, setEditingOwnedPet] = useState<OwnedPet | null>(null);
    const [viewingOwnedPet, setViewingOwnedPet] = useState<OwnedPet | null>(null);
    const [petToDelete, setPetToDelete] = useState<OwnedPet | null>(null);
    
    const [editableUser, setEditableUser] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
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

    const { data: myReportedPets = [], isLoading: isLoadingMyPets } = useQuery({
        queryKey: ['myPets', user.id],
        enabled: !!user.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return (data || []).map((p: any) => ({
                id: p.id,
                userEmail: user.email,
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
                reward: p.reward,
                lat: p.lat,
                lng: p.lng,
                comments: [], 
                expiresAt: p.expires_at,
                createdAt: p.created_at
            })) as Pet[];
        }
    });

    const { data: savedSearches = [] } = useQuery({
        queryKey: ['savedSearches', user.id],
        enabled: !!user.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('saved_searches')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                if(error.code === '42P01') return [];
                console.error("Error fetching saved searches:", error);
                return [];
            }
            
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

    const { data: myRatings = [], isLoading: isLoadingRatings } = useQuery({
        queryKey: ['ratings', user.id],
        enabled: !!user.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_ratings')
                .select(`
                    *,
                    profiles:rater_id (username, avatar_url)
                `)
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

    const averageRating = useMemo(() => {
        if (myRatings.length === 0) return 0;
        const sum = myRatings.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / myRatings.length).toFixed(1);
    }, [myRatings]);

    const gamificationPoints = useMemo(() => {
        const reportPoints = myReportedPets.length * 15;
        const ratingCountPoints = myRatings.length * 10;
        const qualityPoints = Number(averageRating) * 20;
        return Math.round(reportPoints + ratingCountPoints + qualityPoints);
    }, [myReportedPets.length, myRatings.length, averageRating]);

    const displayedReportedPets = myReportedPets.length > 0 || isLoadingMyPets ? myReportedPets : propReportedPets;
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
        if (editableUser.phone.trim() && !/^9\d{8}$/.test(editableUser.phone.trim())) {
            setError("El número de teléfono debe tener 9 dígitos y empezar con 9.");
            return;
        }
        setLoadingProfile(true);
        setError('');
        try {
            await updateUserProfile({
                firstName: editableUser.firstName,
                lastName: editableUser.lastName,
                phone: editableUser.phone,
                country: editableUser.country,
                avatarUrl: editableUser.avatarUrl,
            });
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
            if (viewingOwnedPet?.id === pet.id) {
                setViewingOwnedPet(pet);
            }
        } catch(err: any) {
            console.error(err);
            alert(err.message || 'Error al actualizar la mascota.');
        }
    };

    const handleConfirmDelete = async () => {
        if (petToDelete) {
            try {
                await deleteOwnedPet(petToDelete.id);
                setPetToDelete(null);
            } catch (err: any) {
                console.error(err);
                alert(err.message || 'Error al eliminar la mascota.');
                setPetToDelete(null);
            }
        }
    };
    
    // --- PROFILE TOUR STEPS ---
    const profileTourSteps: TourStep[] = [
        {
            target: '[data-tour="gamification-card"]',
            title: 'Tu Progreso',
            content: 'Aquí verás tu nivel como héroe de mascotas. Ganas puntos reportando, comentando y ayudando.',
            position: 'left'
        },
        {
            target: '[data-tour="gamification-dashboard-btn"]',
            title: 'Doggy Dashboard',
            content: 'Haz clic aquí para ver misiones diarias y el ranking de usuarios.',
            position: 'bottom'
        },
        {
            target: '[data-tour="my-pets-section"]',
            title: 'Mis Mascotas',
            content: 'Agrega a tus mascotas aquí. Si alguna se pierde, podrás reportarla con un solo clic.',
            position: 'top'
        },
        {
            target: '[data-tour="saved-pets-section"]',
            title: 'Publicaciones Guardadas',
            content: 'Aquí aparecerán los reportes que marques con el ícono de "guardar" para seguirlos de cerca.',
            position: 'top'
        },
        {
            target: '[data-tour="ratings-section"]',
            title: 'Mis Calificaciones',
            content: 'Construye tu reputación. Otros usuarios pueden calificarte si los ayudas o adoptas.',
            position: 'top'
        }
    ];

    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="space-y-8">
            <OnboardingTour steps={profileTourSteps} tourId="profile_v1" />

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-bold text-brand-dark">Mi Perfil</h2>
                    <div className="flex gap-2">
                        {myBusiness && (
                            <button 
                                onClick={() => setIsBusinessModalOpen(true)}
                                className="flex items-center gap-2 text-sm py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-bold"
                            >
                                <StoreIcon />
                                Gestionar mi Negocio
                            </button>
                        )}
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm py-2 px-3 bg-blue-100 text-brand-primary rounded-lg hover:bg-blue-200 transition-colors">
                                <EditIcon />
                                Editar Perfil
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
                                    <img src={editableUser.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-brand-primary text-white flex items-center justify-center text-4xl font-bold">
                                        {(editableUser.firstName || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {loadingProfile ? (
                                    <p className="mt-2 text-sm text-center text-gray-500">Subiendo...</p>
                                ) : (
                                    <>
                                        <label htmlFor="avatar-upload" className="mt-2 block text-sm text-center text-brand-primary hover:underline cursor-pointer">
                                            Cambiar foto
                                        </label>
                                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={loadingProfile} />
                                    </>
                                )}
                            </div>
                            <div className="flex-grow space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">Nombres</label>
                                        <input type="text" name="firstName" id="firstName" value={editableUser.firstName} onChange={handleInputChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">Apellidos</label>
                                        <input type="text" name="lastName" id="lastName" value={editableUser.lastName} onChange={handleInputChange} className={inputClass} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-900">Teléfono</label>
                                        <input 
                                            type="tel" 
                                            name="phone" 
                                            id="phone" value={editableUser.phone} 
                                            onChange={handleInputChange} className={inputClass} 
                                            pattern="9[0-9]{8}"
                                            title="El número de teléfono debe tener 9 dígitos y empezar con 9." />
                                    </div>
                                    <div>
                                        <label htmlFor="country" className="block text-sm font-medium text-gray-900">País</label>
                                        <select 
                                            name="country" 
                                            id="country" 
                                            value={editableUser.country} 
                                            onChange={handleInputChange} 
                                            className={inputClass}
                                        >
                                            {countries.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => { setIsEditing(false); setError(''); }} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={loadingProfile}>Cancelar</button>
                            <button onClick={handleSaveProfile} disabled={loadingProfile} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50">
                                {loadingProfile ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 flex flex-col md:flex-row md:items-start gap-6">
                            <div className="relative">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover shadow-md" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-brand-primary text-white flex items-center justify-center text-5xl font-bold shadow-md">
                                        {(user.firstName || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="text-center md:text-left space-y-2 text-gray-600">
                                <p><span className="font-semibold text-gray-800">Nombre Completo:</span> {user.firstName} {user.lastName}</p>
                                <p><span className="font-semibold text-gray-800">Usuario:</span> @{user.username}</p>
                                <p><span className="font-semibold text-gray-800">Email:</span> {user.email}</p>
                                {user.phone && <p><span className="font-semibold text-gray-800">Teléfono:</span> {user.phone}</p>}
                                {user.country && <p><span className="font-semibold text-gray-800">País:</span> {user.country}</p>}
                                {myBusiness && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                                            <StoreIcon /> Dueño de: {myBusiness.name}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 justify-center md:justify-start">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold text-gray-800">{averageRating}</span>
                                        <div className="flex flex-col">
                                            <StarRating rating={Number(averageRating)} size="sm" />
                                            <span className="text-xs text-gray-500">{myRatings.length} calificaciones</span>
                                        </div>
                                    </div>
                                </div>
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
                                <TrophyIcon className="h-4 w-4" />
                                Ver Doggy Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* SAVED SEARCHES SECTION */}
            {savedSearches.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                        <BellIcon className="text-brand-secondary h-6 w-6"/> Mis Alertas de Búsqueda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedSearches.map(search => (
                            <div key={search.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 relative group hover:border-brand-secondary transition-colors">
                                <h4 className="font-bold text-gray-800">{search.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">Creada el {new Date(search.createdAt).toLocaleDateString()}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {Object.entries(search.filters).map(([key, val]) => (
                                        val !== 'Todos' && <span key={key} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600">{val}</span>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => handleDeleteSavedSearch(search.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Eliminar alerta"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4" data-tour="my-pets-section">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-gray-700">Mis Mascotas</h3>
                    <button onClick={() => { setEditingOwnedPet(null); setIsAddPetModalOpen(true); }} className="flex items-center gap-2 bg-brand-secondary hover:bg-amber-400 text-brand-dark font-bold py-2 px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105">
                        <PlusIcon />
                        Agregar Mascota
                    </button>
                </div>
                 {user.ownedPets && user.ownedPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {user.ownedPets.map(pet => (
                           <div key={pet.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col relative transition-transform transform hover:-translate-y-1 hover:shadow-xl">
                                <button
                                   onClick={(e) => {
                                       e.stopPropagation();
                                       setPetToDelete(pet);
                                   }}
                                   className="absolute top-2 right-2 z-10 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                   aria-label="Eliminar mascota"
                               >
                                   <TrashIcon />
                               </button>
                               <div className="cursor-pointer" onClick={() => setViewingOwnedPet(pet)}>
                                   <img 
                                       src={pet.imageUrls?.[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'} 
                                       alt={pet.name}
                                       className="w-full h-40 object-cover"
                                   />
                                   <div className="p-5 flex-grow flex flex-col">
                                       <h4 className="text-xl font-bold text-brand-dark">{pet.name}</h4>
                                       <p className="text-gray-600 text-sm">{pet.animalType} - {pet.breed}</p>
                                       {pet.colors.length > 0 && (
                                           <div className="mt-2 flex flex-wrap gap-2 items-center">
                                               {pet.colors.map((color, index) => (
                                                  <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">{color}</span>
                                               ))}
                                           </div>
                                       )}
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

            <div className="space-y-4" data-tour="saved-pets-section">
                <h3 className="text-2xl font-semibold text-gray-700">Publicaciones guardadas</h3>
                {savedPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {savedPets.map(pet => {
                            const petOwner = users.find(u => u.email === pet.userEmail);
                            return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                        <p className="text-lg text-gray-500">No has guardado ninguna publicación.</p>
                        <p className="text-sm text-gray-400 mt-1">Usa el ícono de marcador para seguir una publicación.</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-700">Mis reportes</h3>
                {isLoadingMyPets ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
                ) : displayedReportedPets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {displayedReportedPets.filter(p => p).map(pet => {
                            const expired = isPetExpired(pet);
                            return (
                                <div key={pet.id} className="relative">
                                    {expired && (
                                        <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex flex-col items-center justify-center rounded-xl border-2 border-red-200 backdrop-blur-sm">
                                            <p className="text-red-600 font-bold mb-2 text-lg uppercase">Expirado</p>
                                            {onRenewPet && (
                                                <button 
                                                    onClick={() => onRenewPet(pet)}
                                                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors shadow-md animate-pulse"
                                                >
                                                    <SparklesIcon /> Renovar Publicación
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <PetCard pet={pet} owner={user} onViewUser={onViewUser} onNavigate={onNavigate} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                        <p className="text-xl text-gray-500">Aún no has realizado ninguna publicación.</p>
                        <p className="text-gray-400 mt-2">Haz clic en "Reportar Mascota" para empezar.</p>
                    </div>
                )}
            </div>

            {/* Ratings Section */}
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
                                        {rating.raterAvatar ? (
                                            <img src={rating.raterAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {rating.raterName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
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

            {/* Modals */}
            {isAddPetModalOpen && (
                <AddPetModal
                    onClose={() => setIsAddPetModalOpen(false)}
                    onSubmit={handleAddPet}
                    onUpdate={handleUpdatePet}
                    petToEdit={editingOwnedPet}
                />
            )}

            {viewingOwnedPet && (
                <OwnedPetDetailModal
                    pet={viewingOwnedPet}
                    onClose={() => setViewingOwnedPet(null)}
                    onEdit={(pet) => { setViewingOwnedPet(null); setEditingOwnedPet(pet); setIsAddPetModalOpen(true); }}
                    onReportLost={(pet) => { setViewingOwnedPet(null); onReportOwnedPetAsLost(pet); }}
                />
            )}

            {petToDelete && (
                <ConfirmationModal
                    isOpen={!!petToDelete}
                    onClose={() => setPetToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Mascota"
                    message={`¿Estás seguro de que quieres eliminar a ${petToDelete.name}? Esta acción no se puede deshacer.`}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                />
            )}

            {isDashboardOpen && (
                <GamificationDashboard
                    user={user}
                    currentPoints={gamificationPoints}
                    userReportedPets={myReportedPets}
                    onClose={() => setIsDashboardOpen(false)}
                />
            )}

            {isBusinessModalOpen && myBusiness && (
                <BusinessManagementModal
                    isOpen={isBusinessModalOpen}
                    onClose={() => setIsBusinessModalOpen(false)}
                    businessId={myBusiness.id}
                />
            )}
        </div>
    );
};

export default ProfilePage;
