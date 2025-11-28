
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Pet } from '../types';
import { PET_STATUS } from '../constants';
import { HeartIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CheckCircleIcon } from './icons';

const ITEMS_PER_PAGE = 3;

const ReunitedPetsPage: React.FC = () => {
    const [reunitedPets, setReunitedPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch reunited pets
    useEffect(() => {
        const fetchReunited = async () => {
            setLoading(true);
            try {
                // First get count
                const { count } = await supabase
                    .from('pets')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', PET_STATUS.REUNIDO);
                
                setTotalCount(count || 0);

                // Then get data (fetch slightly more to handle initial carousel)
                const { data, error } = await supabase
                    .from('pets')
                    .select('*')
                    .eq('status', PET_STATUS.REUNIDO)
                    .order('reunion_date', { ascending: false, nullsFirst: false }) // Prioritize recent reunions
                    .limit(20); // Initial batch

                if (error) throw error;

                const mapped: Pet[] = (data || []).map((p: any) => ({
                    id: p.id,
                    userEmail: '', // Not needed for this view
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
                    comments: []
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

    const visiblePets = reunitedPets.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
    
    // Pagination logic (local for now, could be server-side if list grows huge)
    const handleNext = () => {
        if (currentIndex + ITEMS_PER_PAGE < reunitedPets.length) {
            setCurrentIndex(prev => prev + 1); // Move 1 by 1 for smooth feel, or +3 for full page
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Auto-advance if not hovering? Maybe too distracting. Manual is better for reading.

    if (loading) return <div className="flex justify-center items-center h-screen bg-purple-50"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500"></div></div>;

    return (
        <div className="bg-purple-50 min-h-screen pb-10 font-sans">
            {/* Hero Section */}
            <div className="bg-white py-12 px-4 shadow-sm border-b border-purple-100 mb-8">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-full mb-4 shadow-sm">
                        <HeartIcon className="h-8 w-8" filled />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-purple-900 mb-4 tracking-tight">
                        Historias de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Amor Real</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Momentos felices que nos inspiran. Gracias a la comunidad, estas mascotas han vuelto a casa.
                    </p>
                </div>
            </div>

            {/* Carousel Section */}
            <div className="max-w-7xl mx-auto px-4 relative">
                
                {reunitedPets.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">Aún no hay historias de éxito registradas. ¡Ayúdanos a crear la primera!</p>
                    </div>
                ) : (
                    <div className="relative group">
                        
                        {/* Cards Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {visiblePets.map((pet) => (
                                <div key={pet.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 flex flex-col h-full border border-purple-100">
                                    {/* Image Area */}
                                    <div className="h-64 overflow-hidden relative">
                                        <img 
                                            src={pet.imageUrls[0]} 
                                            alt={pet.name} 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/60 opacity-60"></div>
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <h3 className="text-2xl font-bold">{pet.name}</h3>
                                            <p className="text-sm opacity-90 flex items-center gap-1">
                                                <CalendarIcon className="h-4 w-4" /> 
                                                Reunido: {pet.reunionDate ? new Date(pet.reunionDate).toLocaleDateString() : 'Recientemente'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Story Content */}
                                    <div className="p-6 flex flex-col flex-grow relative">
                                        <div className="absolute -top-6 right-6 bg-green-500 text-white p-3 rounded-full shadow-lg border-4 border-white">
                                            <CheckCircleIcon className="h-6 w-6" />
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">La Historia</p>
                                            <p className="text-gray-700 italic leading-relaxed text-sm">
                                                "{pet.reunionStory || pet.description || "Gracias a la comunidad, pude regresar a casa. ¡Nunca pierdan la esperanza!"}"
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-purple-50 flex items-center justify-between text-xs text-gray-500">
                                            <span>📍 {pet.location.split(',')[0]}</span>
                                            <span>{pet.breed}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Controls - Overlay on Desktop, Below on Mobile */}
                        {reunitedPets.length > ITEMS_PER_PAGE && (
                            <>
                                <button 
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                    className="absolute top-1/2 -left-4 md:-left-6 transform -translate-y-1/2 bg-white text-purple-700 p-2 rounded-full shadow-lg hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 hidden md:flex items-center justify-center border border-purple-100"
                                >
                                    <ChevronLeftIcon className="h-6 w-6" />
                                </button>
                                <button 
                                    onClick={handleNext}
                                    disabled={currentIndex + ITEMS_PER_PAGE >= reunitedPets.length}
                                    className="absolute top-1/2 -right-4 md:-right-6 transform -translate-y-1/2 bg-white text-purple-700 p-2 rounded-full shadow-lg hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 hidden md:flex items-center justify-center border border-purple-100"
                                >
                                    <ChevronRightIcon className="h-6 w-6" />
                                </button>

                                {/* Mobile Nav */}
                                <div className="flex md:hidden justify-center gap-4 mt-8">
                                    <button 
                                        onClick={handlePrev}
                                        disabled={currentIndex === 0}
                                        className="bg-white text-purple-700 p-3 rounded-full shadow-lg disabled:opacity-50"
                                    >
                                        <ChevronLeftIcon className="h-6 w-6" />
                                    </button>
                                    <button 
                                        onClick={handleNext}
                                        disabled={currentIndex + ITEMS_PER_PAGE >= reunitedPets.length}
                                        className="bg-white text-purple-700 p-3 rounded-full shadow-lg disabled:opacity-50"
                                    >
                                        <ChevronRightIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReunitedPetsPage;
