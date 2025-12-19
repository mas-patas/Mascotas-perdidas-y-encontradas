
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { PetStatus, AnimalType, PetSize } from '@/types';
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES } from '@/constants';
import { dogBreeds, catBreeds, petColors } from '@/data/breeds';
import { departments, getProvinces, getDistricts } from '@/data/locations';
import { MegaphoneIcon, MapIcon, StoreIcon, HeartIcon, LightbulbIcon, FilterIcon, XCircleIcon, ChevronDownIcon } from '@/shared/components/icons';
import { useAuth } from '@/contexts/auth';

type Filters = {
    status: PetStatus | 'Todos';
    type: AnimalType | 'Todos';
    breed: string;
    colors: string[];
    size: PetSize | 'Todos';
    department: string;
    province: string;
    district: string;
    dateFilter: string;
    name: string;
};

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    isSidebarOpen: boolean;
    onClose: () => void;
    onClearFilters: () => void;
}

// Color mapping for visual chips
const colorMap: { [key: string]: { bg: string; border: string; text: string } } = {
    'Negro': { bg: 'bg-gray-900', border: 'border-gray-700', text: 'text-white' },
    'Blanco': { bg: 'bg-white', border: 'border-gray-300', text: 'text-gray-900' },
    'Marrón': { bg: 'bg-amber-800', border: 'border-amber-900', text: 'text-white' },
    'Dorado': { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-gray-900' },
    'Crema': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-gray-900' },
    'Gris': { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-white' },
    'Rojo / Naranja': { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
    'Canela': { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-white' },
    'Atigrado': { bg: 'bg-gradient-to-r from-amber-600 to-gray-600', border: 'border-amber-700', text: 'text-white' },
    'Manchado': { bg: 'bg-gradient-to-br from-gray-400 to-gray-600', border: 'border-gray-500', text: 'text-white' },
    'Bicolor': { bg: 'bg-gradient-to-r from-gray-900 to-white', border: 'border-gray-700', text: 'text-gray-900' },
    'Tricolor': { bg: 'bg-gradient-to-r from-amber-600 via-white to-gray-900', border: 'border-amber-700', text: 'text-gray-900' },
    'Merle': { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', border: 'border-gray-400', text: 'text-white' },
    'Azul': { bg: 'bg-blue-400', border: 'border-blue-500', text: 'text-white' },
};

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
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isColorsOpen, setIsColorsOpen] = useState(false);
    const [isBreedOpen, setIsBreedOpen] = useState(false);
    const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
    const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
    
    // Sort colors alphabetically
    const sortedColors = useMemo(() => {
        return [...petColors].sort((a, b) => a.localeCompare(b, 'es'));
    }, []);
    
    // Get available breeds based on animal type
    const availableBreeds = useMemo(() => {
        if (filters.type === ANIMAL_TYPES.PERRO) {
            return [...dogBreeds].sort((a, b) => a.localeCompare(b, 'es'));
        } else if (filters.type === ANIMAL_TYPES.GATO) {
            return [...catBreeds].sort((a, b) => a.localeCompare(b, 'es'));
        }
        return [];
    }, [filters.type]);
    
    // Show sidebar on specific routes
    const showDesktopSidebar = ['/', '/campanas', '/mapa', '/servicios', '/reunidos', '/tips'].includes(location.pathname);
    const isHome = location.pathname === '/';


    // Reset breed when animal type changes
    useEffect(() => {
        if (filters.type === 'Todos') {
            setFilters(f => ({ ...f, breed: 'Todos' }));
        }
    }, [filters.type, setFilters]);

    // Update provinces when department changes
    useEffect(() => {
        if (filters.department && filters.department !== 'Todos') {
            const provs = getProvinces(filters.department);
            setAvailableProvinces(provs);
            // Reset province and district if department changes
            if (filters.province && !provs.includes(filters.province)) {
                setFilters(f => ({ ...f, province: 'Todos', district: 'Todos' }));
            }
        } else {
            setAvailableProvinces([]);
            setFilters(f => ({ ...f, province: 'Todos', district: 'Todos' }));
        }
    }, [filters.department, setFilters]);

    // Update districts when province changes
    useEffect(() => {
        if (filters.province && filters.province !== 'Todos' && filters.department && filters.department !== 'Todos') {
            const dists = getDistricts(filters.department, filters.province);
            setAvailableDistricts(dists);
            // Reset district if province changes
            if (filters.district && !dists.includes(filters.district)) {
                setFilters(f => ({ ...f, district: 'Todos' }));
            }
        } else {
            setAvailableDistricts([]);
            setFilters(f => ({ ...f, district: 'Todos' }));
        }
    }, [filters.province, filters.department, setFilters]);


    const handleStatusToggle = (status: PetStatus) => {
        setFilters(f => {
            // Si el estado seleccionado es el mismo, deseleccionarlo (volver a 'Todos')
            // Si es diferente, seleccionar el nuevo (deseleccionar el anterior automáticamente)
            const newStatus = f.status === status ? 'Todos' : status;
            return { ...f, status: newStatus };
        });
    };

    const handleColorToggle = (color: string) => {
        setFilters(f => {
            const currentColors = f.colors || [];
            if (currentColors.includes(color)) {
                return { ...f, colors: currentColors.filter(c => c !== color) };
            } else if (currentColors.length < 3) {
                return { ...f, colors: [...currentColors, color] };
            }
            return f; // Max 3 colors
        });
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as AnimalType | 'Todos';
        setFilters(f => ({
            ...f,
            type: newType,
            breed: 'Todos',
        }));
    };

    // Check if name filter should be shown (only if status includes 'Perdido')
    const showNameFilter = filters.status === PET_STATUS.PERDIDO;

    // Count active filters
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.status !== 'Todos') count++;
        if (filters.type !== 'Todos') count++;
        if (filters.breed !== 'Todos') count++;
        if (filters.colors.length > 0) count++;
        if (filters.size !== 'Todos') count++;
        if (filters.department !== 'Todos') count++;
        if (filters.province !== 'Todos') count++;
        if (filters.district !== 'Todos') count++;
        if (filters.dateFilter) count++;
        if (filters.name) count++;
        return count;
    }, [filters]);
    
    // Styling
    const selectClass = "w-full p-1.5 sm:p-2 bg-white/10 border border-white/20 rounded-lg text-[10px] sm:text-xs text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent block transition-colors option:text-gray-900";
    const labelClass = "block mb-1 sm:mb-1.5 text-[9px] sm:text-[10px] font-bold text-white/90 uppercase tracking-wider";
    const navLinkClass = (isActive: boolean) => `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base ${isActive ? 'bg-white/20 text-white shadow-lg' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`;
    const navLinkReunitedClass = (isActive: boolean) => `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-bold text-sm sm:text-base ${isActive ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 shadow-[0_4px_20px_rgba(251,191,36,0.5)] hover:shadow-[0_6px_25px_rgba(251,191,36,0.6)] hover:scale-105' : 'text-blue-100 hover:bg-gradient-to-r hover:from-amber-400 hover:to-yellow-400 hover:text-amber-900 hover:shadow-[0_4px_20px_rgba(251,191,36,0.5)] hover:scale-105'}`;

    return (
        <>
            {isSidebarOpen && <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden backdrop-blur-sm" />}
            
            <aside 
                className={`
                    bg-gradient-to-b from-sky-400 to-blue-900 text-white flex flex-col shadow-2xl border-r border-white/10
                    transition-transform duration-300 ease-in-out
                    fixed inset-y-0 left-0 w-[85vw] max-w-[320px] sm:w-[75vw] sm:max-w-[360px] lg:w-[250px] lg:max-w-none z-40 transform lg:relative lg:translate-x-0 lg:flex-shrink-0
                    pt-14 sm:pt-16 md:pt-20 lg:pt-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${showDesktopSidebar ? 'lg:flex' : 'lg:hidden'}
                `}
                data-tour="sidebar-menu"
            >
                <div className="p-3 sm:p-4 md:p-6 pb-2">
                    <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
                        <h2 className="text-xs sm:text-sm font-bold text-white/70 uppercase tracking-widest">Navegación</h2>
                        <button onClick={onClose} className="lg:hidden text-white hover:text-gray-200 text-xl sm:text-2xl p-1" aria-label="Cerrar menú">&times;</button>
                    </div>
                    
                    <nav className="space-y-0.5 sm:space-y-1" data-tour="sidebar-navigation">
                        {/* Removed Home button from Sidebar as requested */}
                        <button onClick={() => { navigate('/reunidos'); onClose(); }} className={navLinkReunitedClass(location.pathname === '/reunidos')} data-tour="nav-reunited">
                            <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 fill-current text-red-500 animate-pulse" /> 
                            <span className="text-sm sm:text-base">
                                Reencuentros
                            </span>
                        </button>
                        <button onClick={() => { navigate('/nosotros'); onClose(); }} className={navLinkClass(location.pathname === '/nosotros')}>
                            <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="text-sm sm:text-base">Nosotros</span>
                        </button>
                        <button onClick={() => { navigate('/mapa'); onClose(); }} className={navLinkClass(location.pathname === '/mapa')} data-tour="nav-map">
                            <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="text-sm sm:text-base">Mapa de mascotas</span>
                        </button>
                        <button onClick={() => { navigate('/campanas'); onClose(); }} className={navLinkClass(location.pathname === '/campanas')} data-tour="nav-campaigns">
                            <MegaphoneIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="text-sm sm:text-base">Campañas</span>
                        </button>
                        <button onClick={() => { navigate('/tips'); onClose(); }} className={navLinkClass(location.pathname === '/tips')}>
                            <LightbulbIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="text-sm sm:text-base">Tips y Consejos</span>
                        </button>
                        {currentUser?.role === USER_ROLES.SUPERADMIN && (
                            <button onClick={() => { navigate('/servicios'); onClose(); }} className={navLinkClass(location.pathname === '/servicios')}>
                                <StoreIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="text-sm sm:text-base">Servicios</span>
                            </button>
                        )}
                    </nav>
                </div>

                {/* Filters Section for HOME */}
                {isHome && (
                    <div className="flex-grow px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 border-t border-white/10 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4 sm:mb-5">
                            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2">
                                <FilterIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-200" /> <span>Filtros</span>
                            </h3>
                            {activeFiltersCount > 0 && (
                                <button 
                                    onClick={onClearFilters}
                                    className="text-[9px] sm:text-[10px] uppercase font-bold text-sky-200 hover:text-white transition-colors px-1 py-0.5"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4 sm:space-y-5" data-tour="sidebar-filters">
                            {/* FILTROS PRINCIPALES - Always visible */}
                            
                            {/* 1. TIPO DE PUBLICACIÓN */}
                            <div>
                                <label className={labelClass}>Tipo de Publicación</label>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {[PET_STATUS.PERDIDO, PET_STATUS.EN_ADOPCION, PET_STATUS.AVISTADO, PET_STATUS.ENCONTRADO].map(status => {
                                        const isActive = filters.status === status;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusToggle(status)}
                                                className={`
                                                    px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all
                                                    ${isActive 
                                                        ? 'bg-white text-blue-900 shadow-md' 
                                                        : 'bg-white/20 text-white hover:bg-white/30'
                                                    }
                                                `}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. TIPO DE ANIMAL */}
                            <div>
                                <label htmlFor="type-filter" className={labelClass}>Tipo de Animal</label>
                                <select id="type-filter" value={filters.type} onChange={handleTypeChange} className={selectClass}>
                                    {['Todos', ANIMAL_TYPES.PERRO, ANIMAL_TYPES.GATO, ANIMAL_TYPES.OTRO].map(type => 
                                        <option key={type} value={type} className="text-gray-900">{type}</option>
                                    )}
                                </select>
                            </div>

                            {/* FILTROS AVANZADOS - Collapsible, start collapsed */}
                            <div className="border-t border-white/10 pt-4">
                                <button
                                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                    className="flex items-center justify-between w-full mb-3 text-xs sm:text-sm font-bold text-white/90 hover:text-white transition-colors"
                                >
                                    <span>Filtros Avanzados</span>
                                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isAdvancedOpen && (
                                    <div className="space-y-4">
                                        {/* 3. UBICACIÓN - Hierarchical */}
                                        <div className="space-y-3">
                                            <label className={labelClass}>Ubicación</label>
                                            <select 
                                                value={filters.department} 
                                                onChange={(e) => setFilters(f => ({ ...f, department: e.target.value, province: 'Todos', district: 'Todos' }))} 
                                                className={selectClass}
                                            >
                                                <option value="Todos" className="text-gray-900">Todos los departamentos</option>
                                                {departments.map(dept => <option key={dept} value={dept} className="text-gray-900">{dept}</option>)}
                                            </select>
                                            
                                            {filters.department !== 'Todos' && availableProvinces.length > 0 && (
                                                <select 
                                                    value={filters.province} 
                                                    onChange={(e) => setFilters(f => ({ ...f, province: e.target.value, district: 'Todos' }))} 
                                                    className={selectClass}
                                                >
                                                    <option value="Todos" className="text-gray-900">Todas las provincias</option>
                                                    {availableProvinces.map(prov => <option key={prov} value={prov} className="text-gray-900">{prov}</option>)}
                                                </select>
                                            )}
                                            
                                            {filters.province !== 'Todos' && availableDistricts.length > 0 && (
                                                <select 
                                                    value={filters.district} 
                                                    onChange={(e) => setFilters(f => ({ ...f, district: e.target.value }))} 
                                                    className={selectClass}
                                                >
                                                    <option value="Todos" className="text-gray-900">Todos los distritos</option>
                                                    {availableDistricts.map(dist => <option key={dist} value={dist} className="text-gray-900">{dist}</option>)}
                                                </select>
                                            )}
                                        </div>

                                        {/* 4. COLORES - Dropdown menu */}
                                        <div>
                                            <label className={labelClass}>
                                                Colores <span className="text-[9px] sm:text-[10px] font-normal normal-case">(3 colores máximo)</span>
                                            </label>
                                            
                                            {/* Dropdown button */}
                                            <button
                                                onClick={() => setIsColorsOpen(!isColorsOpen)}
                                                className={`
                                                    w-full mt-2 p-2 bg-white/10 border border-white/20 rounded-lg 
                                                    text-[11px] sm:text-xs text-white placeholder-white/50 
                                                    focus:ring-2 focus:ring-white/50 focus:border-transparent 
                                                    transition-colors flex items-center justify-between
                                                    ${isColorsOpen ? 'ring-2 ring-white/50' : ''}
                                                `}
                                            >
                                                <span className={filters.colors.length === 0 ? 'text-white/50' : 'text-white'}>
                                                    {filters.colors.length === 0 ? 'Seleccionar' : `${filters.colors.length} seleccionado${filters.colors.length > 1 ? 's' : ''}`}
                                                </span>
                                                <ChevronDownIcon className={`h-3 w-3 transition-transform ${isColorsOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {/* Selected colors display */}
                                            {filters.colors.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {filters.colors.map(color => {
                                                        const colorStyle = colorMap[color] || { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-white' };
                                                        return (
                                                            <div
                                                                key={color}
                                                                className={`
                                                                    px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold
                                                                    border-2 flex items-center gap-1
                                                                    ${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} shadow-sm
                                                                `}
                                                            >
                                                                <span className={`w-1.5 h-1.5 rounded-full ${colorStyle.bg} ${colorStyle.border} border`}></span>
                                                                <span className="truncate max-w-[50px] sm:max-w-[60px]">{color}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleColorToggle(color);
                                                                    }}
                                                                    className="ml-0.5 hover:opacity-70 transition-opacity"
                                                                >
                                                                    <XCircleIcon className="h-2.5 w-2.5" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            {/* Colors dropdown list */}
                                            {isColorsOpen && (
                                                <div className="mt-2 max-h-64 overflow-y-auto bg-white/10 rounded-lg border border-white/20">
                                                    <div className="p-2 space-y-1">
                                                        {sortedColors.map(color => {
                                                            const isSelected = filters.colors.includes(color);
                                                            const isDisabled = !isSelected && filters.colors.length >= 3;
                                                            const colorStyle = colorMap[color] || { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-white' };
                                                            
                                                            return (
                                                                <button
                                                                    key={color}
                                                                    onClick={() => !isDisabled && handleColorToggle(color)}
                                                                    disabled={isDisabled}
                                                                    className={`
                                                                        w-full px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all
                                                                        flex items-center gap-2 text-left
                                                                        ${isSelected 
                                                                            ? `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} shadow-md` 
                                                                            : `bg-white/10 hover:bg-white/20 text-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className={`w-3 h-3 rounded-full ${colorStyle.bg} ${colorStyle.border} border-2 flex-shrink-0`}></span>
                                                                    <span className="flex-1">{color}</span>
                                                                    {isSelected && <span className="text-xs">✓</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                            {/* 5. TAMAÑO */}
                            <div>
                                <label className={labelClass}>Tamaño</label>
                                <div className="flex gap-1.5 mt-2">
                                    {[SIZES.PEQUENO, SIZES.MEDIANO, SIZES.GRANDE].map(size => {
                                        const isActive = filters.size === size;
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => setFilters(f => ({ 
                                                    ...f, 
                                                    size: isActive ? 'Todos' : (size as PetSize)
                                                }))}
                                                className={`
                                                    flex-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all
                                                    ${isActive 
                                                        ? 'bg-white text-blue-900 shadow-md' 
                                                        : 'bg-white/20 text-white hover:bg-white/30'
                                                    }
                                                `}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 6. FECHA DEL REPORTE */}
                            <div>
                                <label htmlFor="date-filter" className={labelClass}>Fecha del Reporte</label>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {[
                                        { value: '', label: 'Todas' },
                                        { value: 'today', label: 'Hoy' },
                                        { value: 'last3days', label: 'Últimos 3 días' },
                                        { value: 'lastWeek', label: 'Última semana' },
                                        { value: 'lastMonth', label: 'Último mes' }
                                    ].map(option => {
                                        const isActive = filters.dateFilter === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setFilters(f => ({ ...f, dateFilter: option.value }))}
                                                className={`
                                                    px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all
                                                    ${isActive 
                                                        ? 'bg-white text-blue-900 shadow-md' 
                                                        : 'bg-white/20 text-white hover:bg-white/30'
                                                    }
                                                `}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                                        {/* 7. RAZA - Dropdown menu */}
                                        <div>
                                            <label className={labelClass}>Raza</label>
                                            
                                            {/* Dropdown button */}
                                            <button
                                                onClick={() => filters.type !== 'Todos' && setIsBreedOpen(!isBreedOpen)}
                                                disabled={filters.type === 'Todos'}
                                                className={`
                                                    w-full mt-2 p-2 bg-white/10 border border-white/20 rounded-lg 
                                                    text-[11px] sm:text-xs text-white placeholder-white/50 
                                                    focus:ring-2 focus:ring-white/50 focus:border-transparent 
                                                    transition-colors flex items-center justify-between
                                                    ${isBreedOpen ? 'ring-2 ring-white/50' : ''}
                                                    ${filters.type === 'Todos' ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                <span className={filters.breed === 'Todos' ? 'text-white/50' : 'text-white'}>
                                                    {filters.breed === 'Todos' ? 'Seleccionar' : filters.breed}
                                                </span>
                                                <ChevronDownIcon className={`h-3 w-3 transition-transform ${isBreedOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {/* Breed dropdown list */}
                                            {isBreedOpen && filters.type !== 'Todos' && availableBreeds.length > 0 && (
                                                <div className="mt-2 max-h-64 overflow-y-auto bg-white/10 rounded-lg border border-white/20">
                                                    <div className="p-2 space-y-1">
                                                        {availableBreeds.map(breed => {
                                                            const isSelected = filters.breed === breed;
                                                            
                                                            return (
                                                                <button
                                                                    key={breed}
                                                                    onClick={() => {
                                                                        setFilters(f => ({ ...f, breed }));
                                                                        setIsBreedOpen(false);
                                                                    }}
                                                                    className={`
                                                                        w-full px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all
                                                                        flex items-center gap-2 text-left
                                                                        ${isSelected 
                                                                            ? 'bg-white text-blue-900 shadow-md' 
                                                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className="flex-1">{breed}</span>
                                                                    {isSelected && <span className="text-xs">✓</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 8. NOMBRE - Solo si incluye "Perdido" */}
                                        {showNameFilter && (
                                            <div>
                                                <label htmlFor="name-filter" className={labelClass}>Nombre</label>
                                                <input
                                                    id="name-filter"
                                                    type="text"
                                                    value={filters.name}
                                                    onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
                                                    placeholder="Buscar por nombre..."
                                                    className={selectClass}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="p-3 sm:p-4 border-t border-white/10 text-center">
                    <p className="text-[9px] sm:text-[10px] text-blue-200">&copy; {new Date().getFullYear()} Mas Patas v2.0</p>
                </div>
            </aside>
        </>
    );
};
