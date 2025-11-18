
import React from 'react';
import type { Pet, User, UserRole } from '../types';
import { PET_STATUS, ANIMAL_TYPES, USER_ROLES } from '../constants';
import { CalendarIcon, LocationMarkerIcon, BookmarkIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface PetCardProps {
    pet: Pet;
    owner?: User;
    onViewUser?: (user: User) => void;
    onNavigate: (path: string) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, owner, onViewUser, onNavigate }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    const isAdminView = currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    const isSaved = !!currentUser?.savedPetIds?.includes(pet.id);
    
    const getStatusStyles = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO:
                return 'bg-red-500 text-white';
            case PET_STATUS.ENCONTRADO:
                return 'bg-green-500 text-white';
            case PET_STATUS.AVISTADO:
                return 'bg-blue-500 text-white';
            case PET_STATUS.EN_ADOPCION:
                return 'bg-purple-500 text-white';
            case PET_STATUS.REUNIDO:
                return 'bg-gray-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };
    
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
    
    const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Prevent default browser navigation and use the client-side router
        e.preventDefault();
        onNavigate(`/mascota/${pet.id}`);
    };
    
    // Safe image access with fallback
    const image = (pet.imageUrls && pet.imageUrls.length > 0)
        ? pet.imageUrls[0]
        : 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen';

    return (
        <a 
            href={`#/mascota/${pet.id}`}
            onClick={handleNavigate}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full cursor-pointer relative"
        >
             {isReunited && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-800 bg-gray-200 px-4 py-2 rounded-full">REUNIDO</span>
                </div>
            )}
            <div className="relative">
                <img className="w-full h-48 object-cover" src={image} alt={`${pet.breed} ${pet.name}`} />
                <div className={`absolute top-2 left-2 px-3 py-1 text-xs font-bold rounded-full ${getStatusStyles()}`}>
                    {pet.status}
                </div>
                {pet.imageUrls && pet.imageUrls.length > 1 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs font-semibold text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{pet.imageUrls.length}</span>
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow relative">
                 {currentUser && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            isSaved ? unsavePet(pet.id) : savePet(pet.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-brand-primary transition-colors z-10"
                        aria-label={isSaved ? "Quitar de guardados" : "Guardar reporte"}
                    >
                        <BookmarkIcon className="h-5 w-5" filled={isSaved} />
                    </button>
                )}
                <h3 className="text-xl font-bold text-brand-dark mb-1 truncate text-center" title={cardTitle}>{cardTitle}</h3>
                <p className="text-gray-600 text-sm mb-2 text-center">{pet.breed} - {pet.color}</p>
                
                <div className="space-y-2 text-gray-700 text-xs mb-3 flex-grow">
                    <div className="flex items-center gap-2">
                        <LocationMarkerIcon />
                        <span className="truncate">{pet.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon />
                        <span>{new Date(pet.date).toLocaleDateString('es-ES')}</span>
                    </div>
                </div>
                
                {isAdminView && owner?.username && (
                    <div className="mt-auto pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Publicado por: 
                            <button 
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); if(owner && onViewUser) onViewUser(owner); }} 
                                className="font-semibold text-brand-primary hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer text-left"
                            >
                                @{owner.username}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </a>
    );
};
