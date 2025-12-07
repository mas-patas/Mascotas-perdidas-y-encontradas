
import React from 'react';
import { createPortal } from 'react-dom';
import type { OwnedPet } from '@/types';
import { EditIcon, DogIcon } from './icons';

interface OwnedPetDetailModalProps {
    pet: OwnedPet;
    onClose: () => void;
    onEdit: (pet: OwnedPet) => void;
    onReportLost: (pet: OwnedPet) => void;
}

const OwnedPetDetailModal: React.FC<OwnedPetDetailModalProps> = ({ pet, onClose, onEdit, onReportLost }) => {
    
    return createPortal(
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
                    <h2 className="text-3xl font-bold text-brand-dark">{pet.name}</h2>
                    <p className="text-gray-600 text-md">{pet.animalType} - {pet.breed}</p>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    <img 
                        src={pet.imageUrls?.[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'} 
                        alt={pet.name} 
                        className="w-full h-64 object-cover rounded-lg" 
                    />

                    {pet.colors.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800">Colores:</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {pet.colors.map((color, index) => (
                                    <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">{color}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {pet.description && (
                         <div>
                            <h4 className="font-semibold text-gray-800">Descripción:</h4>
                             <p className="text-gray-600 mt-1 text-sm bg-gray-50 p-3 rounded-md border">{pet.description}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t space-y-3 rounded-b-lg">
                    <button
                        onClick={() => onReportLost(pet)}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <DogIcon className="h-5 w-5" />
                        <span>Reportar como Perdido</span>
                    </button>
                    <button
                        onClick={() => onEdit(pet)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <EditIcon />
                        <span>Editar</span>
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default OwnedPetDetailModal;
