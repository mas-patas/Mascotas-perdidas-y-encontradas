
import React from 'react';
import type { Pet } from '../types';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';

interface RenewModalProps {
    pet: Pet;
    onClose: () => void;
    onRenew: (pet: Pet) => void;
    onMarkAsFound: (pet: Pet) => void;
}

export const RenewModal: React.FC<RenewModalProps> = ({ pet, onClose, onRenew, onMarkAsFound }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-brand-primary p-4 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200">
                        <XCircleIcon />
                    </button>
                    <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 mb-3 shadow-lg">
                        <img 
                            src={pet.imageUrls[0]} 
                            alt={pet.name} 
                            className="w-full h-full object-cover rounded-full"
                        />
                    </div>
                    <h2 className="text-xl font-bold">¡Tu publicación ha expirado!</h2>
                    <p className="text-sm opacity-90 mt-1">Han pasado 60 días desde que publicaste a <span className="font-bold">{pet.name}</span>.</p>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-center text-sm mb-4">
                        Para mantener nuestra base de datos actualizada, las publicaciones expiran automáticamente. ¿Qué deseas hacer?
                    </p>

                    <button 
                        onClick={() => onRenew(pet)}
                        className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <CalendarIcon />
                        Renovar por 60 días más
                    </button>

                    <button 
                        onClick={() => onMarkAsFound(pet)}
                        className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <CheckCircleIcon />
                        ¡Sí, ya la encontré! (Marcar Reunido)
                    </button>

                    <button 
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        No, dejar desactivada
                    </button>
                </div>
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t">
                    Si no renuevas, la publicación dejará de ser visible en el mapa.
                </div>
            </div>
        </div>
    );
};
