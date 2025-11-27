
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { PetStatus, AnimalType, PetSize } from '../types';
import { PET_STATUS, ANIMAL_TYPES, SIZES } from '../constants';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { departments } from '../data/locations';
import { HomeIcon, MegaphoneIcon, MapIcon, TrashIcon, StoreIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';


type Filters = {
    status: PetStatus | 'Todos',
    type: AnimalType | 'Todos',
    breed: string,
    color1: string,
    color2: string,
    size: PetSize | 'Todos',
    department: string
};

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    isSidebarOpen: boolean;
    onClose: () => void;
    onClearFilters: () => void;
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
    onClearFilters
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [breeds, setBreeds] = useState<string[]>(['Todos']);
    const miniMapRef = useRef<HTMLDivElement>(null);
    
    // Show sidebar on main lists, campaigns, map, AND services
    const showDesktopSidebar = ['/', '/campanas', '/mapa', '/servicios'].includes(location.pathname);
    
    // Context Flags
    const isHome = location.pathname === '/';
    const isServices = location.pathname === '/servicios';

    useEffect(() => {
        if (filters.type === ANIMAL_TYPES.PERRO) {
            setBreeds(['Todos', ...dogBreeds]);
        } else if (filters.type === ANIMAL_TYPES.GATO) {
            setBreeds(['Todos', ...catBreeds]);
        } else {
            setBreeds(['Todos']);
        }
    }, [filters.type]);

    // Mini Map Init for Services Sidebar (Visual Only)
    useEffect(() => {
        if (isServices && miniMapRef.current) {
            // Small delay to ensure container is rendered
            const timer = setTimeout(() => {
                if(!miniMapRef.current) return;
                const L = (window as any).L;
                if (!L) return;
                
                // Check if map is already initialized to avoid errors
                if ((miniMapRef.current as any)._leaflet_id) return;

                const map = L.map(miniMapRef.current, {
                    zoomControl: false,
                    dragging: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    attributionControl: false
                }).setView([-12.046374, -77.042793], 11);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isServices]);

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
    
    const showAdvancedFilters = filters.type === ANIMAL_TYPES.PERRO || filters.type === ANIMAL_TYPES.GATO || filters.type === ANIMAL_TYPES.OTRO;
    
    const navLinkClass = (isActive: boolean) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white font-semibold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`;

    return (
        <>
            {isSidebarOpen && <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden" />}
            
            <aside className={`
                bg-sidebar-dark text-white flex flex-col shadow-2xl 
                transition-transform duration-300 ease-in-out
                fixed inset-y-0 left-0 w-64 z-40 transform lg:relative lg:translate-x-0 lg:flex-shrink-0
                pt-20 lg:pt-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${showDesktopSidebar ? 'lg:flex' : 'lg:hidden'}
            `}>
                <div className="p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Menú</h2>
                        <button onClick={onClose} className="lg:hidden text-gray-300 hover:text-white text-3xl">&times;</button>
                    </div>
                </div>

                <nav className="px-6 mb-6 space-y-2">
                    <button onClick={() => navigate('/')} className={navLinkClass(isHome)}>
                        <HomeIcon />
                        <span>Inicio</span>
                    </button>
                     <button onClick={() => navigate('/mapa')} className={navLinkClass(location.pathname === '/mapa')}>
                        <MapIcon />
                        <span>Mapa de Mascotas</span>
                    </button>
                    <button onClick={() => navigate('/campanas')} className={navLinkClass(location.pathname === '/campanas')}>
                        <MegaphoneIcon />
                        <span>Campañas</span>
                    </button>
                    <button onClick={() => navigate('/servicios')} className={navLinkClass(isServices)}>
                        <StoreIcon />
                        <span>Servicios</span>
                    </button>
                </nav>


                {/* Filters Section for HOME (Lost Pets) */}
                {isHome && (
                    <div className="flex-grow space-y-4 px-6 overflow-y-auto border-t border-gray-700 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Filtros</h3>
                            <button 
                                onClick={onClearFilters}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                                title="Limpiar todos los filtros"
                            >
                                <TrashIcon /> Limpiar
                            </button>
                        </div>
                        
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
                            <div>
                                <label htmlFor="department-filter" className="block text-sm font-medium text-gray-300 mb-1">Departamento:</label>
                                <select
                                    id="department-filter"
                                    value={filters.department}
                                    onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                                    className={selectClass}
                                >
                                    <option value="Todos">Todos</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar Content for SERVICES Route */}
                {isServices && (
                    <div className="flex-grow px-6 border-t border-gray-700 pt-6 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Mapa de Servicios</h3>
                        
                        <div className="mb-6">
                            <p className="text-xs text-gray-400 mb-2">Explora veterinarias y tiendas cercanas en el mapa interactivo.</p>
                            
                            {/* Decorative Mini Map */}
                            <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-600 relative mb-3 opacity-80 hover:opacity-100 transition-opacity">
                                <div ref={miniMapRef} className="w-full h-full bg-gray-800"></div>
                                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
                                    <MapIcon className="h-8 w-8 text-white drop-shadow-md" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div> Veterinarias
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div> Tiendas / Grooming
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Empty filler for other pages */}
                {!isHome && !isServices && <div className="flex-grow"></div>}
                
                <div className="mt-auto p-6">
                    <p className="text-xs text-gray-400 text-center">
                        &copy; {new Date().getFullYear()} Mascotas. Todos los derechos reservados.
                    </p>
                </div>
            </aside>
        </>
    );
};
