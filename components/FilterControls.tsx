

import React, { useState, useEffect } from 'react';
import type { PetStatus, AnimalType, PetSize } from '../types';
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES } from '../constants';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { HomeIcon, UserIcon, ChatBubbleIcon, AdminIcon, LogoutIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';


type Filters = {
    status: PetStatus | 'Todos',
    type: AnimalType | 'Todos',
    breed: string,
    color1: string,
    color2: string,
    size: PetSize | 'Todos'
};

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    isSidebarOpen: boolean;
    onClose: () => void;
    currentPage: 'list' | 'profile' | 'messages' | 'chat' | 'admin' | 'support';
    onNavigateToHome: () => void;
    onNavigateToProfile: () => void;
    onNavigateToMessages: () => void;
    onNavigateToAdmin: () => void;
}

const statusOptions: (PetStatus | 'Todos')[] = ['Todos', PET_STATUS.PERDIDO, PET_STATUS.ENCONTRADO, PET_STATUS.AVISTADO, PET_STATUS.EN_ADOPCION, PET_STATUS.REUNIDO];
const typeOptions: (AnimalType | 'Todos')[] = ['Todos', ANIMAL_TYPES.PERRO, ANIMAL_TYPES.GATO, ANIMAL_TYPES.OTRO];
const sizeOptions: (PetSize | 'Todos')[] = ['Todos', SIZES.PEQUENO, SIZES.MEDIANO, SIZES.GRANDE];
const colorOptions: string[] = ['Todos', ...petColors];

export const FilterControls: React.FC<FilterControlsProps> = ({ 
    filters, 
    setFilters,
    isSidebarOpen,
    onClose,
    currentPage,
    onNavigateToHome,
    onNavigateToProfile,
    onNavigateToMessages,
    onNavigateToAdmin
}) => {
    
    const [breeds, setBreeds] = useState<string[]>(['Todos']);
    const { currentUser, logout } = useAuth();
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    
    const showDesktopSidebar = currentPage === 'list';
    const showFilters = currentPage === 'list';

    useEffect(() => {
        if (filters.type === ANIMAL_TYPES.PERRO) {
            setBreeds(['Todos', ...dogBreeds]);
        } else if (filters.type === ANIMAL_TYPES.GATO) {
            setBreeds(['Todos', ...catBreeds]);
        } else {
            setBreeds(['Todos']);
        }
    }, [filters.type]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as AnimalType | 'Todos';
        setFilters(f => ({
            ...f,
            type: newType,
            breed: 'Todos',
            color1: 'Todos',
            color2: 'Todos',
            size: 'Todos',
        }));
    };
    
    const selectClass = "w-full p-2 border border-gray-500 rounded-md focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition bg-sidebar-dark bg-opacity-50 text-white disabled:opacity-50 disabled:cursor-not-allowed";
    const showAdvancedFilters = filters.type === ANIMAL_TYPES.PERRO || filters.type === ANIMAL_TYPES.GATO;

    return (
        <>
            {isSidebarOpen && <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden" />}
            
            <aside className={`
                bg-sidebar-dark text-white flex flex-col shadow-2xl 
                transition-transform duration-300 ease-in-out
                fixed inset-y-0 left-0 w-64 z-40 transform lg:relative lg:translate-x-0 lg:flex-shrink-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${showDesktopSidebar ? 'lg:flex' : 'lg:hidden'}
            `}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Filtros</h2>
                        <button onClick={onClose} className="lg:hidden text-gray-300 hover:text-white text-3xl">&times;</button>
                    </div>
                </div>

                {/* Filters Section */}
                {showFilters ? (
                    <div className="flex-grow space-y-4 px-6 overflow-y-auto">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Filtros Principales</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-1">Estado:</label>
                                    <select
                                        id="status-filter"
                                        value={filters.status}
                                        onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as PetStatus | 'Todos' }))}
                                        className={selectClass}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="type-filter" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Animal:</label>
                                    <select
                                        id="type-filter"
                                        value={filters.type}
                                        onChange={handleTypeChange}
                                        className={selectClass}
                                    >
                                        {typeOptions.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={`pt-4 mt-4 border-t border-gray-700 transition-opacity duration-300 ${showAdvancedFilters ? 'opacity-100' : 'opacity-50'}`}>
                            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Filtros Avanzados</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="breed-filter" className="block text-sm font-medium text-gray-300 mb-1">Raza:</label>
                                    <select
                                        id="breed-filter"
                                        value={filters.breed}
                                        onChange={(e) => setFilters(f => ({ ...f, breed: e.target.value }))}
                                        className={selectClass}
                                        disabled={!showAdvancedFilters}
                                    >
                                        {breeds.map(breed => (
                                            <option key={breed} value={breed}>{breed}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="size-filter" className="block text-sm font-medium text-gray-300 mb-1">Tamaño:</label>
                                    <select
                                        id="size-filter"
                                        value={filters.size}
                                        onChange={(e) => setFilters(f => ({ ...f, size: e.target.value as PetSize | 'Todos' }))}
                                        className={selectClass}
                                        disabled={!showAdvancedFilters}
                                    >
                                        {sizeOptions.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="color1-filter" className="block text-sm font-medium text-gray-300 mb-1">Color Primario:</label>
                                    <select
                                        id="color1-filter"
                                        value={filters.color1}
                                        onChange={(e) => setFilters(f => ({ ...f, color1: e.target.value }))}
                                        className={selectClass}
                                        disabled={!showAdvancedFilters}
                                    >
                                        {colorOptions.map(color => (
                                            <option key={color} value={color}>{color}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="color2-filter" className="block text-sm font-medium text-gray-300 mb-1">Color Secundario:</label>
                                    <select
                                        id="color2-filter"
                                        value={filters.color2}
                                        onChange={(e) => setFilters(f => ({ ...f, color2: e.target.value }))}
                                        className={selectClass}
                                        disabled={!showAdvancedFilters}
                                    >
                                        {colorOptions.map(color => (
                                            <option key={color} value={color}>{color}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow"></div>
                )}
                
                <div className="mt-auto p-6">
                    <p className="text-xs text-gray-400 text-center">
                        &copy; {new Date().getFullYear()} Mascotas. Todos los derechos reservados.
                    </p>
                </div>
            </aside>
        </>
    );
};