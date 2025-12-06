
import React, { useState, useEffect, useRef } from 'react';
import type { Pet, User, PetStatus } from '../types';
import { PetCard } from './PetCard';
import { PET_STATUS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, WarningIcon, PlusIcon, HeartIcon, HistoryIcon } from './icons';

interface PetListProps {
    pets: Pet[];
    users: User[];
    onViewUser: (user: User) => void;
    filters: {
        status: PetStatus | 'Todos';
    };
    onNavigate: (path: string) => void;
    onSelectStatus: (status: PetStatus) => void;
    onReset: () => void;
    loadMore?: () => void;
    hasMore?: boolean;
    isLoading: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

// Wrapper for Lazy Loading & Animation
const LazyLoadSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Stop observing once loaded
                }
            },
            {
                rootMargin: '100px', // Load 100px before it comes into view
                threshold: 0.1
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div 
            ref={ref} 
            className={`transition-all duration-1000 ease-out transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } min-h-[240px]`}
        >
            {isVisible ? children : (
                // Skeleton loading state
                <div className="w-full space-y-4">
                    <div className="h-6 bg-gray-100 rounded w-1/4 animate-pulse"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const PetSection: React.FC<{
    title: string;
    pets: Pet[];
    users: User[];
    onViewUser: (user: User) => void;
    onNavigate: (path: string) => void;
    onSeeMore: () => void;
}> = ({ title, pets, users, onViewUser, onNavigate, onSeeMore }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(6);
    const [gridClass, setGridClass] = useState('grid-cols-6');
    
    // Touch state for swipe detection
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            let newCardsPerPage = 6;
            let newGridClass = 'grid-cols-6';
            
            if (width < 640) { // Mobile
                newCardsPerPage = 2;
                newGridClass = 'grid-cols-2';
            } else if (width < 768) { // Small Tablet
                newCardsPerPage = 3;
                newGridClass = 'grid-cols-3';
            } else if (width < 1024) { // Tablet
                newCardsPerPage = 4;
                newGridClass = 'grid-cols-4';
            } else if (width < 1280) { // Small Desktop
                newCardsPerPage = 5;
                newGridClass = 'grid-cols-5';
            }
            
            setGridClass(prev => prev !== newGridClass ? newGridClass : prev);
            setCardsPerPage(prev => prev !== newCardsPerPage ? newCardsPerPage : prev);

            setCurrentIndex(prevIndex => {
                if (pets.length <= newCardsPerPage) {
                    return 0;
                }
                const maxIndex = Math.max(0, pets.length - newCardsPerPage);
                return Math.min(prevIndex, maxIndex);
            });
        };

        window.addEventListener('resize', updateLayout);
        const timer = setTimeout(() => { updateLayout(); }, 0);

        return () => {
            window.removeEventListener('resize', updateLayout);
            clearTimeout(timer);
        };
    }, [pets.length]);


    const showCarousel = pets.length > cardsPerPage;

    if (pets.length === 0) {
        return null;
    }

    const handleNext = () => {
        if (currentIndex + cardsPerPage < pets.length) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex + cardsPerPage < pets.length;

    const visiblePets = showCarousel ? pets.slice(currentIndex, currentIndex + cardsPerPage) : pets;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && canGoNext) {
            handleNext();
        }
        if (isRightSwipe && canGoPrev) {
            handlePrev();
        }
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-4 pb-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-brand-primary before:rounded-full">
                    {title}
                </h2>
                <button 
                    onClick={onSeeMore}
                    className="text-brand-primary hover:text-brand-dark font-bold text-sm flex items-center gap-1 group"
                >
                    <span>Ver todos</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                </button>
            </div>
            
            <div 
                className="relative group/carousel select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className={`grid ${gridClass} gap-4 transition-all duration-500`}>
                    {visiblePets.filter(p => p).map(pet => {
                        const petOwner = users.find(u => u.email === pet.userEmail);
                        return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                    })}
                </div>

                {showCarousel && (
                    <>
                        <button 
                            onClick={handlePrev} 
                            disabled={!canGoPrev} 
                            className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-4 z-20 p-2 rounded-full bg-white text-gray-700 shadow-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-0 disabled:cursor-not-allowed transition-all flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                            aria-label="Anterior"
                        >
                            <ChevronLeftIcon />
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={!canGoNext} 
                            className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-4 z-20 p-2 rounded-full bg-white text-gray-700 shadow-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-0 disabled:cursor-not-allowed transition-all flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                            aria-label="Siguiente"
                        >
                            <ChevronRightIcon />
                        </button>
                        
                        <div className="flex md:hidden justify-center mt-4 gap-1.5">
                            {Array.from({ length: Math.ceil((pets.length - cardsPerPage) + 1) }).map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-brand-primary' : 'w-1.5 bg-gray-300'}`}
                                />
                            )).slice(0, 5)}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};


