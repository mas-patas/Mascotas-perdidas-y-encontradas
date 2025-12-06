
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
    onNavigate?: (path: string) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, owner, onViewUser }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    const isSaved = !!currentUser?.savedPetIds?.includes(pet.id);
    
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
    const primaryImage = (pet.imageUrls && pet.imageUrls.length > 0) ? pet.imageUrls[0] : '';

    return (
        <Link 
            to={`/mascota/${pet.id}`}
            className="group block relative h-full flex flex-col transition-transform duration-200 hover:-translate-y-1"
        >
            <div className="bg-card-surface rounded-[14px] shadow-card hover:shadow-card-hover border border-transparent hover:border-gray-100 overflow-hidden h-full flex flex-col relative transition-all duration-300">
                
                {/* Image Section - 3:2 Aspect Ratio */}
                <div className="relative w-full aspect-[3/2] overflow-hidden rounded-t-[14px] bg-gray-100">
                    <LazyImage 
                        src={primaryImage} 
                        alt={`${pet.breed} ${pet.name}`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {isReunited && (
                        <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="text-sm font-extrabold text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">REUNIDO</span>
                        </div>
                    )}

                    {/* Status Badge - Top Left */}
                    <div className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold text-white rounded-md shadow-sm z-10 uppercase tracking-wide ${getBadgeColor()}`}>
                        {pet.status}
                    </div>

                    {/* Save Button - Top Right */}
                    {currentUser && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                isSaved ? unsavePet(pet.id) : savePet(pet.id);
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-full text-icon-gray hover:text-brand-primary transition-colors z-10 shadow-sm"
                        >
                            <BookmarkIcon className="h-4 w-4" filled={isSaved} />
                        </button>
                    )}

                    {/* Reward Badge - Bottom Right */}
                    {pet.reward && pet.reward > 0 && !isReunited && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 text-[10px] font-bold text-white bg-status-reward rounded-md shadow-sm z-10 flex items-center gap-1">
                            <span>💰</span> Recompensa
                        </div>
                    )}
                </div>
                
                {/* Content Area - Compact */}
                <div className="p-3 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-text-main text-sm truncate pr-2 flex-1" title={pet.name}>
                            {pet.name === 'Desconocido' ? pet.animalType : pet.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-text-sub bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 whitespace-nowrap">
                            <CalendarIcon className="h-3 w-3 text-icon-gray" />
                            <span>{new Date(pet.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                        </div>
                    </div>
                    
                    <p className="text-text-sub text-xs mb-2 truncate">
                        {pet.breed} • {pet.color}
                    </p>
                    
                    <div className="mt-auto flex items-center gap-1.5 text-xs text-text-sub truncate">
                        <LocationMarkerIcon className="flex-shrink-0 text-icon-gray h-3.5 w-3.5" />
                        <span className="truncate">{pet.location}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
