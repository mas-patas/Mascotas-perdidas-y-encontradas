

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import type { Pet, User, PetStatus, UserRole, ReportType, ReportReason, Comment } from '../types';
import { CalendarIcon, LocationMarkerIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ChatBubbleIcon, EditIcon, TrashIcon, PrinterIcon, FlagIcon, GoogleMapsIcon, WazeIcon, SendIcon, XCircleIcon, HeartIcon, VerticalDotsIcon, SparklesIcon } from './icons';
import { PET_STATUS, USER_ROLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { ReportModal } from './ReportModal';
import { formatTime } from '../utils/formatters';
import { usePets } from '../hooks/usePets';
import { supabase } from '../services/supabaseClient';
import UserPublicProfileModal from './UserPublicProfileModal';
import { trackContactOwner, trackPetReunited } from '../services/analytics';
import ShareModal from './ShareModal';
import ReunionSuccessModal from './ReunionSuccessModal';

interface PetDetailPageProps {
    pet?: Pet;
    onClose: () => void;
    onStartChat: (pet: Pet) => void;
    onEdit: (pet: Pet) => void;
    onDelete: (petId: string) => void;
    onGenerateFlyer: (pet: Pet) => void;
    onUpdateStatus: (petId: string, status: PetStatus) => void;
    users: User[];
    onViewUser: (user: User) => void;
    onReport: (type: ReportType, targetId: string, reason: ReportReason, details: string) => void;
    onRecordContactRequest: (petId: string) => Promise<void>;
    onAddComment: (petId: string, text: string, parentId?: string) => Promise<void>;
    onLikeComment: (petId: string, commentId: string) => void;
}

// Recursive Comment Component
const CommentItem: React.FC<{
    comment: Comment;
    allComments: Comment[];
    onReply: (parentId: string, userName: string) => void;
    onLike: (commentId: string) => void;
    onReportComment: (commentId: string) => void;
    onDeleteComment?: (commentId: string) => void;
    currentUser: User | null;
    depth?: number;
    postOwnerEmail?: string;
}> = ({ comment, allComments, onReply, onLike, onReportComment, onDeleteComment, currentUser, depth = 0, postOwnerEmail }) => {
    const replies = allComments.filter(c => c.parentId === comment.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const isLiked = currentUser && comment.likes?.includes(currentUser.id || '');
    const likesCount = comment.likes?.length || 0;

    const dateObj = new Date(comment.timestamp);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = formatTime(comment.timestamp);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action: () => void) => {
        if (!currentUser) {
            alert("Debes iniciar sesión para realizar esta acción.");
            return;
        }
        action();
    };

    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    // Prefer ID check, fallback to email check if ID not available on comment
    const isCommentOwner = comment.userId ? currentUser?.id === comment.userId : currentUser?.email === comment.userEmail;
    const canDelete = isAdmin || (currentUser?.email === postOwnerEmail) || isCommentOwner;

    return (
        <div className={`flex gap-3 items-start ${depth > 0 ? 'ml-8 mt-3 border-l-2 border-gray-100 pl-3' : 'mt-4'}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {comment.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 group relative">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 pr-8 relative">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-sm text-brand-dark">@{comment.userName}</span>
                        <span className="text-xs text-gray-500">{dateStr} {timeStr}</span>
                    </div>
                    <p className="text-sm text-gray-900 break-words">{comment.text}</p>
                    
                    {currentUser && (
                        <div className="absolute top-2 right-2" ref={menuRef}>
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <VerticalDotsIcon className="h-4 w-4" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1 animate-fade-in">
                                    <button 
                                        onClick={() => { setIsMenuOpen(false); onReportComment(comment.id); }}
                                        className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                    >
                                        Reportar
                                    </button>
                                    {canDelete && onDeleteComment && (
                                        <button 
                                            onClick={() => { setIsMenuOpen(false); onDeleteComment(comment.id); }}
                                            className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-4 mt-1 ml-1">
                    <button 
                        onClick={() => handleAction(() => onLike(comment.id))}
                        className={`text-xs flex items-center gap-1 font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <HeartIcon className={isLiked ? "h-3 w-3 fill-current" : "h-3 w-3"} />
                        {likesCount > 0 && <span>{likesCount}</span>}
                        <span>Me gusta</span>
                    </button>
                    
                    {depth < 2 && (
                        <button 
                            onClick={() => handleAction(() => onReply(comment.id, comment.userName))}
                            className="text-xs text-gray-500 hover:text-brand-primary font-medium"
                        >
                            Responder
                        </button>
                    )}
                </div>

                {replies.map(reply => (
                    <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        allComments={allComments} 
                        onReply={onReply} 
                        onLike={onLike}
                        onReportComment={onReportComment}
                        onDeleteComment={onDeleteComment}
                        currentUser={currentUser}
                        depth={depth + 1}
                        postOwnerEmail={postOwnerEmail}
                    />
                ))}
            </div>
        </div>
    );
};

const CommentListAndInput: React.FC<{ 
    petId: string, 
    postOwnerEmail?: string,
    comments?: Comment[], 
    onAddComment: (petId: string, text: string, parentId?: string) => Promise<void>, 
    onLikeComment: (petId: string, commentId: string) => void,
    onReportComment: (commentId: string) => void,
    onDeleteComment?: (commentId: string) => void,
    currentUser: User | null 
}> = ({ petId, postOwnerEmail, comments, onAddComment, onLikeComment, onReportComment, onDeleteComment, currentUser }) => {
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string, userName: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await onAddComment(petId, newComment.trim(), replyTo?.id);
                setNewComment('');
                setReplyTo(null);
            } catch (error) {
                console.error("Failed to post comment", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleReply = (parentId: string, userName: string) => {
        setReplyTo({ id: parentId, userName });
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    const rootComments = comments?.filter(c => !c.parentId) || [];

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-[300px] max-h-[50vh] rounded-t-lg border border-gray-200 border-b-0">
                {rootComments.length > 0 ? (
                    rootComments.map(comment => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment} 
                            allComments={comments || []} 
                            onReply={handleReply} 
                            onLike={(cid) => onLikeComment(petId, cid)}
                            onReportComment={onReportComment}
                            onDeleteComment={onDeleteComment}
                            currentUser={currentUser}
                            postOwnerEmail={postOwnerEmail}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-10">
                        <p>No hay comentarios aún. ¡Sé el primero en ayudar!</p>
                    </div>
                )}
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-b-lg">
                {replyTo && (
                    <div className="flex justify-between items-center mb-2 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded">
                        <span>Respondiendo a <strong>@{replyTo.userName}</strong></span>
                        <button onClick={cancelReply} className="hover:text-blue-800"><XCircleIcon className="h-4 w-4" /></button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={currentUser ? "Escribe un comentario o avistamiento..." : "Inicia sesión para comentar"}
                        className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                        rows={1}
                        disabled={!currentUser || isSubmitting}
                    />
                    <button 
                        type="submit" 
                        disabled={!currentUser || !newComment.trim() || isSubmitting}
                        className="bg-brand-primary text-white p-3 rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export const PetDetailPage: React.FC<PetDetailPageProps> = ({ 
    pet: propPet, 
    onClose, 
    onStartChat, 
    onEdit, 
    onDelete, 
    onGenerateFlyer, 
    onUpdateStatus, 
    users, 
    onViewUser,
    onReport,
    onRecordContactRequest,
    onAddComment,
    onLikeComment
}) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    
    // Hooks state
    const { pets } = usePets({ filters: { status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos', department: 'Todos' } });
    const pet = propPet || pets.find(p => p.id === id);
    
    // UI State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReunionModalOpen, setIsReunionModalOpen] = useState(false);
    const [publicProfileUser, setPublicProfileUser] = useState<User | null>(null);
    const [contactRevealed, setContactRevealed] = useState(false);

    // Map Ref
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        // Small delay to ensure container is rendered and sized
        const timer = setTimeout(() => {
            if (!pet) return;
            if (!pet.lat || !pet.lng) return;
            if (!mapRef.current) return;
            
            const L = (window as any).L;
            if (!L) return;

            // Cleanup previous instance if coordinates changed significantly or force re-init
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
                mapInstance.current.setView([pet.lat, pet.lng], 15);
                return;
            }

            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current, {
                    center: [pet.lat, pet.lng],
                    zoom: 15,
                    zoomControl: false,
                    dragging: true,
                    scrollWheelZoom: false
                });
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapInstance.current);

                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class='marker-pin ${pet.status === PET_STATUS.ENCONTRADO ? 'found' : pet.status === PET_STATUS.AVISTADO ? 'sighted' : 'lost'}'></div><i class='material-icons'></i>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                });

                L.marker([pet.lat, pet.lng], { icon }).addTo(mapInstance.current);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [pet]);

    if (!pet) return <div className="p-8 text-center">Cargando detalles...</div>;

    const petOwner = users.find(u => u.email === pet.userEmail);
    const isOwner = currentUser?.email === pet.userEmail;
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    
    // Status Logic
    const isLost = pet.status === PET_STATUS.PERDIDO;
    const isFound = pet.status === PET_STATUS.ENCONTRADO;
    const isReunited = pet.status === PET_STATUS.REUNIDO;

    // Handlers
    const handleReunionSubmit = async (story: string, date: string, image?: string) => {
        try {
            const updateData: any = {
                status: PET_STATUS.REUNIDO,
                reunion_story: story,
                reunion_date: date
            };

            if (image) {
                updateData.image_urls = [image, ...pet.imageUrls];
            }

            // Using standard update method from parent would be better but direct here for custom fields
            const { error } = await supabase
                .from('pets')
                .update(updateData)
                .eq('id', pet.id);

            if (error) throw error;

            trackPetReunited(pet.id);
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            
            navigate('/reunidos');
            
        } catch (error: any) {
            console.error("Error updating reunion status:", error);
            alert("Hubo un error al guardar. Asegúrate de haber ejecutado el script SQL proporcionado.");
        }
    };

    const handleRevealContact = () => {
        setContactRevealed(true);
        trackContactOwner(pet.id, 'phone_reveal');
        if (onRecordContactRequest) onRecordContactRequest(pet.id);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("¿Eliminar comentario?")) return;
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (!error) {
            queryClient.invalidateQueries({ queryKey: ['pets'] });
        }
    };

    // Helper for badges
    const getStatusBadge = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return 'bg-red-600 text-white';
            case PET_STATUS.ENCONTRADO: return 'bg-green-600 text-white';
            case PET_STATUS.AVISTADO: return 'bg-blue-600 text-white';
            case PET_STATUS.EN_ADOPCION: return 'bg-purple-600 text-white';
            case PET_STATUS.REUNIDO: return 'bg-gray-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-10 px-4 sm:px-6">
            <Helmet>
                <title>{pet.name} - {pet.status} | Pets</title>
                <meta name="description" content={`${pet.status}: ${pet.animalType} ${pet.breed} en ${pet.location}.`} />
            </Helmet>

            <button onClick={onClose} className="mb-4 flex items-center text-gray-600 hover:text-brand-primary font-bold transition-colors">
                <ChevronLeftIcon className="h-5 w-5 mr-1" /> Volver al listado
            </button>

            {/* CLASSIC CARD LAYOUT */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    
                    {/* LEFT: Image Carousel (Simple) */}
                    <div className="relative bg-gray-200 h-[400px] md:h-auto min-h-[400px]">
                        <img 
                            src={pet.imageUrls[currentImageIndex] || 'https://placehold.co/600x400?text=Sin+Imagen'} 
                            alt={pet.name} 
                            className="w-full h-full object-cover"
                        />
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded text-sm font-bold shadow-sm ${getStatusBadge()}`}>
                            {pet.status}
                        </div>
                        {pet.imageUrls.length > 1 && (
                            <>
                                <button onClick={() => setCurrentImageIndex(prev => (prev === 0 ? pet.imageUrls.length - 1 : prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                                    <ChevronLeftIcon className="h-6 w-6" />
                                </button>
                                <button onClick={() => setCurrentImageIndex(prev => (prev + 1) % pet.imageUrls.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                                    <ChevronRightIcon className="h-6 w-6" />
                                </button>
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-2 py-1 rounded-full text-white text-xs">
                                    {currentImageIndex + 1} / {pet.imageUrls.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT: Information */}
                    <div className="p-6 md:p-8 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 capitalize mb-1">{pet.name}</h1>
                                <p className="text-gray-500 font-medium">{pet.animalType} • {pet.breed}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsShareModalOpen(true)} className="p-2 text-gray-500 hover:text-brand-primary bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title="Compartir">
                                    <ShareIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => onGenerateFlyer(pet)} className="p-2 text-gray-500 hover:text-brand-primary bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title="Imprimir Afiche">
                                    <PrinterIcon className="h-5 w-5" />
                                </button>
                                {!isOwner && (
                                    <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-gray-500 hover:text-red-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title="Reportar">
                                        <FlagIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6 flex-grow">
                            <div className="flex items-start gap-3">
                                <LocationMarkerIcon className="text-brand-primary h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Ubicación</p>
                                    <p className="text-gray-800">{pet.location}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CalendarIcon className="text-brand-primary h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Fecha</p>
                                    <p className="text-gray-800 capitalize">
                                        {new Date(pet.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <TagIcon className="text-brand-primary h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Detalles</p>
                                    <p className="text-gray-800">{pet.color} • {pet.size}</p>
                                </div>
                            </div>
                            
                            {pet.reward && (
                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="text-xs text-yellow-800 font-bold uppercase">Recompensa</p>
                                        <p className="text-yellow-900 font-bold">{pet.currency} {pet.reward}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="pt-6 border-t border-gray-100 space-y-3">
                            {(isOwner || isAdmin) ? (
                                <div className="space-y-3">
                                    {isLost && (
                                        <button 
                                            onClick={() => setIsReunionModalOpen(true)}
                                            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <SparklesIcon className="h-5 w-5 text-yellow-300" />
                                            He encontrado a mi mascota
                                        </button>
                                    )}
                                    <div className="flex gap-3">
                                        <button onClick={() => onEdit(pet)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors">
                                            <EditIcon className="h-4 w-4" /> Editar
                                        </button>
                                        <button onClick={() => setIsDeleteModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors">
                                            <TrashIcon className="h-4 w-4" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div onClick={() => petOwner && setPublicProfileUser(petOwner)} className="cursor-pointer">
                                            {petOwner?.avatarUrl ? (
                                                <img src={petOwner.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="avatar" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                                    {(petOwner?.firstName || 'U').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Publicado por</p>
                                            <button onClick={() => petOwner && setPublicProfileUser(petOwner)} className="font-bold text-gray-900 hover:text-brand-primary">
                                                @{petOwner?.username || 'Usuario'}
                                            </button>
                                        </div>
                                    </div>

                                    {pet.shareContactInfo && !isOwner ? (
                                        contactRevealed ? (
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center mb-2">
                                                <a href={`tel:${pet.contact}`} className="text-xl font-bold text-green-800 hover:underline block">{pet.contact}</a>
                                                <a href={`https://wa.me/51${pet.contact}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:text-green-800">
                                                    Abrir WhatsApp
                                                </a>
                                            </div>
                                        ) : (
                                            <button onClick={handleRevealContact} className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-dark transition-all flex items-center justify-center gap-2 mb-2">
                                                <PhoneIcon className="h-5 w-5" /> Ver Teléfono
                                            </button>
                                        )
                                    ) : null}

                                    {!isOwner && (
                                        <button onClick={() => onStartChat(pet)} className="w-full py-3 bg-white border-2 border-brand-primary text-brand-primary font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                                            <ChatBubbleIcon className="h-5 w-5" /> Enviar Mensaje
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Description, Map, Comments */}
                <div className="p-6 md:p-8 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                                <h3 className="font-bold text-gray-900 text-lg mb-3 border-b pb-2">Historia / Descripción</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {pet.description}
                                </p>
                                {pet.adoptionRequirements && (
                                    <div className="mt-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <h4 className="font-bold text-purple-900 text-sm mb-1">Requisitos de Adopción</h4>
                                        <p className="text-purple-800 text-sm">{pet.adoptionRequirements}</p>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Map */}
                            {pet.lat && pet.lng && (
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-gray-900 text-lg mb-3 border-b pb-2 flex items-center gap-2">
                                        <LocationMarkerIcon className="h-5 w-5 text-gray-500" /> Ubicación Exacta
                                    </h3>
                                    <div className="w-full h-64 rounded-lg overflow-hidden shadow-inner border border-gray-200 relative z-0 mb-3">
                                        <div ref={mapRef} className="w-full h-full"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pet.lat},${pet.lng}`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700 transition-colors"
                                        >
                                            <GoogleMapsIcon className="h-4 w-4" /> Google Maps
                                        </button>
                                        <button 
                                            onClick={() => window.open(`https://waze.com/ul?ll=${pet.lat},${pet.lng}&navigate=yes`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 rounded text-xs font-bold text-blue-700 transition-colors"
                                        >
                                            <WazeIcon className="h-4 w-4" /> Waze
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            {/* Comments Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[600px]">
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <ChatBubbleIcon className="h-5 w-5" /> Comentarios y Avistamientos
                                    </h3>
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <CommentListAndInput 
                                        petId={pet.id} 
                                        postOwnerEmail={pet.userEmail}
                                        comments={pet.comments} 
                                        onAddComment={onAddComment}
                                        onLikeComment={onLikeComment}
                                        onReportComment={(cid) => console.log('Report comment', cid)}
                                        onDeleteComment={handleDeleteComment}
                                        currentUser={currentUser} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => { onDelete(pet.id); setIsDeleteModalOpen(false); }}
                title="Eliminar Publicación"
                message="¿Estás seguro? Esta acción es irreversible."
                confirmText="Sí, Eliminar"
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={(r, d) => { onReport('post', pet.id, r, d); setIsReportModalOpen(false); }}
                reportType="post"
                targetIdentifier={pet.name}
            />

            <ShareModal 
                pet={pet} 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
            />

            <ReunionSuccessModal 
                isOpen={isReunionModalOpen}
                onClose={() => setIsReunionModalOpen(false)}
                pet={pet}
                onSubmit={handleReunionSubmit}
            />

            {publicProfileUser && (
                <UserPublicProfileModal
                    isOpen={!!publicProfileUser}
                    onClose={() => setPublicProfileUser(null)}
                    targetUser={publicProfileUser}
                    onViewAdminProfile={onViewUser} 
                />
            )}
        </div>
    );
};

// Internal icon for this file just in case it's missing in icons.tsx export
const ShareIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

export default PetDetailPage;
