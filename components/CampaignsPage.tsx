import React from 'react';
import type { Campaign } from '../types';
import { CAMPAIGN_TYPES } from '../constants';
import CampaignCard from './CampaignCard';

interface CampaignsPageProps {
    campaigns: Campaign[];
    onNavigate: (path: string) => void;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ campaigns, onNavigate }) => {
    const sterilizationCampaigns = campaigns.filter(c => c.type === CAMPAIGN_TYPES.ESTERILIZACION);
    const adoptionCampaigns = campaigns.filter(c => c.type === CAMPAIGN_TYPES.ADOPCION);

    return (
        <div className="space-y-12">
            <h1 className="text-4xl font-bold text-brand-dark border-b-4 border-brand-secondary pb-2">
                Campañas Comunitarias
            </h1>

            <section>
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Campañas de Esterilización</h2>
                {sterilizationCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sterilizationCampaigns.map(campaign => (
                            <CampaignCard key={campaign.id} campaign={campaign} onNavigate={onNavigate} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No hay campañas de esterilización activas en este momento.</p>
                )}
            </section>
            
            <section>
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Campañas de Adopción</h2>
                {adoptionCampaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {adoptionCampaigns.map(campaign => (
                            <CampaignCard key={campaign.id} campaign={campaign} onNavigate={onNavigate} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No hay campañas de adopción activas en este momento.</p>
                )}
            </section>
        </div>
    );
};

export default CampaignsPage;