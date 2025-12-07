
import React from 'react';
import { Link } from 'react-router-dom';
import type { Pet, User } from '@/types';
import { PET_STATUS, ANIMAL_TYPES } from '@/constants';
import { LocationMarkerIcon, CalendarIcon, DogIcon, CatIcon, InfoIcon, BookmarkIcon } from '@/shared/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { LazyImage } from '@/shared';

interface PetCardProps {
    pet: Pet;
    owner?: User;
    onViewUser?: (user: User) => void;
    onNavigate?: (path: string) => void;
}

const getDaysAgo = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
};

export const PetCard: React.FC<PetCardProps> = ({ pet }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    const isSaved = !!currentUser?.savedPetIds?.includes(pet.id);
    
    // Exact color match from specification
    const getStatusBadgeStyle = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return { backgroundColor: '#FF4F4F', color: 'white' }; // Rojo suave
            case PET_STATUS.ENCONTRADO: return { backgroundColor: '#4CAF50', color: 'white' }; // Verde suave (matches reward, differentiation by context)
            case PET_STATUS.AVISTADO: return { backgroundColor: '#3B82F6', color: 'white' };
            case PET_STATUS.EN_ADOPCION: return { backgroundColor: '#8B5CF6', color: 'white' };
            case PET_STATUS.REUNIDO: return { backgroundColor: '#222222', color: 'white' };
            default: return { backgroundColor: '#666666', color: 'white' };
        }
    };

    const statusStyle = getStatusBadgeStyle();
    const isReunited = pet.status === PET_STATUS.REUNIDO;
    const primaryImage = (pet.imageUrls && pet.imageUrls.length > 0) ? pet.imageUrls[0] : 'https://placehold.co/400x300/F5F7FA/CCCCCC?text=Sin+Foto';
    const dateDisplay = new Date(pet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return (
        <Link 
            to={`/mascota/${pet.id}`}
            className="group block relative h-full flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100"
        >
            {/* Image Container - Aspect 3:2 */}
            <div className="relative w-full aspect-[3/2] bg-gray-100 overflow-hidden">
                <LazyImage 
                    src={primaryImage} 
                    alt={`${pet.breed} ${pet.name}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {isReunited && (
                    <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-xs font-black text-white px-3 py-1 rounded-full border border-white tracking-widest uppercase">Reunido</span>
                    </div>
                )}

                {/* Status Badge - Top Left */}
                <div 
                    className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-md shadow-sm z-10 uppercase tracking-wide"
                    style={statusStyle}
                >
                    {pet.status}
                </div>

                {/* Reward Badge - Bottom Left (Green) */}
                {pet.reward && pet.reward > 0 && !isReunited && (
                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4CAF50] text-white text-[9px] sm:text-[10px] font-bold rounded-md shadow-md z-10 flex items-center gap-0.5 sm:gap-1">
                        <span>💵 Recompensa</span>
                    </div>
                )}

                {/* Save Button */}
                {currentUser && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            isSaved ? unsavePet(pet.id) : savePet(pet.id);
                        }}
                        className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full transition-all duration-200 z-10 shadow-sm ${isSaved ? 'bg-[#FF4F4F] text-white' : 'bg-white/80 text-gray-400 hover:text-[#FF4F4F] hover:bg-white'}`}
                        aria-label={isSaved ? "Quitar de guardados" : "Guardar mascota"}
                    >
                        <BookmarkIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" filled={isSaved} />
                    </button>
                )}
            </div>
            
            {/* Content Body - Compact & Clean */}
            <div className="p-2 sm:p-3 flex flex-col flex-grow gap-0.5 sm:gap-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[#222222] text-sm sm:text-base truncate leading-tight w-full" title={pet.name}>
                        {pet.name === 'Desconocido' ? pet.animalType : pet.name}
                    </h3>
                </div>
                
                <p className="text-[#555555] text-[10px] sm:text-xs truncate">
                    {pet.breed} • {pet.color}
                </p>
                
                <div className="mt-auto pt-1.5 sm:pt-2 space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-[#555555]">
                        <LocationMarkerIcon className="flex-shrink-0 text-gray-400 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="truncate max-w-[100px] sm:max-w-[140px]">{pet.location.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-[#555555]">
                        <CalendarIcon className="flex-shrink-0 text-gray-400 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>{dateDisplay}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
