
import React, { useState, useEffect } from 'react';
import type { Campaign } from '../types';
import { CAMPAIGN_TYPES } from '../constants';
import CampaignCard from './CampaignCard';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useCampaigns } from '../hooks/useResources';

interface CampaignsPageProps {
    onNavigate: (path: string) => void;
}

const CampaignSection: React.FC<{
    title: string;
    campaigns: Campaign[];
    onNavigate: (path: string) => void;
}> = ({ title, campaigns, onNavigate }) => {
    // ... (Carousel logic remains exactly the same) ...
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(3);
    const [gridClass, setGridClass] = useState('grid-cols-3');

    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            if (width < 768) { setCardsPerPage(1); setGridClass('grid-cols-1'); } 
            else if (width < 1024) { setCardsPerPage(2); setGridClass('grid-cols-2'); } 
            else { setCardsPerPage(3); setGridClass('grid-cols-3'); }
            setCurrentIndex(prev => Math.min(prev, Math.max(0, campaigns.length - cardsPerPage)));
        };
        window.addEventListener('resize', updateLayout);
        updateLayout();
        return () => window.removeEventListener('resize', updateLayout);
    }, [campaigns.length]);

    const showCarousel = campaigns.length > cardsPerPage;
    if (campaigns.length === 0) return <section className="mb-10"><h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-brand-secondary mb-4">{title}</h2><p className="text-gray-500 italic">No hay campañas activas.</p></section>;
    const visibleCampaigns = showCarousel ? campaigns.slice(currentIndex, currentIndex + cardsPerPage) : campaigns;

    return (
        <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-brand-secondary mb-4">{title}</h2>
            <div className="relative group">
                <div className={`grid ${gridClass} gap-6`}>{visibleCampaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} onNavigate={onNavigate} />)}</div>
                {showCarousel && (
                    <>
                        <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="absolute top-1/2 -left-4 z-10 p-3 rounded-full bg-brand-primary text-white shadow-lg disabled:opacity-0 opacity-0 group-hover:opacity-100 transition-all"><ChevronLeftIcon /></button>
                        <button onClick={() => setCurrentIndex(p => p + 1)} disabled={currentIndex + cardsPerPage >= campaigns.length} className="absolute top-1/2 -right-4 z-10 p-3 rounded-full bg-brand-primary text-white shadow-lg disabled:opacity-0 opacity-0 group-hover:opacity-100 transition-all"><ChevronRightIcon /></button>
                    </>
                )}
            </div>
        </section>
    );
};

const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
    const { data: campaigns = [], isLoading } = useCampaigns();

    if (isLoading) return <div className="text-center py-20">Cargando campañas...</div>;

    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    const activeCampaigns = campaigns.filter(c => c.date >= yesterdayISO);
    const sterilizationCampaigns = activeCampaigns.filter(c => c.type === CAMPAIGN_TYPES.ESTERILIZACION);
    const adoptionCampaigns = activeCampaigns.filter(c => c.type === CAMPAIGN_TYPES.ADOPCION);

    return (
        <div className="space-y-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-brand-dark mb-2">Campañas Comunitarias</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">Entérate de los últimos eventos de esterilización y ferias de adopción cerca de ti.</p>
            </div>
            <CampaignSection title="Campañas de Esterilización" campaigns={sterilizationCampaigns} onNavigate={onNavigate} />
            <CampaignSection title="Campañas de Adopción" campaigns={adoptionCampaigns} onNavigate={onNavigate} />
        </div>
    );
};

export default CampaignsPage;
