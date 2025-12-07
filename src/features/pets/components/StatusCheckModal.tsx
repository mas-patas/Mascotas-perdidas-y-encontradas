
import React from 'react';
import type { Pet } from '@/types';
import { CheckCircleIcon, XCircleIcon, SearchIcon } from '@/shared/components/icons';

interface StatusCheckModalProps {
    pet: Pet;
    onClose: () => void;
    onConfirmFound: (pet: Pet) => void;
    onKeepLooking: () => void;
}

export const StatusCheckModal: React.FC<StatusCheckModalProps> = ({ pet, onClose, onConfirmFound, onKeepLooking }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-blue-600 p-4 text-white text-center relative">
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
                    <h2 className="text-xl font-bold">¿Encontraste a {pet.name}?</h2>
                    <p className="text-sm opacity-90 mt-1">Han pasado 30 días desde tu reporte.</p>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-center text-sm mb-4">
                        Queremos saber si has tenido éxito en la búsqueda para actualizar el estado de tu publicación.
                    </p>

                    <button 
                        onClick={() => onConfirmFound(pet)}
                        className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <CheckCircleIcon />
                        Sí, ya está en casa
                    </button>

                    <button 
                        onClick={onKeepLooking}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <SearchIcon />
                        Aún no, seguir buscando
                    </button>
                </div>
            </div>
        </div>
    );
};
