
import React, { useState } from 'react';
import type { ReportReason, ReportType } from '@/types';
import { REPORT_REASONS } from '@/constants';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: ReportReason, details: string) => void;
    reportType: ReportType;
    targetIdentifier: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, reportType, targetIdentifier }) => {
    const [reason, setReason] = useState<ReportReason>(REPORT_REASONS.INAPPROPRIATE_CONTENT);
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!details.trim()) {
            setError('Por favor, proporciona detalles para tu reporte.');
            return;
        }
        setError('');
        onSubmit(reason, details);
    };

    const reportTypeName = reportType === 'post' ? 'la publicación' : 'al usuario';
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-brand-dark mb-2">Reportar {reportTypeName}</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Estás reportando a <span className="font-semibold">"{targetIdentifier}"</span>.
                        </p>
                        {error && <div className="bg-red-100 border-red-400 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motivo del reporte</label>
                                <select
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value as ReportReason)}
                                    className={`${inputClass} mt-1`}
                                >
                                    {Object.values(REPORT_REASONS).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="details" className="block text-sm font-medium text-gray-700">Detalles adicionales</label>
                                <textarea
                                    id="details"
                                    rows={4}
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    className={`${inputClass} mt-1`}
                                    placeholder="Proporciona más información sobre por qué estás reportando esto."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="py-2 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                            Enviar Reporte
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
