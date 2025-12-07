
import React, { useState } from 'react';
import type { Pet, Report, ReportPostSnapshot, ReportStatus, User } from '@/types';
import { CalendarIcon, LocationMarkerIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, ChatBubbleIcon } from '@/shared/components/icons';
import { REPORT_STATUS } from '@/constants';
import { ConfirmationModal } from '@/shared';

interface ReportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report;
    pet: Pet | ReportPostSnapshot;
    isDeleted: boolean;
    onDeletePet: (petId: string) => void;
    onUpdateReportStatus: (reportId: string, status: ReportStatus) => void;
    allUsers: User[];
    onViewUser: (user: User) => void;
    onDeleteComment: (commentId: string) => Promise<void>;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report, pet, isDeleted, onDeletePet, onUpdateReportStatus, allUsers, onViewUser, onDeleteComment }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [newStatus, setNewStatus] = useState<ReportStatus>(report.status);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ('imageUrls' in pet && pet.imageUrls) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % pet.imageUrls.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ('imageUrls' in pet && pet.imageUrls) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + pet.imageUrls.length) % pet.imageUrls.length);
        }
    };

    if (!isOpen) return null;

    // Find user objects for clickable links
    const reporterUser = allUsers.find(u => u.email === report.reporterEmail);
    const reportedUserObj = allUsers.find(u => u.email === report.reportedEmail);

    const reporterDisplayName = reporterUser?.username || report.reporterEmail;
    const reportedDisplayName = reportedUserObj?.username || report.reportedEmail;
    
    const handleConfirmDelete = () => {
        if ('id' in pet && typeof pet.id === 'string') {
            onDeletePet(pet.id);
            setIsConfirmingDelete(false);
            // Update status to ELIMINATED automatically if deleted
            onUpdateReportStatus(report.id, REPORT_STATUS.ELIMINATED);
            onClose();
        }
    };

    const handleUpdateStatus = async () => {
        // If setting status to ELIMINATED, trigger the actual deletion if not already deleted
        if (newStatus === REPORT_STATUS.ELIMINATED) {
            if (report.type === 'post' && !isDeleted && 'id' in pet && typeof pet.id === 'string') {
                onDeletePet(pet.id);
            } else if (report.type === 'comment' && !isDeleted) {
                await onDeleteComment(report.targetId);
            }
        }
        
        onUpdateReportStatus(report.id, newStatus);
        onClose();
    };

    const isCommentReport = report.type === 'comment';
    const isPostReport = report.type === 'post';

    // Helper to safely access Pet properties if it's a pet
    const petData = isPostReport ? (pet as Pet) : null;
    const commentData = isCommentReport ? (pet as { text: string }) : null;

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
                    <h2 className="text-xl font-bold text-brand-dark">
                        {isCommentReport ? 'Detalle de Reporte de Comentario' : 'Detalle de Reporte y Publicación'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {/* Left side: Content details */}
                    <div className="p-6 border-r flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Contenido Reportado</h3>
                        
                        {isDeleted && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                                <p className="font-bold">Aviso</p>
                                <p>El contenido original fue eliminado.</p>
                            </div>
                        )}

                        {/* Display for Post Report */}
                        {isPostReport && petData && (
                            <>
                                <div className="relative mb-4">
                                    <img 
                                        src={petData.imageUrls?.[currentImageIndex] || 'https://placehold.co/400x400?text=No+Image'} 
                                        alt={petData.name || 'Mascota'} 
                                        className="w-full h-48 object-cover rounded-md" 
                                    />
                                     {petData.imageUrls && petData.imageUrls.length > 1 && (
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
                                                {petData.imageUrls.map((_, index) => (
                                                    <div 
                                                        key={index} 
                                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <h4 className="text-2xl font-bold text-brand-dark">{petData.name}</h4>
                                <p className="text-gray-600 text-md mb-3">{petData.breed} - {petData.color}</p>
                                 <div className="space-y-2 text-gray-700 text-sm mb-3">
                                    <div className="flex items-start gap-2">
                                        <LocationMarkerIcon />
                                        <span>{petData.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon />
                                        <span>{petData.date ? new Date(petData.date).toLocaleString('es-ES') : 'N/A'}</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md border">{petData.description}</p>

                                <div className="mt-auto pt-4">
                                    <button
                                        onClick={() => setIsConfirmingDelete(true)}
                                        disabled={isDeleted}
                                        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <TrashIcon /> Eliminar Publicación
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Display for Comment Report */}
                        {isCommentReport && (
                            <div className="flex flex-col h-full">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold">
                                        <ChatBubbleIcon />
                                        <span>Comentario:</span>
                                    </div>
                                    <p className="text-gray-800 italic text-lg">
                                        "{commentData ? commentData.text : (isDeleted ? 'Comentario eliminado' : 'Texto no disponible')}"
                                    </p>
                                </div>
                                <div className="mt-auto pt-4">
                                    <p className="text-sm text-gray-500">
                                        Si seleccionas "Eliminado" en el estado, el comentario se borrará automáticamente.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side: Report details */}
                    <div className="p-6 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles del Reporte</h3>
                        <div className="space-y-3 text-sm text-gray-700 flex-grow">
                            <p><span className="font-semibold text-gray-900 w-32 inline-block">ID Reporte:</span> {report.id.slice(-6)}</p>
                            <p><span className="font-semibold text-gray-900 w-32 inline-block">Fecha:</span> {new Date(report.timestamp).toLocaleString('es-ES')}</p>
                            
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-900 w-32 inline-block">Reportado por:</span>
                                {reporterUser ? (
                                    <button onClick={() => onViewUser(reporterUser)} className="text-brand-primary hover:underline font-medium bg-transparent border-none p-0 cursor-pointer">
                                        {reporterDisplayName}
                                    </button>
                                ) : (
                                    <span>{reporterDisplayName}</span>
                                )}
                            </div>

                            <div className="flex items-center">
                                <span className="font-semibold text-gray-900 w-32 inline-block">Usuario reportado:</span>
                                {reportedUserObj ? (
                                    <button onClick={() => onViewUser(reportedUserObj)} className="text-brand-primary hover:underline font-medium bg-transparent border-none p-0 cursor-pointer">
                                        {reportedDisplayName}
                                    </button>
                                ) : (
                                    <span>{reportedDisplayName}</span>
                                )}
                            </div>

                            <p><span className="font-semibold text-gray-900 w-32 inline-block">Tipo:</span> {isPostReport ? 'Publicación' : isCommentReport ? 'Comentario' : 'Usuario'}</p>
                            <p><span className="font-semibold text-gray-900 w-32 inline-block">Razón:</span> <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{report.reason}</span></p>
                            <div>
                               <p className="font-semibold text-gray-900 mb-1">Detalles del Reporte:</p>
                                <blockquote className="text-gray-800 p-3 bg-gray-50 border-l-2 border-gray-300 rounded-r-md">
                                    {report.details}
                                </blockquote>
                            </div>
                        </div>

                        {/* Status Management Section */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Gestión del Reporte</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Acción Tomada / Estado</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary bg-white text-gray-900"
                                    >
                                        {Object.values(REPORT_STATUS).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    {newStatus === REPORT_STATUS.ELIMINATED && !isDeleted && (
                                        <p className="text-xs text-red-600 mt-1">
                                            * Al guardar, el contenido será eliminado permanentemente de la base de datos.
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleUpdateStatus}
                                    className="w-full py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors"
                                >
                                    Actualizar Estado y Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-gray-50 border-t text-right rounded-b-lg">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cerrar</button>
                </div>
            </div>
            {isConfirmingDelete && isPostReport && (
                <ConfirmationModal
                    isOpen={isConfirmingDelete}
                    onClose={() => setIsConfirmingDelete(false)}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Publicación"
                    message={`¿Estás seguro de que quieres eliminar la publicación de "${petData?.name}"? Esta acción no se puede deshacer.`}
                    confirmText="Sí, eliminar"
                />
            )}
        </div>
    );
};

export default ReportDetailModal;
