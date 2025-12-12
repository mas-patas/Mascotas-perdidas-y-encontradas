import React from 'react';
import type { Pet } from '@/types';
import { XCircleIcon, CheckCircleIcon, CalendarIcon } from '@/shared/components/icons';

interface ExpiredPetModalProps {
    pet: Pet;
    onClose: () => void;
    onKeepActive: (pet: Pet) => void;
    onDeactivate: (pet: Pet) => void;
}

export const ExpiredPetModal: React.FC<ExpiredPetModalProps> = ({ 
    pet, 
    onClose, 
    onKeepActive, 
    onDeactivate 
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-red-500 p-4 text-white text-center relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <XCircleIcon />
                    </button>
                    <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 mb-3 shadow-lg">
                        <img 
                            src={pet.imageUrls[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'} 
                            alt={pet.name} 
                            className="w-full h-full object-cover rounded-full"
                        />
                    </div>
                    <h2 className="text-xl font-bold">¡Tu publicación ha expirado!</h2>
                    <p className="text-sm opacity-90 mt-1">
                        Tu publicación de <span className="font-bold">{pet.name}</span> ha expirado y se ha desactivado automáticamente.
                    </p>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-center text-sm mb-4">
                        Las publicaciones expiran después de 60 días para mantener nuestra base de datos actualizada. ¿Qué deseas hacer?
                    </p>

                    <button 
                        onClick={() => onKeepActive(pet)}
                        className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <CalendarIcon />
                        Mantener activa (Renovar por 60 días más)
                    </button>

                    <button 
                        onClick={() => onDeactivate(pet)}
                        className="w-full py-3 px-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <CheckCircleIcon />
                        Desactivar definitivamente
                    </button>

                    <button 
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
                <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t">
                    Si desactivas la publicación, solo tú y los administradores podrán verla.
                </div>
            </div>
        </div>
    );
};

