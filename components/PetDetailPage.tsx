
import React, { useState, useEffect, useRef } from 'react';
import type { Pet, User, PetStatus, UserRole, ReportType, ReportReason, Comment } from '../types';
import { CalendarIcon, LocationMarkerIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ChatBubbleIcon, EditIcon, TrashIcon, FacebookIcon, TwitterIcon, WhatsAppIcon, PrinterIcon, CheckCircleIcon, FlagIcon, GoogleMapsIcon, WazeIcon, SendIcon, SparklesIcon, XCircleIcon, ThumbUpIcon } from './icons';
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
    onAddComment: (petId: string, text: string) => void;
}

// Reusing CommentSection internal logic
const CommentListAndInput: React.FC<{ 
    petId: string, 
    comments?: Comment[], 
    onAddComment: (text: string) => void, 
    currentUser: User | null 
}> = ({ petId, comments, onAddComment, currentUser }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Comment List */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 min-h-[300px] max-h-[50vh] rounded-t-lg border border-gray-200 border-b-0">
                {comments && comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                                {comment.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="bg-white p-3 rounded-lg flex-1 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-semibold text-sm text-brand-dark">@{comment.userName}</span>
                                    <span className="text-xs text-gray-600">{new Date(comment.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-900">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-600 italic text-center py-4">Aún no hay comentarios. ¡Sé el primero en comentar!</p>
                )}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-white border border-gray-200 rounded-b-lg">
                {currentUser ? (
                    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Escribe una pista o comentario..."
                                rows={1}
                                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm resize-none bg-gray-100 text-gray-900 placeholder-gray-500"
                                style={{ minHeight: '46px' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!newComment.trim()}
                            className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-sm h-[46px]"
                        >
                            <span>Enviar</span>
                            <SendIcon />
                        </button>
                    </form>
                ) : (
                    <div className="bg-blue-50 p-3 rounded-md text-center">
                        <p className="text-sm text-blue-800">Inicia sesión para dejar un comentario.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PetDetailPage: React.FC<PetDetailPageProps> = ({ pet, onClose, onStartChat, onEdit, onDelete, onGenerateFlyer, onUpdateStatus, users, onViewUser, onReport, onRecordContactRequest, onAddComment }) => {
    const { currentUser } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ type: ReportType, id: string, identifier: string } | null>(null);
    
    // Modal States
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    
    // Social State
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [shareCount, setShareCount] = useState(0);
    
    const miniMapRef = useRef<HTMLDivElement>(null);
    const miniMapInstance = useRef<any>(null);

    const petOwner = users.find(u => u.email === pet.userEmail);
    const isOwner = currentUser?.email === pet.userEmail;
    const canModerate = currentUser && ([USER_ROLES.MODERATOR, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    const canAdmin = currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    
    const hasRevealedContact = currentUser && pet.contactRequests?.includes(currentUser.email);
    const canSeeContact = isOwner || canAdmin || hasRevealedContact;

    // Initialize Mini Map
    useEffect(() => {
        if (pet.lat && pet.lng && miniMapRef.current && !miniMapInstance.current) {
             const L = (window as any).L;
             if (!L) return;

             miniMapInstance.current = L.map(miniMapRef.current, {
                 center: [pet.lat, pet.lng],
                 zoom: 15,
                 zoomControl: true,
                 dragging: true,
                 scrollWheelZoom: false
             });

             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 attribution: '&copy; OpenStreetMap'
             }).addTo(miniMapInstance.current);

             let statusClass = 'lost'; 
             if (pet.status === PET_STATUS.ENCONTRADO) statusClass = 'found';
             else if (pet.status === PET_STATUS.AVISTADO) statusClass = 'sighted';
             else if (pet.status === PET_STATUS.EN_ADOPCION) statusClass = 'adoption';

            const dogIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM8 14s1.5 2 4 2 4-2 4-2M9 10h6"/><path d="M12 14v6a2 2 0 002 2h2a2 2 0 00-2-2h-2M12 14v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 012-2h2"/><path d="M5 8a3 3 0 016 0c0 1.5-3 4-3 4s-3-2.5-3-4zM19 8a3 3 0 00-6 0c0 1.5 3 4 3 4s3-2.5 3-4z"/></svg>`;
            const catIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM9 12s1.5 2 3 2 3-2 3-2M9 9h6"/><path d="M20 12c0 4-4 8-8 8s-8-4-8-8 4-8 8-8 8 4 8 8zM5 8l-2 2M19 8l2 2"/></svg>`;
            const otherIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zm-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8-8 3.582-8 8zm0 0h16" /></svg>`;

            const iconSVG = pet.animalType === ANIMAL_TYPES.PERRO ? dogIconSVG : (pet.animalType === ANIMAL_TYPES.GATO ? catIconSVG : otherIconSVG);

             const icon = L.divIcon({
                 className: 'custom-div-icon',
                 html: `<div class='marker-pin ${statusClass}'></div>${iconSVG}`,
                 iconSize: [30, 42],
                 iconAnchor: [15, 42]
             });

             L.marker([pet.lat, pet.lng], { icon }).addTo(miniMapInstance.current);
        }
    }, [pet]);


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
    
    const handleToggleLike = () => {
        if (isLiked) {
            setLikeCount(prev => prev - 1);
        } else {
            setLikeCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    const getStatusStyles = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return 'bg-red-500 text-white';
            case PET_STATUS.ENCONTRADO: return 'bg-green-500 text-white';
            case PET_STATUS.AVISTADO: return 'bg-blue-500 text-white';
            case PET_STATUS.EN_ADOPCION: return 'bg-purple-500 text-white';
            case PET_STATUS.REUNIDO: return 'bg-gray-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };
    
    const canManageStatus = (isOwner || canAdmin) && (pet.status === PET_STATUS.PERDIDO || pet.status === PET_STATUS.ENCONTRADO);

    // Story Image Generator using Canvas
    const generateStoryImage = async () => {
        return new Promise<string>((resolve, reject) => {
            const canvas = document.createElement('canvas');
            // 1080x1920 (9:16 aspect ratio for stories)
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = pet.imageUrls[0];

            img.onload = () => {
                // Background: Fill with brand/status color or blurred image
                ctx.fillStyle = pet.status === PET_STATUS.PERDIDO ? '#EF4444' : '#10B981'; // Red or Green
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // White Container for content
                const margin = 80;
                const cardWidth = canvas.width - (margin * 2);
                const cardHeight = canvas.height - (margin * 4); // leave space top/bottom
                const cardY = margin * 2;
                
                ctx.fillStyle = '#FFFFFF';
                ctx.roundRect(margin, cardY, cardWidth, cardHeight, 40);
                ctx.fill();
                
                // Header Text (Status)
                ctx.fillStyle = pet.status === PET_STATUS.PERDIDO ? '#DC2626' : '#059669';
                ctx.font = 'bold 80px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pet.status.toUpperCase(), canvas.width / 2, cardY + 120);

                // Pet Image (Square-ish crop)
                const imgSize = 800;
                const imgX = (canvas.width - imgSize) / 2;
                const imgY = cardY + 160;
                
                // Draw image cropped/fitted
                let sWidth = img.width;
                let sHeight = img.height;
                let sx = 0;
                let sy = 0;
                
                if (sWidth > sHeight) {
                    sWidth = sHeight; // Crop center square
                    sx = (img.width - sHeight) / 2;
                } else {
                    sHeight = sWidth;
                    sy = (img.height - sWidth) / 2;
                }
                
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(imgX, imgY, imgSize, imgSize, 20);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sWidth, sHeight, imgX, imgY, imgSize, imgSize);
                ctx.restore();

                // Pet Name
                ctx.fillStyle = '#1F2937'; // Dark Gray
                ctx.font = 'bold 90px Arial';
                ctx.fillText(pet.name, canvas.width / 2, imgY + imgSize + 100);

                // Breed & Color
                ctx.fillStyle = '#4B5563'; // Gray
                ctx.font = '50px Arial';
                ctx.fillText(`${pet.breed} - ${pet.color}`, canvas.width / 2, imgY + imgSize + 180);

                // Location Icon & Text logic simulation
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 40px Arial';
                ctx.fillText("📍 " + pet.location.substring(0, 30) + (pet.location.length > 30 ? '...' : ''), canvas.width / 2, imgY + imgSize + 280);

                // Call to Action
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 50px Arial';
                ctx.fillText("¡AYÚDAME A VOLVER A CASA!", canvas.width / 2, canvas.height - margin * 3);
                
                // Small attribution
                ctx.fillStyle = '#6B7280';
                ctx.font = '30px Arial';
                ctx.fillText("Publicado en Pets App", canvas.width / 2, canvas.height - margin * 2);

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => reject('Error loading image');
        });
    };

    const handleShare = async (platform: 'facebook' | 'whatsapp' | 'copy' | 'native_story') => {
        setShareCount(prev => prev + 1); // Increment local share counter
        
        let pageUrl = window.location.href;
        try {
             pageUrl = new URL(window.location.href).href;
        } catch (e) {
             pageUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
        }

        let shareText = '';
        if (pet.status === PET_STATUS.PERDIDO) {
            shareText = `¡Ayuda a encontrar a ${pet.name}! ${pet.breed} en ${pet.location}.`;
        } else {
            shareText = `${pet.status}: ${pet.animalType} en ${pet.location}.`;
        }
    
        if (platform === 'native_story') {
            try {
                const dataUrl = await generateStoryImage();
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], "mascota_story.png", { type: "image/png" });

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Historia para Instagram/Facebook',
                        text: shareText
                    });
                } else {
                    // Fallback: download image
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `historia_${pet.name}.png`;
                    link.click();
                    alert('La imagen se ha descargado. Puedes subirla manualmente a tus historias.');
                }
            } catch (err) {
                console.error('Error generating story:', err);
                alert('No se pudo generar la imagen para historias.');
            }
            setIsShareModalOpen(false);
            return;
        }

        if (platform === 'copy') {
             navigator.clipboard.writeText(`${shareText} ${pageUrl}`);
             alert('Enlace copiado al portapapeles');
             setIsShareModalOpen(false);
             return;
        }

        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(pageUrl);
        let shareUrl = '';
    
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
        setIsShareModalOpen(false);
    };

    const openInGoogleMaps = () => {
        if (pet.lat && pet.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${pet.lat},${pet.lng}`, '_blank');
        }
    };

    const openInWaze = () => {
         if (pet.lat && pet.lng) {
            window.open(`https://waze.com/ul?ll=${pet.lat},${pet.lng}&navigate=yes`, '_blank');
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

    const HeaderInfo = () => (
        <>
            <div className="flex flex-row justify-between items-center mb-2 gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl lg:text-4xl font-bold text-brand-dark">{title}</h2>
                    {pet.status === PET_STATUS.PERDIDO && (isOwner || canAdmin) && (
                        <button
                            onClick={() => onGenerateFlyer(pet)}
                            className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold py-1 px-3 rounded-lg hover:bg-yellow-500 transition-colors text-xs lg:text-sm shadow-sm whitespace-nowrap"
                        >
                            <PrinterIcon />
                            <span>Crear Afiche</span>
                        </button>
                    )}
                </div>
            </div>
            <p className="text-gray-500 text-lg font-medium mb-4 lg:mb-6">{pet.breed} - {pet.color}</p>
        </>
    );

    const SocialActionBar = () => (
        <div className="mt-2 border-t border-b border-gray-300 py-1">
            <div className="flex justify-between items-center px-4 py-2 text-gray-500 text-sm">
               <div className="flex items-center gap-2">
                    <div className="bg-brand-primary text-white rounded-full p-1">
                       <ThumbUpIcon />
                    </div>
                    <span>{likeCount}</span>
               </div>
               <div className="flex gap-4">
                    <span>{pet.comments?.length || 0} comentarios</span>
                    <span>{shareCount} veces compartido</span>
               </div>
            </div>
            <div className="flex border-t border-gray-200">
                <button 
                    onClick={handleToggleLike}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 transition-colors font-semibold text-sm ${isLiked ? 'text-brand-primary' : 'text-gray-600'}`}
                >
                    <ThumbUpIcon /> Me gusta
                </button>
                <button 
                    onClick={() => setIsCommentModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 transition-colors text-gray-600 font-semibold text-sm"
                >
                    <ChatBubbleIcon /> Comentar
                </button>
                <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-100 transition-colors text-gray-600 font-semibold text-sm"
                >
                    <div className="transform -scale-x-100">
                        <SendIcon />
                    </div>
                    Compartir
                </button>
            </div>
        </div>
    );

    const ActionButtons = () => (
        <div className="space-y-3 mt-4">
            {canManageStatus && (
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Gestión de Estado</h4>
                <button
                    onClick={() => onUpdateStatus(pet.id, PET_STATUS.REUNIDO)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"
                >
                    <CheckCircleIcon />
                    <span>Marcar como Reunido</span>
                </button>
                </div>
            )}

            {/* Contact Button (First) */}
            {currentUser && !isOwner && (
                <button
                    onClick={() => onStartChat(pet)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-dark transition-colors shadow-md"
                >
                    <ChatBubbleIcon />
                    <span>Contactar por Mensaje</span>
                </button>
            )}

            {/* Reveal Contact Info (Second - Darker Green) */}
            {pet.contact !== 'No aplica' && (
                pet.shareContactInfo !== false ? (
                    <div>
                        {canSeeContact ? (
                            <div className="flex items-center gap-3 p-4 bg-white border-2 border-green-700 rounded-lg shadow-sm mt-2">
                                <div className="p-2 bg-green-100 text-green-800 rounded-full">
                                    <PhoneIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Número de Contacto</p>
                                    <p className="text-xl font-bold text-gray-900 tracking-wide">{pet.contact}</p>
                                </div>
                            </div>
                        ) : (
                            currentUser && !isOwner && (
                                <button
                                    onClick={handleRevealContact}
                                    className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 transition-colors shadow-md"
                                >
                                    <PhoneIcon />
                                    <span>Mostrar Información de Contacto</span>
                                </button>
                            )
                        )}
                    </div>
                ) : (
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-sm mt-2">
                        El publicador ha preferido mantener su contacto privado.
                    </div>
                )
            )}

            {/* Edit (Mobile) */}
            {(isOwner || canAdmin) && (
                <button
                    onClick={() => onEdit(pet)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <EditIcon />
                    <span>Editar</span>
                </button>
            )}
        </div>
    );

    return (
        <>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-auto">
                {/* Header - Back Button */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <button onClick={onClose} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                        <ChevronLeftIcon /> Volver a la lista
                    </button>
                     {canAdmin && petOwner?.username && (
                         <div className="hidden sm:flex items-center gap-2">
                            <span className="text-xs text-gray-500">Publicado por:</span>
                            <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                                {petOwner.username.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={() => { if(petOwner) onViewUser(petOwner); }} className="font-bold text-gray-800 hover:underline text-sm">{petOwner.username}</button>
                         </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Left Column (Desktop): Images + Social Bar */}
                    <div className="w-full lg:w-7/12 p-6 flex flex-col border-r border-gray-200 bg-white">
                        
                        {/* Mobile Only: Title Header FIRST */}
                        <div className="w-full lg:hidden mb-4">
                            <HeaderInfo />
                        </div>

                        {/* Image Gallery */}
                        <div className="relative w-full mb-4 bg-gray-100 rounded-lg shadow-sm overflow-hidden border border-gray-200">
                            <img 
                                src={pet.imageUrls[currentImageIndex]} 
                                alt={`${pet.breed} ${pet.name}`} 
                                className="w-full h-96 object-contain bg-gray-100" 
                            />
                            <div className={`absolute top-2 left-2 px-3 py-1 text-sm font-bold rounded-full ${getStatusStyles()} shadow-md`}>
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
                            <div className="flex justify-center gap-2 mb-6">
                                {pet.imageUrls.map((url, index) => (
                                    <button key={index} onClick={() => setCurrentImageIndex(index)}>
                                        <img
                                            src={url}
                                            alt={`Vista previa ${index + 1}`}
                                            className={`w-16 h-16 object-cover rounded-md cursor-pointer transition-all duration-200 border-2 ${
                                                index === currentImageIndex
                                                    ? 'border-brand-primary opacity-100'
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Social Action Bar */}
                        <SocialActionBar />
                    </div>

                    {/* Right Column: Details, Stats, Map, Actions */}
                    <div className="w-full lg:w-5/12 p-6 flex flex-col bg-white">
                        
                        {/* Desktop Only: Title Header */}
                        <div className="hidden lg:block">
                            <HeaderInfo />
                        </div>

                        {/* Stats Bar */}
                        <div className="space-y-4 text-gray-700 text-sm mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-brand-primary"><LocationMarkerIcon /></div>
                                <div>
                                    <span className="block font-bold text-gray-900">Ubicación</span>
                                    <span>{pet.location}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-brand-primary"><CalendarIcon /></div>
                                <div>
                                    <span className="block font-bold text-gray-900">Fecha</span>
                                    <span>{new Date(pet.date).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                                </div>
                            </div>
                            {pet.size && (
                                <div className="flex items-center gap-3">
                                    <div className="text-brand-primary"><TagIcon /></div>
                                    <div>
                                        <span className="block font-bold text-gray-900">Tamaño</span>
                                        <span>{pet.size}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Details */}
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Detalles</h4>
                            <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-md border border-gray-200 leading-relaxed">{pet.description}</p>
                        </div>
                        
                        {pet.status === PET_STATUS.EN_ADOPCION && pet.adoptionRequirements && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">Requisitos de Adopción</h4>
                                <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                                    <p className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed">{pet.adoptionRequirements}</p>
                                </div>
                            </div>
                        )}

                        {/* Map Section */}
                         {pet.lat && pet.lng && (
                            <div className="w-full mb-6 relative z-0 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                                <div className="w-full h-48 rounded overflow-hidden">
                                    <div ref={miniMapRef} className="w-full h-full"></div>
                                </div>
                                <div className="flex flex-wrap gap-3 p-2">
                                    <button 
                                        onClick={openInGoogleMaps}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium text-xs border border-gray-300"
                                    >
                                        <GoogleMapsIcon />
                                        Google Maps
                                    </button>
                                    <button 
                                        onClick={openInWaze}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors font-medium text-xs border border-blue-200"
                                    >
                                        <WazeIcon />
                                        Waze
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto">
                            
                            {/* Action Buttons Component */}
                            <ActionButtons />
                            
                            {/* Text Links for Delete / Report */}
                            <div className="pt-4 mt-4 flex flex-col items-center gap-2">
                                {(isOwner || canModerate) && (
                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="text-red-500 hover:text-red-700 hover:underline text-sm cursor-pointer bg-transparent border-none"
                                    >
                                        Eliminar Publicación
                                    </button>
                                )}

                                {currentUser && !isOwner && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleOpenReportModal('post', pet.id, pet.name === 'Desconocido' ? `Publicación ID: ${pet.id.slice(0, 6)}` : pet.name)}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <FlagIcon /> Reportar Publicación
                                        </button>
                                        {petOwner && (
                                            <button
                                                onClick={() => handleOpenReportModal('user', petOwner.email, petOwner.username || petOwner.email)}
                                                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <FlagIcon /> Reportar Usuario
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-end sm:items-center p-0 sm:p-4" onClick={() => setIsShareModalOpen(false)}>
                    <div className="bg-white w-full sm:w-full max-w-sm rounded-t-xl sm:rounded-xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Compartir</h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircleIcon /></button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mb-6">
                             <button onClick={() => handleShare('native_story')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px] group-hover:scale-105 transition-transform">
                                     <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                        <SparklesIcon />
                                     </div>
                                </div>
                                <span className="text-xs text-center text-gray-600">Instagram Stories</span>
                            </button>
                            
                            <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                    <WhatsAppIcon />
                                </div>
                                <span className="text-xs text-center text-gray-600">WhatsApp</span>
                            </button>
                            
                            <button onClick={() => handleShare('facebook')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                    <FacebookIcon />
                                </div>
                                <span className="text-xs text-center text-gray-600">Facebook</span>
                            </button>

                            <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm group-hover:bg-gray-300 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs text-center text-gray-600">Copiar Enlace</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal */}
            {isCommentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4" onClick={() => setIsCommentModalOpen(false)}>
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Comentarios</h3>
                            <button onClick={() => setIsCommentModalOpen(false)} className="text-gray-500 hover:text-gray-700"><XCircleIcon /></button>
                        </div>
                        
                        {/* Pet Mini Info */}
                        <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
                             <img src={pet.imageUrls[0]} alt={pet.name} className="w-12 h-12 object-cover rounded-md" />
                             <div>
                                 <p className="font-bold text-brand-dark text-sm">{pet.name}</p>
                                 <p className="text-xs text-gray-500">{pet.breed}</p>
                             </div>
                        </div>

                        {/* Comments Body */}
                        <div className="flex-grow overflow-y-auto">
                             <CommentListAndInput 
                                petId={pet.id}
                                comments={pet.comments} 
                                onAddComment={(text) => onAddComment(pet.id, text)} 
                                currentUser={currentUser}
                            />
                        </div>
                    </div>
                </div>
            )}

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
