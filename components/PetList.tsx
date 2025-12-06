
import React, { useRef } from 'react';
import type { Pet, User, PetStatus } from '../types';
import { PetCard } from './PetCard';
import { PET_STATUS } from '../constants';
import { WarningIcon, MapIcon, FilterIcon, XCircleIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PetListProps {
    pets: Pet[];
    users: User[];
    onViewUser: (user: User) => void;
    filters: any;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    onNavigate: (path: string) => void;
    onSelectStatus: (status: PetStatus) => void;
    onReset: () => void;
    loadMore?: () => void;
    hasMore?: boolean;
    isLoading: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

// Internal Component for Horizontal Rows
const PetSection: React.FC<{ 
    title: string; 
    pets: Pet[]; 
    users: User[]; 
    onViewUser: (user: User) => void; 
    onNavigate: (path: string) => void;
    accentColor: string;
    icon: React.ReactNode;
    onViewAll: () => void;
}> = ({ title, pets, users, onViewUser, onNavigate, accentColor, icon, onViewAll }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 600; 
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (pets.length === 0) return null;

    return (
        <div className="mb-8 border-b border-gray-100 pb-6 last:border-0 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full bg-${accentColor}-100 text-${accentColor}-600`}>
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onViewAll}
                        className="text-xs font-bold text-brand-primary hover:text-brand-dark hover:underline uppercase tracking-wide transition-colors"
                    >
                        Ver todos
                    </button>
                    
                    <div className="w-px h-4 bg-gray-300"></div>

                    <div className="flex gap-1">
                        <button 
                            onClick={() => scroll('left')}
                            className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar scroll-smooth snap-x snap-mandatory w-full"
            >
                {pets.map(pet => {
                    const petOwner = users.find(u => u.email === pet.userEmail);
                    return (
                        <div key={pet.id} className="min-w-[200px] w-[200px] snap-start flex-shrink-0">
                            <PetCard pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const PetList: React.FC<PetListProps> = ({ pets, users, onViewUser, filters, setFilters, onNavigate, onSelectStatus, onReset, loadMore, hasMore, isLoading, isError, onRetry }) => {
    
    const sentinelRef = useRef<HTMLDivElement>(null);
    
    // DIRECT STATE DERIVATION: No more local state syncing issues
    // If filters.status is 'Todos', we are in 'ALL' (Dashboard) mode.
    const activeTab = filters.status === 'Todos' ? 'ALL' : filters.status;

    const handleTabChange = (status: string) => {
        if (status === 'ALL') {
            setFilters((prev: any) => ({ ...prev, status: 'Todos' }));
        } else {
            setFilters((prev: any) => ({ ...prev, status: status }));
        }
    };

    const removeFilter = (key: string) => {
        setFilters((prev: any) => ({ ...prev, [key]: 'Todos' }));
    };

    // Active Filters Logic
    const activeFilters = Object.entries(filters).filter(([key, value]) => 
        key !== 'status' && value !== 'Todos' && value !== ''
    );

    // Grouping for Dashboard View - Only done when needed
    // We filter prop 'pets' which should contain dashboard data when activeTab is ALL
    const dashboardGroups = activeTab === 'ALL' ? {
        lost: pets.filter(p => p.status === PET_STATUS.PERDIDO),
        sighted: pets.filter(p => p.status === PET_STATUS.AVISTADO),
        found: pets.filter(p => p.status === PET_STATUS.ENCONTRADO),
        adoption: pets.filter(p => p.status === PET_STATUS.EN_ADOPCION)
    } : null;

    // Intersection Observer for Infinite Scroll (Only for Grid Mode)
    React.useEffect(() => {
        if (!hasMore || !loadMore || isLoading || isError || activeTab === 'ALL') return;
        
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadMore();
        }, { rootMargin: '400px' });
        
        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => { if (sentinelRef.current) observer.unobserve(sentinelRef.current); };
    }, [hasMore, loadMore, isLoading, isError, activeTab]);

    if (isError) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md border border-red-100 mt-8">
                <div className="text-red-500 mb-4 flex justify-center"><WarningIcon /></div>
                <p className="text-xl text-gray-800 font-semibold">Hubo un problema al cargar.</p>
                <button onClick={onRetry} className="mt-4 bg-brand-primary text-white px-6 py-2 rounded-full font-bold hover:bg-brand-dark transition-colors">Reintentar</button>
            </div>
        );
    }
    
    const tabs = [
        { id: 'ALL', label: 'Explorar Todos' },
        { id: PET_STATUS.PERDIDO, label: 'Perdidos' },
        { id: PET_STATUS.AVISTADO, label: 'Avistados' },
        { id: PET_STATUS.ENCONTRADO, label: 'Encontrados' },
        { id: PET_STATUS.EN_ADOPCION, label: 'Adopción' },
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Style Injection for Hide Scrollbar */}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* 1. Banner */}
            {activeTab === 'ALL' && (
                <div 
                    className="relative rounded-2xl overflow-hidden shadow-md h-[150px] md:h-[180px] flex items-center bg-gray-900 group cursor-pointer animate-fade-in"
                    onClick={() => onNavigate('/reunidos')}
                >
                    <img 
                        src="https://images.unsplash.com/photo-1544568100-847a948585b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80" 
                        alt="Happy dog" 
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/80 to-blue-600/40"></div>
                    
                    <div className="relative z-10 p-6 md:px-10 text-white max-w-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Historias Reales</span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-black mb-2 leading-tight drop-shadow-md">
                            Cuando la esperanza <br/> vuelve a casa.
                        </h2>
                        <button className="bg-white text-indigo-600 text-xs font-bold py-2 px-4 rounded-full shadow hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                            <HeartIcon className="h-3 w-3 fill-current text-red-500" /> Ver Reencuentros
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Navigation Bar */}
            <div className="sticky top-0 bg-[#F5F7FA] pt-2 pb-4 z-20 backdrop-blur-sm bg-opacity-95">
                <div className="flex flex-col gap-3">
                    {/* Tab Strip - Modified to wrap on mobile instead of scroll */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 pb-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    relative px-2 sm:px-1 py-2 text-sm font-bold whitespace-nowrap transition-colors duration-200
                                    ${activeTab === tab.id 
                                        ? 'text-gray-900' 
                                        : 'text-gray-500 hover:text-gray-800'}
                                `}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-full animate-scale-x"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Active Filters & Map Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center min-h-[30px]">
                            {activeFilters.length > 0 ? (
                                <>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1"><FilterIcon className="inline h-3 w-3 mb-0.5"/> Filtros:</span>
                                    {activeFilters.map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => removeFilter(key)}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            {value as string} <XCircleIcon className="h-3 w-3 text-gray-400" />
                                        </button>
                                    ))}
                                    <button onClick={onReset} className="text-xs text-gray-500 hover:text-red-500 font-bold underline ml-1">Borrar</button>
                                </>
                            ) : (
                                <p className="text-xs text-gray-400 font-medium italic">Mostrando resultados más recientes</p>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => onNavigate('/mapa')}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-900 text-white font-bold rounded-full hover:opacity-90 transition-all shadow-sm text-xs"
                        >
                            <MapIcon className="h-4 w-4" />
                            Ver en Mapa
                        </button>
                    </div>
                </div>
                <div className="h-px w-full bg-gray-200 mt-2"></div>
            </div>

            {/* CONTENT AREA */}
            {isLoading && pets.length === 0 ? (
                // Loading Skeleton
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-[3/2] bg-gray-200 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : pets.length > 0 ? (
                <>
                    {/* 2. DASHBOARD VIEW (Rows) - Only when viewing 'ALL' */}
                    {activeTab === 'ALL' && dashboardGroups ? (
                        <div className="space-y-2 animate-fade-in w-full">
                            <PetSection 
                                title="Mascotas Perdidas" 
                                pets={dashboardGroups.lost} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="red"
                                icon={<WarningIcon className="h-5 w-5 text-red-500" />}
                                onViewAll={() => handleTabChange(PET_STATUS.PERDIDO)}
                            />
                            
                            <PetSection 
                                title="Mascotas Avistadas" 
                                pets={dashboardGroups.sighted} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="blue"
                                icon={<MapIcon className="h-5 w-5 text-blue-500" />}
                                onViewAll={() => handleTabChange(PET_STATUS.AVISTADO)}
                            />

                            <PetSection 
                                title="Mascotas Encontradas" 
                                pets={dashboardGroups.found} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="green"
                                icon={<HeartIcon className="h-5 w-5 text-green-500" />}
                                onViewAll={() => handleTabChange(PET_STATUS.ENCONTRADO)}
                            />

                            <PetSection 
                                title="En Adopción" 
                                pets={dashboardGroups.adoption} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="purple"
                                icon={<HeartIcon className="h-5 w-5 text-purple-500" filled />}
                                onViewAll={() => handleTabChange(PET_STATUS.EN_ADOPCION)}
                            />
                        </div>
                    ) : (
                        /* GRID VIEW (For specific tabs) */
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 animate-fade-in-up w-full">
                                {pets.map(pet => {
                                    const petOwner = users.find(u => u.email === pet.userEmail);
                                    return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                                })}
                            </div>
                            
                            {/* Infinite Scroll Trigger */}
                            <div ref={sentinelRef} className="h-20 flex justify-center items-center mt-8">
                                {isLoading && hasMore && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>}
                            </div>
                            
                            {!hasMore && pets.length > 10 && (
                                <div className="text-center py-10 w-full">
                                    <p className="text-gray-400 text-sm font-medium">Has visto todas las publicaciones de esta categoría.</p>
                                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-2 text-brand-primary text-xs font-bold hover:underline">Volver arriba</button>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mx-auto max-w-md mt-10">
                    <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <WarningIcon className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Sin resultados</h3>
                    <p className="text-gray-500 text-sm mb-6">No encontramos mascotas con estos filtros en esta categoría.</p>
                    <button onClick={onReset} className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold shadow-lg hover:bg-black transition-all">
                        Limpiar filtros
                    </button>
                </div>
            )}
        </div>
    );
};
