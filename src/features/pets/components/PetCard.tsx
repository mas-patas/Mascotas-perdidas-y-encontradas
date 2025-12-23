
import React from 'react';
import { Link } from 'react-router-dom';
import type { Pet, User } from '@/types';
import { PET_STATUS, ANIMAL_TYPES } from '@/constants';
import { LocationMarkerIcon, CalendarIcon, DogIcon, CatIcon, InfoIcon, BookmarkIcon } from '@/shared/components/icons';
import { useAuth } from '@/contexts/auth';
import { LazyImage, Tooltip, VerifiedBadge } from '@/shared';

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

// Helper function to format location as "distrito, urbanizacion" or "distrito, calle"
const formatLocation = (location: string): string => {
    if (!location) return '';
    
    const parts = location.split(',').map(p => p.trim()).filter(Boolean);
    
    // Location format from ReportPetForm: [address, neighbourhood, district, province, department]
    // After filter(Boolean), empty values are removed
    // Format: "address, neighbourhood, district, province, department"
    
    if (parts.length === 0) return '';
    
    let district = '';
    let urbanization = '';
    let street = '';
    
    // The district is always the 3rd from the end when we have at least 3 parts
    // (since the last 3 are: district, province, department)
    if (parts.length >= 3) {
        district = parts[parts.length - 3] || '';
        
        // Determine if we have urbanization or street based on number of parts
        if (parts.length === 5) {
            // Full format: [address, neighbourhood, district, province, department]
            urbanization = parts[1] || '';  // neighbourhood (urbanization)
            street = parts[0] || '';        // address (street)
        } else if (parts.length === 4) {
            // Either: [address, district, province, department] (no neighbourhood)
            // Or: [neighbourhood, district, province, department] (no address)
            // We'll check the first part to determine if it's likely an address or urbanization
            const firstPart = parts[0] || '';
            // Common address indicators
            const isAddress = firstPart.toLowerCase().includes('av') || 
                            firstPart.toLowerCase().includes('avenida') ||
                            firstPart.toLowerCase().includes('calle') ||
                            firstPart.toLowerCase().includes('jr') ||
                            firstPart.toLowerCase().includes('jiron') ||
                            firstPart.toLowerCase().includes('pasaje') ||
                            firstPart.match(/\d/); // Contains numbers (common in addresses)
            
            if (isAddress) {
                street = firstPart;
            } else {
                // Likely an urbanization/neighbourhood name
                urbanization = firstPart;
            }
        }
        // If parts.length === 3: [district, province, department] - no address or urbanization
    } else if (parts.length === 2) {
        // Fallback: could be [street, district] or [district, province]
        // Check if second part is a common province name
        const secondPart = parts[1] || '';
        const commonProvinces = ['lima', 'callao', 'cusco', 'arequipa', 'trujillo', 'piura', 'chiclayo'];
        if (commonProvinces.some(p => secondPart.toLowerCase().includes(p.toLowerCase()))) {
            // Likely [district, province]
            district = parts[0] || '';
        } else {
            // Likely [street, district]
            street = parts[0] || '';
            district = secondPart;
        }
    } else if (parts.length === 1) {
        // Only one part, use it as district
        district = parts[0];
    }
    
    // Format: "distrito, urbanizacion" if urbanization exists, otherwise "distrito, calle"
    if (district) {
        if (urbanization) {
            return `${district}, ${urbanization}`;
        } else if (street) {
            return `${district}, ${street}`;
        } else {
            return district;
        }
    }
    
    // Fallback: return first part if we can't parse
    return parts[0] || location;
};

// Helper function to get user display name
const getUserDisplayName = (owner?: User): string => {
    if (!owner) return '';
    
    if (owner.username) {
        return `@${owner.username}`;
    }
    
    if (owner.firstName || owner.lastName) {
        const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
        return fullName || owner.email || 'Usuario';
    }
    
    return owner.email || 'Usuario';
};

export const PetCard: React.FC<PetCardProps> = ({ pet, owner, onViewUser }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    const isSaved = !!currentUser?.savedPetIds?.includes(pet.id);
    
    // Exact color match from specification
    const getStatusBadgeStyle = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return { backgroundColor: '#FF4F4F', color: 'white' }; // Rojo suave
            case PET_STATUS.ENCONTRADO: return { backgroundColor: '#4CAF50', color: 'white' }; // Verde suave
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
            className="group block relative h-full flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 hover:bg-sky-50/30 hover:shadow-lg hover:shadow-gray-900/60 border border-gray-100"
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

                {/* Reward Badge - Bottom Right (Gold) */}
                {pet.reward !== undefined && pet.reward !== null && !isReunited && (
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#D4AF37] text-white text-[9px] sm:text-[10px] font-bold rounded-md shadow-md z-10 flex items-center gap-0.5 sm:gap-1">
                        <span>💵 Recompensa</span>
                    </div>
                )}

                {/* Save Button */}
                {currentUser && (
                    <Tooltip text={isSaved ? "Quitar de guardados" : "Guardar mascota"}>
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
                    </Tooltip>
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
                        <span className="truncate max-w-[100px] sm:max-w-[140px]">{formatLocation(pet.location)}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-[#555555]">
                        <CalendarIcon className="flex-shrink-0 text-gray-400 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>{dateDisplay}</span>
                    </div>
                    {owner && (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs pt-0.5 sm:pt-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (onViewUser) {
                                        onViewUser(owner);
                                    }
                                }}
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity truncate max-w-full"
                                title="Ver perfil del usuario"
                            >
                                <span className="truncate text-blue-600 font-bold">{getUserDisplayName(owner)}</span>
                                <VerifiedBadge user={owner} size="sm" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};