export const PetList: React.FC<PetListProps> = ({ pets, users, onViewUser, filters, onNavigate, onSelectStatus, onReset, loadMore, hasMore, isLoading, isError, onRetry }) => {
    
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [showSlowLoading, setShowSlowLoading] = useState(false);

    useEffect(() => {
        let timer: any;
        if (isLoading) {
            setShowSlowLoading(false);
            timer = setTimeout(() => {
                setShowSlowLoading(true);
            }, 10000); 
        } else {
            setShowSlowLoading(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        if (filters.status === 'Todos' || !hasMore || !loadMore || isLoading || isError) return;

        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting) {
                loadMore();
            }
        }, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => {
            if (sentinelRef.current) observer.unobserve(sentinelRef.current);
        };
    }, [hasMore, loadMore, filters.status, isLoading, isError]);

    if (isError) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md border border-red-100">
                <div className="text-red-500 mb-4 flex justify-center">
                    <WarningIcon />
                </div>
                <p className="text-xl text-gray-800 font-semibold">Hubo un problema al cargar las mascotas.</p>
                <p className="text-gray-500 mt-2 mb-6">Por favor, revisa tu conexión o intenta nuevamente.</p>
                <button 
                    onClick={onRetry} 
                    className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold hover:bg-brand-dark transition-colors shadow-md"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // View 1: Specific Category Selected (Infinite Scroll Grid with Fluid Layout)
    if (filters.status !== 'Todos') {
        return (
             <div className="space-y-6 animate-fade-in">
                <div>
                    <button 
                        onClick={onReset} 
                        className="text-gray-500 hover:text-gray-900 font-bold py-2 rounded-lg transition-colors flex items-center gap-1 text-sm mb-4"
                    >
                        <ChevronLeftIcon />
                        Volver al inicio
                    </button>
                    <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800">
                            {filters.status === PET_STATUS.EN_ADOPCION ? 'Mascotas en Adopción' : `Mascotas ${filters.status}s`}
                        </h2>
                        <span className="text-gray-500 text-sm font-medium bg-white border border-gray-200 px-3 py-1 rounded-full">
                            {pets.length} resultados
                        </span>
                    </div>
                </div>

                {isLoading && pets.length === 0 ? (
                     <div className="h-64 w-full flex flex-col justify-center items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-primary"></div>
                        {showSlowLoading && (
                            <div className="text-center animate-fade-in">
                                <p className="text-gray-500 text-sm mb-2">Esto está tardando más de lo normal...</p>
                                <button onClick={onRetry} className="text-brand-primary font-bold hover:underline text-sm flex items-center gap-1 mx-auto">
                                    <HistoryIcon className="h-4 w-4"/> Recargar ahora
                                </button>
                            </div>
                        )}
                    </div>
                ) : pets.length > 0 ? (
                    <>
                        {/* Fluid Grid Layout - Airbnb Style */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 md:gap-5">
                            {pets.filter(p => p).map(pet => {
                                const petOwner = users.find(u => u.email === pet.userEmail);
                                return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                            })}
                        </div>
                        
                        {/* Infinite Scroll Logic + Manual Button */}
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            {hasMore && (
                                <>
                                    <div ref={sentinelRef} className="h-1 w-full opacity-0"></div>
                                    <button 
                                        onClick={() => loadMore && loadMore()}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-full shadow-sm transition-all text-sm"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                <span>Cargando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon />
                                                <span>Cargar más resultados</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            
                            {!hasMore && pets.length > 10 && (
                                <div className="text-center mt-4">
                                    <p className="text-gray-400 text-sm">Has llegado al final de la lista.</p>
                                    <button onClick={onReset} className="text-brand-primary text-sm font-bold mt-2 hover:underline">Ver otras categorías</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 px-6 bg-white rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto mt-10">
                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <WarningIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-xl text-gray-800 font-bold">No se encontraron resultados.</p>
                        <p className="text-gray-500 mt-2 text-sm">Intenta ajustar tu búsqueda o limpiar los filtros.</p>
                        <button onClick={onReset} className="mt-6 px-6 py-2 bg-brand-primary text-white rounded-full font-bold text-sm shadow-md hover:bg-brand-dark transition-colors">
                            Limpiar Filtros
                        </button>
                    </div>
                )}
            </div>
        )
    }

    // View 2: Dashboard / Overview (Carousels per category)
    const lostPets = pets.filter(p => p && p.status === PET_STATUS.PERDIDO);
    const foundPets = pets.filter(p => p && p.status === PET_STATUS.ENCONTRADO);
    const sightedPets = pets.filter(p => p && p.status === PET_STATUS.AVISTADO);
    const adoptionPets = pets.filter(p => p && p.status === PET_STATUS.EN_ADOPCION);

    if (isLoading && pets.length === 0) {
        return (
            <div className="text-center py-24 px-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary mx-auto mb-4"></div>
                <p className="text-lg text-gray-500 font-medium">Buscando mascotas cercanas...</p>
                
                {showSlowLoading && (
                    <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100 max-w-sm mx-auto inline-block">
                        <p className="text-yellow-700 text-sm mb-2 font-medium">La conexión parece lenta.</p>
                        <button 
                            onClick={onRetry} 
                            className="bg-white border border-yellow-300 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-yellow-50 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in pb-10">
            {/* Banner Promocional para Reunidos */}
            <div 
                className="bg-gradient-to-r from-sky-400 to-blue-600 rounded-2xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden group cursor-pointer transition-transform transform hover:-translate-y-1" 
                onClick={() => onNavigate('/reunidos')}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300 opacity-20 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm"><HeartIcon className="h-4 w-4 text-white" filled /></span>
                            <span className="font-bold text-blue-100 uppercase tracking-wider text-[10px]">Finales Felices</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black mb-2 leading-tight drop-shadow-sm">
                            Mascotas que regresaron a casa
                        </h2>
                        <p className="text-blue-50 max-w-lg text-sm font-medium opacity-90 leading-relaxed">
                            Descubre historias conmovedoras de reencuentros posibles gracias a esta comunidad.
                        </p>
                    </div>
                    <button className="bg-white text-blue-700 font-bold py-2.5 px-6 rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-900 transition-all transform hover:scale-105 flex items-center gap-2 whitespace-nowrap text-sm">
                        Ver Historias <ChevronRightIcon />
                    </button>
                </div>
            </div>

            {pets.length > 0 ? (
                <>
                    {lostPets.length > 0 && (
                        <LazyLoadSection>
                            <PetSection 
                                title="Mascotas Perdidas"
                                pets={lostPets}
                                users={users}
                                onViewUser={onViewUser}
                                onNavigate={onNavigate}
                                onSeeMore={() => onSelectStatus(PET_STATUS.PERDIDO)}
                            />
                        </LazyLoadSection>
                    )}
                    {foundPets.length > 0 && (
                         <LazyLoadSection>
                            <PetSection 
                                title="Mascotas Encontradas"
                                pets={foundPets}
                                users={users}
                                onViewUser={onViewUser}
                                onNavigate={onNavigate}
                                onSeeMore={() => onSelectStatus(PET_STATUS.ENCONTRADO)}
                            />
                        </LazyLoadSection>
                    )}
                    {adoptionPets.length > 0 && (
                        <LazyLoadSection>
                            <PetSection 
                                title="En Adopción"
                                pets={adoptionPets}
                                users={users}
                                onViewUser={onViewUser}
                                onNavigate={onNavigate}
                                onSeeMore={() => onSelectStatus(PET_STATUS.EN_ADOPCION)}
                            />
                        </LazyLoadSection>
                    )}
                    {sightedPets.length > 0 && (
                         <LazyLoadSection>
                            <PetSection 
                                title="Mascotas Avistadas"
                                pets={sightedPets}
                                users={users}
                                onViewUser={onViewUser}
                                onNavigate={onNavigate}
                                onSeeMore={() => onSelectStatus(PET_STATUS.AVISTADO)}
                            />
                        </LazyLoadSection>
                    )}
                </>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100 max-w-md mx-auto">
                    <p className="text-xl text-gray-500 font-bold">No hay publicaciones recientes.</p>
                    <p className="text-gray-400 mt-2 text-sm">¡Sé el primero en reportar una mascota!</p>
                </div>
            )}
        </div>
    );
};
