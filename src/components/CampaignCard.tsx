
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
                <img className="w-full h-48 object-cover" src={image} alt={campaign.title} />
                <div className={`absolute top-2 left-2 px-3 py-1 text-xs font-bold rounded-full text-white ${typeColor}`}>
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
                
                <div className="mt-auto pt-2">
                     <span className="text-sm font-semibold text-brand-primary group-hover:underline">
                        Ver más detalles &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default CampaignCard;
