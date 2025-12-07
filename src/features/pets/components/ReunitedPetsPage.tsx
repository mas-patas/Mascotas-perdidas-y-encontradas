
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Pet, AnimalType } from '@/types';
import { PET_STATUS, ANIMAL_TYPES } from '@/constants';
import { HeartIcon, CalendarIcon, UserIcon, ArrowDownIcon, SearchIcon, SparklesIcon, TrophyIcon } from '@/shared/components/icons';
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

    // Auto-rotate hero slider
    useEffect(() => {
        if (filteredPets.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.min(filteredPets.length, 5));
        }, 5000);
        return () => clearInterval(interval);
    }, [filteredPets.length]);

    if (loading) return <div className="flex justify-center items-center h-screen bg-brand-light"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary"></div></div>;

    const featuredPets = filteredPets.slice(0, 5);

    // Calculamos estadísticas rápidas para la UI
    const totalReunited = reunitedPets.length;
    const fastReunions = reunitedPets.filter(p => calculateDaysApart(p.date, p.reunionDate) <= 3).length;

    return (
        <div className="bg-white min-h-screen pb-20 font-sans">
            <Helmet>
                <title>Finales Felices | Mas Patas</title>
                <meta name="description" content="Historias reales de reencuentros." />
            </Helmet>

            {/* --- HERO SECTION --- */}
            <div className="relative bg-gradient-to-b from-purple-900 to-indigo-900 text-white overflow-hidden pb-16 pt-8 rounded-b-[3rem] shadow-2xl mb-12">
                {/* Abstract Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-500 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-yellow-300 border border-white/20 mb-6 shadow-lg animate-fade-in-up">
                            <SparklesIcon className="h-4 w-4" /> {totalReunited} mascotas han vuelto a casa
                        </span>
                        
                        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight drop-shadow-xl">
                            Historias que <br className="md:hidden"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Inspiran Esperanza</span>
                        </h1>
                        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto font-medium leading-relaxed">
                            Detrás de cada foto hay una comunidad que no se rindió. <br/>
                            Estos son los momentos por los que trabajamos.
                        </p>
                    </div>

                    {/* --- FEATURED CAROUSEL (Hero Card) --- */}
                    {featuredPets.length > 0 && (
                        <div className="relative w-full max-w-5xl mx-auto aspect-[4/3] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-black/40 backdrop-blur-sm">
                            {featuredPets.map((pet, index) => {
                                const isActive = index === currentIndex;
                                const days = calculateDaysApart(pet.date, pet.reunionDate);
                                
                                return (
                                    <div 
                                        key={pet.id}
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                                        <img 
                                            src={pet.imageUrls[0]} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover"
                                        />
                                        
                                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20 flex flex-col md:flex-row items-end justify-between gap-4">
                                            <div className="text-left space-y-2 max-w-2xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded uppercase tracking-wider shadow-lg">
                                                        Reunido en {days} {days === 1 ? 'día' : 'días'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-white/90 text-sm font-bold bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                                                        <UserIcon className="h-3 w-3" /> @{pet.userEmail}
                                                    </span>
                                                </div>
                                                <h2 className="text-3xl md:text-5xl font-black text-white leading-none">
                                                    {pet.name}
                                                </h2>
                                                <p className="text-white/90 text-sm md:text-lg font-medium line-clamp-2 md:line-clamp-none italic font-serif">
                                                    "{pet.reunionStory || "Gracias a todos por compartir, ¡ya estamos juntos de nuevo!"}"
                                                </p>
                                            </div>
                                            
                                            {/* Navigation Dots */}
                                            <div className="flex gap-2">
                                                {featuredPets.map((_, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => setCurrentIndex(idx)}
                                                        className={`h-2 rounded-full transition-all duration-300 shadow-sm ${currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
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
                <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-3 divide-x divide-gray-100">
                    <div className="text-center px-4">
                        <p className="text-3xl font-black text-brand-primary">{totalReunited}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Finales Felices</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-3xl font-black text-green-500">{fastReunions}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">En menos de 72h</p>
                    </div>
                    <div className="hidden md:block text-center px-4">
                        <div className="flex justify-center text-yellow-400 mb-1">
                            <TrophyIcon className="h-8 w-8" />
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Comunidad #1</p>
                    </div>
                </div>
            </div>

            {/* --- FILTER PILLS --- */}
            <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
                <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4">Filtrar Historias</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {['Todos', ANIMAL_TYPES.PERRO, ANIMAL_TYPES.GATO, ANIMAL_TYPES.OTRO].map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type as any)}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all transform hover:scale-105 ${
                                selectedType === type 
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {type === 'Todos' ? 'Todas las Historias' : type + 's'}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- STORIES GRID --- */}
            <div className="max-w-7xl mx-auto px-6">
                {filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPets.map((pet) => {
                            const days = calculateDaysApart(pet.date, pet.reunionDate);
                            return (
                                <div key={pet.id} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
                                    {/* Image Container */}
                                    <div className="relative h-64 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                                        <img 
                                            src={pet.imageUrls[0]} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 right-4 z-20">
                                            <span className="bg-white/90 backdrop-blur text-brand-primary text-xs font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                                                <HeartIcon className="h-3 w-3 fill-current" /> {days} {days === 1 ? 'Día' : 'Días'} lejos
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <h3 className="text-2xl font-black text-gray-800 group-hover:text-brand-primary transition-colors">
                                                {pet.name}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500">
                                                Perdido el {new Date(pet.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <div className="relative bg-purple-50 p-4 rounded-xl mb-4 flex-grow border border-purple-100">
                                            <span className="absolute -top-2 -left-1 text-4xl text-purple-200 font-serif leading-none">“</span>
                                            <p className="text-gray-700 text-sm italic font-medium leading-relaxed line-clamp-4 relative z-10">
                                                {pet.reunionStory || "Gracias a la comunidad, volvió a casa."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {pet.userEmail.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 truncate max-w-[120px]">
                                                    @{pet.userEmail}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                ¡Reunido!
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl">
                        <div className="bg-white inline-block p-6 rounded-full mb-4 shadow-sm">
                            <SearchIcon className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-600">No encontramos historias en esta categoría</h3>
                        <p className="text-gray-500 mt-2">Intenta cambiar los filtros.</p>
                        <button 
                            onClick={() => setSelectedType('Todos')} 
                            className="mt-6 text-brand-primary font-bold hover:underline"
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
