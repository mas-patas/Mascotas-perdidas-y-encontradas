
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User, Pet, OwnedPet } from '../types';
import { PetCard } from './PetCard';
import { useAuth } from '../contexts/AuthContext';
import { EditIcon, PlusIcon, TrashIcon, SparklesIcon } from './icons';
import AddPetModal from './AddPetModal';
import OwnedPetDetailModal from './OwnedPetDetailModal';
import ConfirmationModal from './ConfirmationModal';
import { uploadImage } from '../utils/imageUtils';
import { supabase } from '../services/supabaseClient';


interface ProfilePageProps {
    user: User;
    reportedPets: Pet[]; // Keeping for fallback, but will load own data
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
    const [isEditing, setIsEditing] = useState(false);
    const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
    const [editingOwnedPet, setEditingOwnedPet] = useState<OwnedPet | null>(null);
    const [viewingOwnedPet, setViewingOwnedPet] = useState<OwnedPet | null>(null);
    const [petToDelete, setPetToDelete] = useState<OwnedPet | null>(null);
    
    const [editableUser, setEditableUser] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
    });
    const [error, setError] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(false);

    // 1. Fetch 'My Pets' (Reported) - Includes Expired Pets
    // This ensures the profile owner sees EVERYTHING they posted, even if it's hidden from the main feed.
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
            
            // Enrich/Format
            return data.map((p: any) => ({
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
                lat: p.lat,
                lng: p.lng,
                comments: [], // Comments not needed for list view
                expiresAt: p.expires_at,
                createdAt: p.created_at
            })) as Pet[];
        }
    });

    // Use the fetched data if available, otherwise fallback to props (though props filter out expired)
    const displayedReportedPets = myReportedPets.length > 0 || isLoadingMyPets ? myReportedPets : propReportedPets;

    const savedPets = useMemo(() => allPets.filter(p => user.savedPetIds?.includes(p.id)), [allPets, user.savedPetIds]);

    // Helper to check if a reported pet is expired
    const isPetExpired = (pet: Pet) => {
        if (!pet.expiresAt) return false; 
        return new Date(pet.expiresAt) < new Date();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditableUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             try {
                // Upload to Supabase Storage and get URL
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
            // If the pet being edited is also the one being viewed, refresh the view
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
                setPetToDelete(null); // Close modal on success
            } catch (err: any) {
                console.error(err);
                alert(err.message || 'Error al eliminar la mascota.');
                setPetToDelete(null); // Also close modal on error
            }
        }
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-bold text-brand-dark">Mi Perfil</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm py-2 px-3 bg-blue-100 text-brand-primary rounded-lg hover:bg-blue-200 transition-colors">
                            <EditIcon />
                            Editar Perfil
                        </button>
                    )}
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
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
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
                        </div>
                    </div>
                )}
            </div>
            
            <div className="space-y-4">
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

            <div className="space-y-4">
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
                        {displayedReportedPets.map(pet => {
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

             <div className="text-center pt-4">
                 <button
                    onClick={onBack}
                    className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    &larr; Volver a la lista principal
                </button>
            </div>
            
            {(isAddPetModalOpen || editingOwnedPet) && (
                <AddPetModal 
                    onClose={() => { setIsAddPetModalOpen(false); setEditingOwnedPet(null); }}
                    onSubmit={handleAddPet}
                    onUpdate={handleUpdatePet}
                    petToEdit={editingOwnedPet}
                />
            )}

            {viewingOwnedPet && (
                <OwnedPetDetailModal
                    pet={viewingOwnedPet}
                    onClose={() => setViewingOwnedPet(null)}
                    onEdit={(pet) => {
                        setViewingOwnedPet(null);
                        setEditingOwnedPet(pet);
                        setIsAddPetModalOpen(true);
                    }}
                    onReportLost={(pet) => {
                        setViewingOwnedPet(null);
                        onReportOwnedPetAsLost(pet);
                    }}
                />
            )}

            {petToDelete && (
                <ConfirmationModal
                    isOpen={!!petToDelete}
                    onClose={() => setPetToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Mascota"
                    message={`¿Estás seguro de que quieres eliminar a "${petToDelete.name}" de tu perfil? Esta acción no se puede deshacer.`}
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                />
            )}
        </div>
    );
};

export default ProfilePage;
