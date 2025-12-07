
import React from 'react';
import { Link } from 'react-router-dom';
import type { Campaign } from '@/types';
import { CalendarIcon, LocationMarkerIcon } from '@/shared/components/icons';

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
            className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full cursor-pointer group border border-gray-100"
        >
            <div className="relative">
                <img className="w-full h-52 object-cover transition-transform duration-700 group-hover:scale-105" src={image} alt={campaign.title} />
                <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-full text-white ${typeColor} shadow-md`}>
                    {campaign.type}
                </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-extrabold text-brand-dark mb-3 group-hover:text-brand-primary transition-colors leading-tight">
                    {campaign.title}
                </h3>
                
                {/* Updated text color: text-gray-700 and size: text-sm */}
                <div className="space-y-3 text-gray-700 text-sm mb-4 flex-grow font-medium leading-relaxed">
                    <div className="flex items-start gap-2.5">
                        <LocationMarkerIcon className="text-gray-600 h-5 w-5 flex-shrink-0" />
                        <span className="line-clamp-2">{campaign.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <CalendarIcon className="text-gray-600 h-5 w-5 flex-shrink-0" />
                        <span className="capitalize">{new Date(campaign.date).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
                
                <div className="mt-auto pt-2">
                     <div className="w-full group/btn relative flex items-center justify-center gap-2 bg-gray-50 hover:bg-indigo-50 text-indigo-700 font-bold py-3 px-4 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all duration-300">
                        <span>Ver más detalles</span>
                        <span className="transition-transform duration-300 group-hover/btn:translate-x-1 text-lg leading-none mb-0.5">→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CampaignCard;
