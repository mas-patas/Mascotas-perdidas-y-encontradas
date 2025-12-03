
import React from 'react';
import { Link } from 'react-router-dom';
import type { Pet, User } from '../types';
import { PET_STATUS, ANIMAL_TYPES } from '../constants';
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
    const isReunited = pet.status === PET_STATUS.REUNIDO;

    // Logic to determine card title (Name vs Report Type)
    // If name is 'Desconocido', show the status (e.g. 'Avistado', 'Encontrado')
    let cardTitle = pet.name;
    if (pet.name === 'Desconocido') {
        cardTitle = pet.status;
    }
    
    // Safe image access with fallback logic
    const primaryImage = (pet.imageUrls && pet.imageUrls.length > 0) ? pet.imageUrls[0] : '';

    return (
        <Link 
            to={`/mascota/${pet.id}`}
            className={`rounded-2xl shadow-md overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col h-full cursor-pointer relative block group border ${theme.border}`}
        >
             {isReunited && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-20 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-lg font-extrabold text-gray-800 bg-gray-200 px-4 py-2 rounded-full shadow-sm border border-gray-300">REUNIDO</span>
                </div>
            )}
            
            <div className="relative h-56 w-full">
                <LazyImage 
                    src={primaryImage} 
                    alt={`${pet.breed} ${pet.name}`}
                    className="h-full w-full"
                />

                <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-full shadow-sm z-10 ${theme.badge}`}>
                    {pet.status}
                </div>
                {pet.imageUrls && pet.imageUrls.length > 1 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white z-10 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 00-2-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{pet.imageUrls.length}</span>
                    </div>
                )}
            </div>
            
            {/* Content Area with Colored Background */}
            <div className={`p-5 flex flex-col flex-grow relative ${theme.bg} transition-colors duration-300`}>
                 {currentUser && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            isSaved ? unsavePet(pet.id) : savePet(pet.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/70 hover:bg-white rounded-full text-gray-500 hover:text-brand-primary transition-all z-10 shadow-sm"
                        aria-label={isSaved ? "Quitar de guardados" : "Guardar reporte"}
                    >
                        <BookmarkIcon className="h-5 w-5" filled={isSaved} />
                    </button>
                )}
                
                {/* Title using Nunito Extrabold */}
                <h3 className={`text-2xl font-extrabold mb-1 truncate text-center transition-colors tracking-tight ${theme.textTitle}`} title={cardTitle}>
                    {cardTitle}
                </h3>
                
                {pet.reward && pet.reward > 0 && (
                    <div className="flex justify-center mb-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full border border-green-200 shadow-sm flex items-center gap-1">
                            <span>💵</span> Recompensa
                        </span>
                    </div>
                )}

                <p className="text-gray-700 text-sm mb-4 text-center truncate font-bold">{pet.breed} • {pet.color}</p>
                
                {/* Updated Typography: text-sm (14px) and gray-700 for high contrast */}
                <div className="space-y-3 text-gray-700 text-sm mb-4 flex-grow font-medium leading-relaxed">
                    <div className="flex items-start gap-2.5">
                        <LocationMarkerIcon className="flex-shrink-0 text-gray-600 h-5 w-5" />
                        <span className="line-clamp-2">{pet.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <CalendarIcon className="flex-shrink-0 text-gray-600 h-5 w-5" />
                        <span>{new Date(pet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>
                
                {currentUser && owner?.username && (
                    <div className="mt-auto pt-3 border-t border-gray-200/50">
                        <p className="text-xs text-gray-600 font-semibold">
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
