
import React from 'react';
import { Link } from 'react-router-dom';
import type { Campaign } from '../types';
import { CalendarIcon, LocationMarkerIcon } from './icons';

interface CampaignCardProps {
    campaign: Campaign;
    onNavigate?: (path: string) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
    
    const typeColor = campaign.type === 'Esterilización' ? 'bg-teal-500' : 'bg-indigo-500';
    
    const image = (campaign.imageUrls && campaign.imageUrls.length > 0) 
        ? campaign.imageUrls[0] 
        : 'https://placehold.co/800x600/CCCCCC/FFFFFF?text=Sin+Imagen';

    return (
        <Link 
            to={`/campanas/${campaign.id}`}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full cursor-pointer group"
        >
            <div className="relative">
                <img className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105" src={image} alt={campaign.title} />
                <div className={`absolute top-2 left-2 px-3 py-1 text-xs font-bold rounded-full text-white ${typeColor} shadow-sm`}>
                    {campaign.type}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-brand-dark mb-2 group-hover:text-brand-primary transition-colors">{campaign.title}</h3>
                
                <div className="space-y-2 text-gray-700 text-sm mb-3 flex-grow">
                    <div className="flex items-center gap-2">
                        <LocationMarkerIcon />
                        <span className="truncate">{campaign.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon />
                        <span>{new Date(campaign.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
                
                <div className="mt-auto pt-4">
                     <div className="w-full group/btn relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5">
                        <span>Ver detalles</span>
                        <span className="transition-transform duration-300 group-hover/btn:translate-x-1 text-lg leading-none mb-0.5">→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CampaignCard;
