
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Pet, User, UserRole } from '../types';
import { PET_STATUS, ANIMAL_TYPES, USER_ROLES } from '../constants';
import { CalendarIcon, LocationMarkerIcon, BookmarkIcon, PetIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface PetCardProps {
    pet: Pet;
    owner?: User;
    onViewUser?: (user: User) => void;
    onNavigate?: (path: string) => void; // Optional now, mostly deprecated
}

export const PetCard: React.FC<PetCardProps> = ({ pet, owner, onViewUser }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const isSaved = !!currentUser?.savedPetIds?.includes(pet.id);
    
    // Theme logic: Returns subtle background and border colors based on status
    const getTheme = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO:
                return {
                    badge: 'bg-red-500 text-white',
                    bg: 'bg-red-50',
                    border: 'border-red-100 group-hover:border-red-300',
                    textTitle: 'text-red-900'
                };
            case PET_STATUS.ENCONTRADO:
                return {
                    badge: 'bg-emerald-500 text-white',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100 group-hover:border-emerald-300',
                    textTitle: 'text-emerald-900'
                };
            case PET_STATUS.AVISTADO:
                return {
                    badge: 'bg-blue-500 text-white',
                    bg: 'bg-blue-50',
                    border: 'border-blue-100 group-hover:border-blue-300',
                    textTitle: 'text-blue-900'
                };
            case PET_STATUS.EN_ADOPCION:
                return {
                    badge: 'bg-purple-500 text-white',
                    bg: 'bg-purple-50',
                    border: 'border-purple-100 group-hover:border-purple-300',
                    textTitle: 'text-purple-900'
                };
            case PET_STATUS.REUNIDO:
                return {
                    badge: 'bg-gray-500 text-white',
                    bg: 'bg-gray-100',
                    border: 'border-gray-200 group-hover:border-gray-400',
                    textTitle: 'text-gray-700'
                };
            default:
                return {
                    badge: 'bg-gray-500 text-white',
                    bg: 'bg-white',
                    border: 'border-gray-200',
                    textTitle: 'text-gray-900'
                };
        }
    };

    const theme = getTheme();
    
    const isUnknownAndFoundOrSighted = (pet.status === PET_STATUS.ENCONTRADO || pet.status === PET_STATUS.AVISTADO) && pet.name === 'Desconocido';
    const isReunited = pet.status === PET_STATUS.REUNIDO;

    let cardTitle = pet.name;
    if (isUnknownAndFoundOrSighted) {
        if (pet.animalType === ANIMAL_TYPES.OTRO) {
            const match = pet.description.match(/^\[Tipo: (.*?)\]/);
            cardTitle = match ? match[1] : pet.animalType;
        } else {
            cardTitle = pet.animalType;
        }
    }
    
    // Safe image access with fallback logic
    const primaryImage = (pet.imageUrls && pet.imageUrls.length > 0) ? pet.imageUrls[0] : null;
    const fallbackImage = 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen';

    return (
        <Link 
            to={`/mascota/${pet.id}`}
            className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col h-full cursor-pointer relative block group border ${theme.border}`}
        >
             {isReunited && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-20 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-lg font-bold text-gray-800 bg-gray-200 px-4 py-2 rounded-full shadow-sm border border-gray-300">REUNIDO</span>
                </div>
            )}
            <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                {/* Fallback / Loading State */}
                {(!imageLoaded || imageError || !primaryImage) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-0">
                        <PetIcon className="h-12 w-12 text-gray-300" />
                    </div>
                )}

                {primaryImage && !imageError && (
                    <img 
                        className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} 
                        src={primaryImage} 
                        alt={`${pet.breed} ${pet.name}`} 
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true); // Stop loading spinner
                        }}
                    />
                )}

                <div className={`absolute top-2 left-2 px-3 py-1 text-xs font-bold rounded-full shadow-sm z-10 ${theme.badge}`}>
                    {pet.status}
                </div>
                {pet.imageUrls && pet.imageUrls.length > 1 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs font-semibold text-white z-10 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{pet.imageUrls.length}</span>
                    </div>
                )}
            </div>
            
            {/* Content Area with Colored Background */}
            <div className={`p-4 flex flex-col flex-grow relative ${theme.bg} transition-colors duration-300`}>
                 {currentUser && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            isSaved ? unsavePet(pet.id) : savePet(pet.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-60 hover:bg-opacity-100 rounded-full text-gray-500 hover:text-brand-primary transition-all z-10 shadow-sm"
                        aria-label={isSaved ? "Quitar de guardados" : "Guardar reporte"}
                    >
                        <BookmarkIcon className="h-5 w-5" filled={isSaved} />
                    </button>
                )}
                <h3 className={`text-xl font-bold mb-1 truncate text-center transition-colors ${theme.textTitle}`} title={cardTitle}>
                    {cardTitle}
                </h3>
                
                {pet.reward && pet.reward > 0 && (
                    <div className="flex justify-center mb-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full border border-green-200 shadow-sm flex items-center gap-1">
                            <span>💵</span> Recompensa
                        </span>
                    </div>
                )}

                <p className="text-gray-600 text-sm mb-3 text-center truncate font-medium">{pet.breed} • {pet.color}</p>
                
                <div className="space-y-2 text-gray-700 text-xs mb-3 flex-grow">
                    <div className="flex items-start gap-2">
                        <LocationMarkerIcon className="flex-shrink-0 text-gray-500 h-4 w-4 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{pet.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="flex-shrink-0 text-gray-500 h-4 w-4" />
                        <span>{new Date(pet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>
                
                {currentUser && owner?.username && (
                    <div className="mt-auto pt-2 border-t border-gray-200/50">
                        <p className="text-[10px] text-gray-500">
                            Publicado por: 
                            <button 
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); if(owner && onViewUser) onViewUser(owner); }} 
                                className="font-bold text-brand-primary hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer text-left"
                            >
                                @{owner.username}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </Link>
    );
};
