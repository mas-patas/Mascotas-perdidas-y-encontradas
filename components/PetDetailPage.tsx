
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import type { Pet, User, PetStatus, UserRole, ReportType, ReportReason, Comment } from '../types';
import { CalendarIcon, LocationMarkerIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, ChatBubbleIcon, EditIcon, TrashIcon, PrinterIcon, CheckCircleIcon, FlagIcon, GoogleMapsIcon, WazeIcon, SendIcon, XCircleIcon, HeartIcon, WarningIcon, VerticalDotsIcon } from './icons';
import { PET_STATUS, ANIMAL_TYPES, USER_ROLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { ReportModal } from './ReportModal';
import { formatTime } from '../utils/formatters';
import { usePets } from '../hooks/usePets';
import { supabase } from '../services/supabaseClient';
import UserPublicProfileModal from './UserPublicProfileModal';
import { sendEvent, trackContactOwner, trackShare } from '../services/analytics';
import ShareModal from './ShareModal';

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
    // Find replies for this comment
    const replies = allComments.filter(c => c.parentId === comment.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const isLiked = currentUser && comment.likes?.includes(currentUser.id || '');
    const likesCount = comment.likes?.length || 0;

    const dateObj = new Date(comment.timestamp);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = formatTime(comment.timestamp);

    // Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside to close menu
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
    const canDelete = isAdmin || (currentUser?.email === postOwnerEmail) || (currentUser?.email === comment.userEmail);

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
                    
                    {/* Three Dots Menu */}
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
                
                {/* Action Buttons */}
                <div className="flex items-center gap-4 mt-1 ml-1">
                    <button 
                        onClick={() => handleAction(() => onLike(comment.id))}
                        className={`text-xs flex items-center gap-1 font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <HeartIcon className={isLiked ? "h-3 w-3 fill-current" : "h-3 w-3"} />
                        {likesCount > 0 && <span>{likesCount}</span>}
                        <span>Me gusta</span>
                    </button>
                    
                    {depth < 2 && ( // Limit depth to 2 levels for UI sanity
                        <button 
                            onClick={() => handleAction(() => onReply(comment.id, comment.userName))}
                            className="text-xs text-gray-500 hover:text-brand-primary font-medium"
                        >
                            Responder
                        </button>
                    )}
                </div>

                {/* Render Replies recursively */}
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
    onAddComment: (text: string, parentId?: string) => Promise<void>, 
    onLikeComment: (petId: string, commentId: string) => void,
    onReportComment: (commentId: string) => void,
    onDeleteComment?: (commentId: string) => void,
    currentUser: User | null 
}> = ({ petId, postOwnerEmail, comments, onAddComment, onLikeComment, onReportComment, onDeleteComment, currentUser }) => {
    const navigate = useNavigate();
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string, userName: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await onAddComment(newComment.trim(), replyTo?.id);
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

    // Filter root comments (those without parentId)
    const rootComments = comments?.filter(c => !c.parentId) || [];

    return (
        <div className="flex flex-col h-full">
            {/* Comment List */}
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
                    <div className="flex flex-col items-center justify-center h-full py-8 text-gray-500">
                        <ChatBubbleIcon className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm italic">Aún no hay comentarios. ¡Sé el primero en comentar!</p>
                    </div>
                )}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-white border border-gray-200 rounded-b-lg shadow-inner">
                {currentUser ? (
                    <form onSubmit={handleSubmit}>
                        {replyTo && (
                            <div className="flex justify-between items-center mb-2 text-xs bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                                <span>Respondiendo a <strong>@{replyTo.userName}</strong></span>
                                <button type="button" onClick={cancelReply} className="text-blue-500 hover:text-blue-700 font-bold px-2">✕</button>
                            </div>
                        )}
                        <div className="flex gap-3 items-start">
                            <div className="flex-1">
                                <textarea
                                    ref={textareaRef}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={replyTo ? "Escribe tu respuesta..." : "Escribe una pista o comentario..."}
                                    rows={1}
                                    disabled={isSubmitting}
                                    className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm resize-none bg-gray-50 text-gray-900 placeholder-gray-500 transition-all focus:bg-white disabled:opacity-60"
                                    style={{ minHeight: '46px' }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={!newComment.trim() || isSubmitting}
                                className="bg-brand-primary text-white px-4 py-2 rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-sm h-[46px] shadow-sm active:scale-95 min-w-[90px] justify-center"
                            >
                                {isSubmitting ? (
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                ) : (
                                    <>
                                        <span>Enviar</span>
                                        <SendIcon />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                        <p className="text-sm text-blue-800 font-medium">Inicia sesión para dejar un comentario o pista.</p>
                        <button onClick={() => navigate('/login')} className="text-xs font-bold text-brand-primary hover:underline mt-1 inline-block">Ir al login</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PetDetailPage: React.FC<PetDetailPageProps> = ({ pet: propPet, onClose, onStartChat, onEdit, onDelete, onGenerateFlyer, onUpdateStatus, users, onViewUser, onReport, onRecordContactRequest, onAddComment, onLikeComment }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { pets, loading: petsLoading } = usePets({ filters: { status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos', department: 'Todos' } });
    
    // Find pet from props or list
    const [pet, setPet] = useState<Pet | undefined>(propPet || pets.find(p => p.id === id));
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ type: ReportType, id: string, identifier: string } | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // Removed isRevealingContact loader state to prevent UI flicker/delay
    const [viewingPublisher, setViewingPublisher] = useState<User | null>(null);
    
    // NEW: Local state to force show contact immediately upon click (Optimistic UI)
    const [hasLocalAccess, setHasLocalAccess] = useState(false);
    
    const miniMapRef = useRef<HTMLDivElement>(null);
    const miniMapInstance = useRef<any>(null);

    // REALTIME COMMENTS SUBSCRIPTION
    useEffect(() => {
        if (!pet?.id) return;

        const channel = supabase.channel(`comments-${pet.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `pet_id=eq.${pet.id}`
                },
                (payload) => {
                    const newCommentRaw = payload.new;
                    
                    // Convert to App Type (Comment)
                    const newComment: Comment = {
                        id: newCommentRaw.id,
                        userEmail: newCommentRaw.user_email,
                        userName: newCommentRaw.user_name,
                        text: newCommentRaw.text,
                        timestamp: newCommentRaw.created_at,
                        parentId: newCommentRaw.parent_id,
                        likes: []
                    };

                    setPet(prev => {
                        if (!prev) return prev;
                        
                        // Check if we already have this comment (by ID)
                        const exists = prev.comments?.some(c => c.id === newComment.id);
                        if (exists) return prev;

                        // Handle Optimistic Update Deduplication
                        // If the comment belongs to the current user, try to find a temp comment to replace
                        if (currentUser && newComment.userEmail === currentUser.email) {
                            const hasOptimistic = prev.comments?.some(c => c.id.startsWith('temp-') && c.text === newComment.text);
                            if (hasOptimistic) {
                                // Replace the temp comment with the real one
                                const updatedComments = prev.comments?.map(c => 
                                    (c.id.startsWith('temp-') && c.text === newComment.text) ? newComment : c
                                );
                                return { ...prev, comments: updatedComments };
                            }
                        }

                        // Otherwise, append new comment
                        return {
                            ...prev,
                            comments: [...(prev.comments || []), newComment]
                        };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pet?.id, currentUser]);

    // Sync local pet state with global pets list when it updates (e.g., new comment)
    useEffect(() => {
        const foundPet = pets.find(p => p.id === id);
        
        if (foundPet) {
            setPet(prev => {
                // If no previous state, accept global
                if (!prev) return foundPet;

                // CRITICAL FIX: PRESERVE OPTIMISTIC COMMENTS
                // When global state updates (e.g. refetch), it might wipe out local optimistic comments (temp-*)
                // We must merge them back in until the real comment arrives via realtime/refetch.
                const optimisticComments = prev.comments?.filter(c => c.id.toString().startsWith('temp-')) || [];
                
                // Check if any optimistic comments are now redundant (because foundPet has the real one)
                // We match by text and user email as a heuristic
                const realComments = foundPet.comments || [];
                const uniqueOptimistic = optimisticComments.filter(opt => 
                    !realComments.some(real => real.text === opt.text && real.userEmail === opt.userEmail)
                );

                return {
                    ...foundPet,
                    comments: [...realComments, ...uniqueOptimistic]
                };
            });

            setIsLoading(false);
            
            // Analytics: Track Item View
            sendEvent('view_item', {
                currency: foundPet.currency,
                value: foundPet.reward,
                items: [{
                    item_id: foundPet.id,
                    item_name: foundPet.name,
                    item_category: foundPet.status,
                    item_brand: foundPet.breed,
                    item_variant: foundPet.color
                }]
            });
        } else if (id && !propPet && !petsLoading) {
            // Try fetching single pet if not in current list
            setIsLoading(true);
            supabase.from('pets').select('*').eq('id', id).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        // Helper to format similar to hook
                        const p = data;
                        const formatted: Pet = {
                            id: p.id,
                            userEmail: 'loading...', 
                            status: p.status,
                            name: p.name,
                            animalType: p.animal_type,
                            breed: p.breed,
                            color: p.color,
                            size: p.size,
                            location: p.location,
                            date: p.date,
                            contact: p.contact,
                            description: p.description,
                            imageUrls: p.image_urls || [],
                            adoptionRequirements: p.adoption_requirements,
                            shareContactInfo: p.share_contact_info,
                            contactRequests: p.contact_requests || [],
                            reward: p.reward,
                            currency: p.currency,
                            lat: p.lat,
                            lng: p.lng,
                            comments: []
                        };
                        setPet(formatted);
                    }
                    setIsLoading(false);
                });
        } else if (propPet) {
            setIsLoading(false);
        }
    }, [id, pets, petsLoading, propPet]);

    // Map Effect
    useEffect(() => {
        if (isLoading || !pet || !pet.lat || !pet.lng || !miniMapRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        const lat = pet.lat;
        const lng = pet.lng;
        const status = pet.status;
        const animalType = pet.animalType;

        // Initialize map only if instance doesn't exist
        if (!miniMapInstance.current) {
            miniMapInstance.current = L.map(miniMapRef.current, {
                center: [lat, lng],
                zoom: 15,
                zoomControl: true,
                dragging: true,
                scrollWheelZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(miniMapInstance.current);
        } else {
            // Just update view
            miniMapInstance.current.setView([lat, lng]);
        }

        // Clear existing layers (markers)
        miniMapInstance.current.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
                miniMapInstance.current.removeLayer(layer);
            }
        });

        let statusClass = 'lost'; 
        if (status === PET_STATUS.ENCONTRADO) statusClass = 'found';
        else if (status === PET_STATUS.AVISTADO) statusClass = 'sighted';
        else if (status === PET_STATUS.EN_ADOPCION) statusClass = 'adoption';

        const dogIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM8 14s1.5 2 4 2 4-2 4-2M9 10h6"/><path d="M12 14v6a2 2 0 002 2h2a2 2 0 00-2-2h-2M12 14v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 012-2h2"/><path d="M5 8a3 3 0 016 0c0 1.5-3 4-3 4s-3-2.5-3-4zM19 8a3 3 0 00-6 0c0 1.5 3 4 3 4s3-2.5 3-4z"/></svg>`;
        const catIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM9 12s1.5 2 3 2 3-2 3-2M9 9h6"/><path d="M20 12c0 4-4 8-8 8s-8-4-8-8 4-8 8-8 8 4 8 8zM5 8l-2 2M19 8l2 2"/></svg>`;
        const otherIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zm-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8-8 3.582-8 8zm0 0h16" /></svg>`;

        const iconSVG = animalType === ANIMAL_TYPES.PERRO ? dogIconSVG : (animalType === ANIMAL_TYPES.GATO ? catIconSVG : otherIconSVG);

        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin ${statusClass}'></div>${iconSVG}`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        L.marker([lat, lng], { icon }).addTo(miniMapInstance.current);

        setTimeout(() => {
            miniMapInstance.current?.invalidateSize();
        }, 200);

    }, [isLoading, pet?.lat, pet?.lng, pet?.status, pet?.animalType]); 

    // Cleanup effect on unmount only
    useEffect(() => {
        return () => {
            if (miniMapInstance.current) {
                miniMapInstance.current.remove();
                miniMapInstance.current = null;
            }
        };
    }, []);

    if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div></div>;
    
    // Defensive check: if pet is missing (deleted or network error), show friendly message instead of crashing
    if (!pet) return (
        <div className="flex flex-col items-center justify-center h-96 text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-brand-primary text-6xl mb-4 opacity-20"><TagIcon /></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Publicación no encontrada</h2>
            <p className="text-gray-600 mb-6">Es posible que la publicación haya sido eliminada o el enlace sea incorrecto.</p>
            <button 
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors shadow-md"
            >
                Volver al inicio
            </button>
        </div>
    );

    // Helpers
    const petOwner = users.find(u => u.email === pet.userEmail);
    const isOwner = currentUser?.email === pet.userEmail;
    const canModerate = currentUser && ([USER_ROLES.MODERATOR, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    const canAdmin = currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    
    const hasRevealedContact = currentUser && pet.contactRequests?.includes(currentUser.email);
    // Updated visibility logic to include hasLocalAccess for instant UI feedback
    const canSeeContact = isOwner || canAdmin || hasRevealedContact || hasLocalAccess;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pet.imageUrls && pet.imageUrls.length > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % pet.imageUrls.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pet.imageUrls && pet.imageUrls.length > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + pet.imageUrls.length) % pet.imageUrls.length);
        }
    };
    
    const handleOpenReportModal = (type: ReportType, id: string, identifier: string) => {
        setReportTarget({ type, id, identifier });
        setIsReportModalOpen(true);
    };

    // New handler for comment reports
    const handleReportComment = (commentId: string) => {
        handleOpenReportModal('comment', commentId, `Comentario ID: ${commentId.slice(0,6)}...`);
    };

    // New handler for deleting comments from UI
    const handleDeleteCommentFromModal = async (commentId: string) => {
        if (!window.confirm("¿Estás seguro de eliminar este comentario?")) return;
        try {
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    const handleReportSubmit = (reason: ReportReason, details: string) => {
        if (reportTarget) {
            onReport(reportTarget.type, reportTarget.id, reason, details);
        }
        setIsReportModalOpen(false);
        setReportTarget(null);
    };
    
    // --- OPTIMISTIC CONTACT REVEAL ---
    const handleRevealContact = () => {
        if (!currentUser) return;
        
        // 1. Force local visibility immediately (Robust UI)
        setHasLocalAccess(true);
        
        // 2. Optimistic Update (Immediate Feedback on Object)
        setPet(prev => prev ? ({
            ...prev,
            contactRequests: [...(prev.contactRequests || []), currentUser.email]
        }) : prev);
        
        // 3. Fire and Forget (Server Sync in background)
        onRecordContactRequest(pet.id).catch(err => {
            console.error("Error recording contact request in background", err);
            // We do NOT revert UI here to prevent jitter
        });
        
        // 4. Analytics
        trackContactOwner(pet.id, 'phone_reveal');
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
    
    const handleStartChatWithAnalytics = (p: Pet) => {
        onStartChat(p);
        trackContactOwner(p.id, 'chat');
    };
    
    const onGenerateFlyerWithAnalytics = (p: Pet) => {
        onGenerateFlyer(p);
        sendEvent('generate_flyer', {
            pet_id: p.id
        });
    };

    // --- OPTIMISTIC COMMENT UI UPDATE ---
    const handleOptimisticAddComment = async (text: string, parentId?: string) => {
        if (!currentUser || !pet) return;

        // 1. Create temp comment
        const tempId = `temp-${Date.now()}`;
        const optimisticComment: Comment = {
            id: tempId,
            userEmail: currentUser.email,
            userName: currentUser.username || 'Yo',
            text: text,
            timestamp: new Date().toISOString(),
            parentId: parentId || null,
            likes: []
        };

        // 2. Update local state immediately
        setPet(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                comments: [...(prev.comments || []), optimisticComment]
            };
        });

        // 3. Perform actual server request
        try {
            await onAddComment(pet.id, text, parentId);
            // 4. Force refresh to ensure consistency if realtime is slow
            queryClient.invalidateQueries({ queryKey: ['pets'] });
        } catch (error) {
            console.error("Error posting comment:", error);
            // Rollback on error
            setPet(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    comments: prev.comments?.filter(c => c.id !== tempId)
                };
            });
            alert("No se pudo enviar el comentario.");
        }
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
            <Helmet>
                <title>{pet.status === PET_STATUS.PERDIDO ? 'SE BUSCA:' : pet.status} {title} - Pets</title>
                <meta name="description" content={`${pet.status}: ${title}, ${pet.breed} en ${pet.location}. Ayúdanos a encontrarlo.`} />
                <meta property="og:title" content={`${pet.status}: ${title} - Pets`} />
                <meta property="og:description" content={`${pet.breed} - ${pet.color}. Visto en ${pet.location}. ${pet.description.substring(0, 100)}...`} />
                <meta property="og:image" content={pet.imageUrls[0] || 'https://placehold.co/600x400/EEE/31343C?text=Mascotas'} />
                <meta property="og:type" content="website" />
            </Helmet>

            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-auto">
                {/* Header - Back Button */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <button onClick={onClose} className="bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                        <ChevronLeftIcon /> Volver a la lista
                    </button>
                     {petOwner?.username && (
                         <div className="hidden sm:flex items-center gap-2">
                            <span className="text-xs text-gray-500">Publicado por:</span>
                            <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                                {petOwner.avatarUrl ? (
                                    <img src={petOwner.avatarUrl} alt="av" className="w-full h-full object-cover"/>
                                ) : (
                                    petOwner.username.charAt(0).toUpperCase()
                                )}
                            </div>
                            <button onClick={() => setViewingPublisher(petOwner)} className="font-bold text-gray-800 hover:underline text-sm bg-transparent border-none cursor-pointer">
                                {petOwner.username}
                            </button>
                         </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Left Column (Desktop): Images + Social Bar */}
                    <div className="w-full lg:w-7/12 p-6 flex flex-col border-r border-gray-200 bg-white">
                        
                        <div className="w-full lg:hidden mb-4">
                            <div className="flex flex-row justify-between items-center mb-2 gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl lg:text-4xl font-bold text-brand-dark">{title}</h2>
                                    {pet.status === PET_STATUS.PERDIDO && (isOwner || canAdmin) && (
                                        <button
                                            onClick={() => onGenerateFlyerWithAnalytics(pet)}
                                            className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold py-1 px-3 rounded-lg hover:bg-yellow-500 transition-colors text-xs lg:text-sm shadow-sm whitespace-nowrap"
                                        >
                                            <PrinterIcon />
                                            <span>Crear Afiche</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {pet.reward && pet.reward > 0 && (
                                <div className="bg-green-100 border border-green-200 rounded-lg p-2 mb-3 inline-block">
                                    <p className="text-green-800 font-bold text-sm flex items-center gap-1 uppercase tracking-wide">
                                        <span>💰</span> Recompensa: {pet.currency || 'S/'} {pet.reward}
                                    </p>
                                </div>
                            )}
                            <p className="text-gray-500 text-lg font-medium mb-4 lg:mb-6">{pet.breed} - {pet.color}</p>
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
                        <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2 text-sm text-center rounded-t-lg">
                            ¿Tienes información sobre esta mascota? Deja un comentario o contacta al dueño.
                        </div>
                        <div className="border border-gray-300 border-t-0 rounded-b-lg py-1 mb-4">
                            <div className="flex justify-between items-center px-4 py-2 text-gray-500 text-sm">
                               <div className="flex gap-4 text-xs">
                                    <span>{pet.comments?.length || 0} comentarios</span>
                               </div>
                            </div>
                            <div className="flex border-t border-gray-200">
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
                    </div>

                    {/* Right Column: Details, Stats, Map, Actions */}
                    <div className="w-full lg:w-5/12 p-6 flex flex-col bg-white">
                        
                        <div className="hidden lg:block">
                            <div className="flex flex-row justify-between items-center mb-2 gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl lg:text-4xl font-bold text-brand-dark">{title}</h2>
                                    {pet.status === PET_STATUS.PERDIDO && (isOwner || canAdmin) && (
                                        <button
                                            onClick={() => onGenerateFlyerWithAnalytics(pet)}
                                            className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold py-1 px-3 rounded-lg hover:bg-yellow-500 transition-colors text-xs lg:text-sm shadow-sm whitespace-nowrap"
                                        >
                                            <PrinterIcon />
                                            <span>Crear Afiche</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {pet.reward && pet.reward > 0 && (
                                <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-4 inline-block shadow-sm">
                                    <p className="text-green-800 font-extrabold text-lg flex items-center gap-2 uppercase tracking-wide">
                                        <span>💰</span> Recompensa: {pet.currency || 'S/'} {pet.reward}
                                    </p>
                                </div>
                            )}
                            <p className="text-gray-500 text-lg font-medium mb-4 lg:mb-6">{pet.breed} - {pet.color}</p>
                        </div>

                        {pet.reward && pet.reward > 0 && (
                            <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded-r-md flex gap-3 items-start">
                                <WarningIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Advertencia de Seguridad</p>
                                    <p>Nunca realices pagos ni transferencias por adelantado para "recuperar" a tu mascota. Si alguien afirma tenerla y exige dinero antes de verse, <strong>es una estafa</strong>. Entrega la recompensa solo en persona y en un lugar seguro.</p>
                                </div>
                            </div>
                        )}

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
                                        Ver en Google Maps
                                    </button>
                                    <button 
                                        onClick={openInWaze}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors font-medium text-sm border border-blue-200"
                                    >
                                        <WazeIcon />
                                        Ver en Waze
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto">
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

                                {(!isOwner) && (
                                    <button
                                        onClick={() => currentUser ? handleStartChatWithAnalytics(pet) : navigate('/login')}
                                        className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-colors shadow-md ${
                                            currentUser 
                                            ? 'bg-brand-primary text-white hover:bg-brand-dark' 
                                            : 'bg-blue-400 text-white hover:bg-blue-500'
                                        }`}
                                    >
                                        <ChatBubbleIcon />
                                        <span>{currentUser ? 'Contactar por Mensaje' : 'Inicia sesión para contactar'}</span>
                                    </button>
                                )}

                                {pet.contact !== 'No aplica' && (
                                    pet.shareContactInfo !== false ? (
                                        <div>
                                            {canSeeContact ? (
                                                <div className="flex items-center gap-3 p-4 bg-white border-2 border-green-700 rounded-lg shadow-sm mt-2 animate-fade-in">
                                                    <div className="p-2 bg-green-100 text-green-800 rounded-full">
                                                        <PhoneIcon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold uppercase">Número de Contacto</p>
                                                        <p className="text-xl font-bold text-gray-900 tracking-wide">{pet.contact}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                (!isOwner) && (
                                                    <button
                                                        onClick={() => currentUser ? handleRevealContact() : navigate('/login')}
                                                        className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-colors shadow-md ${
                                                            currentUser 
                                                            ? 'bg-green-700 text-white hover:bg-green-800'
                                                            : 'bg-green-500 text-white hover:bg-green-600'
                                                        }`}
                                                    >
                                                        <PhoneIcon />
                                                        <span>{currentUser ? 'Mostrar Información de Contacto' : 'Inicia sesión para ver contacto'}</span>
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

            {/* Modals code */}
            {isShareModalOpen && pet && (
                <ShareModal
                    pet={pet}
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}

            {isCommentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4" onClick={() => setIsCommentModalOpen(false)}>
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Comentarios</h3>
                            <button onClick={() => setIsCommentModalOpen(false)} className="text-gray-500 hover:text-gray-700"><XCircleIcon /></button>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
                             <img src={pet.imageUrls[0]} alt={pet.name} className="w-12 h-12 object-cover rounded-md" />
                             <div>
                                 <p className="font-bold text-brand-dark text-sm">{pet.name}</p>
                                 <p className="text-xs text-gray-500">{pet.breed}</p>
                             </div>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                             <CommentListAndInput 
                                petId={pet.id}
                                postOwnerEmail={pet.userEmail}
                                comments={pet.comments} 
                                onAddComment={handleOptimisticAddComment} 
                                onLikeComment={onLikeComment}
                                onReportComment={handleReportComment}
                                onDeleteComment={handleDeleteCommentFromModal}
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
            
            {viewingPublisher && (
                <UserPublicProfileModal 
                    isOpen={!!viewingPublisher}
                    onClose={() => setViewingPublisher(null)}
                    targetUser={viewingPublisher}
                    onViewAdminProfile={onViewUser}
                />
            )}
        </>
    );
};
