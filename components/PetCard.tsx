
import React from 'react';
import { Link } from 'react-router-dom';
import type { Pet, User } from '../types';
import { PET_STATUS } from '../constants';
import { CalendarIcon, LocationMarkerIcon, BookmarkIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { LazyImage } from './LazyImage';

interface PetCardProps {
    pet: Pet;
    owner?: User;
    onViewUser?: (user: User) => void;
    onNavigate?: (path: string) => void; // Optional now, mostly deprecated
}

export const PetCard: React.FC<PetCardProps> = ({ pet, owner, onViewUser }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    const isSaved = !!currentUser?.savedPetIds?.includes(pet.id);
    
    // Updated Badge Logic based on specifications
    const getBadgeColor = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return 'bg-status-lost';
            case PET_STATUS.ENCONTRADO: return 'bg-status-found';
            case PET_STATUS.AVISTADO: return 'bg-status-sighted';
            case PET_STATUS.EN_ADOPCION: return 'bg-status-adoption';
            default: return 'bg-gray-500';
        }
    };

    const isReunited = pet.status === PET_STATUS.REUNIDO;

    // Logic to determine card title (Name vs Report Type)
    let cardTitle = pet.name;
    if (pet.name === 'Desconocido') {
        cardTitle = pet.status;
    }
    
    // Safe image access with fallback logic
    const primaryImage = (pet.imageUrls && pet.imageUrls.length > 0) ? pet.imageUrls[0] : '';

    return (
        <Link 
            to={`/mascota/${pet.id}`}
            className="group block relative h-full flex flex-col transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="bg-card-surface border border-card-border rounded-[16px] shadow-card overflow-hidden h-full flex flex-col relative hover:shadow-lg transition-shadow duration-300">
                
                {isReunited && (
                    <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center backdrop-blur-[1px] rounded-[16px]">
                        <span className="text-lg font-extrabold text-gray-800 bg-gray-200 px-4 py-2 rounded-full shadow-sm border border-gray-300">REUNIDO</span>
                    </div>
                )}
                
                {/* Image Section - Rounded top only */}
                <div className="relative h-56 w-full rounded-t-[16px] overflow-hidden">
                    <LazyImage 
                        src={primaryImage} 
                        alt={`${pet.breed} ${pet.name}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-sm z-10 ${getBadgeColor()}`}>
                        {pet.status}
                    </div>

                    {/* Photo Count Badge */}
                    {pet.imageUrls && pet.imageUrls.length > 1 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white z-10 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 00-2-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <span>{pet.imageUrls.length}</span>
                        </div>
                    )}
                </div>
                
                {/* Content Area - Padding 24px (p-6) */}
                <div className="p-6 flex flex-col flex-grow relative">
                     {currentUser && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                isSaved ? unsavePet(pet.id) : savePet(pet.id);
                            }}
                            className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-50 rounded-full text-icon-gray hover:text-brand-primary transition-colors z-10 shadow-sm border border-card-border"
                            aria-label={isSaved ? "Quitar de guardados" : "Guardar reporte"}
                        >
                            <BookmarkIcon className="h-5 w-5" filled={isSaved} />
                        </button>
                    )}
                    
                    {/* Title & Subtitle */}
                    <div className="mb-4 pr-8">
                        <h3 className="text-xl font-bold text-text-main truncate tracking-tight mb-1" title={cardTitle}>
                            {cardTitle}
                        </h3>
                        <p className="text-text-sub font-medium text-sm truncate">
                            {pet.breed} • {pet.color}
                        </p>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-3 mb-4 flex-grow">
                        <div className="flex items-start gap-3">
                            <LocationMarkerIcon className="flex-shrink-0 text-icon-gray h-5 w-5 mt-0.5" />
                            <span className="text-text-sub text-sm font-medium line-clamp-2 leading-snug">{pet.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="flex-shrink-0 text-icon-gray h-5 w-5" />
                            <span className="text-text-sub text-sm font-medium">
                                {new Date(pet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    {/* Reward Badge */}
                    {pet.reward && pet.reward > 0 && (
                        <div className="mb-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-lg border border-green-200">
                                <span>💰</span> Recompensa
                            </span>
                        </div>
                    )}
                    
                    {/* Footer / User Info */}
                    {currentUser && owner?.username && (
                        <div className="pt-4 border-t border-card-border mt-auto">
                            <p className="text-xs text-text-sub font-semibold flex items-center">
                                Publicado por: 
                                <button 
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); if(owner && onViewUser) onViewUser(owner); }} 
                                    className="font-bold text-brand-primary hover:underline ml-1.5 bg-transparent border-none p-0 cursor-pointer"
                                >
                                    @{owner.username}
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};
