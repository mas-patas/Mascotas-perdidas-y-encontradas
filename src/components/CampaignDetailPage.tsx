
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Campaign } from '../types';
import { CalendarIcon, LocationMarkerIcon, ChevronLeftIcon, ChevronRightIcon, PhoneIcon, GoogleMapsIcon, WazeIcon } from './icons';
import { useAppData } from '../hooks/useAppData';

interface CampaignDetailPageProps {
    campaign?: Campaign;
    onClose: () => void;
}

const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaign: propCampaign, onClose }) => {
    // 1. HOOK DECLARATIONS
    const { id } = useParams<{ id: string }>();
    const { campaigns, loading: campaignsLoading } = useAppData();
    const campaign = propCampaign || campaigns.find(c => c.id === id);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    const miniMapRef = useRef<HTMLDivElement>(null);
    const miniMapInstance = useRef<any>(null);

    // 2. EFFECTS
    // Loading State Effect
    useEffect(() => {
        if (campaign || !campaignsLoading) {
            setIsLoading(false);
        }
    }, [campaign, campaignsLoading]);

    // Map Effect (Moved to top, before any return)
    useEffect(() => {
        if (!campaign || !campaign.lat || !campaign.lng || !miniMapRef.current || miniMapInstance.current) return;

        const L = (window as any).L;
        if (!L) return;

        miniMapInstance.current = L.map(miniMapRef.current, {
            center: [campaign.lat, campaign.lng],
            zoom: 15,
            zoomControl: true,
            dragging: true,
            scrollWheelZoom: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(miniMapInstance.current);

        const megaphoneIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.136A1.76 1.76 0 015.882 11H3a1 1 0 01-1-1V8a1 1 0 011-1h2.882a1.76 1.76 0 011.649.931l2.147 6.136-1.09-3.115A1.76 1.76 0 0110.232 5h1.232c1.026 0 1.943.684 2.247 1.647L15 12l-1.09-3.115"/></svg>`;

        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin sighted'></div>${megaphoneIconSVG}`, 
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        L.marker([campaign.lat, campaign.lng], { icon }).addTo(miniMapInstance.current);
    }, [campaign]);

    // 3. EARLY RETURNS
    if (isLoading) return <div className="text-center py-10">Cargando campaña...</div>;
    if (!campaign) return <div className="text-center py-10">Campaña no encontrada.</div>;

    // 4. DERIVED DATA
    const images = (campaign.imageUrls && Array.isArray(campaign.imageUrls) && campaign.imageUrls.length > 0) 
        ? campaign.imageUrls 
        : ['https://placehold.co/800x600/CCCCCC/FFFFFF?text=Sin+Imagen'];

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };
    
    const typeColor = campaign.type === 'Esterilización' 
        ? 'bg-teal-100 text-teal-800 border-teal-500' 
        : 'bg-indigo-100 text-indigo-800 border-indigo-500';

    const formattedDate = (() => {
        try {
            if (!campaign.date) return 'Fecha no especificada';
            const d = new Date(campaign.date);
            if (isNaN(d.getTime())) return 'Fecha inválida';
            return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return 'Error en fecha';
        }
    })();

    const openInGoogleMaps = () => {
        if (campaign.lat && campaign.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${campaign.lat},${campaign.lng}`, '_blank');
        }
    };

    const openInWaze = () => {
         if (campaign.lat && campaign.lng) {
            window.open(`https://waze.com/ul?ll=${campaign.lat},${campaign.lng}&navigate=yes`, '_blank');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto">
            <div className="p-4">
                <button onClick={onClose} className="text-sm text-brand-primary hover:underline">&larr; Volver a Campañas</button>
            </div>
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border-2 ${typeColor}`}>
                            {campaign.type || 'Campaña'}
                        </span>
                        <h1 className="text-4xl font-bold text-brand-dark mt-2">{campaign.title}</h1>
                    </div>
                     <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 text-gray-700">
                            <CalendarIcon />
                            <span className="font-semibold">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 mt-1">
                            <LocationMarkerIcon />
                            <span className="font-semibold">{campaign.location}</span>
                        </div>
                        {campaign.contactPhone && (
                             <div className="flex items-center gap-2 text-gray-700 mt-2 bg-white border border-gray-200 shadow-sm px-3 py-1 rounded-lg">
                                <div className="bg-green-100 p-1 rounded-full text-green-600">
                                    <PhoneIcon className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-gray-800">{campaign.contactPhone}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Image Gallery */}
                <div className="relative w-full mb-4">
                    <img 
                        src={images[currentImageIndex]} 
                        alt={campaign.title}
                        className="max-w-full h-auto mx-auto rounded-lg shadow-lg object-contain max-h-[500px] w-full bg-gray-100" 
                    />
                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={prevImage} 
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                                aria-label="Imagen anterior"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <button 
                                onClick={nextImage} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                                aria-label="Siguiente imagen"
                            >
                                <ChevronRightIcon />
                            </button>
                             <div className="absolute bottom-2 right-2 flex gap-2">
                                {images.map((_, index) => (
                                    <div 
                                        key={index} 
                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Description */}
                <div className="prose max-w-none text-gray-800 mt-6">
                    <p className="whitespace-pre-wrap break-words">{campaign.description}</p>
                </div>

                {/* Mini Map Section */}
                {campaign.lat && campaign.lng && (
                    <div className="w-full mt-8 relative z-0">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Ubicación del Evento</h4>
                        <div className="w-full h-64 rounded-lg overflow-hidden shadow-md border border-gray-200">
                            <div ref={miniMapRef} className="w-full h-full"></div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                            <button 
                                onClick={openInGoogleMaps}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium text-sm border border-gray-300"
                            >
                                <GoogleMapsIcon />
                                Ver en Google Maps
                            </button>
                            <button 
                                onClick={openInWaze}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors font-medium text-sm border border-blue-200"
                            >
                                <WazeIcon />
                                Ver en Waze
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignDetailPage;
