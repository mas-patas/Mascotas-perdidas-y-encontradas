
import React, { useState, useEffect } from 'react';
import type { Campaign } from '@/types';
import { CAMPAIGN_TYPES } from '@/constants';
import CampaignCard from './CampaignCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/icons';

interface CampaignsPageProps {
    campaigns: Campaign[];
    onNavigate: (path: string) => void;
}

const CampaignSection: React.FC<{
    title: string;
    campaigns: Campaign[];
    onNavigate: (path: string) => void;
}> = ({ title, campaigns, onNavigate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(3);
    const [gridClass, setGridClass] = useState('grid-cols-3');

    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            let newCardsPerPage = 3;
            let newGridClass = 'grid-cols-3';
            
            if (width < 768) { // Mobile
                newCardsPerPage = 1;
                newGridClass = 'grid-cols-1';
            } else if (width < 1024) { // Tablet
                newCardsPerPage = 2;
                newGridClass = 'grid-cols-2';
            }
            
            setGridClass(newGridClass);
            setCardsPerPage(newCardsPerPage);

            setCurrentIndex(prevIndex => {
                if (campaigns.length <= newCardsPerPage) {
                    return 0;
                }
                const maxIndex = Math.max(0, campaigns.length - newCardsPerPage);
                return Math.min(prevIndex, maxIndex);
            });
        };

        window.addEventListener('resize', updateLayout);
        updateLayout();

        return () => window.removeEventListener('resize', updateLayout);
    }, [campaigns.length]);

    const showCarousel = campaigns.length > cardsPerPage;

    if (campaigns.length === 0) {
        return (
            <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-brand-secondary mb-4">{title}</h2>
                <p className="text-gray-500 italic">No hay campañas activas de este tipo en este momento.</p>
            </section>
        );
    }

    const handleNext = () => {
        if (currentIndex + cardsPerPage < campaigns.length) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex + cardsPerPage < campaigns.length;

    const visibleCampaigns = showCarousel ? campaigns.slice(currentIndex, currentIndex + cardsPerPage) : campaigns;

    return (
        <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-brand-secondary mb-4">{title}</h2>
            
            <div className="relative group">
                <div className={`grid ${gridClass} gap-6`}>
                    {visibleCampaigns.map(campaign => (
                         <CampaignCard key={campaign.id} campaign={campaign} onNavigate={onNavigate} />
                    ))}
                </div>

                {showCarousel && (
                    <>
                        <button 
                            onClick={handlePrev} 
                            disabled={!canGoPrev} 
                            className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 z-10 p-3 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Anterior"
                        >
                            <ChevronLeftIcon />
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={!canGoNext} 
                            className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 z-10 p-3 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Siguiente"
                        >
                            <ChevronRightIcon />
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

const CampaignsPage: React.FC<CampaignsPageProps> = ({ campaigns, onNavigate }) => {
    // Filter active campaigns only for public view
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
                <h1 className="text-4xl font-extrabold text-brand-dark mb-2">
                    Campañas Comunitarias
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Entérate de los últimos eventos de esterilización y ferias de adopción cerca de ti. 
                    ¡Participa y ayuda a mejorar la vida de nuestras mascotas!
                </p>
            </div>

            <CampaignSection 
                title="Campañas de Esterilización" 
                campaigns={sterilizationCampaigns} 
                onNavigate={onNavigate} 
            />
            
            <CampaignSection 
                title="Campañas de Adopción" 
                campaigns={adoptionCampaigns} 
                onNavigate={onNavigate} 
            />
        </div>
    );
};

export default CampaignsPage;