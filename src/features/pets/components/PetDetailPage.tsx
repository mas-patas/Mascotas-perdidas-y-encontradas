import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { Pet, User, PetStatus, UserRole, ReportType, ReportReason, Comment } from '@/types';
import { CalendarIcon, LocationMarkerIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ChatBubbleIcon, EditIcon, TrashIcon, PrinterIcon, FlagIcon, GoogleMapsIcon, WazeIcon, SendIcon, XCircleIcon, HeartIcon, VerticalDotsIcon, SparklesIcon, LockIcon, WarningIcon } from '@/shared/components/icons';
import { PET_STATUS, USER_ROLES } from '@/constants';
import { useAuth } from '@/contexts/auth';
import { ConfirmationModal, InfoModal } from '@/shared';
import { ReportModal } from '@/features/reports';
import { formatTime } from '@/utils/formatters';
import { UserPublicProfileModal } from '@/features/profile';
import { usePet, useDeleteComment, useCommentsByPetId, useRenewPet, useDeactivatePet } from '@/api';
import { trackContactOwner, trackPetReunited } from '@/services/analytics';
import { ShareModal } from '@/shared';
import { ReunionSuccessModal, ExpiredPetModal } from '@/features/pets';
import { ErrorBoundary } from '@/shared';
import { supabase } from '@/services/supabaseClient';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { hasCelebrated, markAsCelebrated } from '@/utils/celebrationTracker';

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
    onReport: (type: ReportType, targetId: string, reason: ReportReason, details: string, postSnapshot?: any) => void;
    onRecordContactRequest: (petId: string) => Promise<void>;
    onAddComment: (petId: string, text: string, parentId?: string) => Promise<void>;
    onLikeComment: (petId: string, commentId: string) => void;
}

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
    onShowInfo?: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ comment, allComments, onReply, onLike, onReportComment, onDeleteComment, currentUser, depth = 0, postOwnerEmail, onShowInfo }) => {
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
            if (onShowInfo) {
                onShowInfo("Debes iniciar sesión para realizar esta acción.", 'info');
            }
            return;
        }
        action();
    };

    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    const isCommentOwner = comment.userId ? currentUser?.id === comment.userId : currentUser?.email === comment.userEmail;
    const canDelete = isAdmin || (currentUser?.email === postOwnerEmail) || isCommentOwner;

    return (
        <div className={`flex gap-3 items-start ${depth > 0 ? 'ml-8 mt-3 border-l-2 border-gray-100 pl-3' : 'mt-4'}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {comment.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 group relative">
                <div className="bg-gray-50 p-3 rounded-2xl shadow-sm border border-gray-200 pr-8 relative">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm text-brand-dark">@{comment.userName}</span>
                        <span className="text-xs text-gray-500 font-medium">{dateStr} {timeStr}</span>
                    </div>
                    <p className="text-sm text-gray-800 break-words font-medium">{comment.text}</p>
                    
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
                                        className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 font-bold"
                                    >
                                        Reportar
                                    </button>
                                    {canDelete && onDeleteComment && (
                                        <button 
                                            onClick={() => { setIsMenuOpen(false); onDeleteComment(comment.id); }}
                                            className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold"
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
                        className={`text-xs flex items-center gap-1 font-bold transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <HeartIcon className={isLiked ? "h-3 w-3 fill-current" : "h-3 w-3"} />
                        {likesCount > 0 && <span>{likesCount}</span>}
                        <span>Me gusta</span>
                    </button>
                    
                    {depth < 2 && (
                        <button 
                            onClick={() => handleAction(() => onReply(comment.id, comment.userName))}
                            className="text-xs text-gray-500 hover:text-brand-primary font-bold"
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
                        onShowInfo={onShowInfo}
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
    currentUser: User | null;
    onShowInfo?: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ petId, postOwnerEmail, comments, onAddComment, onLikeComment, onReportComment, onDeleteComment, currentUser, onShowInfo }) => {
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
            <div className="flex-1 overflow-y-auto p-4 bg-white min-h-[300px]">
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
                            onShowInfo={onShowInfo}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-10 font-medium">
                        <p>No hay comentarios aún. ¡Sé el primero en ayudar!</p>
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
                {replyTo && (
                    <div className="flex justify-between items-center mb-2 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold">
                        <span>Respondiendo a <strong>@{replyTo.userName}</strong></span>
                        <button onClick={cancelReply} className="hover:text-blue-900"><XCircleIcon className="h-4 w-4" /></button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={currentUser ? "Escribe un comentario o avistamiento..." : "Inicia sesión para comentar"}
                        className="flex-1 p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none text-gray-800 font-medium placeholder-gray-400"
                        rows={1}
                        disabled={!currentUser || isSubmitting}
                    />
                    <button 
                        type="submit" 
                        disabled={!currentUser || !newComment.trim() || isSubmitting}
                        className="bg-brand-primary text-white p-3 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors btn-press shadow-md"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

const CommentsModal: React.FC<any> = ({ isOpen, onClose, ...props }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[3000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="font-extrabold text-lg text-gray-800 flex items-center gap-2">
                        <ChatBubbleIcon className="h-5 w-5 text-brand-primary" /> Comentarios
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircleIcon className="h-6 w-6" /></button>
                </div>
                <div className="flex-grow overflow-hidden">
                    <ErrorBoundary name="Comments List">
                        <CommentListAndInput {...props} />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
}

// ... Main Component ...

export const PetDetailPage: React.FC<PetDetailPageProps> = ({ 
    pet: propPet, 
    onClose, 
    onStartChat, 
    onEdit, 
    onDelete, 
    onGenerateFlyer, 
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
    const deleteComment = useDeleteComment();
    const renewPet = useRenewPet();
    const deactivatePet = useDeactivatePet();
    
    // FETCH SPECIFIC PET
    const { data: fetchedPet, isLoading: isLoadingSingle, isError } = usePet(id && !propPet ? id : undefined);

    const pet = propPet || fetchedPet;
    
    // FETCH COMMENTS INDEPENDENTLY - Use petId from propPet or fetchedPet or id param
    // Always call hook in same order to avoid React Hook order violations
    const petIdForComments = propPet?.id || fetchedPet?.id || id;
    const { data: commentsFromHook } = useCommentsByPetId(petIdForComments);
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Reset image index when pet or imageUrls change
    useEffect(() => {
        if (pet?.imageUrls && pet.imageUrls.length > 0) {
            setCurrentImageIndex(0);
        }
    }, [pet?.id, pet?.imageUrls?.length]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isCommentReportModalOpen, setIsCommentReportModalOpen] = useState(false);
    const [commentToReport, setCommentToReport] = useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReunionModalOpen, setIsReunionModalOpen] = useState(false);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
    const [publicProfileUser, setPublicProfileUser] = useState<User | null>(null);
    const [contactRevealed, setContactRevealed] = useState(false);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ isOpen: false, message: '', type: 'info' });
    const [newCommentPreview, setNewCommentPreview] = useState('');
    const [showCelebration, setShowCelebration] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    // Calculate owner status early (before early returns)
    const isOwner = pet ? (currentUser?.email === pet.userEmail) : false;
    
    // Show expired modal when pet is loaded and expired (only for owner)
    // This must be before early returns to maintain hook order
    useEffect(() => {
        if (!pet || !isOwner) {
            return;
        }
        
        // Check if pet is expired
        const checkIfExpired = () => {
            if (!pet.expiresAt) return false;
            const now = new Date();
            const expirationDate = new Date(pet.expiresAt);
            // Check if expired (more than 1 minute past expiration)
            return now.getTime() > (expirationDate.getTime() + 60000);
        };
        
        // Check if pet is permanently deactivated (expires_at <= 2000-01-01)
        const checkIfDeactivated = () => {
            if (!pet.expiresAt) return false;
            const deactivatedDate = new Date('2000-01-01');
            const expirationDate = new Date(pet.expiresAt);
            return expirationDate.getTime() <= deactivatedDate.getTime();
        };
        
        const isExpired = checkIfExpired();
        const isDeactivated = checkIfDeactivated();
        
        if (isExpired && !isDeactivated) {
            setIsExpiredModalOpen(true);
        }
    }, [pet?.id, pet?.expiresAt, isOwner]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!pet) return;
            if (!pet.lat || !pet.lng) return;
            if (!mapRef.current) return;
            
            const L = (window as any).L;
            if (!L) return;

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

    // Transform and combine comments: prioritize hook comments, fallback to pet.comments
    // IMPORTANT: This useMemo must be called before any conditional returns to follow React Hook rules
    const allComments = useMemo(() => {
        // Transform comments from hook (snake_case) to camelCase
        const transformedHookComments: Comment[] = (commentsFromHook || []).map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            userEmail: c.user_email,
            userName: c.user_name,
            text: c.text,
            timestamp: c.created_at,
            parentId: c.parent_id || null,
            likes: c.likes || []
        }));
        
        // Use hook comments if available, otherwise fallback to pet.comments
        const pet = propPet || fetchedPet;
        return transformedHookComments.length > 0 ? transformedHookComments : (pet?.comments || []);
    }, [commentsFromHook, propPet, fetchedPet]);
    // Celebration effect for reunited pets
    useEffect(() => {
        if (!pet) return;
        
        // Only show celebration if pet is reunited
        if (pet.status === PET_STATUS.REUNIDO) {
            const userId = currentUser?.id || null;
            
            // Check if user has already seen the celebration for this pet
            if (!hasCelebrated(pet.id, userId)) {
                // Show celebration and mark as seen
                setShowCelebration(true);
                markAsCelebrated(pet.id, userId);
                
                // Hide celebration after duration
                const timer = setTimeout(() => {
                    setShowCelebration(false);
                }, 1000);
                
                return () => clearTimeout(timer);
            }
        } else {
            // Hide celebration if pet is not reunited
            setShowCelebration(false);
        }
    }, [pet?.id, pet?.status, currentUser?.id]);

    if (isLoadingSingle && !pet) return <div className="p-16 text-center text-gray-500 font-bold"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-primary mx-auto mb-4"></div>Cargando detalles...</div>;
    
    if (isError) return (
        <div className="p-16 text-center text-red-600 font-bold bg-red-50 rounded-xl m-4 border border-red-100">
            <WarningIcon className="h-12 w-12 mx-auto mb-3" />
            <p className="mb-2 text-lg">No se pudo cargar la información de la mascota.</p>
            <p className="text-sm text-red-500 mb-6">Es posible que haya sido eliminada o que el enlace sea incorrecto.</p>
            <button onClick={onClose} className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-sm font-extrabold">Volver al inicio</button>
        </div>
    );

    if (!pet) return <div className="p-16 text-center text-gray-500 font-bold">No se encontró la publicación.<br/><button onClick={onClose} className="mt-4 text-brand-primary hover:underline">Volver</button></div>;

    const petOwner = users.find(u => u.email === pet.userEmail);
    const ownerName = petOwner?.username || (fetchedPet?.userEmail ? fetchedPet.userEmail.split('@')[0] : 'Usuario');
    
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    
    const isLost = pet.status === PET_STATUS.PERDIDO;
    
    // Determine the display name: if 'Desconocido', show status instead
    const displayName = pet.name === 'Desconocido' ? pet.status : pet.name;
    
    const handleKeepActive = async (pet: Pet) => {
        try {
            await renewPet.mutateAsync(pet.id);
            setIsExpiredModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['pet_detail', pet.id] });
            alert('✅ Publicación renovada por 60 días más.');
        } catch (err: any) {
            alert('Error al renovar: ' + err.message);
        }
    };
    
    const handleDeactivate = async (pet: Pet) => {
        try {
            await deactivatePet.mutateAsync(pet.id);
            setIsExpiredModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['pet_detail', pet.id] });
            alert('✅ Publicación desactivada. Solo tú y los administradores podrán verla.');
        } catch (err: any) {
            alert('Error al desactivar: ' + err.message);
        }
    };

    const handleReunionSubmit = async (story: string, date: string, image?: string) => {
        try {
            const updateData: any = {
                status: PET_STATUS.REUNIDO,
                reunion_story: story,
                reunion_date: date
            };

            if (image) {
                updateData.image_urls = [image, ...(pet.imageUrls || [])];
            }

            const { error } = await supabase
                .from('pets')
                .update(updateData)
                .eq('id', pet.id);

            if (error) throw error;

            trackPetReunited(pet.id);
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['pet_detail', pet.id] });
            
            navigate('/reunidos');
            
        } catch (error: any) {
            console.error("Error updating reunion status:", error);
            setInfoModal({ isOpen: true, message: "Hubo un error al guardar.", type: 'error' });
        }
    };

    const handleSaveForLater = async () => {
        try {
            const updateData: any = {
                status: PET_STATUS.REUNIDO,
                reunion_date: new Date().toISOString().split('T')[0]
            };

            const { error } = await supabase
                .from('pets')
                .update(updateData)
                .eq('id', pet.id);

            if (error) throw error;

            trackPetReunited(pet.id);
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['pet_detail', pet.id] });
            
        } catch (error: any) {
            console.error("Error updating reunion status:", error);
            alert("Hubo un error al guardar.");
            throw error;
        }
    };

    const handleUpdateReunionStory = async (story: string, date: string, image?: string) => {
        try {
            const updateData: any = {
                reunion_story: story,
                reunion_date: date
            };

            if (image) {
                updateData.image_urls = [image, ...(pet.imageUrls || [])];
            }

            const { error } = await supabase
                .from('pets')
                .update(updateData)
                .eq('id', pet.id);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['pet_detail', pet.id] });
            
        } catch (error: any) {
            console.error("Error updating reunion story:", error);
            alert("Hubo un error al guardar la historia.");
        }
    };

    const handleRevealContact = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setContactRevealed(true);
        trackContactOwner(pet.id, 'phone_reveal');
        if (onRecordContactRequest) onRecordContactRequest(pet.id);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("¿Eliminar comentario?") || !pet) return;
        try {
            await deleteComment.mutateAsync({ id: commentId, petId: pet.id });
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleReportComment = (commentId: string) => {
        setCommentToReport(commentId);
        setIsCommentReportModalOpen(true);
    };

    const getStatusBadge = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return 'bg-red-600 text-white';
            case PET_STATUS.ENCONTRADO: return 'bg-green-600 text-white';
            case PET_STATUS.AVISTADO: return 'bg-blue-600 text-white';
            case PET_STATUS.EN_ADOPCION: return 'bg-status-adoption text-white';
            case PET_STATUS.REUNIDO: return 'bg-gray-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    const previewComments = allComments.filter(c => !c.parentId).slice(-2);
    const totalComments = allComments.length;

    const handleQuickComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentPreview.trim()) return;
        if (!currentUser) {
            setInfoModal({ isOpen: true, message: "Inicia sesión para comentar", type: 'info' });
            return;
        }
        await onAddComment(pet.id, newCommentPreview);
        queryClient.invalidateQueries({ queryKey: ['pet_detail', pet.id] });
        setNewCommentPreview('');
    };

    // --- Content Blocks ---

    const renderHeader = (isMobile: boolean) => {
        // Using brand colors for header card
        const cardStyle = "bg-white border border-card-border shadow-sm rounded-xl p-3 sm:p-4 mb-4";

        if (isMobile) {
            // Mobile View - Compact design
            return (
                <div className={`block md:hidden ${cardStyle}`}>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl font-black text-text-main capitalize leading-tight mb-1">{displayName}</h1>
                                <p className="text-text-sub font-semibold text-sm sm:text-base">{pet.animalType} • {pet.breed}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wide shadow-sm ${getStatusBadge()}`}>
                                {pet.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-50 text-text-sub border border-card-border">
                                {pet.size}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-50 text-text-sub border border-card-border">
                                {pet.color}
                            </span>
                        </div>
                        
                        {/* Mobile Actions - Compact buttons */}
                        <div className="flex gap-1.5 mt-3 pt-3 border-t border-card-border">
                            <button onClick={() => setIsShareModalOpen(true)} className="flex-1 py-2 text-text-sub bg-brand-light rounded-lg text-[11px] sm:text-xs font-bold hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-1.5 border border-card-border">
                                COMPARTIR
                            </button>
                            <button onClick={() => onGenerateFlyer(pet)} className="flex-1 py-2 text-brand-dark bg-brand-secondary rounded-lg text-[11px] sm:text-xs font-bold hover:bg-amber-500 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                                <PrinterIcon className="h-3.5 w-3.5" /> Afiche
                            </button>
                            {!isOwner && (
                                <button onClick={() => setIsReportModalOpen(true)} className="py-2 px-2.5 text-icon-gray hover:text-status-lost bg-white rounded-lg hover:bg-red-50 border border-card-border transition-colors">
                                    <FlagIcon className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        } else {
            // Desktop View (Reorganized: Centered, Large Title, Buttons Row at bottom)
            return (
                <div className={`hidden md:flex flex-col items-center text-center ${cardStyle}`}>
                    {/* Row 1: Name */}
                    <h1 className="text-4xl lg:text-5xl font-black text-text-main mb-2">{displayName}</h1>
                    
                    {/* Row 2: Type • Breed */}
                    <p className="text-lg lg:text-xl text-text-sub font-bold mb-4">{pet.animalType} • {pet.breed}</p>
                    
                    {/* Row 3: Badges */}
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wide shadow-sm ${getStatusBadge()}`}>
                            {pet.status}
                        </span>
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-text-sub border border-card-border shadow-sm">
                            {pet.size}
                        </span>
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-text-sub border border-card-border shadow-sm">
                            {pet.color}
                        </span>
                    </div>

                    {/* Row 4: Buttons (Horizontal) */}
                    <div className="flex items-center justify-center gap-3 w-full max-w-lg">
                        <button 
                            onClick={() => setIsShareModalOpen(true)} 
                            className="px-4 py-3 bg-white text-icon-gray rounded-full hover:bg-brand-light border border-card-border shadow-sm hover:text-brand-primary transition-colors font-bold text-sm"
                            title="Compartir"
                        >
                            COMPARTIR
                        </button>
                        
                        <button 
                            onClick={() => onGenerateFlyer(pet)} 
                            className="flex-grow py-3 px-6 bg-brand-secondary text-brand-dark font-black rounded-full hover:bg-amber-500 shadow-md transition-transform hover:scale-105 flex items-center justify-center gap-2 text-base lg:text-lg"
                        >
                            <PrinterIcon className="h-6 w-6" />
                            Crear Afiche
                        </button>
                        
                        {!isOwner && (
                            <button 
                                onClick={() => setIsReportModalOpen(true)} 
                                className="p-3 bg-white text-icon-gray rounded-full hover:bg-red-50 border border-card-border shadow-sm hover:text-status-lost transition-colors"
                                title="Reportar"
                            >
                                <FlagIcon className="h-6 w-6" />
                            </button>
                        )}
                    </div>
                </div>
            );
        }
    };

    const renderImages = () => {
        // Ensure imageUrls is always an array
        const imageUrls = pet?.imageUrls || [];
        const safeImageIndex = Math.min(currentImageIndex, Math.max(0, imageUrls.length - 1));
        const currentImage = imageUrls[safeImageIndex] || 'https://placehold.co/600x400?text=Sin+Imagen';
        
        return (
            <div className="relative bg-gray-200 rounded-xl overflow-hidden h-[250px] sm:h-[300px] md:h-[500px] shadow-md border border-card-border group w-full">
                <img 
                    src={currentImage} 
                    alt={pet?.name || 'Mascota'} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {imageUrls.length > 1 && (
                    <>
                        <button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1))}} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-black/70 transition backdrop-blur-sm">
                            <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % imageUrls.length)}} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-black/70 transition backdrop-blur-sm">
                            <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        </button>
                        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-white text-[10px] sm:text-xs font-bold backdrop-blur-sm">
                            {safeImageIndex + 1} / {imageUrls.length}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderDescription = () => (
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-card-border w-full">
            <h3 className="font-extrabold text-text-main text-base sm:text-lg mb-2 sm:mb-3 border-b border-card-border pb-2">Historia / Descripción</h3>
            <p className="text-text-sub leading-relaxed whitespace-pre-line text-sm sm:text-base font-medium">
                {pet.description}
            </p>
            {pet.adoptionRequirements && (
                <div className="mt-3 sm:mt-4 bg-status-adoption/10 p-3 sm:p-4 rounded-lg border border-status-adoption/30">
                    <h4 className="font-bold text-status-adoption text-xs sm:text-sm mb-1 sm:mb-2">Requisitos de Adopción</h4>
                    <p className="text-status-adoption text-xs sm:text-sm font-medium">{pet.adoptionRequirements}</p>
                </div>
            )}
        </div>
    );

    const renderMapAndLocation = () => (
        <div className="flex flex-col gap-2 sm:gap-3 w-full">
            {/* Meta Info */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-card-border">
                <div className="flex items-center gap-3 sm:gap-4 border-b border-card-border pb-3 sm:pb-4 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-brand-light text-brand-primary rounded-full">
                        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase tracking-wider">Fecha del Suceso</p>
                        <p className="text-text-main font-bold text-sm sm:text-base lg:text-lg capitalize break-words">
                            {new Date(pet.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {pet.status === PET_STATUS.REUNIDO && pet.reunionDate && (
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-1.5 sm:p-2 bg-green-100 text-green-600 rounded-full mt-1 flex-shrink-0">
                            <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" filled />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-green-600 font-bold uppercase tracking-wider">Fecha de Reencuentro</p>
                            <p className="text-green-700 font-bold text-sm sm:text-base lg:text-lg capitalize break-words">
                                {new Date(pet.reunionDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                )}

                <div className="border-t border-card-border pt-3 sm:pt-4"></div>

                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-gray-100 text-icon-gray rounded-full mt-1 flex-shrink-0">
                        <LocationMarkerIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase tracking-wider">Ubicación</p>
                        <p className="text-text-main font-bold text-sm sm:text-base lg:text-lg leading-snug break-words">{pet.location}</p>
                    </div>
                </div>

                {pet.reward && (
                    <div className="mt-3 sm:mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
                        <span className="text-2xl sm:text-3xl">💰</span>
                        <div>
                            <p className="text-[10px] sm:text-xs text-brand-secondary font-black uppercase tracking-wider">Recompensa</p>
                            <p className="text-brand-dark font-black text-base sm:text-lg lg:text-xl">{pet.currency} {pet.reward}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Map */}
            {pet.lat && pet.lng && (
                <div className="border border-card-border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="p-2 sm:p-3 bg-gray-50 border-b border-card-border text-[10px] sm:text-xs font-bold text-icon-gray uppercase tracking-wide">
                        Ubicación Exacta
                    </div>
                    <ErrorBoundary name="PetDetailMap">
                        <div className="w-full h-40 sm:h-48 relative z-0">
                            <div ref={mapRef} className="w-full h-full"></div>
                        </div>
                        <div className="flex">
                            <button 
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pet.lat},${pet.lng}`, '_blank')}
                                className="flex-1 py-2 sm:py-3 bg-white hover:bg-gray-50 text-[10px] sm:text-xs font-bold text-text-sub transition-colors border-r border-card-border flex items-center justify-center gap-1 btn-press"
                            >
                                <GoogleMapsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Maps
                            </button>
                            <button 
                                onClick={() => window.open(`https://waze.com/ul?ll=${pet.lat},${pet.lng}&navigate=yes`, '_blank')}
                                className="flex-1 py-2 sm:py-3 bg-white hover:bg-brand-light text-[10px] sm:text-xs font-bold text-brand-primary transition-colors flex items-center justify-center gap-1 btn-press"
                            >
                                <WazeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Waze
                            </button>
                        </div>
                    </ErrorBoundary>
                </div>
            )}
        </div>
    );

    const renderComments = () => (
        <div className="bg-white rounded-xl shadow-sm border border-card-border overflow-hidden w-full">
            <div className="p-2 sm:p-3 md:p-4 bg-gray-50 border-b border-card-border flex justify-between items-center">
                <h3 className="font-bold text-text-main text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                    <ChatBubbleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-brand-primary" /> Comentarios ({totalComments})
                </h3>
                {totalComments > 2 && (
                    <button onClick={() => setIsCommentsModalOpen(true)} className="text-[10px] sm:text-xs text-brand-primary font-extrabold hover:underline uppercase tracking-wide">
                        Ver todos
                    </button>
                )}
            </div>
            <div className="p-2 sm:p-3 md:p-4">
                {previewComments.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
                        {previewComments.map(comment => (
                            <CommentItem 
                                key={comment.id} 
                                comment={comment} 
                                allComments={allComments} 
                                onReply={() => setIsCommentsModalOpen(true)}
                                onLike={(cid) => onLikeComment(pet.id, cid)}
                                onReportComment={handleReportComment} 
                                currentUser={currentUser}
                                postOwnerEmail={pet.userEmail}
                                onShowInfo={(message: string, type?: 'success' | 'error' | 'info') => setInfoModal({ isOpen: true, message, type: type || 'info' })}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs sm:text-sm text-icon-gray italic mb-3 sm:mb-4 text-center font-medium">Aún no hay comentarios.</p>
                )}
                
                <form onSubmit={handleQuickComment} className="flex gap-1.5 sm:gap-2">
                    <input 
                        type="text" 
                        placeholder={currentUser ? "Escribe un comentario..." : "Inicia sesión para comentar"} 
                        className="flex-1 p-2 sm:p-3 border border-card-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary text-text-main font-medium placeholder-icon-gray bg-gray-50 focus:bg-white transition-colors"
                        value={newCommentPreview}
                        onChange={(e) => setNewCommentPreview(e.target.value)}
                        disabled={!currentUser}
                    />
                    <button type="submit" disabled={!currentUser || !newCommentPreview.trim()} className="bg-brand-primary text-white p-2 sm:p-3 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 btn-press shadow-md">
                        <SendIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </form>
            </div>
        </div>
    );

    const renderActions = () => (
        <div className="w-full bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-card-border">
            {(isOwner || isAdmin) ? (
                <div className="space-y-2 sm:space-y-3">
                    {/* Owner section - show "Tu publicación" for owners, "Publicado por" for admins viewing others' posts */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-card-border">
                        <div onClick={() => petOwner && setPublicProfileUser(petOwner)} className="cursor-pointer flex-shrink-0">
                            {petOwner?.avatarUrl ? (
                                <img src={petOwner.avatarUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="avatar" />
                            ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center text-icon-gray font-bold text-lg sm:text-xl">
                                    {(petOwner?.firstName?.charAt(0) || ownerName.charAt(0) || '?').toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            {isOwner ? (
                                <>
                                    <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase">Tu publicación</p>
                                    <p className="font-black text-text-main text-sm sm:text-base">Gestionar</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase">Publicado por</p>
                                    <button onClick={() => petOwner && setPublicProfileUser(petOwner)} className="font-black text-text-main hover:text-brand-primary text-sm sm:text-base hover:underline">
                                        @{ownerName}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Owner management section - only show if user is the actual owner */}
                    {isOwner && (
                        <>
                            {isLost && (
                                <button 
                                    onClick={() => setIsReunionModalOpen(true)}
                                    className="w-full bg-status-found text-white font-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 btn-press text-sm sm:text-base lg:text-lg"
                                >
                                    <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-brand-secondary" />
                                    ¡Ya encontré a mi mascota!
                                </button>
                            )}
                            {pet.status === PET_STATUS.REUNIDO && (
                                <button 
                                    onClick={() => setIsReunionModalOpen(true)}
                                    className="w-full bg-purple-100 text-purple-700 font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-2 shadow-sm mb-2 sm:mb-3 text-sm sm:text-base"
                                >
                                    <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" filled />
                                    Contar mi experiencia de cómo me reuní con mi mascota
                                </button>
                            )}
                            <div className="flex gap-2 sm:gap-3">
                                <button onClick={() => onEdit(pet)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 bg-brand-light text-brand-primary font-bold rounded-lg hover:bg-blue-100 transition-colors border border-card-border btn-press text-xs sm:text-sm">
                                    <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Editar
                                </button>
                                <button onClick={() => setIsDeleteModalOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 bg-red-50 text-status-lost font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-200 btn-press text-xs sm:text-sm">
                                    <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Eliminar
                                </button>
                            </div>
                        </>
                    )}

                    {/* Admin actions - show if admin but not owner */}
                    {isAdmin && !isOwner && (
                        <div className="flex gap-2 sm:gap-3 border-t border-card-border pt-2 sm:pt-3">
                            <button onClick={() => onEdit(pet)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 bg-brand-light text-brand-primary font-bold rounded-lg hover:bg-blue-100 transition-colors border border-card-border btn-press text-xs sm:text-sm">
                                <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Editar (Admin)
                            </button>
                            <button onClick={() => setIsDeleteModalOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 bg-red-50 text-status-lost font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-200 btn-press text-xs sm:text-sm">
                                <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Eliminar (Admin)
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2 sm:space-y-3">
                    {/* Non-owner section - show "Publicado por" */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-card-border">
                        <div onClick={() => petOwner && setPublicProfileUser(petOwner)} className="cursor-pointer flex-shrink-0">
                            {petOwner?.avatarUrl ? (
                                <img src={petOwner.avatarUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="avatar" />
                            ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center text-icon-gray font-bold text-lg sm:text-xl">
                                    {(petOwner?.firstName?.charAt(0) || ownerName.charAt(0) || '?').toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-icon-gray font-bold uppercase">Publicado por</p>
                            <button onClick={() => petOwner && setPublicProfileUser(petOwner)} className="font-black text-text-main hover:text-brand-primary text-sm sm:text-base hover:underline">
                                @{ownerName}
                            </button>
                        </div>
                    </div>

                    {pet.shareContactInfo && (
                        contactRevealed ? (
                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 text-center animate-fade-in shadow-sm">
                                <a href={`tel:${pet.contact}`} className="text-lg sm:text-xl lg:text-2xl font-black text-status-found hover:underline block mb-1">{pet.contact}</a>
                                <a href={`https://wa.me/51${pet.contact}`} target="_blank" rel="noreferrer" className="text-xs sm:text-sm font-bold text-status-found hover:text-green-800 flex items-center justify-center gap-1.5 sm:gap-2">
                                    <PhoneIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Abrir WhatsApp
                                </a>
                            </div>
                        ) : (
                            <button onClick={handleRevealContact} className={`w-full py-3 sm:py-4 ${currentUser ? 'bg-brand-primary text-white hover:bg-brand-dark' : 'bg-gray-100 text-text-sub hover:bg-gray-200'} font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 btn-press text-sm sm:text-base lg:text-lg`}>
                                {!currentUser ? <LockIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                                {currentUser ? 'Ver Teléfono' : 'Ver Teléfono (Ingresa)'}
                            </button>
                        )
                    )}

                    <button onClick={() => onStartChat(pet)} className="w-full py-3 sm:py-4 bg-white border-2 border-brand-primary text-brand-primary font-bold rounded-lg hover:bg-brand-light transition-colors flex items-center justify-center gap-2 btn-press text-sm sm:text-base lg:text-lg">
                        <ChatBubbleIcon className="h-5 w-5 sm:h-6 sm:w-6" /> Enviar Mensaje
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-6 sm:pb-10 px-3 sm:px-4 md:px-6">
            <Helmet>
                <title>{displayName} - {pet.status} | Mas Patas</title>
                <meta name="description" content={`${pet.status}: ${pet.animalType} ${pet.breed} en ${pet.location}.`} />
            </Helmet>

            {/* Celebration Effect */}
            {showCelebration && <CelebrationEffect duration={1000} />}

            <button onClick={onClose} className="mb-3 sm:mb-4 flex items-center text-icon-gray hover:text-brand-primary font-bold transition-colors text-sm sm:text-base">
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Volver al listado
            </button>

            {/* Layout Wrapper: Flex Col for Mobile, Grid for Desktop */}
            <div className="flex flex-col md:grid md:grid-cols-12 md:gap-6 lg:gap-8 gap-2 sm:gap-3">
                
                {/* 1. Header (Mobile Visible, Desktop Hidden here - moved to right col) */}
                {renderHeader(true)}

                {/* 2. Left Column (Desktop) / Linear Flow (Mobile) */}
                <div className="md:col-span-7 space-y-2 sm:space-y-3 md:space-y-4 flex flex-col">
                    {/* Images */}
                    <div className="order-1">
                        {renderImages()}
                    </div>
                    {/* Description */}
                    <div className="order-2">
                        {renderDescription()}
                    </div>
                    
                    {/* On Desktop, Comments go here. On Mobile, they go after map. */}
                    <div className="hidden md:block order-3">
                        {renderComments()}
                    </div>
                </div>

                {/* 3. Right Column (Desktop) / Linear Flow (Mobile) */}
                <div className="md:col-span-5 space-y-2 sm:space-y-3 md:space-y-4 flex flex-col">
                    {/* Desktop Header (Hidden on Mobile) */}
                    <div className="hidden md:block order-first">
                        {renderHeader(false)}
                    </div>

                    {/* Location & Map */}
                    <div className="order-1 md:order-2">
                        {renderMapAndLocation()}
                    </div>

                    {/* Mobile Comments (Visible only on mobile here to preserve order) */}
                    <div className="block md:hidden order-3">
                        {renderComments()}
                    </div>

                    {/* Actions / Contact */}
                    <div className="order-4 md:order-3 mt-auto">
                        {renderActions()}
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

            {commentToReport && (
                <ReportModal
                    isOpen={isCommentReportModalOpen}
                    onClose={() => {
                        setIsCommentReportModalOpen(false);
                        setCommentToReport(null);
                    }}
                    onSubmit={(r, d) => {
                        const comment = allComments.find(c => c.id === commentToReport);
                        const commentText = comment?.text?.substring(0, 50) || 'comentario';
                        // Create postSnapshot with comment text and pet_id for admin review
                        const postSnapshot = comment ? {
                            text: comment.text,
                            pet_id: pet.id
                        } : { text: 'comentario eliminado', pet_id: pet.id };
                        onReport('comment', commentToReport, r, d, postSnapshot);
                        setIsCommentReportModalOpen(false);
                        setCommentToReport(null);
                    }}
                    reportType="comment"
                    targetIdentifier={commentToReport ? (allComments.find(c => c.id === commentToReport)?.text?.substring(0, 50) || 'comentario') : 'comentario'}
                />
            )}

            <ShareModal 
                pet={pet} 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
            />

            <ReunionSuccessModal 
                isOpen={isReunionModalOpen}
                onClose={() => setIsReunionModalOpen(false)}
                pet={pet}
                onSubmit={pet.status === PET_STATUS.REUNIDO ? handleUpdateReunionStory : handleReunionSubmit}
                onSaveForLater={pet.status === PET_STATUS.REUNIDO ? undefined : handleSaveForLater}
            />

            <CommentsModal 
                isOpen={isCommentsModalOpen} 
                onClose={() => setIsCommentsModalOpen(false)}
                petId={pet.id} 
                postOwnerEmail={pet.userEmail}
                comments={allComments} 
                onAddComment={onAddComment}
                onLikeComment={onLikeComment}
                onReportComment={handleReportComment}
                onDeleteComment={handleDeleteComment}
                currentUser={currentUser}
                onShowInfo={(message: string, type?: 'success' | 'error' | 'info') => setInfoModal({ isOpen: true, message, type: type || 'info' })}
            />

            {publicProfileUser && (
                <UserPublicProfileModal
                    isOpen={!!publicProfileUser}
                    onClose={() => setPublicProfileUser(null)}
                    targetUser={publicProfileUser}
                    onViewAdminProfile={onViewUser} 
                />
            )}
            
            <InfoModal 
                isOpen={infoModal.isOpen} 
                onClose={() => setInfoModal({ isOpen: false, message: '', type: 'info' })} 
                title={infoModal.type === 'success' ? 'Éxito' : infoModal.type === 'error' ? 'Error' : 'Información'}
                message={infoModal.message}
                type={infoModal.type || 'info'}
            />
            {isExpiredModalOpen && pet && (
                <ExpiredPetModal
                    pet={pet}
                    onClose={() => setIsExpiredModalOpen(false)}
                    onKeepActive={handleKeepActive}
                    onDeactivate={handleDeactivate}
                />
            )}
        </div>
    );
};

const ShareIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

export default PetDetailPage;