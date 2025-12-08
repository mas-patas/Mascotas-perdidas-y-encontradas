
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import type { PetRow, AnimalType } from '@/types';
import { PET_STATUS, ANIMAL_TYPES } from '@/constants';
import { HeartIcon, CalendarIcon, UserIcon, ArrowDownIcon, SearchIcon, SparklesIcon, TrophyIcon, DogIcon, CatIcon, ChevronLeftIcon, ChevronRightIcon, LocationMarkerIcon, PetIcon } from '@/shared/components/icons';
import { Helmet } from 'react-helmet-async';

// Helper para calcular días transcurridos
const calculateDaysApart = (start: string, end?: string) => {
    const date1 = new Date(start);
    const date2 = end ? new Date(end) : new Date();
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
};

const ReunitedPetsPage: React.FC = () => {
    const [reunitedPets, setReunitedPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Filters
    const [selectedType, setSelectedType] = useState<AnimalType | 'Todos'>('Todos');

    // Fetch reunited pets
    useEffect(() => {
        const fetchReunited = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('pets')
                    .select('*, profiles:user_id(username)')
                    .eq('status', PET_STATUS.REUNIDO)
                    .order('reunion_date', { ascending: false, nullsFirst: false })
                    .limit(100);

                if (error) throw error;

                const mapped: Pet[] = (data || []).map((p: any) => ({
                    id: p.id,
                    userEmail: p.profiles?.username || 'Usuario',
                    status: p.status,
                    name: p.name,
                    animalType: p.animal_type,
                    breed: p.breed,
                    color: p.color,
                    location: p.location,
                    date: p.date,
                    contact: '',
                    description: p.description,
                    imageUrls: p.image_urls || [],
                    lat: p.lat,
                    lng: p.lng,
                    reunionStory: p.reunion_story,
                    reunionDate: p.reunion_date,
                    comments: [],
                    createdAt: p.created_at
                }));

                setReunitedPets(mapped);
            } catch (err) {
                console.error("Error fetching reunited pets:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReunited();
    }, []);

    const filteredPets = useMemo(() => {
        return reunitedPets.filter(pet => {
            const typeMatch = selectedType === 'Todos' || pet.animalType === selectedType;
            return typeMatch;
        });
    }, [reunitedPets, selectedType]);

    // Contadores por tipo para filtros
    const filterCounts = useMemo(() => {
        return {
            Todos: reunitedPets.length,
            [ANIMAL_TYPES.PERRO]: reunitedPets.filter(p => p.animalType === ANIMAL_TYPES.PERRO).length,
            [ANIMAL_TYPES.GATO]: reunitedPets.filter(p => p.animalType === ANIMAL_TYPES.GATO).length,
            [ANIMAL_TYPES.OTRO]: reunitedPets.filter(p => p.animalType === ANIMAL_TYPES.OTRO).length,
        };
    }, [reunitedPets]);

    // Auto-rotate hero slider
    useEffect(() => {
        if (filteredPets.length <= 1 || isCarouselPaused) return;
        carouselIntervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.min(filteredPets.length, 5));
        }, 5000);
        return () => {
            if (carouselIntervalRef.current) {
                clearInterval(carouselIntervalRef.current);
            }
        };
    }, [filteredPets.length, isCarouselPaused]);

    const handlePrevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + Math.min(filteredPets.length, 5)) % Math.min(filteredPets.length, 5));
    };

    const handleNextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % Math.min(filteredPets.length, 5));
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-brand-light"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-500"></div></div>;

    const featuredPets = filteredPets.slice(0, 5);

    // Calculamos estadísticas rápidas para la UI
    const totalReunited = reunitedPets.length;
    const fastReunions = reunitedPets.filter(p => calculateDaysApart(p.date, p.reunionDate) <= 3).length;

    return (
        <div className="bg-brand-light min-h-screen pb-20 font-sans">
            <Helmet>
                <title>Reencuentros | Mas Patas</title>
                <meta name="description" content="Historias reales de reencuentros." />
            </Helmet>

            {/* --- HERO SECTION --- */}
            <div className="relative bg-gradient-to-b from-sky-400 to-blue-700 text-white overflow-hidden pb-12 pt-6 rounded-b-[3rem] shadow-card-hover mb-12">
                {/* Abstract Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-300 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-white border border-white/25 mb-6 shadow-card animate-fade-in-up">
                            <SparklesIcon className="h-4 w-4" /> {totalReunited} mascotas han vuelto a casa
                        </span>
                        
                        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight drop-shadow-xl">
                            Historias que <br className="md:hidden"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-200">Inspiran Esperanza</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium leading-relaxed">
                            Detrás de cada foto hay una comunidad que no se rindió. <br/>
                            Estos son los momentos por los que trabajamos.
                        </p>
                    </div>

                    {/* --- FEATURED CAROUSEL (Hero Card) --- */}
                    {featuredPets.length > 0 && (
                        <div 
                            className="relative w-full max-w-5xl mx-auto aspect-[4/3] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-card-hover border-4 border-white/15 bg-black/30 backdrop-blur-sm"
                            onMouseEnter={() => setIsCarouselPaused(true)}
                            onMouseLeave={() => setIsCarouselPaused(false)}
                        >
                            {/* Navigation Arrows */}
                            {featuredPets.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevSlide}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 md:p-3 transition-all duration-200 hover:scale-110 border border-white/20"
                                        aria-label="Historia anterior"
                                    >
                                        <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                    </button>
                                    <button
                                        onClick={handleNextSlide}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 md:p-3 transition-all duration-200 hover:scale-110 border border-white/20"
                                        aria-label="Siguiente historia"
                                    >
                                        <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                    </button>
                                </>
                            )}

                            {featuredPets.map((pet, index) => {
                                const isActive = index === currentIndex;
                                const days = calculateDaysApart(pet.date, pet.reunionDate);
                                
                                return (
                                    <div 
                                        key={pet.id}
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"></div>
                                        <img 
                                            src={pet.imageUrls[0]} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover"
                                        />
                                        
                                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20 flex flex-col md:flex-row items-end justify-between gap-4">
                                            <div className="text-left space-y-3 max-w-2xl">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="bg-emerald-400/95 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">
                                                        Reunido en {days} {days === 1 ? 'día' : 'días'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-white/95 text-sm font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                                        <UserIcon className="h-3.5 w-3.5" /> @{pet.userEmail}
                                                    </span>
                                                </div>
                                                <h2 className="text-3xl md:text-5xl font-black text-white leading-none drop-shadow-lg">
                                                    {pet.name}
                                                </h2>
                                                <p className="text-white/95 text-sm md:text-lg font-medium line-clamp-2 md:line-clamp-none italic font-serif drop-shadow-md">
                                                    "{pet.reunionStory || "Gracias a todos por compartir, ¡ya estamos juntos de nuevo!"}"
                                                </p>
                                            </div>
                                            
                                            {/* Navigation Dots */}
                                            <div className="flex gap-2">
                                                {featuredPets.map((_, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => setCurrentIndex(idx)}
                                                        className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${currentIndex === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'}`}
                                                        aria-label={`Ver historia ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* --- STATS STRIP --- */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20 mb-12">
                <div className="bg-white rounded-2xl shadow-card-hover p-6 md:p-8 grid grid-cols-2 md:grid-cols-3 divide-x divide-card-border border border-card-border">
                    <div className="text-center px-4 transition-transform duration-200 hover:scale-105 cursor-default">
                        <div className="flex justify-center mb-2">
                            <HeartIcon className="h-10 w-10 md:h-12 md:w-12 text-sky-600" filled />
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-sky-600">{totalReunited}</p>
                        <p className="text-xs text-icon-gray font-bold uppercase tracking-wider mt-1.5">Reencuentros</p>
                    </div>
                    <div className="text-center px-4 transition-transform duration-200 hover:scale-105 cursor-default">
                        <div className="flex justify-center mb-2">
                            <SparklesIcon className="h-10 w-10 md:h-12 md:w-12 text-emerald-500" />
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-emerald-500">{fastReunions}</p>
                        <p className="text-xs text-icon-gray font-bold uppercase tracking-wider mt-1.5">En menos de 72h</p>
                    </div>
                    <div className="hidden md:block text-center px-4 transition-transform duration-200 hover:scale-105 cursor-default">
                        <div className="flex justify-center text-amber-400 mb-1.5">
                            <TrophyIcon className="h-10 w-10 md:h-12 md:w-12" />
                        </div>
                        <p className="text-xs text-icon-gray font-bold uppercase tracking-wider">Comunidad #1</p>
                    </div>
                </div>
            </div>

            {/* --- FILTER PILLS --- */}
            <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                <h3 className="text-icon-gray font-bold text-sm uppercase tracking-widest mb-6">Filtrar Historias</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {['Todos', ANIMAL_TYPES.PERRO, ANIMAL_TYPES.GATO, ANIMAL_TYPES.OTRO].map((type) => {
                        const count = filterCounts[type as keyof typeof filterCounts] || 0;
                        const getIcon = () => {
                            if (type === 'Todos') return null;
                            if (type === ANIMAL_TYPES.PERRO) return <DogIcon className="h-4 w-4" />;
                            if (type === ANIMAL_TYPES.GATO) return <CatIcon className="h-4 w-4" />;
                            return <PetIcon className="h-4 w-4" />;
                        };
                        const Icon = getIcon();
                        
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type as any)}
                                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                                    selectedType === type 
                                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                                    : 'bg-white text-text-sub hover:bg-sky-50 border border-card-border hover:border-sky-200'
                                }`}
                            >
                                {Icon && <span className={selectedType === type ? 'text-white' : 'text-icon-gray'}>{Icon}</span>}
                                <span>
                                    {type === 'Todos' ? 'Todas las Historias' : type + 's'}
                                    {count > 0 && <span className="ml-1.5 opacity-70">({count})</span>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- STORIES GRID --- */}
            <div className="max-w-7xl mx-auto px-6">
                {filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
                        {filteredPets.map((pet) => {
                            const days = calculateDaysApart(pet.date, pet.reunionDate);
                            const reunionDateFormatted = pet.reunionDate ? new Date(pet.reunionDate).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                            }) : null;
                            
                            return (
                                <Link
                                    key={pet.id}
                                    to={`/mascota/${pet.id}`}
                                    className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-card hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 transform hover:-translate-y-2 border border-card-border hover:border-sky-200 flex flex-col h-full cursor-pointer"
                                >
                                    {/* Image Container */}
                                    <div className="relative h-48 sm:h-64 overflow-hidden bg-sky-50">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 group-hover:to-transparent transition-all duration-500 z-10"></div>
                                        <img 
                                            src={pet.imageUrls[0]} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
                                            <span className="bg-white/95 backdrop-blur-sm text-sky-600 text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-sky-100">
                                                <HeartIcon className="h-3 w-3 fill-current" /> {days} {days === 1 ? 'Día' : 'Días'} lejos
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-5 sm:p-6 flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <h3 className="text-xl sm:text-2xl font-black text-text-main group-hover:text-sky-600 transition-colors duration-200 mb-1">
                                                {pet.name}
                                            </h3>
                                            <div className="space-y-1">
                                                <p className="text-xs sm:text-sm font-medium text-icon-gray flex items-center gap-1.5">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    Perdido el {new Date(pet.date).toLocaleDateString()}
                                                </p>
                                                {reunionDateFormatted && (
                                                    <p className="text-xs sm:text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                                                        <HeartIcon className="h-3.5 w-3.5 fill-current" />
                                                        Reunido el {reunionDateFormatted}
                                                    </p>
                                                )}
                                                {pet.location && (
                                                    <p className="text-xs sm:text-sm font-medium text-icon-gray flex items-center gap-1.5">
                                                        <LocationMarkerIcon className="h-3.5 w-3.5" />
                                                        {pet.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="relative bg-gradient-to-br from-sky-50 to-blue-50 p-4 sm:p-5 rounded-lg sm:rounded-xl mb-4 flex-grow border border-sky-100 group-hover:border-sky-200 transition-colors">
                                            <span className="absolute -top-2 -left-1 text-3xl sm:text-4xl text-sky-200 font-serif leading-none">“</span>
                                            <p className="text-text-sub text-xs sm:text-sm italic font-medium leading-relaxed line-clamp-4 relative z-10">
                                                {pet.reunionStory || "Gracias a la comunidad, volvió a casa."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-card-border">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-[11px] sm:text-xs font-bold text-sky-600 flex-shrink-0 shadow-sm border border-sky-200">
                                                    {pet.userEmail.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-bold text-text-sub truncate max-w-[100px] sm:max-w-[120px]">
                                                    @{pet.userEmail}
                                                </span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0 border border-emerald-100">
                                                ¡Reunido!
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 sm:py-20 bg-white rounded-2xl sm:rounded-3xl border border-card-border shadow-card">
                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 inline-block p-5 sm:p-6 rounded-full mb-4 shadow-sm border border-sky-100">
                            <SearchIcon className="h-8 w-8 sm:h-10 sm:w-10 text-sky-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-text-main">No encontramos historias en esta categoría</h3>
                        <p className="text-text-sub mt-2 text-sm sm:text-base">Intenta cambiar los filtros.</p>
                        <button 
                            onClick={() => setSelectedType('Todos')} 
                            className="mt-6 text-sky-600 font-bold hover:text-sky-700 hover:underline text-sm sm:text-base transition-colors"
                        >
                            Ver todas las historias
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReunitedPetsPage;
