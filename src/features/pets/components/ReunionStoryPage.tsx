import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import type { Pet } from '@/types';
import { PET_STATUS } from '@/constants';
import { ReunionTimeline } from '@/shared/components/ReunionTimeline';
import { ChevronLeftIcon, LocationMarkerIcon, HeartIcon } from '@/shared/components/icons';
import { Helmet } from 'react-helmet-async';

const ReunionStoryPage: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const navigate = useNavigate();
    const [pet, setPet] = useState<Pet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPet = async () => {
            if (!petId) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('pets')
                    .select('*, profiles:user_id(username)')
                    .eq('id', petId)
                    .eq('status', PET_STATUS.REUNIDO)
                    .single();

                if (error) throw error;

                const mapped: Pet = {
                    id: data.id,
                    userEmail: data.profiles?.username || 'Usuario',
                    status: data.status,
                    name: data.name,
                    animalType: data.animal_type,
                    breed: data.breed,
                    color: data.color,
                    size: data.size,
                    location: data.location,
                    date: data.date,
                    contact: '',
                    description: data.description,
                    imageUrls: data.image_urls || [],
                    lat: data.lat,
                    lng: data.lng,
                    reunionStory: data.reunion_story,
                    reunionDate: data.reunion_date,
                    comments: [],
                    createdAt: data.created_at
                };

                setPet(mapped);
            } catch (err) {
                console.error("Error fetching reunion story:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPet();
    }, [petId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-brand-light">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-500"></div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="bg-brand-light min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-main mb-4">Historia no encontrada</h2>
                    <p className="text-text-sub mb-6">No pudimos encontrar esta historia de reencuentro.</p>
                    <Link
                        to="/reunidos"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                        Volver a reencuentros
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-brand-light min-h-screen pb-20">
            <Helmet>
                <title>{pet.name} - Historia de Reencuentro | Mas Patas</title>
                <meta name="description" content={`Historia completa del reencuentro de ${pet.name}`} />
            </Helmet>

            {/* Header with back button */}
            <div className="bg-white border-b border-card-border sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link
                        to="/reunidos"
                        className="inline-flex items-center gap-2 text-text-sub hover:text-sky-600 transition-colors font-medium"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                        Volver a reencuentros
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Hero Image */}
                <div className="relative w-full aspect-[4/3] md:aspect-[21/9] rounded-2xl overflow-hidden mb-8 shadow-lg">
                    <img
                        src={pet.imageUrls[0]}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
                            {pet.name}
                        </h1>
                        {pet.location && (
                            <div className="flex items-center gap-2 text-white/90">
                                <LocationMarkerIcon className="h-5 w-5" />
                                <span className="font-medium">{pet.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 mb-8 border border-card-border">
                    <h2 className="text-xl font-black text-text-main mb-6">Línea de tiempo</h2>
                    <ReunionTimeline
                        lostDate={pet.date}
                        reunionDate={pet.reunionDate}
                        orientation="horizontal"
                    />
                </div>

                {/* Full Story */}
                <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 mb-8 border border-card-border">
                    <h2 className="text-xl font-black text-text-main mb-4">Historia del reencuentro</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-text-sub leading-relaxed text-base md:text-lg whitespace-pre-line">
                            {pet.reunionStory || "Gracias a la comunidad, volvió a casa."}
                        </p>
                    </div>
                </div>

                {/* Trust Elements */}
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-6 md:p-8 border border-sky-100">
                    <p className="text-sm text-text-sub mb-4">
                        Historia compartida por su familia.
                    </p>
                    {/* Placeholder for future "Me dio esperanza" button */}
                    <div className="flex items-center gap-2 opacity-50">
                        <HeartIcon className="h-5 w-5 text-sky-600" />
                        <span className="text-sm font-medium text-text-sub">Me dio esperanza</span>
                        <span className="text-xs text-icon-gray">(Próximamente)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReunionStoryPage;

