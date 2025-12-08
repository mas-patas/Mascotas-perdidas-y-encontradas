
import React from 'react';
import { CheckCircleIcon, WarningIcon, InfoIcon, XCircleIcon } from './icons';
import type { Toast as ToastType } from '@/contexts/ToastContext';

interface ToastProps {
    toast: ToastType;
    onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 text-green-800 border-green-200';
            case 'error':
                return 'bg-red-50 text-red-800 border-red-200';
            case 'warning':
                return 'bg-yellow-50 text-yellow-800 border-yellow-200';
            default:
                return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircleIcon />;
            case 'error':
                return <WarningIcon className="h-5 w-5 text-red-600" />;
            case 'warning':
                return <WarningIcon className="h-5 w-5 text-yellow-600" />;
            default:
                return <InfoIcon />;
        }
    };

    return (
        <div className={`flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow-lg border border-l-4 animate-slide-in-right ${getStyles()}`} role="alert">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
                {getIcon()}
            </div>
            <div className="ml-3 text-sm font-normal break-words flex-1">{toast.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 text-gray-500 hover:bg-white/50"
                onClick={() => onClose(toast.id)}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <XCircleIcon />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastType[]; onClose: (id: string) => void }> = ({ toasts, onClose }) => {
    return (
        <div className="fixed bottom-5 right-5 z-[3000] flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};
