
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
    const { id } = useParams<{ id: string }>();
    const { campaigns } = useAppData();
    const campaign = propCampaign || campaigns.find(c => c.id === id);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const miniMapRef = useRef<HTMLDivElement>(null);
    const miniMapInstance = useRef<any>(null);

    if (!campaign) return <div className="text-center py-10">Campaña no encontrada o cargando...</div>;

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

    // Logic to simplify location: Take first 3 parts (Street, District, City usually)
    const simplifiedLocation = (() => {
        if (!campaign.location) return 'Ubicación no especificada';
        const parts = campaign.location.split(',');
        if (parts.length <= 3) return campaign.location;
        return parts.slice(0, 3).map(p => p.trim()).join(', ');
    })();

    useEffect(() => {
        if (campaign.lat && campaign.lng && miniMapRef.current && !miniMapInstance.current) {
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
        }
    }, [campaign]);

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
            <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-lg shadow-sm">
                <button 
                    onClick={onClose} 
                    className="group flex items-center gap-2 px-5 py-2 bg-white text-gray-700 font-bold rounded-full shadow-sm border border-gray-200 hover:shadow-md hover:text-brand-primary hover:border-brand-primary transition-all duration-300"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform duration-300">
                        <ChevronLeftIcon /> 
                    </span>
                    Volver a Campañas
                </button>
            </div>
            <div className="p-6 md:p-8">
                {/* Header Section */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                    {/* 1. Title & Badge Row */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                            {campaign.title}
                        </h1>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border shadow-sm w-fit ${typeColor}`}>
                            {campaign.type}
                        </span>
                    </div>

                    {/* 2. Date */}
                    <div className="flex items-center gap-3 text-gray-700 mb-3">
                        <div className="p-2 bg-blue-50 text-brand-primary rounded-full shadow-sm">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-medium capitalize">{formattedDate}</span>
                    </div>

                    {/* 3. Simplified Location */}
                    <div className="flex items-start gap-3 text-gray-700">
                        <div className="p-2 bg-gray-100 text-gray-600 rounded-full mt-0.5 shadow-sm">
                            <LocationMarkerIcon className="h-5 w-5" />
                        </div>
                        <span className="text-lg leading-snug pt-1.5">{simplifiedLocation}</span>
                    </div>
                    
                    {/* Optional Contact Phone */}
                    {campaign.contactPhone && (
                        <div className="flex items-center gap-3 mt-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-full shadow-sm">
                                <PhoneIcon className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{campaign.contactPhone}</span>
                        </div>
                    )}
                </div>
                
                {/* Image Gallery */}
                <div className="relative w-full mb-8">
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
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Detalles del Evento</h3>
                    <p className="whitespace-pre-wrap break-words leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                        {campaign.description}
                    </p>
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
