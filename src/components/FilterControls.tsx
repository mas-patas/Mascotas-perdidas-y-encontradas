
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { PetStatus, AnimalType, PetSize } from '../types';
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES } from '../constants';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { departments } from '../data/locations';
import { MegaphoneIcon, MapIcon, StoreIcon, HeartIcon, LightbulbIcon, FilterIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

type Filters = {
    status: PetStatus | 'Todos',
    type: AnimalType | 'Todos',
    breed: string;
    color1: string;
    color2: string;
    color3: string;
    size: PetSize | 'Todos';
    department: string
};

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    isSidebarOpen: boolean;
    onClose: () => void;
    onClearFilters: () => void;
}

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
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [breeds, setBreeds] = useState<string[]>(['Todos']);
    
    // Show sidebar on specific routes
    const showDesktopSidebar = ['/', '/campanas', '/mapa', '/servicios', '/reunidos', '/tips'].includes(location.pathname);
    const isHome = location.pathname === '/';

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
        }));
    };
    
    // Styling: Semi-transparent white inputs on blue gradient
    const selectClass = "w-full p-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent block transition-colors option:text-gray-900";
    const labelClass = "block mb-1.5 text-xs font-bold text-white/80 uppercase tracking-wider";
    const navLinkClass = (isActive: boolean) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-white/20 text-white shadow-lg' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`;

    return (
        <>
            {isSidebarOpen && <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden backdrop-blur-sm" />}
            
            <aside 
                className={`
                    bg-gradient-to-b from-sky-400 to-blue-900 text-white flex flex-col shadow-2xl border-r border-white/10
                    transition-transform duration-300 ease-in-out
                    fixed inset-y-0 left-0 w-72 z-40 transform lg:relative lg:translate-x-0 lg:flex-shrink-0
                    pt-20 lg:pt-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${showDesktopSidebar ? 'lg:flex' : 'lg:hidden'}
                `}
                data-tour="sidebar-menu"
            >
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest">Navegación</h2>
                        <button onClick={onClose} className="lg:hidden text-white hover:text-gray-200 text-2xl">&times;</button>
                    </div>
                    
                    <nav className="space-y-1" data-tour="sidebar-navigation">
                        {/* Removed Home button from Sidebar as requested */}
                        <button onClick={() => navigate('/reunidos')} className={navLinkClass(location.pathname === '/reunidos')} data-tour="nav-reunited">
                            <HeartIcon className="h-5 w-5" /> <span>Finales Felices</span>
                        </button>
                        <button onClick={() => navigate('/mapa')} className={navLinkClass(location.pathname === '/mapa')} data-tour="nav-map">
                            <MapIcon className="h-5 w-5" /> <span>Mapa Global</span>
                        </button>
                        <button onClick={() => navigate('/campanas')} className={navLinkClass(location.pathname === '/campanas')} data-tour="nav-campaigns">
                            <MegaphoneIcon className="h-5 w-5" /> <span>Campañas</span>
                        </button>
                        <button onClick={() => navigate('/tips')} className={navLinkClass(location.pathname === '/tips')}>
                            <LightbulbIcon className="h-5 w-5" /> <span>Consejos</span>
                        </button>
                        {currentUser?.role === USER_ROLES.SUPERADMIN && (
                            <button onClick={() => navigate('/servicios')} className={navLinkClass(location.pathname === '/servicios')}>
                                <StoreIcon className="h-5 w-5" /> <span>Servicios</span>
                            </button>
                        )}
                    </nav>
                </div>

                {/* Filters Section for HOME */}
                {isHome && (
                    <div className="flex-grow px-6 py-6 border-t border-white/10 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <FilterIcon className="text-sky-200" /> Filtros
                            </h3>
                            <button 
                                onClick={onClearFilters}
                                className="text-[10px] uppercase font-bold text-sky-200 hover:text-white transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                        
                        <div className="space-y-5" data-tour="sidebar-filters">
                            <div>
                                <label htmlFor="type-filter" className={labelClass}>Especie</label>
                                <select id="type-filter" value={filters.type} onChange={handleTypeChange} className={selectClass}>
                                    {typeOptions.map(type => <option key={type} value={type} className="text-gray-900">{type}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label htmlFor="department-filter" className={labelClass}>Ubicación</label>
                                <select id="department-filter" value={filters.department} onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))} className={selectClass}>
                                    <option value="Todos" className="text-gray-900">Todas las zonas</option>
                                    {departments.map(dept => <option key={dept} value={dept} className="text-gray-900">{dept}</option>)}
                                </select>
                            </div>

                            {/* Advanced Filters */}
                            <div className="pt-4 border-t border-white/10 space-y-5">
                                <div>
                                    <label htmlFor="breed-filter" className={labelClass}>Raza</label>
                                    <select id="breed-filter" value={filters.breed} onChange={(e) => setFilters(f => ({ ...f, breed: e.target.value }))} className={selectClass} disabled={filters.type === 'Todos'}>
                                        {breeds.map(breed => <option key={breed} value={breed} className="text-gray-900">{breed}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="size-filter" className={labelClass}>Tamaño</label>
                                    <select id="size-filter" value={filters.size} onChange={(e) => setFilters(f => ({ ...f, size: e.target.value as PetSize | 'Todos' }))} className={selectClass}>
                                        {sizeOptions.map(size => <option key={size} value={size} className="text-gray-900">{size}</option>)}
                                    </select>
                                </div>

                                {/* Multi-Color Filter */}
                                <div className="space-y-3">
                                    <label className={labelClass}>Colores (Max 3)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <select value={filters.color1} onChange={(e) => setFilters(f => ({ ...f, color1: e.target.value }))} className={selectClass}>
                                            <option value="Todos" className="text-gray-900">Color 1 (Principal)</option>
                                            {colorOptions.filter(c => c !== 'Todos').map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                                        </select>
                                        <select value={filters.color2} onChange={(e) => setFilters(f => ({ ...f, color2: e.target.value }))} className={selectClass}>
                                            <option value="Todos" className="text-gray-900">Color 2 (Opcional)</option>
                                            {colorOptions.filter(c => c !== 'Todos').map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                                        </select>
                                        <select value={filters.color3} onChange={(e) => setFilters(f => ({ ...f, color3: e.target.value }))} className={selectClass}>
                                            <option value="Todos" className="text-gray-900">Color 3 (Opcional)</option>
                                            {colorOptions.filter(c => c !== 'Todos').map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="p-4 border-t border-white/10 text-center">
                    <p className="text-[10px] text-blue-200">&copy; {new Date().getFullYear()} Pets v2.0</p>
                </div>
            </aside>
        </>
    );
};
