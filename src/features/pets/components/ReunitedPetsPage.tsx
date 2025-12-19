
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import type { PetRow, AnimalType } from '@/types';
import { PET_STATUS, ANIMAL_TYPES } from '@/constants';
import { HeartIcon, CalendarIcon, UserIcon, ArrowDownIcon, SearchIcon, SparklesIcon, TrophyIcon, DogIcon, CatIcon, ChevronLeftIcon, ChevronRightIcon, LocationMarkerIcon, PetIcon, PawIcon } from '@/shared/components/icons';
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
            <div className="relative bg-gradient-to-b from-sky-400 to-blue-700 text-white mb-12 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden">
                <div className="max-w-full mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[450px] lg:min-h-[500px]">
                        {/* LEFT SECTION - Text Content with Gradient */}
                        <div className="relative bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700 flex flex-col justify-between p-6 lg:p-10 text-center lg:text-left">
                            {/* Top Indicator Chip */}
                            <div className="mb-6 flex justify-center lg:justify-start">
                                <span className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold text-blue-700 shadow-md">
                                    <PawIcon className="h-5 w-5" />
                                    +{totalReunited} reencuentros logrados
                                </span>
                            </div>

                            {/* Main Heading */}
                            <div className="flex-1 flex flex-col justify-center">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight tracking-tight text-white">
                                    Historias que <br className="md:hidden"/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-200">Inspiran Esperanza</span>
                                </h1>
                                <p className="text-base md:text-lg text-white/95 font-medium leading-relaxed mb-6">
                                    Detrás de cada foto hay una comunidad que no se rindió. <br/>
                                    Estos son los momentos por los que trabajamos.
                                </p>
                            </div>

                            {/* Bottom Motto */}
                            <div className="flex items-center justify-center lg:justify-start gap-2 text-white/95">
                                <HeartIcon className="h-5 w-5" filled />
                                <span className="text-base font-medium">Cada historia es una razón para seguir creyendo</span>
                            </div>
                        </div>

                        {/* RIGHT SECTION - Image Carousel */}
                        {featuredPets.length > 0 && (
                            <div 
                                className="relative w-full h-full min-h-[400px] lg:min-h-[500px] overflow-hidden"
                                onMouseEnter={() => setIsCarouselPaused(true)}
                                onMouseLeave={() => setIsCarouselPaused(false)}
                            >
                                {featuredPets.map((pet, index) => {
                                    const isActive = index === currentIndex;
                                    const days = calculateDaysApart(pet.date, pet.reunionDate);
                                    
                                    return (
                                        <div 
                                            key={pet.id}
                                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                        >
                                            <img 
                                                src={pet.imageUrls[0] || 'https://via.placeholder.com/800x700'} 
                                                alt={pet.name} 
                                                className="w-full h-full object-cover"
                                            />
                                            
                                            {/* Overlay Information */}
                                            <div className="absolute bottom-0 left-0 w-full p-6 lg:p-8 z-20 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                                                <div className="space-y-2">
                                                    {/* Green Tag */}
                                                    <span className="inline-block bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm">
                                                        REUNIDO EN {days} {days === 1 ? 'DÍA' : 'DÍAS'}
                                                    </span>
                                                    
                                                    {/* Pet Name */}
                                                    <h2 className="text-3xl md:text-4xl font-black text-white leading-none drop-shadow-lg">
                                                        {pet.name}
                                                    </h2>
                                                    
                                                    {/* Owner Quote */}
                                                    <p className="text-white text-sm md:text-base font-medium italic drop-shadow-md max-w-md">
                                                        "{pet.reunionStory || 'lo encontre cerca a mi casa'}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Pagination Dots */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                                    {featuredPets.map((_, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
                                            aria-label={`Ver historia ${idx + 1}`}
                                        />
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                {featuredPets.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevSlide}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white backdrop-blur-md rounded-full p-3 transition-all duration-200 hover:scale-110 shadow-lg border border-white/50"
                                            aria-label="Historia anterior"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={handleNextSlide}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white backdrop-blur-md rounded-full p-3 transition-all duration-200 hover:scale-110 shadow-lg border border-white/50"
                                            aria-label="Siguiente historia"
                                        >
                                            <ChevronRightIcon className="h-5 w-5 text-blue-600" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- STATS STRIP --- */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-20 mb-8 sm:mb-12">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-card-hover p-2 sm:p-3 md:p-4 grid grid-cols-3 divide-x divide-card-border border border-card-border">
                    <div className="text-center px-2 sm:px-3 md:px-4 transition-transform duration-200 hover:scale-105 cursor-default py-1">
                        <div className="flex justify-center items-center mb-0.5 sm:mb-1 h-5 sm:h-6 md:h-7">
                            <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-sky-600" filled />
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-sky-600 leading-tight">{totalReunited}</p>
                        <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase tracking-wider mt-0">Reencuentros</p>
                    </div>
                    <div className="text-center px-2 sm:px-3 md:px-4 transition-transform duration-200 hover:scale-105 cursor-default py-1">
                        <div className="flex justify-center items-center mb-0.5 sm:mb-1 h-5 sm:h-6 md:h-7">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="10" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-emerald-500 leading-tight">{fastReunions}</p>
                        <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase tracking-wider mt-0">En menos de 72h</p>
                    </div>
                    <div className="text-center px-2 sm:px-3 md:px-4 transition-transform duration-200 hover:scale-105 cursor-default py-1">
                        <div className="flex justify-center items-center text-amber-400 mb-0.5 sm:mb-1 h-5 sm:h-6 md:h-7">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-amber-400 leading-tight">#1</p>
                        <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase tracking-wider mt-0">Comunidad</p>
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
