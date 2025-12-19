
import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { PetRow, User, PetStatus, Pet } from '@/types';
import { PetCard } from '@/features/pets';
import { PET_STATUS } from '@/constants';
import { WarningIcon, MapIcon, FilterIcon, XCircleIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/icons';
import { supabase } from '@/services/supabaseClient';
import { applyPetFilters } from '@/api/pets/pets.filters';
import { mapPetFromDb } from '@/utils/mappers';
import { BannerCarousel } from '@/shared';
import { useActiveBanners } from '@/api';

interface PetListProps {
    pets: Pet[] | PetRow[];
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

// Internal Component for Horizontal Rows with Infinite Scroll
const PetSection: React.FC<{ 
    title: string; 
    status: string; // Needed for fetching more
    initialPets: Pet[] | PetRow[]; 
    users: User[]; 
    onViewUser: (user: User) => void; 
    onNavigate: (path: string) => void;
    accentColor: string;
    icon: React.ReactNode;
    onViewAll: () => void;
    filters: any; // Filters from sidebar
}> = ({ title, status, initialPets, users, onViewUser, onNavigate, accentColor, icon, onViewAll, filters }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [additionalPets, setAdditionalPets] = useState<Pet[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreHorizontal, setHasMoreHorizontal] = useState(true);

    // Check if initialPets are already Pet[] (have imageUrls) or PetRow[] (have image_urls)
    const isPetType = (pet: Pet | PetRow): pet is Pet => {
        return 'imageUrls' in pet && Array.isArray((pet as Pet).imageUrls);
    };

    // Transform initial pets to Pet type with processed image URLs if needed
    const transformedInitialPets = useMemo(() => {
        const deduplicated = (() => {
            const map = new Map<string, Pet | PetRow>();
            initialPets.forEach(pet => {
                if (pet && pet.id) {
                    map.set(pet.id, pet);
                }
            });
            return Array.from(map.values());
        })();

        // If already Pet[], return as-is. Otherwise transform from PetRow[]
        return deduplicated.map(pet => {
            if (isPetType(pet)) {
                // Already Pet type with processed imageUrls - return as-is
                return pet;
            } else {
                // PetRow type, needs transformation
                const petRow = pet as PetRow;
                const owner = users.find(u => u.id === petRow.user_id);
                const profiles = owner ? [{ id: owner.id, email: owner.email }] : [];
                return mapPetFromDb(petRow, profiles);
            }
        });
    }, [initialPets, users]);

    // Combine initial props with fetched data, removing duplicates by ID
    const allPets = useMemo(() => {
        const allPetsMap = new Map<string, Pet>();
        // Add transformed initial pets
        transformedInitialPets.forEach(pet => {
            if (pet && pet.id) {
                allPetsMap.set(pet.id, pet);
            }
        });
        // Add additional pets (will overwrite if duplicate, keeping the initial one)
        additionalPets.forEach(pet => {
            if (pet && pet.id && !allPetsMap.has(pet.id)) {
                allPetsMap.set(pet.id, pet);
            }
        });
        return Array.from(allPetsMap.values());
    }, [transformedInitialPets, additionalPets]);

    // Reset when initialPets or filters change (e.g. refresh or filter change) - use a stable reference
    useEffect(() => {
        setAdditionalPets([]);
        setHasMoreHorizontal(true);
    }, [transformedInitialPets, filters]);

    const fetchMoreHorizontal = async () => {
        if (isLoadingMore || !hasMoreHorizontal) return;
        
        setIsLoadingMore(true);
        try {
            // Calculate offset based on what we currently have
            const currentCount = allPets.length;
            const BATCH_SIZE = 7;
            
            // Basic query similar to usePets but specific for this row
            // Apply filters from sidebar using declarative approach
            let query = supabase
                .from('pets')
                .select('id, status, name, animal_type, breed, color, size, location, date, contact, description, image_urls, adoption_requirements, share_contact_info, contact_requests, reward, currency, lat, lng, created_at, expires_at, user_id, reunion_story, reunion_date')
                .eq('status', status)
                .gt('expires_at', new Date().toISOString());
            
            // Apply all filters consistently with getPets
            query = applyPetFilters(query, filters || {});
            
            const { data, error } = await query
                // Filter: expires_at > now (excludes expired and deactivated pets)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .range(currentCount, currentCount + BATCH_SIZE - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                // Get unique user IDs from the fetched pets
                const userIds = [...new Set(data.map((p: PetRow) => p.user_id).filter(Boolean))];
                
                // Fetch profiles for these users
                let profiles: any[] = [];
                if (userIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', userIds);
                    
                    if (profilesError) {
                        console.error('Error fetching profiles:', profilesError);
                    } else {
                        profiles = profilesData || [];
                    }
                }
                
                // Transform PetRow[] to Pet[] using mapPetFromDb to ensure image URLs are processed
                const newPets: Pet[] = (data as PetRow[]).map(p => mapPetFromDb(p, profiles));
                
                // Filter out pets that are already in transformedInitialPets to avoid duplicates
                const existingIds = new Set(transformedInitialPets.map(p => p.id));
                const newUniquePets = newPets.filter(p => p && p.id && !existingIds.has(p.id));
                
                // Also filter out pets already in additionalPets
                setAdditionalPets(prev => {
                    const prevIds = new Set(prev.map(p => p.id));
                    const trulyNewPets = newUniquePets.filter(p => !prevIds.has(p.id));
                    return [...prev, ...trulyNewPets];
                });
                
                if (data.length < BATCH_SIZE || newUniquePets.length === 0) {
                    setHasMoreHorizontal(false);
                }
            } else {
                setHasMoreHorizontal(false);
            }
        } catch (err) {
            console.error("Error fetching more horizontal pets", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 600; 
            
            // Check if we need to load more when scrolling right
            if (direction === 'right' && hasMoreHorizontal) {
                const maxScrollLeft = current.scrollWidth - current.clientWidth;
                // If we are within 2 scroll distances of the end, start loading
                if (current.scrollLeft + scrollAmount >= maxScrollLeft - 100) {
                    fetchMoreHorizontal();
                }
            }

            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (allPets.length === 0) return null;

    return (
        <div className="mb-6 sm:mb-8 border-b border-gray-100 pb-4 sm:pb-6 last:border-0 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-3 sm:mb-4 px-0.5 sm:px-1 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <div className={`p-1 sm:p-1.5 rounded-full bg-${accentColor}-100 text-${accentColor}-600 flex-shrink-0`}>
                        <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5">{icon}</div>
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{title}</h3>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                    <button 
                        onClick={onViewAll}
                        className="text-[10px] sm:text-xs font-bold text-brand-primary hover:text-brand-dark hover:underline uppercase tracking-wide transition-colors whitespace-nowrap"
                    >
                        Ver todos
                    </button>
                    
                    <div className="w-px h-3 sm:h-4 bg-gray-300"></div>

                    <div className="flex gap-0.5 sm:gap-1">
                        <button 
                            onClick={() => scroll('left')}
                            className="p-1 sm:p-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            aria-label="Scroll izquierda"
                        >
                            <ChevronLeftIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="p-1 sm:p-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            aria-label="Scroll derecha"
                        >
                            <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-3 sm:pb-4 hide-scrollbar scroll-smooth snap-x snap-mandatory w-full"
            >
                {allPets.map(pet => {
                    // Find owner by userEmail since Pet has userEmail
                    const petOwner = users.find(u => u.email === pet.userEmail);
                    return (
                        <div key={pet.id} className="min-w-[160px] w-[160px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] snap-start flex-shrink-0">
                            <PetCard pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />
                        </div>
                    );
                })}
                
                {/* Loader Skeleton at the end while fetching more */}
                {isLoadingMore && (
                    <div className="min-w-[160px] w-[160px] sm:min-w-[180px] sm:w-[180px] md:min-w-[200px] md:w-[200px] snap-start flex-shrink-0">
                        <div className="h-full w-full bg-gray-100 rounded-xl animate-pulse flex flex-col p-3 sm:p-4 space-y-2">
                            <div className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PetList: React.FC<PetListProps> = ({ pets, users, onViewUser, filters, setFilters, onNavigate, onSelectStatus, onReset, loadMore, hasMore, isLoading, isError, onRetry }) => {
    
    const sentinelRef = useRef<HTMLDivElement>(null);
    const { data: banners = [] } = useActiveBanners();
    
    // DIRECT STATE DERIVATION: No more local state syncing issues
    // If filters.status is 'Todos', we are in 'ALL' (Dashboard) mode.
    const activeTab = filters.status === 'Todos' ? 'ALL' : filters.status;

    // Check if we should show dashboard view (rows) or grid view
    // Dashboard view only when: NO filters active at all (completely default state)
    // When ANY filter is active, show grid view
    const shouldShowDashboard = useMemo(() => {
        // Check if status filter is active
        const hasStatusFilter = filters.status !== 'Todos';
        
        // Check if any other filter is active
        const hasOtherFilters = 
            filters.type !== 'Todos' ||
            filters.breed !== 'Todos' ||
            filters.colors.length > 0 ||
            filters.size !== 'Todos' ||
            filters.department !== 'Todos' ||
            filters.province !== 'Todos' ||
            filters.district !== 'Todos' ||
            filters.dateFilter !== '' ||
            filters.name !== '';
        
        // Show dashboard ONLY if NO filters are active (completely default state)
        // If ANY filter is active (status or other), show grid view
        return !hasStatusFilter && !hasOtherFilters;
    }, [filters]);

    const handleTabChange = (status: string) => {
        if (status === 'ALL') {
            setFilters((prev: any) => ({ ...prev, status: 'Todos' }));
        } else {
            setFilters((prev: any) => ({ ...prev, status: status }));
        }
    };

    const removeFilter = (key: string, valueToRemove?: string) => {
        setFilters((prev: any) => {
            if (key === 'colors' && Array.isArray(prev.colors)) {
                // Remove specific color from array
                if (valueToRemove) {
                    return { ...prev, colors: prev.colors.filter((c: string) => c !== valueToRemove) };
                }
                return { ...prev, colors: [] };
            } else {
                // Standard filter removal
                const defaultValues: any = {
                    status: 'Todos',
                    type: 'Todos',
                    breed: 'Todos',
                    size: 'Todos',
                    department: 'Todos',
                    province: 'Todos',
                    district: 'Todos',
                    dateFilter: '',
                    name: ''
                };
                // Use the default value if key exists, otherwise fallback to 'Todos'
                // This preserves empty strings for dateFilter and name fields
                const defaultValue = key in defaultValues ? defaultValues[key] : 'Todos';
                return { ...prev, [key]: defaultValue };
            }
        });
    };

    // Active Filters Logic - Declarative Configuration Approach
    const activeFilters = useMemo(() => {
        type FilterConfig = {
            key: string;
            label: string;
            isValid: (value: any) => boolean;
            getValue: (value: any) => string | string[];
            isArray?: boolean;
        };

        const DATE_LABELS: Record<string, string> = {
            'today': 'Hoy',
            'last3days': 'Últimos 3 días',
            'lastWeek': 'Última semana',
            'lastMonth': 'Último mes'
        };

        const isNotDefault = (value: any, defaultValue: string = 'Todos'): boolean => {
            return value && value !== defaultValue;
        };

        const isNotEmpty = (value: any): boolean => {
            return value && typeof value === 'string' && value.trim() !== '';
        };

        const filterConfigs: FilterConfig[] = [
            {
                key: 'status',
                label: 'Tipo',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'type',
                label: 'Animal',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'breed',
                label: 'Raza',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'colors',
                label: 'Color',
                isValid: (value) => Array.isArray(value) && value.length > 0,
                getValue: (value) => value,
                isArray: true
            },
            {
                key: 'size',
                label: 'Tamaño',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'department',
                label: 'Ubicación',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'province',
                label: 'Provincia',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'district',
                label: 'Distrito',
                isValid: (value) => isNotDefault(value),
                getValue: (value) => value
            },
            {
                key: 'dateFilter',
                label: 'Fecha',
                isValid: (value) => isNotEmpty(value),
                getValue: (value) => DATE_LABELS[value] || value
            },
            {
                key: 'name',
                label: 'Nombre',
                isValid: (value) => isNotEmpty(value),
                getValue: (value) => value
            }
        ];

        return filterConfigs
            .filter(config => {
                const filterValue = filters[config.key as keyof typeof filters];
                return config.isValid(filterValue);
            })
            .flatMap(config => {
                const filterValue = filters[config.key as keyof typeof filters];
                const processedValue = config.getValue(filterValue);
                
                if (config.isArray && Array.isArray(processedValue)) {
                    return processedValue.map(value => ({
                        key: config.key,
                        label: config.label,
                        value: String(value)
                    }));
                }
                
                return [{
                    key: config.key,
                    label: config.label,
                    value: String(processedValue)
                }];
            });
    }, [filters]);

    // Helper to check if pet is Pet type (has imageUrls) or PetRow (has image_urls)
    const isPetType = (pet: Pet | PetRow): pet is Pet => {
        return 'imageUrls' in pet;
    };

    // Deduplicate pets array to prevent duplicate keys
    const deduplicatedPets = useMemo(() => {
        const petsMap = new Map<string, Pet | PetRow>();
        pets.forEach(pet => {
            if (pet && pet.id) {
                petsMap.set(pet.id, pet);
            }
        });
        return Array.from(petsMap.values());
    }, [pets]);

    // Grouping for Dashboard View - Only done when needed
    // We filter prop 'pets' which should contain dashboard data when activeTab is ALL
    const dashboardGroups = activeTab === 'ALL' ? {
        lost: deduplicatedPets.filter(p => p.status === PET_STATUS.PERDIDO) as (Pet | PetRow)[],
        sighted: deduplicatedPets.filter(p => p.status === PET_STATUS.AVISTADO) as (Pet | PetRow)[],
        found: deduplicatedPets.filter(p => p.status === PET_STATUS.ENCONTRADO) as (Pet | PetRow)[],
        adoption: deduplicatedPets.filter(p => p.status === PET_STATUS.EN_ADOPCION) as (Pet | PetRow)[]
    } : null;

    // Intersection Observer for Infinite Scroll (Only for Grid Mode)
    useEffect(() => {
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
        <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-20">
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

            {/* 1. Banner Carousel or Default Banner */}
            {shouldShowDashboard && (
                <>
                    {banners.length > 0 ? (
                        <BannerCarousel banners={banners} />
                    ) : (
                        <div 
                            className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md h-[120px] sm:h-[150px] md:h-[180px] flex items-center bg-gray-900 group cursor-pointer animate-fade-in"
                            onClick={() => onNavigate('/reunidos')}
                        >
                            <img 
                                src="https://images.unsplash.com/photo-1544568100-847a948585b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80" 
                                alt="Happy dog" 
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/80 to-blue-600/40"></div>
                            
                            <div className="relative z-10 p-4 sm:p-5 md:p-6 lg:px-10 text-white max-w-2xl">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider">Historias Reales</span>
                                </div>
                                <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl font-black mb-1.5 sm:mb-2 leading-tight drop-shadow-md">
                                    Cuando la esperanza <br className="hidden sm:block"/> vuelve a casa.
                                </h2>
                                <button className="bg-white text-indigo-600 text-[10px] sm:text-xs font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-full shadow hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-1.5">
                                    <HeartIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current text-red-500" /> <span>Ver Reencuentros</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Sticky Navigation Bar */}
            <div className="sticky top-0 bg-[#F5F7FA] pt-1.5 sm:pt-2 pb-2 sm:pb-4 z-20 backdrop-blur-sm bg-opacity-95">
                <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3">
                    {/* Tab Strip - Modified to wrap on mobile instead of scroll */}
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:gap-4 pb-0.5 sm:pb-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    relative px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-bold whitespace-nowrap transition-colors duration-200
                                    ${activeTab === tab.id 
                                        ? 'text-gray-900' 
                                        : 'text-gray-500 hover:text-brand-primary'}
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
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1 sm:gap-2 items-center min-h-[24px] sm:min-h-[30px] flex-1 min-w-0">
                            {activeFilters.length > 0 ? (
                                <>
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mr-0.5 sm:mr-1 flex-shrink-0"><FilterIcon className="inline h-2.5 w-2.5 sm:h-3 sm:w-3 mb-0.5"/> <span className="hidden sm:inline">Filtros:</span></span>
                                    {activeFilters.map((filter, index) => (
                                        <button
                                            key={`${filter.key}-${filter.value}-${index}`}
                                            onClick={() => removeFilter(filter.key, filter.value)}
                                            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-white border border-gray-200 text-gray-700 text-[10px] sm:text-xs font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
                                            title={`${filter.label}: ${filter.value}`}
                                        >
                                            <span className="truncate max-w-[80px] sm:max-w-none">{filter.value}</span> <XCircleIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 flex-shrink-0" />
                                        </button>
                                    ))}
                                    <button onClick={onReset} className="text-[10px] sm:text-xs text-gray-500 hover:text-red-500 font-bold underline ml-0.5 sm:ml-1 flex-shrink-0">Borrar</button>
                                </>
                            ) : (
                                <p className="text-[10px] sm:text-xs text-gray-600 font-bold italic">Mostrando resultados más recientes</p>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => onNavigate('/mapa')}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-900 text-white font-bold rounded-full hover:opacity-90 transition-all shadow-sm text-xs flex-shrink-0"
                        >
                            <MapIcon className="h-4 w-4" />
                            Ver en Mapa
                        </button>
                    </div>
                </div>
                <div className="h-px w-full bg-gray-200 mt-1 sm:mt-2"></div>
            </div>

            {/* CONTENT AREA */}
            {isLoading && deduplicatedPets.length === 0 ? (
                // Loading Skeleton
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-[3/2] bg-gray-200 rounded-lg sm:rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : deduplicatedPets.length > 0 ? (
                <>
                    {/* 2. DASHBOARD VIEW (Rows) - Only when no filters active */}
                    {shouldShowDashboard && dashboardGroups ? (
                        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in w-full">
                            <PetSection 
                                title="Mascotas Perdidas" 
                                status={PET_STATUS.PERDIDO}
                                initialPets={dashboardGroups.lost} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="red"
                                icon={<WarningIcon className="h-5 w-5 text-red-500" />}
                                onViewAll={() => handleTabChange(PET_STATUS.PERDIDO)}
                                filters={filters}
                            />
                            
                            <PetSection 
                                title="Mascotas Avistadas" 
                                status={PET_STATUS.AVISTADO}
                                initialPets={dashboardGroups.sighted} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="blue"
                                icon={<MapIcon className="h-5 w-5 text-blue-500" />}
                                onViewAll={() => handleTabChange(PET_STATUS.AVISTADO)}
                                filters={filters}
                            />

                            <PetSection 
                                title="Mascotas Encontradas" 
                                status={PET_STATUS.ENCONTRADO}
                                initialPets={dashboardGroups.found} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="green"
                                icon={<HeartIcon className="h-5 w-5 text-green-500" />}
                                onViewAll={() => handleTabChange(PET_STATUS.ENCONTRADO)}
                                filters={filters}
                            />

                            <PetSection 
                                title="En Adopción" 
                                status={PET_STATUS.EN_ADOPCION}
                                initialPets={dashboardGroups.adoption} 
                                users={users} 
                                onViewUser={onViewUser} 
                                onNavigate={onNavigate}
                                accentColor="purple"
                                icon={<HeartIcon className="h-5 w-5 text-purple-500" filled />}
                                onViewAll={() => handleTabChange(PET_STATUS.EN_ADOPCION)}
                                filters={filters}
                            />
                        </div>
                    ) : (
                        /* GRID VIEW (For specific tabs) */
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-6 md:gap-x-4 md:gap-y-8 animate-fade-in-up w-full">
                                {deduplicatedPets.map(pet => {
                                    // Handle both Pet and PetRow types
                                    let petForCard: Pet;
                                    let petOwner: User | undefined;
                                    
                                    if (isPetType(pet)) {
                                        // Already Pet type
                                        petForCard = pet;
                                        petOwner = users.find(u => u.email === pet.userEmail);
                                    } else {
                                        // PetRow type, needs transformation
                                        const owner = users.find(u => u.id === pet.user_id);
                                        const profiles = owner ? [{ id: owner.id, email: owner.email }] : [];
                                        petForCard = mapPetFromDb(pet, profiles);
                                        petOwner = owner;
                                    }
                                    
                                    return <PetCard key={petForCard.id} pet={petForCard} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                                })}
                            </div>
                            
                            {/* Infinite Scroll Trigger */}
                            <div ref={sentinelRef} className="h-12 sm:h-16 md:h-20 flex justify-center items-center mt-4 sm:mt-6 md:mt-8">
                                {isLoading && hasMore && <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900"></div>}
                            </div>
                            
                            {!hasMore && deduplicatedPets.length > 10 && (
                                <div className="text-center py-6 sm:py-8 md:py-10 w-full">
                                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Has visto todas las publicaciones de esta categoría.</p>
                                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-2 text-brand-primary text-[10px] sm:text-xs font-bold hover:underline">Volver arriba</button>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm mx-auto max-w-md mt-6 sm:mt-8 md:mt-10 px-4">
                    <div className="bg-gray-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <WarningIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">Sin resultados</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6">No encontramos mascotas con estos filtros en esta categoría.</p>
                    <button onClick={onReset} className="px-6 sm:px-8 py-2 sm:py-3 bg-gray-900 text-white rounded-full font-bold shadow-lg hover:bg-black transition-all text-xs sm:text-sm">
                        Limpiar filtros
                    </button>
                </div>
            )}
        </div>
    );
};
