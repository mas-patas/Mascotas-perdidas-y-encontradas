
import React, { useState, useEffect, useRef } from 'react';
import type { Pet, User, PetStatus } from '../types';
import { PetCard } from './PetCard';
import { PET_STATUS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, WarningIcon, PlusIcon } from './icons';

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

const PetSection: React.FC<{
    title: string;
    pets: Pet[];
    users: User[];
    onViewUser: (user: User) => void;
    onNavigate: (path: string) => void;
    onSeeMore: () => void;
}> = ({ title, pets, users, onViewUser, onNavigate, onSeeMore }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(4);
    const [gridClass, setGridClass] = useState('grid-cols-4');
    
    // Touch state for swipe detection
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            let newCardsPerPage = 4;
            let newGridClass = 'grid-cols-4';
            if (width < 768) { // Mobile
                newCardsPerPage = 2;
                newGridClass = 'grid-cols-2';
            } else if (width < 1024) { // Tablet
                newCardsPerPage = 3;
                newGridClass = 'grid-cols-3';
            }
            
            // Guard against unnecessary state updates (React 310/185 prevention)
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
        
        // FIX: Defer initial update to prevent "update inside render" error
        const timer = setTimeout(() => {
            updateLayout(); 
        }, 0);

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

    // Touch Handlers
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
            <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-3">
                <h2 className="text-2xl font-bold text-gray-800 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-brand-primary before:rounded-full">
                    {title}
                </h2>
                <button 
                    onClick={onSeeMore}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm group"
                >
                    <span>Ver más</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                </button>
            </div>
            
            <div 
                className="relative group/carousel select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className={`grid ${gridClass} gap-4 transition-all duration-300`}>
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
                            className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-4 z-20 p-2 rounded-full bg-white text-brand-primary shadow-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-0 disabled:cursor-not-allowed transition-all flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                            aria-label="Anterior"
                        >
                            <ChevronLeftIcon />
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={!canGoNext} 
                            className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-4 z-20 p-2 rounded-full bg-white text-brand-primary shadow-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-0 disabled:cursor-not-allowed transition-all flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                            aria-label="Siguiente"
                        >
                            <ChevronRightIcon />
                        </button>
                        
                        {/* Mobile Indicators (Dots) */}
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

    // Infinite Scroll Observer triggers server fetch via loadMore prop
    useEffect(() => {
        if (filters.status === 'Todos' || !hasMore || !loadMore || isLoading || isError) return;

        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting) {
                loadMore();
            }
        }, {
            root: null,
            rootMargin: '100px',
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

    // View 1: Specific Category Selected (Infinite Scroll Grid)
    if (filters.status !== 'Todos') {
        return (
             <div className="space-y-6">
                <div>
                    <button 
                        onClick={onReset} 
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm mb-4"
                    >
                        <ChevronLeftIcon />
                        Volver al inicio
                    </button>
                    <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                        <h2 className="text-3xl font-bold text-brand-dark">
                            {filters.status === PET_STATUS.EN_ADOPCION ? 'Mascotas en Adopción' : `Mascotas ${filters.status}s`}
                        </h2>
                        <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded-md">
                            Mostrando {pets.length}
                        </span>
                    </div>
                </div>

                {isLoading && pets.length === 0 ? (
                     <div className="h-64 w-full flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div>
                    </div>
                ) : pets.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pets.filter(p => p).map(pet => {
                                const petOwner = users.find(u => u.email === pet.userEmail);
                                return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                            })}
                        </div>
                        
                        {/* Infinite Scroll Logic + Manual Button */}
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            {hasMore && (
                                <>
                                    {/* Sentinel for auto-loading on scroll */}
                                    <div ref={sentinelRef} className="h-1 w-full opacity-0"></div>
                                    
                                    {/* Manual Button for UX preference */}
                                    <button 
                                        onClick={() => loadMore && loadMore()}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-brand-primary font-bold py-2 px-6 rounded-full shadow-sm transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                <span>Cargando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon />
                                                <span>Cargar más mascotas</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            
                            {!hasMore && pets.length > 10 && (
                                <p className="text-gray-400 text-sm">Has llegado al final de la lista.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                        <p className="text-xl text-gray-500">No se encontraron mascotas con los filtros actuales.</p>
                        <p className="text-gray-400 mt-2">Intenta ajustar tu búsqueda o limpiar los filtros.</p>
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
    const reunitedPets = pets.filter(p => p && p.status === PET_STATUS.REUNIDO);

    if (isLoading && pets.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <p className="text-xl text-gray-500 mt-4">Cargando mascotas...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {pets.length > 0 ? (
                <>
                    {lostPets.length > 0 && (
                        <PetSection 
                            title="Mascotas Perdidas"
                            pets={lostPets}
                            users={users}
                            onViewUser={onViewUser}
                            onNavigate={onNavigate}
                            onSeeMore={() => onSelectStatus(PET_STATUS.PERDIDO)}
                        />
                    )}
                    {foundPets.length > 0 && (
                         <PetSection 
                            title="Mascotas Encontradas"
                            pets={foundPets}
                            users={users}
                            onViewUser={onViewUser}
                            onNavigate={onNavigate}
                            onSeeMore={() => onSelectStatus(PET_STATUS.ENCONTRADO)}
                        />
                    )}
                    {adoptionPets.length > 0 && (
                        <PetSection 
                            title="En Adopción"
                            pets={adoptionPets}
                            users={users}
                            onViewUser={onViewUser}
                            onNavigate={onNavigate}
                            onSeeMore={() => onSelectStatus(PET_STATUS.EN_ADOPCION)}
                        />
                    )}
                    {sightedPets.length > 0 && (
                         <PetSection 
                            title="Mascotas Avistadas"
                            pets={sightedPets}
                            users={users}
                            onViewUser={onViewUser}
                            onNavigate={onNavigate}
                            onSeeMore={() => onSelectStatus(PET_STATUS.AVISTADO)}
                        />
                    )}
                    {reunitedPets.length > 0 && (
                         <PetSection 
                            title="Historias de Éxito (Reunidos)"
                            pets={reunitedPets}
                            users={users}
                            onViewUser={onViewUser}
                            onNavigate={onNavigate}
                            onSeeMore={() => onSelectStatus(PET_STATUS.REUNIDO)}
                        />
                    )}
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                    <p className="text-xl text-gray-500">No hay publicaciones recientes.</p>
                    <p className="text-gray-400 mt-2">¡Sé el primero en reportar una mascota!</p>
                </div>
            )}
        </div>
    );
};
