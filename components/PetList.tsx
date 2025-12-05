
import React, { useState, useEffect, useRef } from 'react';
import type { Pet, User, PetStatus } from '../types';
import { PetCard } from './PetCard';
import { PET_STATUS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, WarningIcon, PlusIcon, HeartIcon, HistoryIcon } from './icons';
import { useUsers } from '../hooks/useResources';
import { usePets } from '../hooks/usePets';

interface PetListProps {
    filters: {
        status: PetStatus | 'Todos';
        type: any;
        breed: string;
        color1: string;
        color2: string;
        size: any;
        department: string;
    };
    onViewUser: (user: User) => void;
    onNavigate: (path: string) => void;
    onSelectStatus: (status: PetStatus) => void;
    onReset: () => void;
}

// ... LazyLoadSection and PetSection components remain the same (omitted for brevity, assume they exist) ...
// Re-declaring purely to allow full file replace logic
const LazyLoadSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
        }, { rootMargin: '100px', threshold: 0.1 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return <div ref={ref} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} min-h-[300px]`}>{isVisible ? children : <div className="w-full space-y-4"><div className="h-8 bg-gray-100 rounded w-1/4 animate-pulse"></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>)}</div></div>}</div>;
};

const PetSection: React.FC<{ title: string; pets: Pet[]; users: User[]; onViewUser: (user: User) => void; onNavigate: (path: string) => void; onSeeMore: () => void; }> = ({ title, pets, users, onViewUser, onNavigate, onSeeMore }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(4);
    const [gridClass, setGridClass] = useState('grid-cols-4');
    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            if (width < 768) { setCardsPerPage(2); setGridClass('grid-cols-2'); } else if (width < 1024) { setCardsPerPage(3); setGridClass('grid-cols-3'); } else { setCardsPerPage(4); setGridClass('grid-cols-4'); }
            setCurrentIndex(prev => Math.min(prev, Math.max(0, pets.length - cardsPerPage)));
        };
        window.addEventListener('resize', updateLayout);
        updateLayout();
        return () => window.removeEventListener('resize', updateLayout);
    }, [pets.length]);
    const showCarousel = pets.length > cardsPerPage;
    if (pets.length === 0) return null;
    const visiblePets = showCarousel ? pets.slice(currentIndex, currentIndex + cardsPerPage) : pets;
    return (
        <section>
            <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-3">
                <h2 className="text-2xl font-bold text-gray-800 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-brand-primary before:rounded-full">{title}</h2>
                <button onClick={onSeeMore} className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm group"><span>Ver más</span><span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span></button>
            </div>
            <div className="relative group/carousel">
                <div className={`grid ${gridClass} gap-4 transition-all duration-500`}>
                    {visiblePets.map(pet => <PetCard key={pet.id} pet={pet} owner={users.find(u => u.email === pet.userEmail)} onViewUser={onViewUser} onNavigate={onNavigate} />)}
                </div>
                {showCarousel && (
                    <>
                        <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 p-2 rounded-full bg-white text-brand-primary shadow-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-0 transition-all opacity-0 group-hover/carousel:opacity-100"><ChevronLeftIcon /></button>
                        <button onClick={() => setCurrentIndex(p => p + 1)} disabled={currentIndex + cardsPerPage >= pets.length} className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 p-2 rounded-full bg-white text-brand-primary shadow-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-0 transition-all opacity-0 group-hover/carousel:opacity-100"><ChevronRightIcon /></button>
                    </>
                )}
            </div>
        </section>
    );
};

export const PetList: React.FC<PetListProps> = ({ filters, onViewUser, onNavigate, onSelectStatus, onReset }) => {
    // Hooks called internally now
    const { data: users = [] } = useUsers();
    const { pets, loading: isLoading, hasMore, loadMore, isError, refetch } = usePets({ filters });
    
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [showSlowLoading, setShowSlowLoading] = useState(false);

    useEffect(() => {
        let timer: any;
        if (isLoading) {
            setShowSlowLoading(false);
            timer = setTimeout(() => setShowSlowLoading(true), 10000);
        } else setShowSlowLoading(false);
        return () => clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        if (filters.status === 'Todos' || !hasMore || isLoading || isError) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadMore();
        }, { root: null, rootMargin: '100px', threshold: 0.1 });
        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => { if (sentinelRef.current) observer.unobserve(sentinelRef.current); };
    }, [hasMore, loadMore, filters.status, isLoading, isError]);

    if (isError) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md border border-red-100">
                <div className="text-red-500 mb-4 flex justify-center"><WarningIcon /></div>
                <p className="text-xl text-gray-800 font-semibold">Hubo un problema al cargar las mascotas.</p>
                <button onClick={() => refetch()} className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold hover:bg-brand-dark transition-colors shadow-md mt-4">Reintentar</button>
            </div>
        );
    }

    if (filters.status !== 'Todos') {
        return (
             <div className="space-y-6 animate-fade-in">
                <div>
                    <button onClick={onReset} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm mb-4"><ChevronLeftIcon /> Volver al inicio</button>
                    <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                        <h2 className="text-3xl font-bold text-brand-dark">{filters.status === PET_STATUS.EN_ADOPCION ? 'Mascotas en Adopción' : `Mascotas ${filters.status}s`}</h2>
                        <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded-md">Mostrando {pets.length}</span>
                    </div>
                </div>
                {isLoading && pets.length === 0 ? (
                     <div className="h-64 w-full flex flex-col justify-center items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div>
                        {showSlowLoading && <div className="text-center animate-fade-in"><p className="text-gray-500 text-sm mb-2">Esto está tardando...</p><button onClick={() => refetch()} className="text-brand-primary font-bold hover:underline text-sm flex items-center gap-1 mx-auto"><HistoryIcon className="h-4 w-4"/> Recargar ahora</button></div>}
                    </div>
                ) : pets.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pets.filter(p => p).map(pet => <PetCard key={pet.id} pet={pet} owner={users.find(u => u.email === pet.userEmail)} onViewUser={onViewUser} onNavigate={onNavigate} />)}
                        </div>
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            {hasMore && <><div ref={sentinelRef} className="h-1 w-full opacity-0"></div><button onClick={() => loadMore()} disabled={isLoading} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-brand-primary font-bold py-2 px-6 rounded-full shadow-sm transition-all transform hover:scale-105 active:scale-95">{isLoading ? <span>Cargando...</span> : <><PlusIcon /><span>Cargar más</span></>}</button></>}
                            {!hasMore && pets.length > 10 && <p className="text-gray-400 text-sm">Has llegado al final.</p>}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md"><p className="text-xl text-gray-500">No se encontraron mascotas.</p></div>
                )}
            </div>
        )
    }

    const lostPets = pets.filter(p => p && p.status === PET_STATUS.PERDIDO);
    const foundPets = pets.filter(p => p && p.status === PET_STATUS.ENCONTRADO);
    const sightedPets = pets.filter(p => p && p.status === PET_STATUS.AVISTADO);
    const adoptionPets = pets.filter(p => p && p.status === PET_STATUS.EN_ADOPCION);

    if (isLoading && pets.length === 0) return <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary mx-auto"></div><p className="text-xl text-gray-500 mt-4">Cargando...</p></div>;

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden group cursor-pointer transition-transform transform hover:-translate-y-1" onClick={() => onNavigate('/reunidos')}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2"><span className="bg-white/20 p-1.5 rounded-full"><HeartIcon className="h-5 w-5 text-white" filled /></span><span className="font-bold text-purple-100 uppercase tracking-wider text-xs">Finales Felices</span></div>
                        <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight drop-shadow-md">Mascotas que regresaron a casa</h2>
                        <p className="text-purple-50 max-w-lg text-sm md:text-base font-medium opacity-90">Descubre historias conmovedoras de reencuentros.</p>
                    </div>
                    <button className="bg-white text-purple-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-purple-50 flex items-center gap-2 whitespace-nowrap">Ver Historias <ChevronRightIcon /></button>
                </div>
            </div>
            {pets.length > 0 ? (
                <>
                    {lostPets.length > 0 && <LazyLoadSection><PetSection title="Mascotas Perdidas" pets={lostPets} users={users} onViewUser={onViewUser} onNavigate={onNavigate} onSeeMore={() => onSelectStatus(PET_STATUS.PERDIDO)} /></LazyLoadSection>}
                    {foundPets.length > 0 && <LazyLoadSection><PetSection title="Mascotas Encontradas" pets={foundPets} users={users} onViewUser={onViewUser} onNavigate={onNavigate} onSeeMore={() => onSelectStatus(PET_STATUS.ENCONTRADO)} /></LazyLoadSection>}
                    {adoptionPets.length > 0 && <LazyLoadSection><PetSection title="En Adopción" pets={adoptionPets} users={users} onViewUser={onViewUser} onNavigate={onNavigate} onSeeMore={() => onSelectStatus(PET_STATUS.EN_ADOPCION)} /></LazyLoadSection>}
                    {sightedPets.length > 0 && <LazyLoadSection><PetSection title="Mascotas Avistadas" pets={sightedPets} users={users} onViewUser={onViewUser} onNavigate={onNavigate} onSeeMore={() => onSelectStatus(PET_STATUS.AVISTADO)} /></LazyLoadSection>}
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md"><p className="text-xl text-gray-500">No hay publicaciones recientes.</p></div>
            )}
        </div>
    );
};
