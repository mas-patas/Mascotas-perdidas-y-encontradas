import React, { useState } from 'react';
import { XCircleIcon } from '@/shared/components/icons';
import { useAuth } from '@/contexts/auth';
import { useCreateCampaignReport } from '@/api';
import { CampaignReportForm } from './CampaignReportForm';

interface CampaignReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CampaignReportModal: React.FC<CampaignReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const createReport = useCreateCampaignReport();
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFormSubmit = async (data: {
        address: string;
        socialLink: string;
        department: string;
        province: string;
        district: string;
        imageUrl: string | null;
    }) => {
        setError('');

        try {
            await createReport.mutateAsync({
                user_id: currentUser?.id || null,
                user_email: currentUser?.email || null,
                address: data.address.trim(),
                social_link: data.socialLink.trim(),
                image_url: data.imageUrl,
                district: data.district,
                department: data.department,
                province: data.province,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error submitting campaign report:', err);
            setError('Error al enviar el reporte. Intenta de nuevo.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-brand-dark">Informar de Campaña</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XCircleIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="px-6 pt-4">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                            {error}
                        </div>
                    </div>
                )}
                <CampaignReportForm
                    onSubmit={handleFormSubmit}
                    onCancel={onClose}
                    isSubmitting={createReport.isPending}
                />
            </div>
        </div>
    );
};

export default CampaignReportModal;

