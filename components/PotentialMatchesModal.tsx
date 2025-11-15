import React from 'react';
import type { PotentialMatch, Pet } from '../types';
import { SparklesIcon } from './icons';

interface PotentialMatchesModalProps {
    matches: PotentialMatch[];
    onClose: () => void;
    onConfirmPublication: () => void;
    onPetSelect: (pet: Pet) => void;
}

const MatchCard: React.FC<{ match: PotentialMatch; onPetSelect: (pet: Pet) => void; }> = ({ match, onPetSelect }) => {
    const scoreColor = match.score > 85 ? 'text-green-600' : match.score > 70 ? 'text-yellow-600' : 'text-gray-600';

    return (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <img src={match.pet.imageUrls[0]} alt={match.pet.name} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${match.pet.status === 'Encontrado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {match.pet.status}
                        </span>
                        <p className="font-bold text-lg text-brand-dark mt-1">{match.pet.breed}</p>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-xl ${scoreColor}`}>{match.score}%</p>
                        <p className="text-xs text-gray-500">Coincidencia</p>
                    </div>
                </div>
                <blockquote className="mt-2 p-2 bg-gray-100 border-l-4 border-gray-300 text-sm text-gray-600 italic">
                    "{match.explanation}"
                </blockquote>
                 <button 
                    onClick={() => onPetSelect(match.pet)}
                    className="mt-3 text-sm font-semibold text-brand-primary hover:underline"
                >
                    Ver detalles completos &rarr;
                </button>
            </div>
        </div>
    );
};


export const PotentialMatchesModal: React.FC<PotentialMatchesModalProps> = ({ matches, onClose, onConfirmPublication, onPetSelect }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <SparklesIcon />
                        <h2 className="text-2xl font-bold text-brand-dark">¡Encontramos posibles coincidencias!</h2>
                    </div>
                    <p className="text-gray-600 mt-1">Nuestra IA ha encontrado mascotas que podrían ser la tuya. Por favor, revísalas antes de publicar.</p>
                </div>

                <div className="p-6 space-y-4 flex-grow">
                    {matches.length > 0 ? (
                        matches.map(match => (
                            <MatchCard key={match.pet.id} match={match} onPetSelect={onPetSelect} />
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-lg text-gray-500">No encontramos coincidencias claras por ahora.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-lg">
                    <p className="text-sm text-gray-600 text-center sm:text-left">¿Ninguna es tu mascota? No te preocupes, puedes publicar tu reporte para que la comunidad ayude.</p>
                    <div className="flex gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            onClick={onConfirmPublication}
                            className="py-2 px-5 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark"
                        >
                            Publicar mi reporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};