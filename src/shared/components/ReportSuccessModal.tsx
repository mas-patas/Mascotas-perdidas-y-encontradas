import React from 'react';
import { CheckCircleIcon } from './icons';

interface ReportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportSuccessModal: React.FC<ReportSuccessModalProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                Reporte Enviado
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Tu reporte ha sido enviado, te notificaremos cuando tomemos alguna acción. Puedes revisar tus reportes en <span className="font-semibold">MI PERFIL / SOPORTE / MIS REPORTES</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 rounded-b-lg flex justify-end">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                        onClick={onClose}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportSuccessModal;

