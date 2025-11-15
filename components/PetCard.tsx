import React from 'react';
// FIX: Import UserRole to use it for type casting.
import type { Pet, User, UserRole } from '../types';
import { PET_STATUS, ANIMAL_TYPES, USER_ROLES } from '../constants';
import { CalendarIcon, LocationMarkerIcon, DogIcon, CatIcon, BookmarkIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface PetCardProps {
    pet: Pet;
    onPetSelect: (pet: Pet) => void;
    owner?: User;
    onViewUser?: (user: User) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, onPetSelect, owner, onViewUser }) => {
    const { currentUser, savePet, unsavePet } = useAuth();
    // FIX: Cast array to UserRole[] to allow .includes() to check against the broader UserRole type of currentUser.role.
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
    
    const showIconAsTitle = (pet.status === PET_STATUS.ENCONTRADO || pet.status === PET_STATUS.AVISTADO) && pet.name === 'Desconocido';
    const isReunited = pet.status === PET_STATUS.REUNIDO;

    return (
        <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full cursor-pointer relative"
            onClick={() => onPetSelect(pet)}
        >
             {isReunited && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-800 bg-gray-200 px-4 py-2 rounded-full">REUNIDO</span>
                </div>
            )}
            <div className="relative">
                <img className="w-full h-48 object-cover" src={pet.imageUrls[0]} alt={`${pet.breed} ${pet.name}`} />
                <div className={`absolute top-2 left-2 px-3 py-1 text-xs font-bold rounded-full ${getStatusStyles()}`}>
                    {pet.status}
                </div>
                {pet.imageUrls.length > 1 && (
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
                            isSaved ? unsavePet(pet.id) : savePet(pet.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-brand-primary transition-colors z-10"
                        aria-label={isSaved ? "Quitar de guardados" : "Guardar reporte"}
                    >
                        <BookmarkIcon className="h-5 w-5" filled={isSaved} />
                    </button>
                )}
                {showIconAsTitle ? (
                    <h3 className="text-xl font-bold text-brand-dark mb-1 h-[28px] flex justify-center items-center">
                       {pet.animalType === ANIMAL_TYPES.PERRO && <DogIcon className="h-7 w-7 text-brand-dark" />}
                       {pet.animalType === ANIMAL_TYPES.GATO && <CatIcon className="h-7 w-7 text-brand-dark" />}
                    </h3>
                ) : (
                    <h3 className="text-xl font-bold text-brand-dark mb-1 truncate text-center" title={pet.name}>{pet.name}</h3>
                )}
                <p className="text-gray-600 text-sm mb-2 text-center">{pet.breed} - {pet.color}</p>
                
                <div className="space-y-2 text-gray-700 text-xs mb-3">
                    <div className="flex items-center gap-2">
                        <LocationMarkerIcon />
                        <span className="truncate">{pet.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon />
                        <span>{new Date(pet.date).toLocaleDateString('es-ES')}</span>
                    </div>
                </div>

                <p className="text-gray-600 mb-3 text-sm flex-grow line-clamp-2">{pet.description}</p>
                
                {isAdminView && owner?.username && (
                    <div className="mt-auto pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Publicado por: 
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(owner && onViewUser) onViewUser(owner); }} 
                                className="font-semibold text-brand-primary hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer text-left"
                            >
                                @{owner.username}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};