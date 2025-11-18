import React, { useState, useEffect } from 'react';
import type { Pet, User, PetStatus } from '../types';
import { PetCard } from './PetCard';
import { PET_STATUS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PetListProps {
    pets: Pet[];
    users: User[];
    onViewUser: (user: User) => void;
    filters: {
        status: PetStatus | 'Todos';
    };
    onNavigate: (path: string) => void;
}

const PetSection: React.FC<{
    title: string;
    pets: Pet[];
    users: User[];
    onViewUser: (user: User) => void;
    onNavigate: (path: string) => void;
}> = ({ title, pets, users, onViewUser, onNavigate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(4);
    const [gridClass, setGridClass] = useState('grid-cols-4');

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
            
            setGridClass(newGridClass);
            setCardsPerPage(newCardsPerPage);

            // A more robust way to reset the index to prevent it from going out of bounds
            // when the number of pets or the page size changes.
            setCurrentIndex(prevIndex => {
                // If there are fewer pets than can be displayed on one page, always reset to the first page.
                if (pets.length <= newCardsPerPage) {
                    return 0;
                }
                // Calculate the last possible starting index for the carousel.
                const maxIndex = Math.max(0, pets.length - newCardsPerPage);
                // If the current index is now out of bounds, clamp it to the last valid index.
                return Math.min(prevIndex, maxIndex);
            });
        };

        window.addEventListener('resize', updateLayout);
        updateLayout(); // Initial call

        return () => window.removeEventListener('resize', updateLayout);
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

    return (
        <section>
            <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-brand-primary mb-4">{title}</h2>
            
            <div className="relative">
                <div className={`grid ${gridClass} gap-4`}>
                    {visiblePets.map(pet => {
                        const petOwner = users.find(u => u.email === pet.userEmail);
                        return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                    })}
                </div>

                {showCarousel && (
                    <>
                        <button 
                            onClick={handlePrev} 
                            disabled={!canGoPrev} 
                            className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 z-10 p-2 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Anterior"
                        >
                            <ChevronLeftIcon />
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={!canGoNext} 
                            className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 z-10 p-2 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Siguiente"
                        >
                            <ChevronRightIcon />
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};


export const PetList: React.FC<PetListProps> = ({ pets, users, onViewUser, filters, onNavigate }) => {
    
    // Si se aplica un filtro de estado, mostrar una sola cuadrícula con todos los resultados.
    if (filters.status !== 'Todos') {
        return (
             <div className="space-y-10">
                {pets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {pets.map(pet => {
                            const petOwner = users.find(u => u.email === pet.userEmail);
                            return <PetCard key={pet.id} pet={pet} owner={petOwner} onViewUser={onViewUser} onNavigate={onNavigate} />;
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                        <p className="text-xl text-gray-500">No se encontraron mascotas con los filtros actuales.</p>
                        <p className="text-gray-400 mt-2">Intenta ajustar tu búsqueda.</p>
                    </div>
                )}
            </div>
        )
    }

    // Vista por defecto: secciones separadas con carruseles
    const lostPets = pets.filter(p => p.status === PET_STATUS.PERDIDO);
    const foundPets = pets.filter(p => p.status === PET_STATUS.ENCONTRADO);
    const sightedPets = pets.filter(p => p.status === PET_STATUS.AVISTADO);
    const adoptionPets = pets.filter(p => p.status === PET_STATUS.EN_ADOPCION);
    const reunitedPets = pets.filter(p => p.status === PET_STATUS.REUNIDO);

    return (
        <div className="space-y-10">
            {pets.length > 0 ? (
                <>
                    <PetSection 
                        title="Mascotas Perdidas"
                        pets={lostPets}
                        users={users}
                        onViewUser={onViewUser}
                        onNavigate={onNavigate}
                    />
                     <PetSection 
                        title="Mascotas Encontradas"
                        pets={foundPets}
                        users={users}
                        onViewUser={onViewUser}
                        onNavigate={onNavigate}
                    />
                    <PetSection 
                        title="En Adopción"
                        pets={adoptionPets}
                        users={users}
                        onViewUser={onViewUser}
                        onNavigate={onNavigate}
                    />
                     <PetSection 
                        title="Mascotas Avistadas"
                        pets={sightedPets}
                        users={users}
                        onViewUser={onViewUser}
                        onNavigate={onNavigate}
                    />
                     <PetSection 
                        title="Historias de Éxito (Reunidos)"
                        pets={reunitedPets}
                        users={users}
                        onViewUser={onViewUser}
                        onNavigate={onNavigate}
                    />
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                    <p className="text-xl text-gray-500">No se encontraron mascotas con los filtros actuales.</p>
                    <p className="text-gray-400 mt-2">Intenta ajustar tu búsqueda.</p>
                </div>
            )}
        </div>
    );
};