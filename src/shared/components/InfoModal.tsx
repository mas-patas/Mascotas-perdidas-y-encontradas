import React from 'react';
import { CheckCircleIcon, XCircleIcon, InfoIcon } from './icons';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    buttonText?: string;
}

const InfoModal: React.FC<InfoModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    buttonText = 'Entendido',
}) => {
    if (!isOpen) {
        return null;
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
            case 'error':
                return <XCircleIcon className="h-6 w-6 text-red-600" />;
            default:
                return <InfoIcon className="h-6 w-6 text-blue-600" />;
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100';
            case 'error':
                return 'bg-red-100';
            default:
                return 'bg-blue-100';
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-700';
            case 'error':
                return 'bg-red-600 hover:bg-red-700';
            default:
                return 'bg-brand-primary hover:bg-brand-dark';
        }
    };

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
                        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getIconBgColor()} sm:mx-0 sm:h-10 sm:w-10`}>
                            {getIcon()}
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                            <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 whitespace-pre-line">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 rounded-b-lg flex justify-end">
                    <button
                        type="button"
                        className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary sm:text-sm ${getButtonColor()}`}
                        onClick={onClose}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InfoModal;

