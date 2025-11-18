
import React, { useState } from 'react';
import type { Campaign } from '../types';
import { CalendarIcon, LocationMarkerIcon, ChevronLeftIcon, ChevronRightIcon, PhoneIcon } from './icons';

interface CampaignDetailPageProps {
    campaign: Campaign;
    onClose: () => void;
}

const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaign, onClose }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Defensive check: If campaign or mandatory fields are missing, don't render to avoid crash
    if (!campaign) return null;

    // Safe fallback for images to prevent crashes if imageUrls is missing or empty
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

    // Safe date formatting with try-catch block
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
                            <div className="flex items-center gap-2 text-gray-700 mt-1">
                                <PhoneIcon />
                                <span className="font-semibold">{campaign.contactPhone}</span>
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
            </div>
        </div>
    );
};

export default CampaignDetailPage;
