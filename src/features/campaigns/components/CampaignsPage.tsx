
import React, { useState, useEffect } from 'react';
import type { Campaign } from '@/types';
import { CAMPAIGN_TYPES } from '@/constants';
import CampaignCard from './CampaignCard';
import CampaignReportModal from './CampaignReportModal';
import { ChevronLeftIcon, ChevronRightIcon, MegaphoneIcon } from '@/shared/components/icons';

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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    // Filter active campaigns only for public view
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    const activeCampaigns = campaigns.filter(c => c.date && c.date >= yesterdayISO);

    // Group campaigns by type dynamically
    const campaignsByType = activeCampaigns.reduce((acc, campaign) => {
        const type = campaign.type || 'Otro';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(campaign);
        return acc;
    }, {} as Record<string, Campaign[]>);

    // Get all unique types, sorted with known types first
    const knownTypes: string[] = [CAMPAIGN_TYPES.ESTERILIZACION, CAMPAIGN_TYPES.VACUNACION, CAMPAIGN_TYPES.ADOPCION];
    const allTypes = [
        ...knownTypes.filter(type => campaignsByType[type]?.length > 0),
        ...Object.keys(campaignsByType).filter(type => !knownTypes.includes(type))
    ];

    // Helper function to get section title based on type
    const getSectionTitle = (type: string): string => {
        if (type === CAMPAIGN_TYPES.ESTERILIZACION) return 'Campañas de Esterilización';
        if (type === CAMPAIGN_TYPES.VACUNACION) return 'Campañas de Vacunación';
        if (type === CAMPAIGN_TYPES.ADOPCION) return 'Campañas de Adopción';
        return `Campañas de ${type}`;
    };
    
    // Type guard to check if type is a known campaign type
    const isKnownCampaignType = (type: string): type is typeof CAMPAIGN_TYPES[keyof typeof CAMPAIGN_TYPES] => {
        return Object.values(CAMPAIGN_TYPES).includes(type as any);
    };

    return (
        <div className="space-y-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-brand-dark mb-2">
                    Campañas Comunitarias
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto mb-4">
                    Entérate de los últimos eventos de esterilización, vacunación y ferias de adopción cerca de ti. 
                    ¡Participa y ayuda a mejorar la vida de nuestras mascotas!
                </p>
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl hover:bg-brand-dark transition-all transform hover:scale-105"
                >
                    <MegaphoneIcon className="h-5 w-5" />
                    Informar de Campaña
                </button>
            </div>
            
            <CampaignReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSuccess={() => {
                    // Optionally show success message or refresh data
                }}
            />

            {allTypes.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No hay campañas activas en este momento.</p>
                </div>
            ) : (
                allTypes.map(type => (
                    <CampaignSection
                        key={type}
                        title={getSectionTitle(type)}
                        campaigns={campaignsByType[type] || []}
                        onNavigate={onNavigate}
                    />
                ))
            )}
        </div>
    );
};

export default CampaignsPage;