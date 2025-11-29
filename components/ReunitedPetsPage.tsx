
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Pet, AnimalType } from '../types';
import { PET_STATUS, ANIMAL_TYPES } from '../constants';
import { HeartIcon, CalendarIcon, UserIcon, ArrowDownIcon, SearchIcon } from './icons';
import { Helmet } from 'react-helmet-async';

const ReunitedPetsPage: React.FC = () => {
    const [reunitedPets, setReunitedPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);
    
    // Filters
    const [selectedYear, setSelectedYear] = useState<string>('Todos');
    const [selectedType, setSelectedType] = useState<AnimalType | 'Todos'>('Todos');

    // Fetch reunited pets
    useEffect(() => {
        const fetchReunited = async () => {
            setLoading(true);
            try {
                // Fetch pets joined with profiles to get the username
                const { data, error } = await supabase
                    .from('pets')
                    .select('*, profiles:user_id(username)')
                    .eq('status', PET_STATUS.REUNIDO)
                    .order('reunion_date', { ascending: false, nullsFirst: false }) // Prioritize recent reunions
                    .limit(100); // Increased limit to allow filtering on client side comfortably

                if (error) throw error;

                const mapped: Pet[] = (data || []).map((p: any) => ({
                    id: p.id,
                    userEmail: p.profiles?.username || 'Usuario', // Using userEmail field to store username temporarily for display
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

    // Derived State for Filters
    const years = useMemo(() => {
        const uniqueYears = new Set(reunitedPets.map(p => {
            const d = p.reunionDate ? new Date(p.reunionDate) : new Date(p.date);
            return d.getFullYear().toString();
        }));
        return ['Todos', ...Array.from(uniqueYears).sort().reverse()];
    }, [reunitedPets]);

    const filteredPets = useMemo(() => {
        return reunitedPets.filter(pet => {
            const petYear = (pet.reunionDate ? new Date(pet.reunionDate) : new Date(pet.date)).getFullYear().toString();
            const yearMatch = selectedYear === 'Todos' || petYear === selectedYear;
            const typeMatch = selectedType === 'Todos' || pet.animalType === selectedType;
            return yearMatch && typeMatch;
        });
    }, [reunitedPets, selectedYear, selectedType]);

    // Auto-rotate the featured stories (First 5 of filtered)
    useEffect(() => {
        if (filteredPets.length <= 1 || showAll) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.min(filteredPets.length, 5));
        }, 6000); // Change every 6 seconds

        return () => clearInterval(interval);
    }, [filteredPets.length, showAll]);

    if (loading) return <div className="flex justify-center items-center h-screen bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500"></div></div>;

    const featuredPets = filteredPets.slice(0, 5);

    return (
        <div className="bg-white min-h-screen pb-10 font-sans">
            <Helmet>
                <title>Historias de Reencuentros | Pets</title>
                <meta name="description" content="Descubre historias conmovedoras de mascotas que regresaron a casa gracias a nuestra comunidad. ¡La esperanza nunca se pierde!" />
                <meta property="og:title" content="Historias de Reencuentros - Pets" />
                <meta property="og:description" content="Mira cómo la comunidad ayuda a reunir mascotas perdidas con sus familias." />
                <meta property="og:image" content={reunitedPets[0]?.imageUrls[0] || 'https://placehold.co/1200x630/483D8B/ffffff?text=Finales+Felices'} />
            </Helmet>

            {/* Artistic Hero Section */}
            <div className="relative bg-[#FFFBF0] overflow-hidden min-h-[650px] flex flex-col justify-center">
                {/* Background Pattern (Doodles/Lines) */}
                <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                ></div>
                
                {/* Decorative Trazos/Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-white rounded-full mb-4 shadow-sm border border-purple-100">
                            <HeartIcon className="h-6 w-6 text-purple-600" filled />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-2 tracking-tight">
                            Finales <span className="text-purple-600 relative inline-block">
                                Felices
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-lg text-gray-500 font-medium mb-6">Historias reales de reencuentros que nos inspiran.</p>
                        
                        {/* Filters */}
                        <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up">
                            <div className="relative">
                                <select 
                                    value={selectedType} 
                                    onChange={(e) => { setSelectedType(e.target.value as any); setShowAll(true); }}
                                    className="appearance-none bg-white border border-purple-200 text-purple-900 py-2 pl-4 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <option value="Todos">Todas las Mascotas</option>
                                    <option value={ANIMAL_TYPES.PERRO}>Perros</option>
                                    <option value={ANIMAL_TYPES.GATO}>Gatos</option>
                                    <option value={ANIMAL_TYPES.OTRO}>Otros</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-purple-500">
                                    <ArrowDownIcon className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="relative">
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => { setSelectedYear(e.target.value); setShowAll(true); }}
                                    className="appearance-none bg-white border border-purple-200 text-purple-900 py-2 pl-4 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year === 'Todos' ? 'Todos los Años' : year}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-purple-500">
                                    <CalendarIcon className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Featured Stories Rotation (Hidden if filtering results in 0) */}
                    {filteredPets.length > 0 ? (
                        <div className="relative w-full h-[500px] md:h-[400px]">
                            {featuredPets.map((pet, index) => {
                                const isActive = index === currentIndex;
                                // Only hide non-active ones if NOT in "Show All" mode. 
                                // In Show All mode, this carousel might feel redundant, but we keep it as a "Hero" unless filtered list is small.
                                if (!isActive && !showAll) return null; 

                                return (
                                    <div 
                                        key={pet.id}
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        {/* Image Side */}
                                        <div className="w-full md:w-1/2 h-64 md:h-full relative group">
                                            <div className="absolute inset-0 bg-purple-600 rounded-3xl transform rotate-3 translate-x-2 translate-y-2 opacity-20 group-hover:rotate-6 transition-transform duration-500"></div>
                                            <img 
                                                src={pet.imageUrls[0]} 
                                                alt={pet.name} 
                                                className="w-full h-full object-cover rounded-3xl shadow-xl relative z-10 border-4 border-white"
                                            />
                                            <div className="absolute -bottom-4 -right-4 bg-white px-4 py-2 rounded-full shadow-lg z-20 font-bold text-gray-800 flex items-center gap-2">
                                                🎉 {pet.name} en casa
                                            </div>
                                        </div>

                                        {/* Text Side */}
                                        <div className="w-full md:w-1/2 text-left space-y-6">
                                            <div className="relative">
                                                <span className="absolute -top-6 -left-4 text-6xl text-purple-200 font-serif">“</span>
                                                <p className="text-xl md:text-2xl font-medium text-gray-700 leading-relaxed italic font-serif relative z-10">
                                                    {pet.reunionStory || pet.description || "Gracias a la comunidad y a Pets, pude regresar a casa. ¡Nunca pierdan la esperanza!"}
                                                </p>
                                                <span className="absolute -bottom-10 right-0 text-6xl text-purple-200 font-serif transform rotate-180">“</span>
                                            </div>

                                            <div className="pt-4 border-t border-purple-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-purple-100 p-2 rounded-full">
                                                        <UserIcon className="h-4 w-4 text-purple-700" />
                                                    </div>
                                                    <p className="font-bold text-gray-900">@{pet.userEmail}</p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                                        Perdido: {new Date(pet.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        <span className="font-semibold text-green-700">Encontrado: {pet.reunionDate ? new Date(pet.reunionDate).toLocaleDateString() : 'Recientemente'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="bg-white/50 inline-block p-6 rounded-full mb-4">
                                <SearchIcon className="h-12 w-12 text-gray-400" />
                            </div>
                            <p className="text-xl text-gray-500 font-medium">No se encontraron historias con estos filtros.</p>
                            <button onClick={() => { setSelectedType('Todos'); setSelectedYear('Todos'); }} className="mt-4 text-purple-600 font-bold hover:underline">Limpiar filtros</button>
                        </div>
                    )}
                </div>
                
                {/* Pagination Dots (Hide if filtered list is small or empty) */}
                {filteredPets.length > 1 && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
                        {featuredPets.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-8 bg-purple-600' : 'bg-purple-200'}`}
                                aria-label={`Ver historia ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* See More Section */}
            <div className="max-w-7xl mx-auto px-6 mt-12">
                {!showAll && filteredPets.length > 0 && (
                    <div className="text-center">
                        <button 
                            onClick={() => setShowAll(true)}
                            className="btn-press group inline-flex items-center gap-2 bg-white border-2 border-gray-100 text-gray-600 font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md hover:border-purple-200 hover:text-purple-600 transition-all"
                        >
                            Ver más historias
                            <ArrowDownIcon className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
                        </button>
                    </div>
                )}

                {showAll && filteredPets.length > 0 && (
                    <div className="animate-fade-in-up mt-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-purple-500 pl-4">
                            Todas las Historias ({filteredPets.length})
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* We show ALL filtered pets in the grid when expanded */}
                            {filteredPets.map((pet) => (
                                <div key={pet.id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-lg transition-shadow duration-300 border border-transparent hover:border-purple-100 group">
                                    <div className="relative h-56 mb-4 overflow-hidden rounded-xl">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                                        <img 
                                            src={pet.imageUrls[0]} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-800 z-20">
                                            {pet.reunionDate ? new Date(pet.reunionDate).toLocaleDateString() : ''}
                                        </div>
                                    </div>
                                    
                                    <h4 className="font-bold text-xl text-gray-900 mb-1">{pet.name}</h4>
                                    <p className="text-sm text-gray-500 mb-3">Reunido con @{pet.userEmail}</p>
                                    
                                    <p className="text-gray-600 text-sm italic line-clamp-3 bg-white p-3 rounded-lg border border-gray-100">
                                        "{pet.reunionStory || "¡En casa sano y salvo!"}"
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="text-center mt-10">
                            <button 
                                onClick={() => { setShowAll(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="text-purple-600 font-bold hover:text-purple-800 underline text-sm btn-press"
                            >
                                Volver arriba
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReunitedPetsPage;
