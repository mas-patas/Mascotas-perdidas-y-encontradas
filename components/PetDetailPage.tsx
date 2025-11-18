import React, { useState } from 'react';
import type { Pet, User, PetStatus, UserRole, ReportType, ReportReason } from '../types';
import { CalendarIcon, LocationMarkerIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ChatBubbleIcon, EditIcon, TrashIcon, FacebookIcon, TwitterIcon, WhatsAppIcon, PrinterIcon, CheckCircleIcon, FlagIcon } from './icons';
import { PET_STATUS, ANIMAL_TYPES, USER_ROLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { ReportModal } from './ReportModal';

interface PetDetailPageProps {
    pet: Pet;
    onClose: () => void;
    onStartChat: (pet: Pet) => void;
    onEdit: (pet: Pet) => void;
    onDelete: (petId: string) => void;
    onGenerateFlyer: (pet: Pet) => void;
    onUpdateStatus: (petId: string, status: PetStatus) => void;
    users: User[];
    onViewUser: (user: User) => void;
    onReport: (type: ReportType, targetId: string, reason: ReportReason, details: string) => void;
    onRecordContactRequest: (petId: string) => void;
}

export const PetDetailPage: React.FC<PetDetailPageProps> = ({ pet, onClose, onStartChat, onEdit, onDelete, onGenerateFlyer, onUpdateStatus, users, onViewUser, onReport, onRecordContactRequest }) => {
    const { currentUser } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ type: ReportType, id: string, identifier: string } | null>(null);

    const petOwner = users.find(u => u.email === pet.userEmail);
    const isOwner = currentUser?.email === pet.userEmail;
    const canModerate = currentUser && ([USER_ROLES.MODERATOR, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    const canAdmin = currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    
    const hasRevealedContact = currentUser && pet.contactRequests?.includes(currentUser.email);
    const canSeeContact = isOwner || canAdmin || hasRevealedContact;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % pet.imageUrls.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + pet.imageUrls.length) % pet.imageUrls.length);
    };
    
    const handleOpenReportModal = (type: ReportType, id: string, identifier: string) => {
        setReportTarget({ type, id, identifier });
        setIsReportModalOpen(true);
    };

    const handleReportSubmit = (reason: ReportReason, details: string) => {
        if (reportTarget) {
            onReport(reportTarget.type, reportTarget.id, reason, details);
        }
        setIsReportModalOpen(false);
        setReportTarget(null);
    };
    
    const handleRevealContact = () => {
        if (!currentUser) return;
        onRecordContactRequest(pet.id);
    };

    const getStatusStyles = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO:
                return 'bg-red-500 text-white';
            case PET_STATUS.ENCONTRADO:
                return 'bg-green-500 text-white';
            case PET_STATUS.AVISTADO:
                return 'bg-blue-500 text-white';
            case PET_STATUS.EN_ADOPCION:
                return 'bg-purple-500 text-white';
            case PET_STATUS.REUNIDO:
                return 'bg-gray-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };
    
    const canManageStatus = (isOwner || canAdmin) && (pet.status === PET_STATUS.PERDIDO || pet.status === PET_STATUS.ENCONTRADO);

    const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
        const pageUrl = window.location.href; 
        let shareText = '';
        
        if (pet.status === PET_STATUS.PERDIDO) {
            shareText = `¡Ayuda a encontrar a ${pet.name}! Es un ${pet.animalType} de raza ${pet.breed} perdido en la zona de ${pet.location}. Si lo ves, por favor contacta. #MascotaPerdida`;
        } else if (pet.status === PET_STATUS.ENCONTRADO) {
            shareText = `¡Se encontró esta mascota! Es un ${pet.animalType} de raza ${pet.breed} encontrado en ${pet.location}. ¿Lo reconoces? Ayuda a que vuelva a casa. #MascotaEncontrada`;
        } else {
            shareText = `¡Mascota avistada! Se vio un ${pet.animalType} (${pet.breed}) por la zona de ${pet.location}. Podría estar perdido. #MascotaAvistada`;
        }
    
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(pageUrl);
        let shareUrl = '';
    
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleConfirmDelete = () => {
        onDelete(pet.id);
        setIsDeleteModalOpen(false);
    };
    
    const isUnknownAndFoundOrSighted = (pet.status === PET_STATUS.ENCONTRADO || pet.status === PET_STATUS.AVISTADO) && pet.name === 'Desconocido';

    let title = pet.name;
    if (isUnknownAndFoundOrSighted) {
        if (pet.animalType === ANIMAL_TYPES.OTRO) {
            const match = pet.description.match(/^\[Tipo: (.*?)\]/);
            title = match ? match[1] : pet.animalType;
        } else {
            title = pet.animalType;
        }
    }


    return (
        <>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto">
                <div className="p-4">
                    <button onClick={onClose} className="text-sm text-brand-primary hover:underline">&larr; Volver a la lista</button>
                </div>
                <div className="flex flex-col md:flex-row">
                    {/* Image Gallery */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col items-center">
                        <div className="relative w-full mb-4">
                            <img 
                                src={pet.imageUrls[currentImageIndex]} 
                                alt={`${pet.breed} ${pet.name}`} 
                                className="w-full h-96 object-cover rounded-lg shadow-lg" 
                            />
                            <div className={`absolute top-2 left-2 px-3 py-1 text-sm font-bold rounded-full ${getStatusStyles()}`}>
                                {pet.status}
                            </div>
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
                                </>
                            )}
                        </div>
                        {pet.imageUrls.length > 1 && (
                            <div className="flex justify-center gap-2">
                                {pet.imageUrls.map((url, index) => (
                                    <button key={index} onClick={() => setCurrentImageIndex(index)}>
                                        <img
                                            src={url}
                                            alt={`Vista previa ${index + 1}`}
                                            className={`w-16 h-16 object-cover rounded-md cursor-pointer transition-all duration-200 ${
                                                index === currentImageIndex
                                                    ? 'ring-4 ring-brand-primary'
                                                    : 'opacity-60 hover:opacity-100'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pet Details */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                             <h2 className="text-3xl font-bold text-brand-dark">{title}</h2>
                        </div>
                       
                        <p className="text-gray-600 text-md mb-4">{pet.breed} - {pet.color}</p>

                        <div className="space-y-3 text-gray-700 text-sm mb-4">
                            <div className="flex items-start gap-2">
                                <LocationMarkerIcon />
                                <span>{pet.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon />
                                <span>{new Date(pet.date).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                            </div>
                            {pet.size && (
                                <div className="flex items-center gap-2">
                                    <TagIcon />
                                    <span>Tamaño: {pet.size}</span>
                                </div>
                            )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 text-sm bg-gray-50 p-3 rounded-md border">{pet.description}</p>
                        
                        {pet.status === PET_STATUS.EN_ADOPCION && pet.adoptionRequirements && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-1">Requisitos de Adopción</h4>
                                <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                                    <p className="text-sm text-purple-800 whitespace-pre-wrap">{pet.adoptionRequirements}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-gray-200 space-y-4">
                             {canAdmin && petOwner?.username && (
                                <div className="pb-2">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Publicado por</h4>
                                    <div className="p-2 bg-gray-100 rounded-md">
                                        <button onClick={() => { if(petOwner) onViewUser(petOwner); }} className="font-medium text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-left">@{petOwner.username}</button>
                                        <span className="text-gray-600 text-sm"> ({petOwner.email})</span>
                                    </div>
                                </div>
                            )}
                             {pet.contact !== 'No aplica' && (
                                pet.shareContactInfo !== false ? (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Información de Contacto</h4>
                                        {canSeeContact ? (
                                            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                                                <PhoneIcon />
                                                <span className="text-gray-700">{pet.contact}</span>
                                            </div>
                                        ) : (
                                            currentUser && !isOwner && (
                                                <button
                                                    onClick={handleRevealContact}
                                                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    <PhoneIcon />
                                                    <span>Mostrar Información de Contacto</span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Información de Contacto</h4>
                                        <div className="p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-sm">
                                            El publicador ha preferido mantener su contacto privado. Por favor, usa el botón de "Contactar por Mensaje" para comunicarte.
                                        </div>
                                    </div>
                                )
                            )}

                            {canManageStatus && (
                                 <div className="p-3 bg-gray-100 rounded-md">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Gestión de Estado</h4>
                                    <div>
                                        <button
                                            onClick={() => onUpdateStatus(pet.id, PET_STATUS.REUNIDO)}
                                            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm"
                                        >
                                            <CheckCircleIcon />
                                            <span>Reunido</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {currentUser && !isOwner && (
                                <button
                                    onClick={() => onStartChat(pet)}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-dark transition-colors"
                                >
                                    <ChatBubbleIcon />
                                    <span>Contactar por Mensaje</span>
                                </button>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(isOwner || canAdmin) && (
                                    <button
                                        onClick={() => onEdit(pet)}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <EditIcon />
                                        <span>Editar</span>
                                    </button>
                                )}
                                {pet.status === PET_STATUS.PERDIDO && (isOwner || canAdmin) && (
                                    <button
                                        onClick={() => onGenerateFlyer(pet)}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <PrinterIcon />
                                        <span>Generar Afiche</span>
                                    </button>
                                )}
                            </div>
                            
                            {(isOwner || canModerate) && (
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <TrashIcon />
                                    <span>Eliminar Publicación</span>
                                </button>
                            )}

                            <div className="pt-2">
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 text-center">Compartir</h4>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => handleShare('facebook')} className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors" aria-label="Compartir en Facebook">
                                        <FacebookIcon />
                                    </button>
                                    <button onClick={() => handleShare('twitter')} className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-sky-100 hover:text-sky-500 transition-colors" aria-label="Compartir en Twitter">
                                        <TwitterIcon />
                                    </button>
                                    <button onClick={() => handleShare('whatsapp')} className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors" aria-label="Compartir en WhatsApp">
                                        <WhatsAppIcon />
                                    </button>
                                </div>
                            </div>

                             {currentUser && !isOwner && (
                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2 text-center">Opciones de moderación</h4>
                                    <div className="flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-2">
                                        <button
                                            onClick={() => handleOpenReportModal('post', pet.id, pet.name === 'Desconocido' ? `Publicación ID: ${pet.id.slice(0, 6)}` : pet.name)}
                                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            <FlagIcon /> Reportar Publicación
                                        </button>
                                        {petOwner && (
                                            <button
                                                onClick={() => handleOpenReportModal('user', petOwner.email, petOwner.username || petOwner.email)}
                                                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <FlagIcon /> Reportar Usuario
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
            {isReportModalOpen && reportTarget && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    onSubmit={handleReportSubmit}
                    reportType={reportTarget.type}
                    targetIdentifier={reportTarget.identifier}
                />
            )}
            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Eliminar Publicación"
                    message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                />
            )}
        </>
    );
};