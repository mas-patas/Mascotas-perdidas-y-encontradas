import React, { useState } from 'react';
import type { Pet, Report, ReportPostSnapshot } from '../types';
import { CalendarIcon, LocationMarkerIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface ReportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report;
    pet: Pet | ReportPostSnapshot;
    isDeleted: boolean;
    onDeletePet: (petId: string) => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report, pet, isDeleted, onDeletePet }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % pet.imageUrls.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + pet.imageUrls.length) % pet.imageUrls.length);
    };

    if (!isOpen) return null;

    const reporter = report.reporterEmail.split('@')[0];
    const reported = report.reportedEmail.split('@')[0];
    
    const handleConfirmDelete = () => {
        onDeletePet(pet.id);
        setIsConfirmingDelete(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 bg-gray-50 flex justify-between items-center rounded-t-lg border-b">
                    <h2 className="text-xl font-bold text-brand-dark">Detalle de Reporte y Publicación</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {/* Left side: Pet details */}
                    <div className="p-6 border-r flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Publicación Reportada</h3>
                        
                        {isDeleted && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                                <p className="font-bold">Aviso</p>
                                <p>La publicación original fue eliminada.</p>
                            </div>
                        )}

                        <div className="relative mb-4">
                            <img 
                                src={pet.imageUrls[currentImageIndex]} 
                                alt={pet.name} 
                                className="w-full h-48 object-cover rounded-md" 
                            />
                             {pet.imageUrls.length > 1 && (
                                <>
                                    <button 
                                        onClick={prevImage} 
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                                        aria-label="Imagen anterior"
                                    >
                                        <ChevronLeftIcon />
                                    </button>
                                    <button 
                                        onClick={nextImage} 
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                                        aria-label="Siguiente imagen"
                                    >
                                        <ChevronRightIcon />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                        {pet.imageUrls.map((_, index) => (
                                            <div 
                                                key={index} 
                                                className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <h4 className="text-2xl font-bold text-brand-dark">{pet.name}</h4>
                        <p className="text-gray-600 text-md mb-3">{pet.breed} - {pet.color}</p>
                         <div className="space-y-2 text-gray-700 text-sm mb-3">
                            <div className="flex items-start gap-2">
                                <LocationMarkerIcon />
                                <span>{pet.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon />
                                <span>{new Date(pet.date).toLocaleString('es-ES')}</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md border">{pet.description}</p>

                        <div className="mt-auto pt-4">
                            <button
                                onClick={() => setIsConfirmingDelete(true)}
                                disabled={isDeleted}
                                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <TrashIcon /> Eliminar Publicación
                            </button>
                        </div>
                    </div>

                    {/* Right side: Report details */}
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles del Reporte</h3>
                        <div className="space-y-3 text-sm text-gray-700">
                            <p><span className="font-semibold text-gray-900 w-28 inline-block">ID Reporte:</span> {report.id.slice(-6)}</p>
                            <p><span className="font-semibold text-gray-900 w-28 inline-block">Fecha:</span> {new Date(report.timestamp).toLocaleString('es-ES')}</p>
                            <p><span className="font-semibold text-gray-900 w-28 inline-block">Reportado por:</span> {reporter}</p>
                            <p><span className="font-semibold text-gray-900 w-28 inline-block">Usuario reportado:</span> {reported}</p>
                            <p><span className="font-semibold text-gray-900 w-28 inline-block">Tipo:</span> Publicación</p>
                            <p><span className="font-semibold text-gray-900 w-28 inline-block">Razón:</span> <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{report.reason}</span></p>
                            <div>
                               <p className="font-semibold text-gray-900 mb-1">Detalles:</p>
                                <blockquote className="text-gray-800 p-3 bg-gray-50 border-l-2 border-gray-300 rounded-r-md">
                                    {report.details}
                                </blockquote>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-gray-50 border-t text-right rounded-b-lg">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cerrar</button>
                </div>
            </div>
            {isConfirmingDelete && (
                <ConfirmationModal
                    isOpen={isConfirmingDelete}
                    onClose={() => setIsConfirmingDelete(false)}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Publicación"
                    message={`¿Estás seguro de que quieres eliminar la publicación de "${pet.name}"? Esta acción no se puede deshacer.`}
                    confirmText="Sí, eliminar"
                />
            )}
        </div>
    );
};

export default ReportDetailModal;