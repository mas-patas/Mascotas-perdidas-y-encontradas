
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WarningIcon, InfoIcon } from './icons';

export type DisclaimerVariant = 'compact' | 'full' | 'inline';
export type DisclaimerType = 'warning' | 'info';

interface SecurityDisclaimerProps {
    variant?: DisclaimerVariant;
    type?: DisclaimerType;
    dismissible?: boolean;
    onDismiss?: () => void;
    showReportInfo?: boolean;
    showSupportLink?: boolean;
    customMessage?: string;
}

export const SecurityDisclaimer = ({
    variant = 'full',
    type = 'warning',
    dismissible = false,
    onDismiss,
    showReportInfo = true,
    showSupportLink = true,
    customMessage
}: SecurityDisclaimerProps): JSX.Element | null => {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    const Icon = type === 'warning' ? WarningIcon : InfoIcon;
    const iconColor = type === 'warning' ? 'text-yellow-600' : 'text-blue-600';
    const bgColor = type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200';
    const textColor = type === 'warning' ? 'text-yellow-800' : 'text-blue-800';

    // Default messages based on variant
    const getDefaultMessage = () => {
        if (customMessage) return customMessage;
        
        switch (variant) {
            case 'compact':
                return 'Ten cuidado con estafas. Más Patas es solo una plataforma intermediaria.';
            case 'inline':
                return 'Recuerda: Ten cuidado con estafas. Nunca pagues por adelantado. Realiza encuentros en lugares públicos.';
            case 'full':
            default:
                return 'Ten cuidado con estafas. Nunca pagues por adelantado para recuperar una mascota. Realiza encuentros en lugares públicos y seguros. Más Patas es una plataforma intermediaria y no nos responsabilizamos por las interacciones entre usuarios.';
        }
    };

    const message = getDefaultMessage();

    if (variant === 'inline') {
        return (
            <div className={`${bgColor} border-l-4 ${type === 'warning' ? 'border-yellow-400' : 'border-blue-400'} p-3 rounded-r text-sm ${textColor}`}>
                <div className="flex items-start gap-2">
                    <Icon className={`${iconColor} flex-shrink-0 mt-0.5 h-4 w-4`} />
                    <div className="flex-1">
                        <p className="font-medium">{message}</p>
                        {showReportInfo && (
                            <p className="mt-1 text-xs opacity-90">
                                Puedes reportar usuarios, publicaciones y comentarios inapropiados.
                            </p>
                        )}
                        {showSupportLink && (
                            <Link to="/soporte" className="text-xs underline mt-1 inline-block">
                                ¿Necesitas ayuda? Visita nuestro Centro de Soporte
                            </Link>
                        )}
                    </div>
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`${bgColor} border ${type === 'warning' ? 'border-yellow-300' : 'border-blue-300'} rounded-lg p-3 text-sm ${textColor}`}>
                <div className="flex items-center gap-2">
                    <Icon className={`${iconColor} flex-shrink-0 h-4 w-4`} />
                    <p className="flex-1 font-medium">{message}</p>
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>
                    )}
                </div>
                {(showReportInfo || showSupportLink) && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20 text-xs flex flex-wrap gap-2">
                        {showReportInfo && (
                            <span>Puedes reportar contenido inapropiado.</span>
                        )}
                        {showSupportLink && (
                            <Link to="/soporte" className="underline">
                                Centro de Soporte
                            </Link>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Full variant
    return (
        <div className={`${bgColor} border ${type === 'warning' ? 'border-yellow-300' : 'border-blue-300'} rounded-lg p-4 ${textColor}`}>
            <div className="flex items-start gap-3">
                <Icon className={`${iconColor} flex-shrink-0 h-5 w-5 mt-0.5`} />
                <div className="flex-1 space-y-2">
                    <p className="font-semibold text-base">{message}</p>
                    
                    {showReportInfo && (
                        <div className="text-sm space-y-1">
                            <p className="font-medium">Recuerda:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Puedes reportar usuarios, publicaciones y comentarios inapropiados</li>
                                <li>Todos los reportes son revisados por nuestro equipo de moderación</li>
                                <li>Verifica la identidad de las personas antes de compartir información personal</li>
                            </ul>
                        </div>
                    )}
                    
                    {showSupportLink && (
                        <div className="pt-2 border-t border-current border-opacity-20">
                            <Link 
                                to="/soporte" 
                                className="text-sm font-medium underline hover:opacity-80"
                            >
                                ¿Necesitas ayuda? Visita nuestro Centro de Soporte
                            </Link>
                        </div>
                    )}
                </div>
                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

